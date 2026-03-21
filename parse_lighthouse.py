import json

try:
    with open('lighthouse-report.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    categories = data.get('categories', {})
    perf = categories.get('performance', {}).get('score', 0) * 100
    acc = categories.get('accessibility', {}).get('score', 0) * 100
    bp = categories.get('best-practices', {}).get('score', 0) * 100
    seo = categories.get('seo', {}).get('score', 0) * 100
    
    with open('lighthouse_parsed.txt', 'w', encoding='utf-8') as out:
        out.write(f"Scores:\nPerformance: {perf}\nAccessibility: {acc}\nBest Practices: {bp}\nSEO: {seo}\n\nFailing Audits:\n")
        audits = data.get('audits', {})
        for key, audit in audits.items():
            score = audit.get('score')
            if score is not None and score < 1 and audit.get('scoreDisplayMode') not in ('notApplicable', 'informative', 'manual'):
                out.write(f"- {key}: {audit.get('title')} (Score: {score})\n")
                if 'details' in audit and 'items' in audit['details']:
                    for item in audit['details']['items']:
                        if 'node' in item and 'snippet' in item['node']:
                            out.write(f"    Code: {item['node']['snippet']}\n")
                        elif 'url' in item:
                            out.write(f"    URL: {item['url']}\n")
except Exception as e:
    with open('lighthouse_parsed.txt', 'w') as out:
        out.write(f"Error: {e}\n")
