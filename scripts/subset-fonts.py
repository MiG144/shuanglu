# -*- coding: utf-8 -*-
"""思源字体子集化：从源码/文档提取界面实际使用字符，生成 woff2 子集。

产物（public/fonts/）：
  shuanglu-serif-sc.woff2  —— 思源宋体（古意：标题/印章/原文引文）
  shuanglu-sans-sc.woff2   —— 思源黑体（正文，可选）

用法：python scripts/subset-fonts.py
依赖：本机已装 Noto Serif/Sans SC VF（Windows 字体目录）；pip fonttools brotli

字体来源：Noto Serif SC / Noto Sans SC = 思源宋体/黑体（Google 版，SIL OFL 1.1 可再分发）。
"""
import os
import re
import sys
import glob
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, 'public', 'fonts')
os.makedirs(OUT_DIR, exist_ok=True)

SERIF_SRC = r'C:\WINDOWS\Fonts\NotoSerifSC-VF.ttf'
SANS_SRC = r'C:\WINDOWS\Fonts\NotoSansSC-VF.ttf'

# ----- 收集字符集：扫描源码与文档中的中文及符号 -----
def collect_chars():
    texts = []
    # 源码（tsx/ts/css 含中文文案）
    for pat in ('src/**/*.tsx', 'src/**/*.ts', 'src/**/*.css', 'index.html'):
        for f in glob.glob(os.path.join(ROOT, pat), recursive=True):
            try:
                with open(f, encoding='utf-8', errors='ignore') as fh:
                    texts.append(fh.read())
            except Exception:
                pass
    # 交互教学课件 + 规则手册（组件内含文案）已覆盖；再补规则文档引文
    for f in glob.glob(os.path.join(ROOT, 'docs', 'rules', '*.md')):
        try:
            with open(f, encoding='utf-8', errors='ignore') as fh:
                texts.append(fh.read())
        except Exception:
            pass
    # 需要但不在源码中的补充字（若界面出现，自动纳入）
    extra = '雙陸譜打雙陸馬梁門采彩擲骰拈出離盤過門番禺大食真臘閣婆闍婆西竺曹魏握槊長行波羅塞戲雜記常局格制總録南北局例盤馬'
    all_text = ''.join(texts) + extra
    # 提取 CJK + 常用标点 + ASCII
    chars = set()
    for ch in all_text:
        if ch in '\n\r\t ':  # 空白保留
            continue
        cp = ord(ch)
        if (0x4E00 <= cp <= 0x9FFF) or (0x3400 <= cp <= 0x4DBF) or (0x3000 <= cp <= 0x303F) \
           or (0xFF00 <= cp <= 0xFFEF) or (0x2010 <= cp <= 0x2027) or (0x2027 <= cp <= 0x2028) \
           or ch in '，。；：！？、（）【】「」『』《》·—…‘’“”〝〞・':
            chars.add(ch)
        if 0x20 <= cp <= 0x7E:
            chars.add(ch)  # ASCII
    return ''.join(sorted(chars))


def subset(src, chars, out):
    # 用 fonttools 的 subset 命令行（fonttools subset 内置）
    cmd = [
        sys.executable, '-m', 'fontTools.subset', src,
        '--text=' + chars,
        '--output-file=' + out,
        '--flavor=woff2',
        '--no-hinting',
        '--layout-features=*',
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print('SUBSET FAIL', r.stderr[-800:])
        return False
    return True


def main():
    chars = collect_chars()
    print(f'收集到 {len(chars)} 个字符（含中文 {sum(1 for c in chars if ord(c) > 0x2E7F)} 个）')

    serif_out = os.path.join(OUT_DIR, 'shuanglu-serif-sc.woff2')
    if os.path.exists(SERIF_SRC):
        subset(SERIF_SRC, chars, serif_out)
        print('serif ->', serif_out, os.path.getsize(serif_out), 'bytes' if os.path.exists(serif_out) else '(fail)')
    else:
        print('跳过 serif：未找到', SERIF_SRC)

    sans_out = os.path.join(OUT_DIR, 'shuanglu-sans-sc.woff2')
    if os.path.exists(SANS_SRC):
        subset(SANS_SRC, chars, sans_out)
        print('sans  ->', sans_out, os.path.getsize(sans_out), 'bytes' if os.path.exists(sans_out) else '(fail)')
    else:
        print('跳过 sans：未找到', SANS_SRC)


if __name__ == '__main__':
    main()