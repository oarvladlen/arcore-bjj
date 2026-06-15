#!/usr/bin/env python3
"""Gera ícones PNG da Arcore (opcional, para o iOS ficar nítido).
Uso:  pip install Pillow  &&  python3 tools/make-icons.py
Gera, na pasta do app: icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
Depois aponte o <link rel="apple-touch-icon"> e o manifest para os PNGs, se quiser."""
import os
from PIL import Image, ImageDraw

BG    = (22, 17, 12, 255)   # #16110C
EMBER = (234, 90, 44)       # #EA5A2C
GOLD  = (215, 170, 76)      # #D7AA4C
SS = 4
OUT = os.path.join(os.path.dirname(__file__), "..")


def vgrad(size, top, bottom):
    w, h = size
    g = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        g.putpixel((0, y), tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return g.resize((w, h))


def make(S, maskable=False):
    s = S * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    bg = Image.new("RGBA", (s, s), BG)
    glow = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([-s * 0.2, -s * 0.55, s * 1.2, s * 0.55], fill=(234, 90, 44, 60))
    bg = Image.alpha_composite(bg, glow)

    if maskable:
        img.paste(bg, (0, 0))
    else:
        mask = Image.new("L", (s, s), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=255)
        img.paste(bg, (0, 0), mask)

    scale = 0.50 if maskable else 0.60
    h = s * scale
    cx, y0 = s / 2, (s - h) / 2
    y1, half = y0 + h, h * 0.46
    t = int(h * 0.165)
    apex, botL, botR = (cx, y0), (cx - half, y1), (cx + half, y1)

    legmask = Image.new("L", (s, s), 0)
    ld = ImageDraw.Draw(legmask)
    ld.line([botL, apex, botR], fill=255, width=t, joint="curve")
    for p in (botL, botR, apex):
        ld.ellipse([p[0] - t / 2, p[1] - t / 2, p[0] + t / 2, p[1] + t / 2], fill=255)
    img.paste(vgrad((s, s), EMBER, GOLD).convert("RGBA"), (0, 0), legmask)

    ybar = y0 + h * 0.66
    cw = half * 0.95
    barmask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(barmask).rounded_rectangle([cx - cw, ybar, cx + cw, ybar + t * 0.92], radius=int(t * 0.4), fill=255)
    img.paste(Image.new("RGBA", (s, s), GOLD + (255,)), (0, 0), barmask)
    r = t * 0.34
    ImageDraw.Draw(img).ellipse([cx - r, ybar + t * 0.46 - r, cx + r, ybar + t * 0.46 + r], fill=BG)
    return img.resize((S, S), Image.LANCZOS)


if __name__ == "__main__":
    make(512).save(os.path.join(OUT, "icon-512.png"))
    make(192).save(os.path.join(OUT, "icon-192.png"))
    make(512, maskable=True).save(os.path.join(OUT, "icon-maskable-512.png"))
    make(180).save(os.path.join(OUT, "apple-touch-icon.png"))
    print("OK: icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png")
