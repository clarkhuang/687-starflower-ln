# Public "Home systems" section from the Nov 22, 2026 inspection photos (no panels, EXIF stripped).
import json, pathlib, html
from PIL import Image
R = pathlib.Path('/workspace/property/docs/starflower/inspection/report')
S = pathlib.Path(__file__).parent / 'img'
P = {a: b for a, b, c in json.load(open(R / 'photos.json')) if a}
PH = [
 ('Water and septic', [
  ('19-1', 'Well head, front yard east of the house: 5 in PVC casing, submersible pump, more than 50 ft from the septic. Flow test ran a steady 4–5 gpm (Nov 22, 2026).'),
  ('19-2', 'Well pressure tank in the basement utility room.'),
  ('19-3', 'Main water shut-off for the house, next to the pressure tank.'),
  ('12-1', 'Water softener and salt tank, basement utility room (owned; service it on its own schedule).'),
  ('18-1', 'Septic tank riser lids in the west backyard: two-compartment precast tank, installed 2023. Plan on pumping every 3–5 years.'),
  ('18-11', 'Septic drain field, west backyard. Keep vehicles and new plantings off it.'),
  ('13-1', 'Sewage ejector pump for the lower-level bathroom, basement.'),
 ]),
 ('Heating, cooling and hot water', [
  ('11-3', 'Bryant high-efficiency propane furnace (about 2023), basement utility room. Filter slides in at the base.'),
  ('11-8', 'Filter-change log kept on the furnace. Last change Oct 23, 2026.'),
  ('11-6', 'Whole-house humidifier on the furnace.'),
  ('11-1', 'A/C condensing unit (split system) outside. Run and service it in spring.'),
  ('10-2', 'Lochinvar 75-gallon propane tank water heater (about 2023), basement utility room.'),
  ('6-1', 'Propane tank, 500 gallons (26% on Nov 22, 2026). Feeds the furnace, water heater, range, fireplace and garage heater.'),
  ('8-7', 'Ceiling-mounted propane heater in the garage, with its own thermostat.'),
 ]),
 ('Air, structure and outdoors', [
  ('24-5', 'Radon mitigation fan in the attic, installed fall 2026 per the owner.'),
  ('24-2', 'Radon mitigation pipe where it leaves the basement floor.'),
  ('17-15', 'Superior Walls precast concrete foundation panels with built-in foam insulation; rim joists are spray-foamed.'),
  ('16-1', 'Attic access hatch in the garage ceiling. A second hatch leads from the garage attic into the house attic.'),
  ('16-26', 'Timer switch for the cupola light, in the garage next to the house door.'),
  ('5-2', 'Irrigation backflow preventer on the outside wall. The shut-off and drain valves are inside (winterize in fall).'),
 ]),
]
TABLE = '''<table class="costs" style="break-inside:auto"><thead><tr><th>System</th><th>What and when</th><th>Where</th><th>Upkeep</th></tr></thead><tbody>
<tr><td>House</td><td>Custom stick-built, 2023–24; vinyl siding, precast insulated foundation</td><td>—</td><td>—</td></tr>
<tr><td>Roof</td><td>Asphalt shingles, one layer, about 2023; leaf guards on seamless gutters, underground downspout drains</td><td>—</td><td>Check leaf guards yearly</td></tr>
<tr><td>Windows</td><td>Insulated vinyl double-hung tilt-ins, dated Feb 2023</td><td>—</td><td>—</td></tr>
<tr><td>Furnace + A/C</td><td>Bryant propane high-efficiency furnace, split A/C, humidifier, about 2023; final mechanical inspection 2024</td><td>Basement utility room; condenser outside</td><td>Filter every 2–3 months (log on the furnace); A/C service in spring</td></tr>
<tr><td>Water heater</td><td>Lochinvar 75 gal propane tank, about 2023</td><td>Basement utility room</td><td>Flush yearly; keep at 120 °F</td></tr>
<tr><td>Propane</td><td>500 gal tank</td><td>Yard</td><td>Auto-fill or watch the gauge</td></tr>
<tr><td>Well</td><td>5 in PVC casing, submersible pump, 4–5 gpm</td><td>Front yard east of the house; pressure tank and main shut-off in the basement</td><td>Test water yearly</td></tr>
<tr><td>Septic</td><td>Two-compartment precast tank with riser lids, drain field; installed 2023</td><td>West backyard</td><td>Pump every 3–5 years</td></tr>
<tr><td>Plumbing</td><td>PEX and copper supply, PVC drains; ejector pump for the lower bath; final plumbing inspection 2024</td><td>Basement</td><td>—</td></tr>
<tr><td>Electric</td><td>200 A underground service, breakers; final electrical inspection 2024</td><td>—</td><td>—</td></tr>
<tr><td>Radon</td><td>Sub-slab mitigation system, fan in the attic, fall 2026</td><td>Pipe from the basement floor to the attic and roof</td><td>Check the gauge; fan runs continuously</td></tr>
<tr><td>Insulation</td><td>House attic: ~12 in blown fiberglass over closed-cell foam; foam rim joists; garage attic blown-in only</td><td>Attic access in the garage ceiling</td><td>—</td></tr>
<tr><td>Garage</td><td>~40×50, three doors with auto-reverse openers, ceiling propane heater</td><td>—</td><td>—</td></tr>
<tr><td>Gas fireplace</td><td>Sealed, electronic ignition, remote</td><td>Living room</td><td>Yearly service</td></tr>
<tr><td>Irrigation, hot tub, softener</td><td>Not evaluated at the inspection</td><td>Irrigation valves inside; backflow outside</td><td>Winterize irrigation each fall</td></tr>
</tbody></table>'''

def build():
    out = ['<style>@media print{#systems .gal{grid-template-columns:repeat(4,1fr)!important}#systems figcaption{font-size:8pt}}</style><section id="systems"><h2>Home systems: where they are and their history</h2>',
           '<p>From the Nov 22, 2026 home inspection, with photos. The house was built in 2023–24, and the inspector found it dry, structurally sound and very well maintained. This is a reference for where things are and how to look after them. Ages are the inspector’s estimates; radon and well-water lab results are still to come.</p>',
           '<div class="card" style="margin:12px 0">' + TABLE + '</div>']
    for title, items in PH:
        out.append(f'<h3 class="gal-sec">{title}</h3><div class="gal">')
        for pid, cap in items:
            n = f'sys-{pid}.jpg'
            im = Image.open(R / 'img' / P[pid]).convert('RGB')  # re-save drops EXIF/GPS
            im.save(S / n, quality=92)  # inspector's photos are 320 px; publish as-is, no upscaling
            c = html.escape(cap)
            out.append(f'<figure><a href="img/{n}" target="_blank" rel="noopener"><img loading="lazy" src="img/{n}" alt="{c}"></a><figcaption>{c}</figcaption></figure>')
        out.append('</div>')
    out.append('</section>')
    return ''.join(out)
