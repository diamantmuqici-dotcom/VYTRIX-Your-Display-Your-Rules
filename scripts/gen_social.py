"""Generate VYTRIX social and Discord raster assets from the original vector mark.

Original design: diagonal navy-to-indigo gradient, cyan/violet radial glows,
fine technical grid, the VYTRIX "V" mark, and the tagline.
Run: python scripts/gen_social.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / "assets" / "branding"

# Geometry copied from the original vector mark in vytrix-icon.svg / vytrix-gradient.svg.
BASE = 512
OUTER = [(56, 96), (152, 96), (256, 366), (360, 96), (456, 96), (296, 448), (216, 448)]
INNER = [(170, 96), (210, 96), (256, 232), (302, 96), (342, 96), (256, 332)]
ACCENT = [(238, 380), (274, 380), (256, 420)]

CYAN = (0, 217, 255)
VIOLET = (168, 85, 247)
WHITE = (242, 246, 252)
MUTED = (161, 174, 192)


def font(size, bold=False):
    candidates = []
    if bold:
        candidates += [r"C:\Windows\Fonts\segoeuib.ttf", r"C:\Windows\Fonts\arialbd.ttf"]
    else:
        candidates += [r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\arial.ttf"]
    candidates += [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default(size=size)


def background(width, height):
    image = Image.new("RGB", (width, height))
    pixels = image.load()
    glow_a = (width * 0.18, height * 0.22)
    glow_b = (width * 0.86, height * 0.78)
    max_dist = max(width, height) * 0.85
    for y in range(height):
        for x in range(width):
            t = min(1.0, (x / width * 0.6 + y / height * 0.4))
            base = (
                int(8 + (22 - 8) * t),
                int(11 + (26 - 11) * t),
                int(22 + (58 - 22) * t),
            )
            da = ((x - glow_a[0]) ** 2 + (y - glow_a[1]) ** 2) ** 0.5 / max_dist
            db = ((x - glow_b[0]) ** 2 + (y - glow_b[1]) ** 2) ** 0.5 / max_dist
            ga = max(0.0, 1.0 - da) ** 2 * 0.42
            gb = max(0.0, 1.0 - db) ** 2 * 0.34
            pixels[x, y] = (
                min(255, int(base[0] + CYAN[0] * ga + VIOLET[0] * gb)),
                min(255, int(base[1] + CYAN[1] * ga + VIOLET[1] * gb)),
                min(255, int(base[2] + CYAN[2] * ga + VIOLET[2] * gb)),
            )

    grid = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(grid)
    step = max(36, width // 24)
    for x in range(0, width, step):
        draw.line([(x, 0), (x, height)], fill=(255, 255, 255, 10), width=1)
    for y in range(0, height, step):
        draw.line([(0, y), (width, y)], fill=(255, 255, 255, 10), width=1)
    return Image.alpha_composite(image.convert("RGBA"), grid)


def mark(size):
    scale = size / BASE
    points = lambda seq: [(int(x * scale), int(y * scale)) for x, y in seq]

    surface = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(surface)
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * max(1, size - 1))
            if t < 0.52:
                a, b, u = CYAN, (101, 87, 255), t / 0.52
            else:
                a, b, u = (101, 87, 255), VIOLET, (t - 0.52) / 0.48
            sd.point((x, y), fill=tuple(int(a[i] + (b[i] - a[i]) * u) for i in range(3)) + (255,))

    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).polygon(points(OUTER), fill=255)
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    icon.paste(surface, (0, 0), mask)
    draw = ImageDraw.Draw(icon)
    draw.polygon(points(INNER), fill=(8, 11, 18, 255))
    draw.polygon(points(ACCENT), fill=CYAN + (255,))
    return icon


def paste_mark(canvas, icon, box):
    left, top, width, height = box
    scaled = icon.resize((width, height), Image.Resampling.LANCZOS)
    canvas.alpha_composite(scaled, (left, top))


def text_block(canvas, left, top, width):
    draw = ImageDraw.Draw(canvas)
    title_font = font(114, bold=True)
    tag_font = font(31, bold=False)
    draw.text((left, top), "VYTRIX", font=title_font, fill=WHITE)
    draw.text((left + 4, top + 140), "YOUR DISPLAY. YOUR RULES.", font=tag_font, fill=MUTED)
    bar = ImageDraw.Draw(canvas)
    bar.rounded_rectangle((left, top + 196, left + 132, top + 202), radius=3, fill=CYAN)


def social():
    width, height = 1200, 630
    canvas = background(width, height)
    paste_mark(canvas, mark(512), (92, 148, 330, 330))
    text_block(canvas, 486, 222, width - 486 - 60)
    canvas.convert("RGB").save(ROOT / "vytrix-social.png", optimize=True)


def discord():
    size = 512
    canvas = background(size, size)
    # Circular vignette so the icon reads cleanly at 48px.
    vignette = Image.new("L", (size, size), 0)
    ImageDraw.Draw(vignette).ellipse((6, 6, size - 6, size - 6), fill=255)
    base = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    base.paste(canvas, (0, 0), vignette)
    canvas = base
    paste_mark(canvas, mark(512), (86, 74, 340, 340))
    draw = ImageDraw.Draw(canvas)
    draw.text((150, 424), "VYTRIX", font=font(52, bold=True), fill=WHITE)
    canvas.convert("RGBA").save(ROOT / "vytrix-discord-icon.png", optimize=True)


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    social()
    discord()
    print("wrote vytrix-social.png (1200x630) and vytrix-discord-icon.png (512x512) to", ROOT)


if __name__ == "__main__":
    main()
