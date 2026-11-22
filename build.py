import html, pathlib
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
46:'Lower bedroom',47:'Lower bath',48:'Lower hall',49:'Hinged bookcase',50:'Secret office',51:'Secret office',
52:'Unfinished storage',53:'Unfinished storage',54:'Garage doors',55:'Garage interior',56:'Garage, work wall',
57:'Garage, looking out',58:'Shed',59:'Backyard',60:'Hot tub (included)',61:'Covered deck',
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
('Garage',[54,55,56,57]),
]
R = [
('r-great_nw','Great room from the kitchen corner: Steinway B center, cigar chairs at the fireplace'),
('r-great_foyer','From the front door: piano lid opens toward the fireplace lounge'),
('r-great_dining','Through the dining arch: room to walk around the piano'),
('r-family_ne','Lower family room: sectional tucked in the corner, massage chair at right'),
('r-family_tv','From the sectional: 75" TV on the existing TV wall'),
('r-office','Speakeasy behind the hinged bookcase: tall table, 4 tall chairs, bar cart'),
('r-kidroom',"Bedroom 2 (kids' room): full bed, nightstand, kids desk, 6-drawer dresser"),
('r-bedroom3','Bedroom 3 (teen room, later guest): sleigh bed, nightstand, dresser, small desk'),
('r-basement_office','Office in the storage / utility room: glass desk, Aeron, printer stand, storage'),
('r-primary','Primary bedroom: king bed, nightstands, tall chests (bed wall to confirm)'),
('r-dining','Dining table with 6 chairs; counter stools at the island'),
('r-garage_gym','Garage gym v2: 8x8 platform and rig under the 13 ft center, rope, plunge, GHD'),
('r-garage_stretch','Garage: 8x8 stretch / bodyweight / TV area and the office under the rear loft'),
('r-garage_lift','Garage: one 4-post lift in the right bay (Model Y under, 911 on top)'),
('r-garage_top','Garage v2 from above'),
('r-main_aerial','Main floor from above'),
('r-lower_aerial','Lower level from above'),
('r-exploded','Exploded cutaway: main floor lifted over the lower level'),
('r-sauna','Elevation: 9×16 wood-fired skid sauna, 16 ft perpendicular to the deck'),
]

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

JS = ''

page = (root/'page.tpl').read_text()
for k, v in {'{{CSS}}': css, '{{GAL}}': gal, '{{RENDERS}}': renders, '{{JS}}': JS}.items():
    page = page.replace(k, v)
(root/'index.html').write_text(page)
backup = (root/'backup-power.tpl').read_text().replace('{{CSS}}', css)
(root/'backup-power.html').write_text(backup)
print('ok', len(page), 'sliders', page.count('data-ba'), 'backup', len(backup))
