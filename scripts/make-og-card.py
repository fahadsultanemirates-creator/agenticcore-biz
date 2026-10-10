#!/usr/bin/env python3
"""
Build public/og-card.jpg, the 1200x630 image used for link previews.

og:image pointed at favicon.png -- a 256x256 square -- so every share of this
site previewed as a cropped icon, and twitter:card was the small "summary"
type rather than summary_large_image. This generates a real card at the
aspect ratio the platforms actually crop to.

Run: python3 scripts/make-og-card.py
Needs: pillow, fonttools, brotli (fonttools/brotli only to read the woff2
       brand font that the site already ships in public/fonts).
"""
from pathlib import Path

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
VOID = (9, 9, 13)
ORANGE = (251, 119, 1)
FG = (246, 245, 242)
MUTED = (150, 150, 160)
W, H = 1200, 630


def brand_font(size, weight=600):
    """Inter, from the woff2 the site already serves, as a PIL font."""
    woff2 = ROOT / "public/fonts/inter-normal.woff2"
    ttf = ROOT / "node_modules/.cache/inter-og.ttf"
    ttf.parent.mkdir(parents=True, exist_ok=True)
    if not ttf.exists():
        font = TTFont(str(woff2))
        font.flavor = None
        font.save(str(ttf))
    pil = ImageFont.truetype(str(ttf), size)
    try:
        pil.set_variation_by_axes([weight])
    except Exception:
        pass  # Static build of the font; the default weight is fine.
    return pil


card = Image.new("RGB", (W, H), VOID)
draw = ImageDraw.Draw(card)

# A soft orange glow behind the mark, echoing the site's hero. Drawn on its
# own layer and blurred -- an unblurred ellipse reads as a flat disc with a
# hard edge, which is what the first version of this card shipped.
glow = Image.new("RGB", (W, H), VOID)
ImageDraw.Draw(glow).ellipse((-120, 110, 500, 730), fill=(74, 36, 4))
glow = glow.filter(ImageFilter.GaussianBlur(110))
card = Image.blend(card, glow, 0.75)
draw = ImageDraw.Draw(card)

# The lockup the site actually renders (src/assets/logo-lockup.webp), not
# public/logo.png -- that one is the retired multicoloured mark and nothing
# imports it. The source is only 162px tall, so it is held to a modest size
# rather than upscaled into mush.
logo = Image.open(ROOT / "src/assets/logo-lockup.webp").convert("RGBA")
logo = logo.crop(logo.getchannel("A").getbbox())
target_h = 200
logo = logo.resize((round(logo.width * target_h / logo.height), target_h), Image.LANCZOS)
card.paste(logo, (110, (H - logo.height) // 2), logo)

text_x = 110 + logo.width + 72
draw.text((text_x, 238), "AgenticCore", font=brand_font(64, 700), fill=FG)
draw.text((text_x, 312), ".biz", font=brand_font(64, 700), fill=ORANGE)
draw.text(
    (text_x, 408),
    "Business setup, back-office\nand bookkeeping support.",
    font=brand_font(29, 400),
    fill=MUTED,
    spacing=12,
)

out = ROOT / "public/og-card.jpg"
card.save(out, "JPEG", quality=92, optimize=True)
print(f"wrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} kB, {W}x{H})")
