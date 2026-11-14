import html
CSS=open('/workspace/property/docs/deal-rd/site/index.html').read()
css=CSS[CSS.index('<style>')+7:CSS.index('</style>')]
css+=""".fig2{display:grid;grid-template-columns:1fr 1fr;gap:14px}.fig2 img,.full img{width:100%;border-radius:12px;border:1px solid var(--line)}
.full{margin:12px 0}.pill{display:inline-block;background:#232733;border:1px solid var(--line);border-radius:999px;padding:2px 10px;margin:2px;font-size:12.5px}
.ok{color:var(--ok)}.tight{color:#e0c36a}.no{color:var(--bad)}
@media(max-width:800px){.fig2{grid-template-columns:1fr}}
@media print{nav,iframe,.noprint{display:none!important}body{background:#fff;color:#111}header{background:#fff}.card{background:#fafafa;border-color:#ddd}a{color:#1d5f80}
 section{break-inside:auto}figure,img,.card,table{break-inside:avoid}h2{break-after:avoid}.gal{grid-template-columns:repeat(4,1fr)}.printonly{display:block!important}main{max-width:none}}
.printonly{display:none}"""
PH=[(0,'Woodland Trails drive'),(1,'Front & 40×50 garage'),(4,'Front porch'),(5,'Entry'),(6,'Fireplace wall'),(23,'Great room'),(24,'Great room to front windows'),(22,'Dining → great room'),
(9,'Kitchen'),(14,'Kitchen & island'),(20,'Dining, French doors'),(27,'Primary bedroom'),(33,'Primary bath'),(38,'Primary closet'),(41,'Lower family room (TV wall)'),(42,'Lower family room'),
(43,'Lower bedroom'),(49,'Hinged bookcase'),(51,'Secret office'),(54,'Garage doors'),(55,'Garage interior'),(58,'Shed'),(2,'Covered back deck'),(59,'Backyard'),(60,'Hot tub (included)'),(61,'Covered deck'),(63,'Aerial'),(64,'Aerial, garage'),(65,'Aerial, backyard')]
gal=''.join(f'<figure><a href="photos/p{i:02d}.jpg"><img loading="lazy" src="photos/p{i:02d}.jpg" alt="{c}"></a><figcaption>{c}</figcaption></figure>' for i,c in PH)
def fig(src,cap): return f'<figure><a href="{src}"><img loading="lazy" src="{src}" alt="{html.escape(cap)}"></a><figcaption>{cap}</figcaption></figure>'
R=[('r-great_nw','Great room from the kitchen corner: Steinway B center, cigar chairs at the fireplace'),('r-great_foyer','From the front door: piano lid opens toward the fireplace lounge'),
('r-great_dining','Through the dining arch: room to walk around the piano'),('r-family_ne','Lower family room: sectional tucked in the corner, massage chair at right'),
('r-family_tv','From the sectional: 75" TV on the existing TV wall'),('r-office','Secret office: glass desk + Aeron'),('r-kidroom',"Kids' room: full bed, nightstand, kids desk"),
('r-garage_gym','Garage: lifting platform, rig, plunge, office wing'),('r-main_aerial','Main floor from above'),('r-lower_aerial','Lower level from above'),('r-exploded','Exploded cutaway: main floor lifted over the lower level'),('r-sauna','Backyard: sauna by the hot tub, septic areas shaded')]
renders=''.join(fig(f'img/{a}.jpg',b) for a,b in R)
page=f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>687 Starflower Ln · Woodland Trails · home concept</title><meta name="robots" content="noindex"><style>{css}</style></head><body>
<header><div class="sub">WOODLAND TRAILS · WHITEWATER TOWNSHIP, MICHIGAN · CLARK + JENNY’S PROPERTY CONCEPT</div>
<h1>687 Starflower Ln <span>· piano lounge, 40×50 garage gym &amp; trailside sauna</span></h1>
<div class="sub">2024 custom ranch on 5.13 wooded acres backing onto state forest · listed at $1,295,000 (MLS 1949596) · concept prepared Nov 14, 2026</div></header>
<nav><a href="#overview">Overview</a><a href="#photos">Photos</a><a href="#plans">Floor plans</a><a href="#model">3D model</a><a href="#concepts">Photo concepts</a><a href="#fit">Fit &amp; tight spots</a><a href="#move">Move-in routes</a><a href="#garage">Garage gym</a><a href="#sauna">Sauna</a><a href="#outdoors">Trails</a><a href="#measure">To measure</a><a href="10746-style-pdf" style="display:none"></a><a href="687-Starflower-Concept.pdf">PDF</a></nav>
<main>
<section id="overview"><div class="hero"><img src="photos/p01.jpg" alt="Front of 687 Starflower Ln"><div class="card">
<h3>The house at a glance</h3><table>
<tr><td>List price</td><td>$1,295,000</td></tr><tr><td>Beds / baths</td><td>3 / 2.5 (primary on main, 2 bedrooms lower)</td></tr>
<tr><td>Finished area</td><td>3,209 sf (1,836 main + 1,393 lower) + ~500 sf storage</td></tr><tr><td>Lot</td><td>5.13 acres; west line adjoins state forest</td></tr>
<tr><td>Garage</td><td>40×50 attached, heated, 10×8 / 12×12 / 10×8 doors, 10 ft walls rising to ~13′8″ flat center</td></tr>
<tr><td>Built</td><td>2024, 2×6 frame, poured/insulated-panel full basement</td></tr><tr><td>Heat / utilities</td><td>Propane forced air + central air, gas fireplace, Cherryland Electric, well + septic</td></tr>
<tr><td>Extras</td><td>Covered back deck (~31×12) with hot tub, fenced yard, shed, coffered ceilings, hinged-bookcase secret office</td></tr></table>
<p><a class="cta" href="model.html">Open the 3D model</a><a class="cta" href="687-Starflower-Concept.pdf">Download PDF</a></p></div></div>
<div class="grid" style="margin-top:14px">
<div class="card"><h3>Main floor = piano lounge</h3>Steinway B as the focal point of the 21′4″ × 18′9″ great room, lid opening toward the fireplace; two black leather cigar chairs and the tufted bench at the hearth; the carved mirror panel over the mantel.</div>
<div class="card"><h3>Lower level = movie + recovery</h3>Big sectional in the family-room corner facing the 75″ TV, massage chair in the same room, glass desk + Aeron in the secret office, kids’ room furnished.</div>
<div class="card"><h3>Garage = CrossFit box + RV barn</h3>L-shaped gym across the back and left side, cold plunge by the gym, small office on the left, Airstream and cars still fit, stair to the basement kept clear.</div>
<div class="card"><h3>Backyard = wood-fired sauna</h3>An 8×12, 4-person cabin sauna 20+ ft off the house corner, ~35 ft stroll from the hot tub, clear of the septic field and reserve area.</div></div></section>

