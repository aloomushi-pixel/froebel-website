import json

with open("lighthouse-report.json", "r", encoding="utf-8") as f:
    data = json.load(f)

audits = data.get("audits", {})
ttfb = audits.get("server-response-time")
if ttfb:
    print(f"TTFB Score: {ttfb.get('score')}")
    print(f"TTFB Value: {ttfb.get('displayValue')}")

print("\nNetwork Requests:")
network = audits.get("network-requests")
if network:
    for item in network.get("details", {}).get("items", []):
        print(f"URL: {item.get('url')} | Time: {item.get('endTime') - item.get('startTime')}ms | Network: {item.get('networkEndTime') - item.get('networkRequestTime')}ms")
