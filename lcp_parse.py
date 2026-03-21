import json

with open("lighthouse-report.json", "r", encoding="utf-8") as f:
    data = json.load(f)

audits = data.get("audits", {})
lcp = audits.get("largest-contentful-paint-element")
if lcp:
    details = lcp.get("details", {})
    if "items" in details and details["items"]:
        print("LCP Element:", details["items"][0].get("node", {}).get("snippet"))
    else:
        print("LCP Element not found in items:", details)
        
print(f"LCP Value: {audits.get('largest-contentful-paint', {}).get('displayValue')}")
print(f"FCP Value: {audits.get('first-contentful-paint', {}).get('displayValue')}")
print(f"TTI Value: {audits.get('interactive', {}).get('displayValue')}")
print(f"Speed Index: {audits.get('speed-index', {}).get('displayValue')}")
print(f"TBT: {audits.get('total-blocking-time', {}).get('displayValue')}")
print(f"CLS: {audits.get('cumulative-layout-shift', {}).get('displayValue')}")
