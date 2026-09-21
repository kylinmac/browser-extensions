#!/usr/bin/env bash
# 打包成可分发 / 可上传商店的 zip
set -euo pipefail
cd "$(dirname "$0")"

VER=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
OUT="dist/force-dark-$VER.zip"

rm -rf dist && mkdir -p dist
zip -r -q "$OUT" \
  manifest.json background.js content.js popup icons _locales \
  -x '*.DS_Store' '*/.*'

# 自检：manifest 引用的东西必须都在包里
python3 - "$OUT" <<'CHECK'
import json, sys, zipfile
z = zipfile.ZipFile(sys.argv[1]); names = set(z.namelist())
m = json.loads(z.read('manifest.json'))
missing = []
if 'default_locale' in m:
    if not any(n.startswith('_locales/') for n in names):
        missing.append('_locales/')
    loc = f"_locales/{m['default_locale']}/messages.json"
    if loc not in names:
        missing.append(loc)
for p in [m['background']['service_worker'], m['action']['default_popup']]:
    if p not in names: missing.append(p)
for p in m['icons'].values():
    if p not in names: missing.append(p)
for cs in m['content_scripts']:
    for p in cs['js']:
        if p not in names: missing.append(p)
if missing:
    print('打包缺少文件:', ', '.join(missing)); sys.exit(1)
print(f"自检通过，{len(names)} 个条目")
CHECK

echo "$OUT  ($(du -h "$OUT" | cut -f1))"
