#!/usr/bin/env python3
"""Makes web-sized copies of the supply photos in src/images/Supplies/ into images/supplies/ (max 1200 px on the
long side, JPEG ~80%), named <product>-<what>.jpg, and writes images/supplies/index.json listing them per product.
The originals stay where they are. Re-run after adding photos:  python3 scripts/build-supply-images.py"""
import json, os, re, sys
from PIL import Image, ImageOps

SRC = 'src/images/Supplies'
DST = 'images/supplies'
os.makedirs(DST, exist_ok=True)

def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

# file stem fix-ups: product name as it should read, then the part after " - " is what the photo shows
products = {}
for f in sorted(os.listdir(SRC)):
    if not f.lower().endswith(('.jpg', '.jpeg', '.png')):
        continue
    stem = os.path.splitext(f)[0]
    m = re.match(r'^(.*?)\s*-\s*(.*)$', stem)
    name, what = (m.group(1).strip(), m.group(2).strip()) if m else (stem, 'photo')
    name = name.replace('Milett', 'Millet')
    what = what.replace('Milett', 'Millet').replace('Pallets', 'Pallet')
    key = slug(name)
    out = '%s-%s.jpg' % (key, slug(what))
    im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, f)))
    im.thumbnail((1200, 1200))
    im.convert('RGB').save(os.path.join(DST, out), 'JPEG', quality=80, optimize=True)
    products.setdefault(key, {'name': name, 'images': []})['images'].append({'what': what, 'file': 'images/supplies/' + out})

ORDER = ['bag', 'box', 'bucket', 'sample', 'pallet', 'label']
for p in products.values():
    p['images'].sort(key=lambda i: ORDER.index(i['what'].lower()) if i['what'].lower() in ORDER else 99)
json.dump(products, open(os.path.join(DST, 'index.json'), 'w'), indent=2)
print(sum(len(p['images']) for p in products.values()), 'images,', len(products), 'products')
