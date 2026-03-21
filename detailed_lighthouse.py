import json

with open("lighthouse-report.json", "r", encoding="utf-8") as f:
    data = json.load(f)

audits = data.get("audits", {})
opportunities = []

for audit_id, audit in audits.items():
    if audit.get("details", {}).get("type") == "opportunity":
        savings = audit.get("details", {}).get("overallSavingsMs", 0)
        bytes_savings = audit.get("details", {}).get("overallSavingsBytes", 0)
        if savings > 0 or bytes_savings > 0:
            opportunities.append((audit.get("title"), savings, bytes_savings))

print("Opportunities (ms, bytes):")
opportunities.sort(key=lambda x: x[1], reverse=True)
for title, ms, bytes_ in opportunities:
    print(f"- {title}: {ms}ms, {bytes_} bytes")

print("\nLargest Contentful Paint Element:")
lcp_elem = audits.get("largest-contentful-paint-element", {}).get("details", {}).get("items", [{}])[0].get("node", {}).get("snippet")
print(lcp_elem)

print("\nDiagnostics:")
for audit_id, audit in audits.items():
    if audit.get("score") is not None and audit.get("score") < 0.9 and audit.get("scoreDisplayMode") != "notApplicable" and audit.get("details", {}).get("type") != "opportunity":
        print(f"- {audit_id}: {audit.get('title')} (Score: {audit.get('score')})")
