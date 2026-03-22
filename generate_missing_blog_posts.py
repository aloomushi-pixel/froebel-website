import os
import re

base_dir = r"c:\Users\ccuri\Documents\Desarrollo\Feredico Froebel\website\blog"
template_path = os.path.join(base_dir, "control-de-esfinteres.html")

with open(template_path, "r", encoding="utf-8") as f:
    template_html = f.read()

# Extract the header/footer parts
# The article starts at <!-- ARTICLE --> or <article class="section"
article_start = template_html.find('<!-- ARTICLE -->')
article_end = template_html.find('<!-- FOOTER -->')

prefix = template_html[:article_start]
suffix = template_html[article_end:]

# Fix header link in prefix to point to /blog/ instead of root /
prefix = re.sub(
    r'<a class="header__link header__link--active" href="/">Blog</a>',
    r'<a class="header__link header__link--active" href="/blog/">Blog</a>',
    prefix
)

posts = [
    {
        "filename": "por-que-mi-hijo-llora-al-dejarlo-en-el-kinder.html",
        "title": "¿Por qué mi hijo llora al dejarlo en el kínder? | Blog Froebel",
        "description": "Guía para el desapego respetuoso. Estrategias para que la separación sea un proceso positivo.",
        "tag": "Crianza Respetuosa",
        "h1": "¿Por qué mi hijo llora al dejarlo en el kínder? Guía para el desapego respetuoso",
        "meta": "📅 Febrero 2026 · ⏱️ 8 min de lectura · 👶 Etapa Preescolar",
        "content": """
            <p style="font-size:var(--text-lg);color:var(--color-text);font-weight:var(--weight-medium);margin-bottom:var(--space-6);">
                Es completamente normal y tiene una explicación científica. Descubre las estrategias de apego seguro para que la separación sea un proceso positivo y lleno de amor.
            </p>
            <h2 style="font-size:var(--text-2xl);color:var(--color-text);margin-top:var(--space-10);margin-bottom:var(--space-4);">
                🧠 Entendiendo la ansiedad por separación
            </h2>
            <p>El llanto al separarse de sus figuras de apego es una respuesta evolutiva esperada. Esto demuestra que existe un vínculo sano y seguro entre padres e hijos. No es manipulación, es miedo real a la separación.</p>
            <h2 style="font-size:var(--text-2xl);color:var(--color-text);margin-top:var(--space-10);margin-bottom:var(--space-4);">
                ✅ 5 Estrategias para un desapego respetuoso
            </h2>
            <div style="background:var(--color-primary-50);border-radius:var(--radius-xl);padding:var(--space-6);margin:var(--space-6) 0;">
                <ul style="display:flex;flex-direction:column;gap:var(--space-3);list-style:none;padding:0;margin:0;">
                    <li style="display:flex;gap:var(--space-3);align-items:flex-start;">
                        <span style="color:var(--color-primary);font-weight:bold;flex-shrink:0;">1.</span>
                        <span><strong>Anticipa lo que va a suceder:</strong> Habla de la escuela de forma positiva desde casa.</span>
                    </li>
                    <li style="display:flex;gap:var(--space-3);align-items:flex-start;">
                        <span style="color:var(--color-primary);font-weight:bold;flex-shrink:0;">2.</span>
                        <span><strong>Despedidas cortas pero afectuosas:</strong> Evita "escaparte" sin despedirte. Di adiós con seguridad.</span>
                    </li>
                    <li style="display:flex;gap:var(--space-3);align-items:flex-start;">
                        <span style="color:var(--color-primary);font-weight:bold;flex-shrink:0;">3.</span>
                        <span><strong>Crea un ritual de despedida:</strong> Un choque de manos especial, un beso en la palma de la mano.</span>
                    </li>
                    <li style="display:flex;gap:var(--space-3);align-items:flex-start;">
                        <span style="color:var(--color-primary);font-weight:bold;flex-shrink:0;">4.</span>
                        <span><strong>Transmite seguridad:</strong> Si te notan angustiado, ellos sentirán que el lugar no es seguro.</span>
                    </li>
                    <li style="display:flex;gap:var(--space-3);align-items:flex-start;">
                        <span style="color:var(--color-primary);font-weight:bold;flex-shrink:0;">5.</span>
                        <span><strong>Validar emociones:</strong> "Sé que estás triste y me vas a extrañar. Yo también, pero regresarás a casa a jugar."</span>
                    </li>
                </ul>
            </div>
            <p>En el Instituto Froebel contamos con personal altamente capacitado para acompañar compasivamente el periodo de adaptación.</p>
        """
    },
    {
        "filename": "5-actividades-con-bloques-para-hacer-en-casa.html",
        "title": "5 actividades con bloques para hacer en casa | Froebel",
        "description": "5 actividades con bloques que desarrollan inteligencia espacial y coordinación en casa, mucho mejor que una tablet.",
        "tag": "Actividades",
        "h1": "5 actividades con bloques para hacer en casa (mejor que una tablet)",
        "meta": "📅 Marzo 2026 · ⏱️ 5 min de lectura · 🧱 Desarrollo Cognitivo",
        "content": """
            <p style="font-size:var(--text-lg);color:var(--color-text);font-weight:var(--weight-medium);margin-bottom:var(--space-6);">
                Los bloques de construcción son la herramienta perfecta para fomentar la inteligencia espacial, la motricidad fina y la resolución de problemas.
            </p>
            <h2 style="font-size:var(--text-2xl);color:var(--color-text);margin-top:var(--space-10);margin-bottom:var(--space-4);">
                🧱 Ideas de juegos rápidos
            </h2>
            <ul style="display:flex;flex-direction:column;gap:var(--space-3);margin:var(--space-4) 0;">
                <li style="display:flex;gap:var(--space-2);">
                    <span style="color:var(--color-primary);font-weight:bold;">1.</span>
                    <strong>Torre más alta:</strong> Quién logra crear la torre más alta antes de que se caiga. Enseña equilibrio y gravedad.
                </li>
                <li style="display:flex;gap:var(--space-2);">
                    <span style="color:var(--color-primary);font-weight:bold;">2.</span>
                    <strong>Clasificación por colores:</strong> Ayuda a la discriminación visual pidiendo que junten bloques del mismo color.
                </li>
                <li style="display:flex;gap:var(--space-2);">
                    <span style="color:var(--color-primary);font-weight:bold;">3.</span>
                    <strong>Sigue el patrón:</strong> Crea un patrón simple (rojo, azul, rojo) y pide que lo continúen.
                </li>
                <li style="display:flex;gap:var(--space-2);">
                    <span style="color:var(--color-primary);font-weight:bold;">4.</span>
                    <strong>Medición con bloques:</strong> "¿Cuántos bloques mide tu zapato?" - Introducción a las matemáticas.
                </li>
                <li style="display:flex;gap:var(--space-2);">
                    <span style="color:var(--color-primary);font-weight:bold;">5.</span>
                    <strong>Juego libre:</strong> Dejar que su imaginación dicte la construcción promueve la creatividad.
                </li>
            </ul>
        """
    },
    {
        "filename": "menu-semanal-nutritivo-para-ninos-con-500-pesos.html",
        "title": "Menú semanal nutritivo para niños económico | Blog Froebel",
        "description": "7 días de comidas completas y saludables con ingredientes accesibles. Recetas rápidas para padres que trabajan.",
        "tag": "Nutrición",
        "h1": "Menú semanal nutritivo para niños con $500 pesos",
        "meta": "📅 Marzo 2026 · ⏱️ 10 min de lectura · 🥦 Vida Saludable",
        "content": """
            <p style="font-size:var(--text-lg);color:var(--color-text);font-weight:var(--weight-medium);margin-bottom:var(--space-6);">
                Alimentar correctamente a tus hijos no tiene que ser costoso ni tomar horas en la cocina. Te compartimos una guía práctica.
            </p>
            <h2 style="font-size:var(--text-2xl);color:var(--color-text);margin-top:var(--space-10);margin-bottom:var(--space-4);">
                🍽️ Pilares del menú económico
            </h2>
            <p>El secreto está en comprar ingredientes de temporada, consumir más proteínas vegetales (leguminosas) y planear con anticipación.</p>
            <div style="background:var(--color-secondary-50);border-radius:var(--radius-lg);padding:var(--space-6);margin:var(--space-6) 0;">
                <p><strong>Lunes:</strong> Lentejas guisadas con plátano macho y arroz (Nutritivo, alto en hierro).</p>
                <p><strong>Martes:</strong> Tostadas de tinga de zanahoria y pollo desmenuzado (Rinde mucho y los niños lo aman).</p>
                <p><strong>Miércoles:</strong> Sopa de fideo con espinaca licuada y tortitas de papa (Energía duradera).</p>
                <p><strong>Jueves:</strong> Frijoles charros (versión sin grasa) y huevo revuelto.</p>
                <p><strong>Viernes:</strong> Enfrijoladas con queso panela y aguacate.</p>
            </div>
            <p>Recuerda el método del "Plato del Bien Comer": la mitad debe ser verdura o fruta.</p>
        """
    },
    {
        "filename": "a-que-edad-debe-empezar-el-preescolar.html",
        "title": "¿A qué edad debe empezar el preescolar? | Blog Froebel",
        "description": "La respuesta según la neurociencia. Factores neurológicos, emocionales y familiares para el ingreso escolar.",
        "tag": "Desarrollo",
        "h1": "¿A qué edad debe empezar el preescolar? Lo que dice la ciencia",
        "meta": "📅 Abril 2026 · ⏱️ 6 min de lectura · 🎓 Educación Infantil",
        "content": """
            <p style="font-size:var(--text-lg);color:var(--color-text);font-weight:var(--weight-medium);margin-bottom:var(--space-6);">
                ¿12 meses? ¿2 años? ¿3? La ciencia nos ayuda a entender el momento óptimo para la socialización preescolar.
            </p>
            <h2 style="font-size:var(--text-2xl);color:var(--color-text);margin-top:var(--space-10);margin-bottom:var(--space-4);">
                📊 Neurociencia y socialización temprana
            </h2>
            <p>Entre los 2 y 3 años, el cerebro del niño experimenta una "poda sináptica" y un pico en la sensibilidad social. Según la AAP (Academia Americana de Pediatría), los programas de preescolar de alta calidad tienen un impacto positivo en el desarrollo del lenguaje y la regulación emocional cuando inician alrededor de los 3 años (o a los 2 en programas maternales especializados).</p>
            <div style="background:var(--color-primary-50);border-radius:var(--radius-xl);padding:var(--space-6);margin:var(--space-6) 0;">
                <h3>Beneficios comprobados:</h3>
                <ul style="display:flex;flex-direction:column;gap:var(--space-3);list-style:none;padding:0;margin:0;">
                    <li style="display:flex;gap:var(--space-3);align-items:flex-start;">
                        <span style="color:var(--color-primary);font-weight:bold;flex-shrink:0;">✓</span>
                        <span>Mayor desarrollo en funciones ejecutivas (control de impulsos, atención).</span>
                    </li>
                    <li style="display:flex;gap:var(--space-3);align-items:flex-start;">
                        <span style="color:var(--color-primary);font-weight:bold;flex-shrink:0;">✓</span>
                        <span>Expansión significativa de vocabulario por convivir con pares.</span>
                    </li>
                    <li style="display:flex;gap:var(--space-3);align-items:flex-start;">
                        <span style="color:var(--color-primary);font-weight:bold;flex-shrink:0;">✓</span>
                        <span>Fomento de la inmunidad natural supervisada.</span>
                    </li>
                </ul>
            </div>
            <p>En el Instituto Froebel contamos con espacios diseñados neurocientíficamente para cada edad.</p>
        """
    }
]

