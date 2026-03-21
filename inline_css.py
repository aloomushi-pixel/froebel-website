import os
import re

html_path = r"c:\Users\ccuri\Documents\Desarrollo\Feredico Froebel\website\index.html"
css_tokens = r"c:\Users\ccuri\Documents\Desarrollo\Feredico Froebel\website\styles\tokens.css"
css_main = r"c:\Users\ccuri\Documents\Desarrollo\Feredico Froebel\website\styles\main.css"

with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

with open(css_tokens, "r", encoding="utf-8") as f:
    tokens = f.read()

with open(css_main, "r", encoding="utf-8") as f:
    main = f.read()

# Minify slightly by removing whitespace
def minify_css(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL) # remove comments
    css = re.sub(r'\s+', ' ', css) # remove extra spaces
    css = css.replace('{ ', '{').replace(' }', '}').replace('; ', ';').replace(': ', ':')
    return css.strip()

inlined_css = minify_css(tokens + "\n" + main)

style_tag = f"<style>\n{inlined_css}\n</style>"

# Remove the link tags
html = re.sub(r'<link rel="preload" href="styles/tokens\.css".*?>\n?', '', html)
html = re.sub(r'<link rel="preload" href="styles/main\.css".*?>\n?', '', html)
html = re.sub(r'<link href="styles/tokens\.css".*?>\n?', '', html)
html = re.sub(r'<link href="styles/main\.css".*?>\n?', '', html)

# Insert style tag before closing head
html = html.replace('</head>', style_tag + '\n  </head>')

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

print("Inlined CSS successfully.")
