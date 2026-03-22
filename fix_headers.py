import os
import re

base = r"c:\Users\ccuri\Documents\Desarrollo\Feredico Froebel\website\blog"
files = [
    'index.html', 
    'control-de-esfinteres.html', 
    '5-beneficios-del-horario-extendido-para-padres-que-trabajan-cerca-del-aicm.html', 
    'como-elegir-el-mejor-kinder-en-gustavo-a-madero-y-zona-oriente.html', 
    'diferencia-entre-guarderia-y-neurodesarrollo-temprano-en-maternal.html'
]

for f in files:
    path = os.path.join(base, f)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # We need to replace href="/" with href="/blog/" for the Blog link
        # It looks like: <a class="header__link header__link--active" href="/">Blog</a>
        content = re.sub(
            r'<a class="header__link header__link--active" href="/">Blog</a>', 
            r'<a class="header__link header__link--active" href="/blog/">Blog</a>', 
            content
        )
        
        with open(path, 'w', encoding='utf-8') as file:
            file.write(content)

print('Fixed headers in 5 files')
