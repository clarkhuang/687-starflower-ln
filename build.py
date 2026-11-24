import html, pathlib, re
from PIL import Image
root = pathlib.Path(__file__).resolve().parent
CSS = open('/workspace/property/docs/deal-rd/site/index.html').read()
css = CSS[CSS.index('<style>')+7:CSS.index('</style>')]
css += (root/'extra.css').read_text()

PH = {
0:'Woodland Trails drive',1:'Front and the 40x50 garage',2:'Covered back deck',3:'Aerial, the wooded lot',
4:'Front porch',5:'Entry',6:'Fireplace wall',7:'Foyer sitting area',8:'Built-ins toward the kitchen',
9:'Kitchen',10:'Kitchen, wide view',11:'Kitchen toward the dining windows',12:'Kitchen island and range wall',
13:'Kitchen range and cabinets',14:'Kitchen and island',15:'Kitchen sink and window',16:'Kitchen toward the pantry',
17:'Kitchen stove wall',18:'Kitchen detail',19:'Dining room',20:'Dining, French doors',
21:'Dining toward the great room',22:'Dining to the great room',23:'Great room',24:'Great room to the front windows',
25:'Powder room',26:'Mudroom',27:'Primary bedroom',28:'Laundry',29:'Wet bar / prep area',
30:'Hall to the primary bath',31:'Primary bath, double vanity',32:'Primary bath, second vanity',33:'Primary bath',
34:'Primary bath, tub',35:'Primary bedroom',36:'Primary bedroom, TV wall',37:'Primary bedroom, sitting end',
38:'Primary closet',39:'Primary closet',40:'Primary closet island',
41:'Lower family room, TV wall',42:'Lower family room',43:'Lower bedroom',44:'Lower bedroom',45:'Lower bedroom',
46:'Lower bedroom',47:'Lower bath',48:'Lower hall',49:'Hinged bookcase',50:'Speakeasy through the open bookcase door: existing orange wall and art kept, Jenny’s table and chair, red rug',51:'Speakeasy with its existing walls: Jenny’s 42″ × 42″ espresso high-top, 4 counter chairs and her honey-oak and marble bar cart',
52:'Unfinished storage',53:'Unfinished storage',54:'Garage doors: XT5, Airstream and the lift with the 911 over the Model Y, all nose-in just inside the doors',55:'Garage from the doors: vehicles at the doors, gym on rubber mats',56:'Back-left corner: TV on the south wall with the futon 8 ft back facing it, the existing gray cabinets, Peloton, air bike, Floor Glute, and the paddleboard and kayaks on the suspended loft',
57:'Along the south wall toward the doors: the window by the side door, the side door, the batteries, the Xebex and Ski-Row, and the Airstream and XT5 noses',58:'Shed',59:'Backyard',60:'Hot tub (included)',61:'Covered deck',
62:'Covered deck from the yard',63:'Aerial',64:'Aerial, garage',65:'Aerial, backyard',
}
GROUPS = [
('Exterior and the lot',[0,1,3,4,58,63,64,65]),
('Deck and backyard',[2,59,60,61,62]),
('Main living',[5,6,7,21,22,23,24]),
('Kitchen and dining',[8,9,10,11,12,13,14,15,16,17,18,19,20]),
('Mudroom, powder, laundry',[25,26,28,29]),
('Primary suite',[27,30,31,32,33,34,35,36,37,38,39,40]),
('Lower level',[41,42,43,44,45,46,47,48,49,50,51,52,53]),
]
R = []  # 3D-model still screenshots removed Nov 23 (the interactive model stays)

FULL = root / 'img' / 'full'
def full(src):
    """Link target: the full-res copy when one is published, else the file itself."""
    p = pathlib.Path(src)
    return f'img/full/{p.name}' if src.startswith('img/') and (FULL / p.name).exists() else src

def fig(src, cap):
    return (f'<figure><a href="{full(src)}" target="_blank" rel="noopener"><img loading="lazy" src="{src}" '
            f'alt="{html.escape(cap)}"></a><figcaption>{cap}</figcaption></figure>')

def ba(i, cap=None):
    # Concept (future) image only; no slider. Opens the full-size file in a new tab.
    cap = cap or PH[i]
    return fig(f'img/ba/p{i:02d}-after.jpg', html.escape(cap))

gal_parts = []
for title, ids in GROUPS:
    gal_parts.append(f'<h3 class="gal-sec">{title}</h3><div class="gal">')
    gal_parts.append(''.join(ba(i) for i in ids))
    gal_parts.append('</div>')
gal = ''.join(gal_parts)
renders = ''.join(fig(f'img/{a}.jpg', b) for a, b in R)

JS = '<script>' + (root/'enhance.js').read_text() + '</script>'

def size_images(page):
    """Give every local <img> its intrinsic width/height (no layout shift) and async decoding."""
    def one(m):
        tag, src = m.group(0), m.group(1)
        f = root / src
        if ' width=' in tag or not f.exists():
            return tag
        w, h = Image.open(f).size
        return tag[:-1] + f' width="{w}" height="{h}" decoding="async">'
    return re.sub(r'<img\b[^>]*?\bsrc="([^"]+)"[^>]*>', one, page)

def label_tables(page):
    """Wrap each data table for wide-screen scrolling and tag each cell with its column
    header (data-l) so narrow screens can stack rows with labels. No text is changed."""
    def tbl(m):
        t = m.group(0)
        heads = [re.sub(r'<[^>]+>', '', h).strip() for h in re.findall(r'<th[^>]*>(.*?)</th>', t, flags=re.S)]
        def row(rm):
            i = [0]
            def td(tm):
                attrs = tm.group(1)
                sp = re.search(r'colspan="(\d+)"', attrs)
                span = int(sp.group(1)) if sp else 1
                lab = heads[i[0]] if i[0] < len(heads) else ''
                first = i[0] == 0
                i[0] += span
                return f'<td{attrs}' + (f' data-l="{html.escape(lab)}"' if lab and span == 1 and not first else '') + '>'
            return re.sub(r'<td((?:\s[^>]*)?)>', td, rm.group(0))
        t = re.sub(r'<tr[^>]*>.*?</tr>', row, t, flags=re.S)
        t = re.sub(r'<td([^>]*)>—</td>', r'<td\1 class="nil">—</td>', t)  # dash-only cells collapse in the stacked phone layout
        return '<div class="table-wrap">' + t + '</div>'
    return re.sub(r'<table class="costs[^>]*>.*?</table>', tbl, page, flags=re.S)

def finish(page):
    return size_images(label_tables(page))

import systems
SYS = systems.build()
# Presentation only: the inspection photos get the compact thumbnail-and-note list; spacing lives in extra.css.
SYS = SYS.replace('<div class="gal">', '<div class="gal sys-gal">').replace(' style="margin:12px 0"', '').replace(' style="break-inside:auto"', '')
page = (root/'page.tpl').read_text()
for k, v in {'{{CSS}}': css, '{{GAL}}': gal, '{{RENDERS}}': renders, '{{JS}}': JS, '{{SYSTEMS}}': SYS}.items():
    page = page.replace(k, v)
(root/'index.html').write_text(finish(page))
backup = finish((root/'backup-power.tpl').read_text().replace('{{CSS}}', css).replace('{{JS}}', JS))
(root/'backup-power.html').write_text(backup)
print('ok', len(page), 'sliders', page.count('data-ba'), 'backup', len(backup))
