import os

base_dir = r"c:\Users\ccuri\Documents\Desarrollo\Feredico Froebel\website\blog"

files_and_images = {
    'control-de-esfinteres.html': 'control-de-esfinteres.png',
    'por-que-mi-hijo-llora-al-dejarlo-en-el-kinder.html': 'llanto-kinder.png',
    '5-actividades-con-bloques-para-hacer-en-casa.html': 'actividades-bloques.png',
    'menu-semanal-nutritivo-para-ninos-con-500-pesos.html': 'menu-semanal.png',
    'a-que-edad-debe-empezar-el-preescolar.html': 'edad-preescolar.png',
    'diferencia-entre-guarderia-y-neurodesarrollo-temprano-en-maternal.html': 'neurodesarrollo-maternal.png',
    'como-elegir-el-mejor-kinder-en-gustavo-a-madero-y-zona-oriente.html': 'elegir-kinder.png',
    '5-beneficios-del-horario-extendido-para-padres-que-trabajan-cerca-del-aicm.html': 'horario-extendido.png'
}

for filename, img_name in files_and_images.items():
    path = os.path.join(base_dir, filename)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'assets/images/blog/' not in content:
            img_html = f'\n            <img src="../assets/images/blog/{img_name}" alt="Imagen ilustrativa" style="width: 100%; height: 400px; object-fit: cover; border-radius: var(--radius-2xl); box-shadow: var(--shadow-xl); margin-bottom: var(--space-8); border: 1px solid var(--color-border-light);" loading="lazy">\n            '
            
            target = '<div class="fade-in" style="line-height:var(--leading-relaxed);color:var(--color-text-light);">'
            
            if target in content:
                content = content.replace(target, target + img_html, 1)
                
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Inserted image {img_name} into {filename}")
            else:
                print(f"Failed to find insertion point for {filename}")
        else:
             print(f"Image already in {filename}")
