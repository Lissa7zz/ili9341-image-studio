from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)


icon_source = Image.open(ASSETS / "app-icon-source.png").convert("RGB")


def create_logo(size: int) -> Image.Image:
    return icon_source.resize((size, size), Image.Resampling.LANCZOS)


logo = create_logo(256)
logo.save(ASSETS / "logo-256.png", optimize=True)
create_logo(64).save(ASSETS / "logo-64.png", optimize=True)
logo.save(
    ASSETS / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)

demo = Image.new("RGB", (320, 240), "#173b43")
demo_draw = ImageDraw.Draw(demo)
for y in range(240):
    ratio = y / 239
    red = round(23 + (213 - 23) * ratio)
    green = round(59 + (182 - 59) * ratio)
    blue = round(67 + (119 - 67) * ratio)
    demo_draw.line((0, y, 320, y), fill=(red, green, blue))
demo_draw.ellipse((224, 42, 266, 84), fill="#e5bd72")
demo_draw.polygon(
    [(0, 173), (62, 91), (115, 149), (183, 75), (258, 164), (320, 112), (320, 240), (0, 240)],
    fill="#34575a",
)
demo_draw.polygon(
    [(0, 212), (71, 148), (143, 202), (215, 135), (320, 205), (320, 240), (0, 240)],
    fill="#1b3537",
)
demo.save(ASSETS / "demo.jpg", quality=90, optimize=True)

print("Generated logo, favicon, and demo image.")
