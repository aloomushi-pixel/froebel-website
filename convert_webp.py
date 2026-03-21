import os
from PIL import Image

assets_dir = r"c:\Users\ccuri\Documents\Desarrollo\Feredico Froebel\website\assets\images"
files_to_convert = ["hero-ninos-maternal-y-preescolar-san-juan-de-aragon.jpg", "logo-froebel.jpg"]

for filename in files_to_convert:
    path = os.path.join(assets_dir, filename)
    if os.path.exists(path):
        webp_path = os.path.splitext(path)[0] + ".webp"
        with Image.open(path) as img:
            img.save(webp_path, 'webp', quality=80)
        print(f"Converted {filename} to {os.path.basename(webp_path)}")
