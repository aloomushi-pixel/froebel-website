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
style_tag = f"<style id=\"global-styles\">\n{inlined_css}\n</style>"

classes_to_animate = [
    'card', 
    'section-header', 
    'hero__content', 
    'hero__image', 
    'testimonial', 
    'stat'
]

for root, dirs, files in os.walk(base_dir):
    for filename in files:
        if filename.endswith(".html"):
            html_path = os.path.join(root, filename)
            
            with open(html_path, "r", encoding="utf-8") as f:
                html = f.read()
            
            # Add fade-in classes
            for cls in classes_to_animate:
                pattern = re.compile(rf'class="([^"]*)(?<!-)\b({cls})\b(?!-)(?![\w\s-]*fade-in)([^"]*)"')
                html = pattern.sub(r'class="\1\2 fade-in\3"', html)
            
            # Remove old styles safely
            def style_replacer(match):
                text = match.group(0)
                if 'INSTITUTO FEDERICO FROEBEL' in text or '--color-primary' in text:
                    return ''
                return text
            html = re.sub(r'<style>.*?</style>', style_replacer, html, flags=re.DOTALL)
            html = re.sub(r'<style id="global-styles">.*?</style>', '', html, flags=re.DOTALL)
            
            # Reattach style
            if '</head>' in html:
                html = html.replace('</head>', style_tag + '\n</head>')
            
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(html)
            
            print(f"Processed {filename}")