for post in posts:
    # Update title and meta
    post_html = re.sub(r'<title>.*?</title>', f'<title>{post["title"]}</title>', prefix, flags=re.DOTALL)
    post_html = re.sub(r'<meta content="(?!(width|index|website)).*?" name="description"/>', f'<meta content="{post["description"]}" name="description"/>', post_html)
    post_html = re.sub(r'<meta content=".*?" property="og:title"/>', f'<meta content="{post["title"]}" property="og:title"/>', post_html)
    post_html = re.sub(r'<meta content=".*?" property="og:description"/>', f'<meta content="{post["description"]}" property="og:description"/>', post_html)
    post_html = re.sub(r'<meta content=".*?" property="twitter:title"/>', f'<meta content="{post["title"]}" property="twitter:title"/>', post_html)
    post_html = re.sub(r'<meta content=".*?" property="twitter:description"/>', f'<meta content="{post["description"]}" property="twitter:description"/>', post_html)
    
    # URL meta
    post_url = f"https://froebelinstituto.com.mx/blog/{post['filename']}"
    post_html = re.sub(r'<link href=".*?" rel="canonical"/>', f'<link href="{post_url}" rel="canonical"/>', post_html)
    post_html = re.sub(r'<meta content=".*?" property="og:url"/>', f'<meta content="{post_url}" property="og:url"/>', post_html)
    post_html = re.sub(r'<meta content=".*?" property="twitter:url"/>', f'<meta content="{post_url}" property="twitter:url"/>', post_html)
    
    # Construct article body
    article_body = f'''
    <!-- ARTICLE -->
    <article class="section" style="padding-top: calc(72px + var(--space-16)); max-width: 780px; margin: 0 auto; padding-left: var(--space-6); padding-right: var(--space-6);">
        <div class="fade-in">
            <a href="/blog/" style="display:inline-flex;align-items:center;gap:var(--space-2);color:var(--color-primary);font-weight:var(--weight-semibold);font-size:var(--text-sm);text-decoration:none;margin-bottom:var(--space-6);">
                ← Volver al Blog
            </a>
            <span style="display:inline-block;background:var(--color-accent);color:white;padding:var(--space-1) var(--space-4);border-radius:var(--radius-full);font-size:var(--text-xs);font-weight:var(--weight-semibold);margin-bottom:var(--space-4);">{post['tag']}</span>
            
            <h1 style="font-size:var(--text-4xl);line-height:1.15;margin-bottom:var(--space-4);">
                {post['h1']}
            </h1>
            
            <div style="display:flex;align-items:center;gap:var(--space-4);color:var(--color-text-muted);font-size:var(--text-sm);margin-bottom:var(--space-8);padding-bottom:var(--space-6);border-bottom:1px solid var(--color-border);">
                <span>{post['meta']}</span>
            </div>
        </div>

        <div class="fade-in" style="line-height:var(--leading-relaxed);color:var(--color-text-light);">
            {post['content']}
            
            <!-- CTA -->
            <div style="background:linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));color:white;border-radius:var(--radius-2xl);padding:var(--space-10);text-align:center;margin:var(--space-12) 0;">
                <h2 style="color:white;margin-bottom:var(--space-4);font-size:var(--text-2xl);">
                    Conoce el Instituto Federico Froebel
                </h2>
                <p style="color:rgba(255,255,255,0.9);margin-bottom:var(--space-6);max-width:500px;margin-left:auto;margin-right:auto;">
                    Educamos con amor y respeto. Descubre nuestros programas bilingües con enfoque integral y valores para nivel Preescolar y Maternal.
                </p>
                <div style="display:flex;gap:var(--space-4);justify-content:center;flex-wrap:wrap;">
                    <a href="../inscripciones.html" class="btn btn--accent btn--lg">Inscribir a mi hijo →</a>
                    <a href="../programas.html" class="btn btn--secondary btn--lg">Ver Programas Educativos</a>
                </div>
            </div>
            
        </div>
    </article>
    '''
    
    # Combine everything
    full_html = post_html + article_body + suffix
    
    # Write to file
    out_path = os.path.join(base_dir, post['filename'])
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(full_html)
    print(f"Generated {post['filename']}")
