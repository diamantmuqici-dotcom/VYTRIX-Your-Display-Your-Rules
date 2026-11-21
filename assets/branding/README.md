# VYTRIX Brand Assets

All marks in this directory are original geometry created for VYTRIX. The
vector SVGs are the source of truth; raster files are generated from them.

## Vector sources

| File | Description |
| --- | --- |
| `vytrix-icon.svg` | The standalone "V" mark: gradient outer wedge, dark inner notch, cyan accent triangle. Source geometry for every raster icon. |
| `vytrix-gradient.svg` | Horizontal lockup: icon plus the VYTRIX wordmark in a light gradient. Source for wide placements. |
| `vytrix-white.svg` | Monochrome lockup for dark backgrounds. |
| `vytrix-black.svg` | Monochrome lockup for light backgrounds. |

Geometry (in the icon's 512-unit coordinate space): outer wedge
`(56,96) (152,96) (256,366) (360,96) (456,96) (296,448) (216,448)`; inner notch
`(170,96) (210,96) (256,232) (302,96) (342,96) (256,332)`; accent triangle
`(238,380) (274,380) (256,420)`. Palette: cyan `#00D9FF`, indigo `#6557FF`,
violet `#A855F7`, near-black `#080B12`.

## Generated rasters

| File | Size | Source | Purpose |
| --- | --- | --- | --- |
| `vytrix.png` | 512x512 | `vytrix-icon.svg` | Full-resolution app mark |
| `vytrix-256.png` | 256x256 | `vytrix-icon.svg` | Medium icon |
| `vytrix-64.png` | 64x64 | `vytrix-icon.svg` | Small icon |
| `vytrix.ico` | multi-size | `vytrix-icon.svg` | Windows app icon (`scripts/gen_branding.py`) |
| `favicon.ico` | multi-size | `vytrix-icon.svg` | Website favicon (`scripts/gen_branding.py`) |
| `vytrix-social.png` | 1200x630 | original V mark + lockup | Open Graph / social cards (`scripts/gen_social.py`) |
| `vytrix-discord-icon.png` | 512x512 | original V mark | Discord server icon (`scripts/gen_social.py`) |

Regenerate:

```powershell
python scripts/gen_branding.py
python scripts/gen_social.py
```

The social card and Discord icon use an original layout: diagonal navy-to-indigo
gradient, cyan and violet radial glows, a fine technical grid, the V mark, and
the tagline **YOUR DISPLAY. YOUR RULES.**