<section id="photos"><h2>Listing photos</h2><p class="muted">From the public listing. Click to enlarge.</p><div class="gal">{gal}</div></section>

<section id="plans"><h2>Reconstructed floor plans (to scale, furnished)</h2>
<p class="warn">Walls, doors and windows are traced from the house’s permit drawings (¼″ = 1′) and checked against the listing’s room sizes; typical accuracy is about ±6 in. The finished lower level follows the listing floor plan, since it was finished differently from the original drawings. Items marked “measure” use typical sizes until we tape them.</p>
<div class="full">{fig('img/plan-main.jpg','Main floor: great room piano lounge (red dims = clearances)')}</div>
<div class="full">{fig('img/plan-lower.jpg','Lower level: family room, secret office, kids’ room, storage room with the garage stair')}</div>
<div class="fig2">{fig('img/plan-garage.jpg','Garage: gym L, cold plunge, office, vehicles, stair kept clear')}{fig('img/site-plan-sauna.jpg','Backyard site plan: sauna vs. house, deck, hot tub and septic areas')}</div></section>

<section id="model"><h2>Interactive 3D model</h2><p>Walk the house: pick a viewpoint, switch levels, or explode the main floor off the lower level. <a href="model.html">Open full screen ↗</a></p>
<iframe class="noprint" src="model.html?view=overview" loading="lazy" title="3D model"></iframe>
<div class="rendergrid" style="margin-top:14px">{renders}</div></section>

