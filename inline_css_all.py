import os
import re

base_dir = r"c:\Users\ccuri\Documents\Desarrollo\Feredico Froebel\website"
css_tokens = os.path.join(base_dir, "styles", "tokens.css")
css_main = os.path.join(base_dir, "styles", "main.css")

with open(css_tokens, "r", encoding="utf-8") as f:
    tokens = f.read()

with open(css_main, "r", encoding="utf-8") as f:
    main_css = f.read()

def minify_css(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
    css = re.sub(r'\s+', ' ', css)
    css = css.replace('{ ', '{').replace(' }', '}').replace('; ', ';').replace(': ', ':')
    return css.strip()

inlined_css = minify_css(tokens + "\n" + main_css)
style_tag = f"<style>\n{inlined_css}\n</style>"

for root, dirs, files in os.walk(base_dir):
    for filename in files:
        if filename.endswith(".html"):
            html_path = os.path.join(root, filename)
            
            with open(html_path, "r", encoding="utf-8") as f:
                html = f.read()
            
            # Remove existing CSS references
            html = re.sub(r'<link rel="preload" href="styles/tokens\.css".*?>\n?', '', html)
            html = re.sub(r'<link rel="preload" href="styles/main\.css".*?>\n?', '', html)
            html = re.sub(r'<link href="styles/tokens\.css".*?>\n?', '', html)
            html = re.sub(r'<link href="styles/main\.css".*?>\n?', '', html)
            html = re.sub(r'<link href="\./styles/main\.css".*?>\n?', '', html)
            html = re.sub(r'<link href="\.\./styles/main\.css".*?>\n?', '', html)
            html = re.sub(r'<link href="\.\./\.\./styles/main\.css".*?>\n?', '', html)
            
            # If it already has style block, remove it to not duplicate
            html = re.sub(r'<style>.*?INSTITUTO FEDERICO FROEBEL.*?</style>', '', html, flags=re.DOTALL)
            html = re.sub(r'<style>.*?--color-primary.*?</style>', '', html, flags=re.DOTALL)
            
            # Add to head
            html = html.replace('</head>', style_tag + '\n</head>')
            
            # Fix scripts to defer
            html = html.replace('<script src="scripts/main.js"></script>', '<script src="scripts/main.js" defer></script>')
            html = html.replace('<script src="../scripts/main.js"></script>', '<script src="../scripts/main.js" defer></script>')
            html = html.replace('<script src="../../scripts/main.js"></script>', '<script src="../../scripts/main.js" defer></script>')
            
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(html)
            
            print(f"Inlined CSS in {filename}")
