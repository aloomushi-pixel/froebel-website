import os
import re

directory = r"c:\Users\ccuri\Documents\Desarrollo\Feredico Froebel\website"
nosotros_path = os.path.join(directory, "nosotros.html")

with open(nosotros_path, "r", encoding="utf-8") as f:
    nosotros_content = f.read()

footer_pattern = re.compile(r"(?:<!--\s*FOOTER\s*-->\s*)?<footer\b[^>]*>.*?</footer>", re.DOTALL | re.IGNORECASE)
footer_match = footer_pattern.search(nosotros_content)

if not footer_match:
    print("Could not find footer in nosotros.html")
    exit(1)

new_footer = footer_match.group(0)

# Make sure links in the footer are absolute to avoid 404s when included in subdirectories like /blog/
new_footer = new_footer.replace('href="programas.html#maternal"', 'href="/programas#maternal"')
new_footer = new_footer.replace('href="programas.html#preescolar"', 'href="/programas#preescolar"')
new_footer = new_footer.replace('href="programas.html#extendido"', 'href="/programas#extendido"')

if not new_footer.strip().startswith("<!-- FOOTER -->"):
    new_footer = "<!-- FOOTER -->\n" + new_footer

count = 0
for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(".html"):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            new_content = footer_pattern.sub(new_footer, content)

            if new_content != content:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated footer in {file_path}")
                count += 1
            else:
                print(f"No footer matched or already updated in {file_path}")

print(f"Successfully updated {count} files.")
