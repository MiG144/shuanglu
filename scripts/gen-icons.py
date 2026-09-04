# -*- coding: utf-8 -*-
"""生成 PWA 图标（192/512/apple-touch）——木质底色 + 中心双陆骰子点阵风格。"""
from PIL import Image, ImageDraw

def make_icon(size, path):
    img = Image.new('RGB', (size, size), (122, 79, 42))  # 棋盘木质棕 #7a4f2a
    d = ImageDraw.Draw(img)
    # 内框（门线）
    m = int(size * 0.08)
    d.rectangle([m, m, size - m, size - m], outline=(240, 218, 160), width=max(2, size // 40))
    # 中心：双陆"门"分隔线 + 两点（白/黑骰示意）
    cx = size // 2
    d.line([(cx, m), (cx, size - m)], fill=(240, 218, 160), width=max(2, size // 40))
    r = int(size * 0.13)
    d.ellipse([cx - int(size*0.22) - r, size//2 - r, cx - int(size*0.22) + r, size//2 + r], fill=(245, 241, 228))
    d.ellipse([cx + int(size*0.22) - r, size//2 - r, cx + int(size*0.22) + r, size//2 + r], fill=(43, 43, 51))
    img.save(path, 'PNG')

make_icon(192, 'public/pwa-192.png')
make_icon(512, 'public/pwa-512.png')
make_icon(180, 'public/apple-touch-icon.png')
print('icons generated')