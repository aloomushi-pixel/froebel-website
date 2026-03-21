from PIL import Image, ImageOps
import os

assets_dir = r"c:\Users\ccuri\Documents\Desarrollo\Feredico Froebel\website\assets\images"
hero_path = os.path.join(assets_dir, "hero-ninos-maternal-y-preescolar-san-juan-de-aragon.jpg")

if os.path.exists(hero_path):
    with Image.open(hero_path) as img:
        img = img.convert('RGB')
        # Center crop to 840x760
        img_cropped = ImageOps.fit(img, (840, 760), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        img_cropped.save(hero_path, quality=85)
        print(f"Cropped hero image to {img_cropped.size}")