<section id="concepts"><h2>Photo concepts: our furniture in the real rooms</h2>
<p class="warn">AI-assisted edits of the actual listing photos, made to show the feel. Placement follows the to-scale plans, but sizes in an edited photo are approximate; the plans and 3D model are the source of truth.</p>
<div class="fig2">{fig('img/p-greatroom-piano.jpg','Great room: Steinway B, two cigar chairs, tufted bench, carved mirror panel over the fireplace')}{fig('photos/p23.jpg','Same view today (listing photo)')}
{fig('img/p-basement-sectional.jpg','Family room: gray sectional in the corner + massage chair')}{fig('img/p-basement-tv.jpg','Family room TV wall: 75″ Samsung, white console, soundbar + sub')}
{fig('img/p-secret-office.jpg','Secret office behind the bookcase: glass-top desk + Aeron')}{fig('img/p-garage-gym.jpg','Garage gym concept on the real garage photo')}
{fig('img/p-sauna-backyard.jpg','Backyard: 4-person wood-fired sauna beside the deck and hot tub (illustrative; siting per site plan)')}{fig('photos/p59.jpg','Same view today (listing photo)')}</div></section>

<section id="fit"><h2>What fits, and what’s tight</h2><div class="grid">
<div class="card"><h3 class="ok">Fits well</h3><ul>
<li><b>Steinway B</b> (6′11″ × 4′10″): keys toward the kitchen, tail toward the front windows, lid opening west toward the fireplace lounge. 3′5″ to the lounge, 4′1″ to the stair rail, 5′7″ from the tail to the windows.</li>
<li><b>Cigar chairs + tufted bench</b> face each other across the hearth, about 2½ ft off the fireplace.</li>
<li><b>Glass desk + Aeron</b> in the 9′2″ × 13′6″ secret office, with ~3 ft behind the chair and ~3 ft to the bookcase door.</li>
<li><b>Kids’ room</b> (13′9″ × 13′6″): full bed on the north wall, nightstand, kids desk on the south wall.</li>
<li><b>TV, console, soundbar, sub</b> on the existing family-room TV wall (outlet and cable are already there).</li></ul></div>
<div class="card"><h3 class="tight">Tight / check</h3><ul>
<li><b>Sectional size is unmeasured.</b> The corner spot fits a ~138″ × 86″ L with a 65″ chaise; the short leg must stop ~1 ft before the hinged bookcase so the secret door still works.</li>
<li><b>TV distance:</b> ~15 ft from the back seats (~12 ft from the chaise) to a 75″ screen. If that feels far, float the sectional ~3 ft off the back wall with a sofa table, or go 85″.</li>
<li><b>Massage chair</b> needs ~6½ ft when reclined; it sits on the angle by the bath wall.</li>
<li><b>Piano and sun:</b> keep the tail 5+ ft from the front windows (as shown), use UV film or shades, and add a humidity system (Dampp-Chaser).</li></ul></div>
<div class="card"><h3 class="no">Not placed</h3><ul><li>No dining table, primary bed or guest bed on the moving list, so those rooms show empty.</li><li>Gym equipment, bikes and the cold plunge go to the garage (see the gym plan).</li></ul></div></div></section>

<section id="move"><h2>Move-in routes for the piano and sectional</h2><div class="grid">
<div class="card"><h3>Piano</h3>Easiest through the <b>6 ft rear French doors</b> in the dining room off the covered deck, then about 15 ft to its spot. Second choice is the 36″ front door with the sidelight; a piano mover takes it in on its side on a board either way. No stairs inside.</div>
<div class="card"><h3>Sectional, route A: main stair</h3>Straight run, 15 risers, ~4′1″ framed width (~3′5″–3′8″ clear), landing in an 8′3″ hall with room to turn, then open into the family room. <b>Best route</b>, but a <b>stair lift</b> shows on this stair in the listing photos; if it stays, its rail costs about a foot of width. Also check the headroom where the stair passes under the main floor.</div>
<div class="card"><h3>Sectional, route B: garage stair</h3>From the right side of the garage: a straight 14-riser stair in a 3′11″ hall, then a <b>90° turn through a ~36″ door</b> at the bottom into the storage room, then a 36″ door into the family room. No finished floors to protect, but the bottom turn is the pinch point: pieces deeper than ~34″ or longer than the landing ceiling may not pivot. Measure before moving day.</div></div></section>

<section id="garage"><h2>Garage: L-shaped CrossFit gym, cold plunge, office</h2>
<p>The 40×50 heated garage holds the Airstream (12×12 center door), the cars, and an L-shaped gym of about 775 sf across the back and left side. The rig, rings and rope sit under the ~13′8″ flat center. There are three wall-ball targets, a clear handstand wall, a cardio row with a TV for Jenny, and the GHD and reverse hyper. The cold plunge sits beside the gym, a 9×6 office takes the left side, and the 3 ft walkway to the basement stair on the right stays open.</p>
<div class="fig2">{fig('img/687-gym-plan.jpg','Gym plan detail')}{fig('img/687-garage-layout.jpg','Whole-garage layout with vehicles')}</div></section>

