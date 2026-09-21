#!/usr/bin/env python3
"""
Empaqueta el proyecto en un único HTML autocontenido.

Los módulos ES se concatenan en orden de dependencias, quitando los `import`
internos y la palabra `export`. Sirve para abrir la escena con doble clic o
subirla a cualquier hosting estático sin servidor de por medio.

Uso:  python3 tools/build.py
Sale: dist/via-lactea.html
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ORDER = [
    "config.js",
    "utils.js",
    "flowers.js",
    "starfield.js",
    "garden.js",
    "effects.js",
    "audio.js",
    "ui.js",
    "main.js",
]

IMPORT_RE = re.compile(r"^import\s+[^;]*?from\s+['\"]\./[^'\"]+['\"];\s*$", re.M | re.S)
EXPORT_RE = re.compile(r"^export\s+", re.M)


def bundle_js() -> str:
    parts = []
    for name in ORDER:
        source = (ROOT / "src" / "js" / name).read_text(encoding="utf-8")
        source = IMPORT_RE.sub("", source)
        source = EXPORT_RE.sub("", source)
        parts.append(f"/* ===== {name} ===== */\n{source.strip()}\n")
    return "\n".join(parts)


def main() -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "src" / "styles" / "main.css").read_text(encoding="utf-8")

    html = html.replace(
        '<link rel="stylesheet" href="./src/styles/main.css" />',
        f"<style>\n{css}\n</style>",
    )
    html = html.replace(
        '<script type="module" src="./src/js/main.js"></script>',
        f'<script type="module">\n{bundle_js()}\n</script>',
    )

    out = ROOT / "dist"
    out.mkdir(exist_ok=True)
    target = out / "via-lactea.html"
    target.write_text(html, encoding="utf-8")
    print(f"Listo: {target} ({target.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    main()
