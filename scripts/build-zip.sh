#!/usr/bin/env bash
# 配布用 zip を作る: scripts/build-zip.sh [出力先ディレクトリ]
# zip を展開したフォルダを chrome://extensions で「パッケージ化されていない拡張機能を読み込む」に指定できる。
set -euo pipefail
cd "$(dirname "$0")/.."
version=$(python3 -c 'import json;print(json.load(open("manifest.json"))["version"])')
out=${1:-dist}
name="codie-sidebar-chrome-extension-v${version}"
rm -rf "$out/$name" "$out/$name.zip"
mkdir -p "$out/$name"
cp -r manifest.json README.md LICENSE src sidepanel "$out/$name/"
(cd "$out" && zip -qr "$name.zip" "$name")
echo "$out/$name.zip"
