from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)


def create_logo(size: int) -> Image.Image:
    scale = size / 256
    image = Image.new("RGB", (size, size), "#102a2d")
    draw = ImageDraw.Draw(image)
    margin = round(30 * scale)
    screen = (margin, round(52 * scale), size - margin, size - round(55 * scale))
    draw.rounded_rectangle(
        screen,
        radius=round(22 * scale),
        fill="#eaf4f1",
        outline="#58c5ad",
        width=max(2, round(8 * scale)),
    )
    inner = (
        screen[0] + round(13 * scale),
        screen[1] + round(13 * scale),
        screen[2] - round(13 * scale),
        screen[3] - round(13 * scale),
    )
    draw.rectangle(inner, fill="#173b43")
    draw.ellipse(
        (
            round(165 * scale),
            round(82 * scale),
            round(202 * scale),
            round(119 * scale),
        ),
        fill="#e5b86c",
    )
    draw.polygon(
        [
            (inner[0], round(176 * scale)),
            (round(78 * scale), round(111 * scale)),
            (round(113 * scale), round(157 * scale)),
            (round(150 * scale), round(100 * scale)),
            (inner[2], round(169 * scale)),
            (inner[2], inner[3]),
            (inner[0], inner[3]),
        ],
        fill="#4d817e",
    )
    draw.polygon(
        [
            (inner[0], round(196 * scale)),
            (round(81 * scale), round(154 * scale)),
            (round(127 * scale), round(202 * scale)),
            (round(178 * scale), round(141 * scale)),
            (inner[2], round(194 * scale)),
            (inner[2], inner[3]),
            (inner[0], inner[3]),
        ],
        fill="#24575a",
    )
    draw.rounded_rectangle(
        (
            round(84 * scale),
            size - round(50 * scale),
            size - round(84 * scale),
            size - round(38 * scale),
        ),
        radius=round(5 * scale),
        fill="#d47535",
    )
    return image


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