<section id="sauna"><h2>Backyard: 4-person wood-fired sauna, built from plans</h2>
<div class="fig2">{fig('img/site-plan-sauna.jpg','Site plan (approximate septic areas shaded)')}{fig('img/p-sauna-backyard.jpg','Concept on the real backyard photo')}</div>
<div class="grid" style="margin-top:14px">
<div class="card"><h3>Siting</h3><ul><li>Off the east end of the deck by the hot tub, 20+ ft from the house corner and ~27 ft from the deck. It’s a short barefoot walk (~35 ft) on stepping stones.</li>
<li>Clear of the septic tank, drain field and reserve area on the west side, and 16 ft past the reserve’s east end. Those septic locations come from the county permit sketch and are only good to ±10–15 ft, so probe and stake them before building.</li>
<li>Gravel or paver apron around it as an ember zone; no overhanging branches; chimney well above the roof.</li></ul></div>
<div class="card"><h3>Building</h3><ul><li><b>8×12 cabin</b>: a ~7′ × 7½′ hot room with L-shaped two-tier cedar benches for 4, a small changing room and a covered porch. 7 ft ceiling, insulated with a foil vapor barrier, tongue-and-groove interior.</li>
<li><b>Stove</b>: a wood sauna stove sized for ~350 cu ft (Harvia M3 / Kuuma / similar), on a non-combustible floor, with a heat shield, an insulated Class-A stainless chimney and a spark arrestor.</li>
<li>Skid or pier foundation on gravel, with no digging near the septic.</li><li>Optional: a 20 A circuit for a light and outlet only.</li></ul></div>
<div class="card"><h3>Cost and permits (estimate)</h3><ul><li>DIY from purchased plans: about <b>$9K–$16K</b> in materials, plus $2K–$4K for the stove and chimney.</li><li>Builder-built: about <b>$22K–$40K</b>.</li>
<li><b>Permits:</b> Whitewater Township land-use/zoning permit for an accessory building (setbacks). Under 200 sf it’s usually exempt from a building permit under the Michigan Residential Code, but the wood stove and chimney (and any wiring) may still need a permit, so confirm with the county code office.</li>
<li>Woodland Trails rules allow outbuildings; keep it 75+ ft back from the road. Tell the insurer about it.</li></ul></div></div></section>

<section id="outdoors"><h2>Trails from the back door</h2><p>The west lot line borders state forest. An old two-track from the backyard reaches the Vasa Singletrack in about half a mile, and the Sand Lakes Quiet Area, Muncie Lakes and the main Vasa trailhead are each a short drive.</p>
<div class="full">{fig('img/687-trails-map.jpg','Trail access near 687 Starflower Ln')}</div></section>

<section id="measure"><h2>Measurements to take on the next visit</h2><div class="grid">
<div class="card"><h3>Our furniture (Florida)</h3><ol><li>Every sectional piece: length × depth × height, and which pieces unbolt (corner and chaises).</li><li>Cigar chairs, tufted bench, media console, kids desk.</li><li>Massage chair, upright and fully reclined.</li><li>Bed frame and headboard height; the carved mirror panel.</li></ol></div>
<div class="card"><h3>At 687</h3><ol><li>Main stair: clear width rail-to-wall, headroom at the bottom, and whether the stair lift stays.</li><li>Garage stair: clear width, bottom landing length, ceiling height there, door clear width.</li><li>Angled family-room door and the bookcase-door opening (clear width).</li><li>Front door and rear French doors, clear width.</li><li>Floor vents and outlets near the piano spot; coax and power on the TV wall.</li><li>Center garage door clear opening (for the Airstream).</li></ol></div>
<div class="card"><h3>How confident is this?</h3><ul><li><b>Main floor: high.</b> Permit drawings and the listing plan agree.</li><li><b>Lower level: medium-high.</b> Room sizes are from the listing plan, interior walls ±1 ft.</li><li><b>Garage: medium.</b> Shell from the drawings, contents from the gym plan.</li><li><b>Septic areas: low.</b> Approximate, from the permit sketch.</li></ul></div></div></section>
<p class="muted" style="margin-top:30px">Concept planning only, not an appraisal, survey or engineering document. Photos © their listing photographers, used here for private planning reference.</p>
</main></body></html>"""
open('index.html','w').write(page.replace('<a href="10746-style-pdf" style="display:none"></a>',''))
print('ok',len(page))
