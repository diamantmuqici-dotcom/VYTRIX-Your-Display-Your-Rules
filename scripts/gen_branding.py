"""Generate VYTRIX raster brand assets from the vector geometry."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "assets" / "branding"
BASE = 512
OUTER = [(56, 96), (152, 96), (256, 366), (360, 96), (456, 96), (296, 448), (216, 448)]
INNER = [(170, 96), (210, 96), (256, 232), (302, 96), (342, 96), (256, 332)]
ACCENT = [(238, 380), (274, 380), (256, 420)]


def gradient(size):
    image = Image.new("RGB", (size, size))
    pixels = image.load()
    stops = [(0, 217, 255), (101, 87, 255), (168, 85, 247)]
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * max(1, size - 1))
            if t < 0.52:
                a, b, u = stops[0], stops[1], t / 0.52
            else:
                a, b, u = stops[1], stops[2], (t - 0.52) / 0.48
            pixels[x, y] = tuple(int(a[i] + (b[i] - a[i]) * u) for i in range(3))
    return image


def render(size):
    scale = size / BASE
    points = lambda seq: [(int(x * scale), int(y * scale)) for x, y in seq]
    surface = gradient(size).convert("RGBA")
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).polygon(points(OUTER), fill=255)
    icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    icon.paste(surface, (0, 0), mask)
    draw = ImageDraw.Draw(icon)
    draw.polygon(points(INNER), fill=(8, 11, 18, 255))
    draw.polygon(points(ACCENT), fill=(0, 217, 255, 255))
    return icon


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    render(512).save(ROOT / "vytrix.png")
    render(256).save(ROOT / "vytrix-256.png")
    render(64).save(ROOT / "vytrix-64.png")
    render(512).save(ROOT / "vytrix.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    render(64).save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("branding assets written to", ROOT)


if __name__ == "__main__":
    main()
