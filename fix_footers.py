import os
import glob
import re

base_path = r"c:\Users\ccuri\Documents\Desarrollo\Feredico Froebel\website/**/*.html"
for path in glob.glob(base_path, recursive=True):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # We want to find: <a class="footer__link" href="/">Blog</a> or similar
    # Also <a class="footer__link" href="../index.html">Blog</a>
    # Let's use regex to replace `<a ...>Blog</a>` links in the footer to point to /blog/
    
    updated = False
    if '<a class="footer__link" href="/">Blog</a>' in content:
        content = content.replace('<a class="footer__link" href="/">Blog</a>', '<a class="footer__link" href="/blog/">Blog</a>')
        updated = True
        
    if '<a class="footer__link" href="../">Blog</a>' in content:
        content = content.replace('<a class="footer__link" href="../">Blog</a>', '<a class="footer__link" href="/blog/">Blog</a>')
        updated = True

    if updated:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Updated footer in', path)
print('Finished updating footers')
