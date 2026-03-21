from PIL import Image, ImageOps
import os

assets_dir = r"c:\Users\ccuri\Documents\Desarrollo\Feredico Froebel\website\assets\images"
hero_path = os.path.join(assets_dir, "hero-ninos-maternal-y-preescolar-san-juan-de-aragon.webp")
logo_path = os.path.join(assets_dir, "logo-froebel.webp")

if os.path.exists(hero_path):
    with Image.open(hero_path) as img:
        img_cropped = ImageOps.fit(img, (420, 380), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        img_cropped.save(hero_path, quality=80)
        print(f"Resized hero to 420x380")

if os.path.exists(logo_path):
    with Image.open(logo_path) as img:
        img_cropped = ImageOps.fit(img, (44, 44), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        img_cropped.save(logo_path, quality=80)
        print(f"Resized logo to 44x44")
