from PIL import Image
import os

assets_dir = r"c:\Users\ccuri\Documents\Desarrollo\Feredico Froebel\website\assets\images"

# Resize Hero image
hero_path = os.path.join(assets_dir, "hero-ninos-maternal-y-preescolar-san-juan-de-aragon.jpg")
if os.path.exists(hero_path):
    with Image.open(hero_path) as img:
        img = img.convert('RGB')
        # We need it around 420x380, let's make it 840 width for retina
        # But aspect ratio: 1376x3064 is very tall.
        # It's rendered as object-fit: cover 420x380.
        # Let's resize it to 840x... keeping aspect ratio.
        # ratio width: 1376 -> 840
        ratio = 840 / img.width
        new_height = int(img.height * ratio)
        img_resized = img.resize((840, new_height), Image.Resampling.LANCZOS)
        img_resized.save(hero_path, quality=85)
        print(f"Resized hero image to {img_resized.size}")

# Resize Logo
logo_path = os.path.join(assets_dir, "logo-froebel.jpg")
if os.path.exists(logo_path):
    with Image.open(logo_path) as img:
        img = img.convert('RGB')
        # We need it around 44x44, let's make it 88x88 for retina
        img_resized = img.resize((88, 88), Image.Resampling.LANCZOS)
        img_resized.save(logo_path, quality=85)
        print(f"Resized logo image to {img_resized.size}")
