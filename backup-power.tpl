<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Backup power &amp; garage · 687 Starflower Ln</title><meta name="robots" content="noindex"><style>{{CSS}}</style></head><body>
<header><div class="sub">WOODLAND TRAILS · WHITEWATER TOWNSHIP, MICHIGAN · CLARK + JENNY’S PROPERTY CONCEPT</div>
<h1>687 Starflower Ln <span>· backup power &amp; garage</span></h1>
<div class="sub">Whole-house backup, EV charging, propane, and car-lift options · planning notes Nov 17, 2026</div></header>
<nav><a href="index.html">Concept site</a><a href="index.html#garage">Garage gym</a><a href="#goal">The goal</a><a href="#compare">Battery options</a><a href="#generator">Generator</a><a href="#propane">Propane tanks</a><a href="#charger">Wall Connector</a><a href="#solar">Solar, later</a><a href="#lifts">Car lifts</a><a href="687-Starflower-Concept.pdf">PDF</a></nav>
<main>
<section id="goal">
<p><a class="back" href="index.html" style="display:inline-block;margin:12px 8px 0 0;font-size:13px;color:var(--muted)">← Back to the concept site</a></p>
<h2>Whole-house backup</h2>
<p>The plan is whole-house backup, not a partial-home subpanel: the well, the furnace blower and controls, central air, and the hot tub stay on. Propane heat is what makes a 30–45 kWh battery bank workable — the furnace only needs the blower and controls, not electric resistance heat. The Tesla Wall Connector is paused whenever the house is on backup.</p>
<div class="grid">
<div class="card"><h3>About 3 days on batteries</h3><p>Three Tesla Powerwall 3s (40.5 kWh), or three FranklinWH aPower 2s (45 kWh), cover about <b>3 days of essentials</b> — well, furnace blower, fridge, lights, internet — or about <b>2 days of whole-house winter use</b> if the hot tub and EV are limited. A hard-running hot tub shortens that to about a day.</p></div>
<div class="card"><h3>About 7 days with the generator</h3><p>A 22–26 kW propane standby generator covers a week-long winter outage. On Tesla it takes over after the batteries empty and runs the house itself. On FranklinWH (and on Enphase, if approved) it can recharge the batteries and then shut off, which cuts propane use roughly in half.</p></div>
<div class="card"><h3>Recommended pick</h3><p><b>FranklinWH</b> — three aPower 2 batteries, an aGate, and a generator module — plus the 22–26 kW generator, a Wall Connector, and a second 500-gallon tank (or a swap to a single 1,000). It is the only one of the three paths that officially supports no-solar backup, generator charging, auto start/stop, and a 200 A generator input.</p></div>
</div>
<p class="muted">Figures below are planning estimates, not live bids, and assume a 2027 install with no federal tax credit. Get written quotes from a site visit before buying anything.</p>
</section>

<section id="compare">
<h2>Three battery-plus-generator options</h2>
<p>All three packages include a 22–26 kW propane generator, a Tesla Wall Connector on a 60 A circuit, and a second 500-gallon tank or a 1,000-gallon swap. There is room in the garage for the batteries.</p>
<div class="table-wrap">
<table class="costs wide">
<thead>
<tr><th></th><th>Tesla, 3 Powerwall 3s</th><th class="ok">FranklinWH, 3 aPower 2s + aGate (recommended)</th><th>Enphase, 8× IQ Battery 5P + System Controller 3G</th></tr>
</thead>
<tbody>
<tr><td>Energy / battery power</td><td>40.5 kWh / <b>34.5 kW</b> continuous</td><td>45 kWh / <b>30 kW</b> continuous</td><td>40 kWh / <b>15.4 kW</b> on batteries alone (PCS cap)</td></tr>
<tr><td>Charges batteries from the generator</td><td><b>No.</b> Tesla’s official limit: the Powerwall does not charge from a generator. The generator sits downstream, on the house side of a 200 A service-rated automatic transfer switch, after Gateway 3. The batteries never see its power. Official sources: Tesla’s <a href="https://www.tesla.com/support/energy/powerwall/learn/combining-systems">Combining Systems with Powerwall</a> page and the <a href="https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/General/Compatibility/en-us/Powerwall-Compatibility-Table-EN.pdf">Powerwall Compatibility Table (PDF)</a>.</td><td><b>Yes</b>, official, and solar is not required. In Auto mode the generator starts at a 20% state of charge and stops at 80% (both adjustable in the app). Official sources: the <a href="https://www.franklinwh.com/document/download/generator-module-installation-guide-sku-accy-genv2-us">Generator Module Installation Guide</a> and the <a href="https://www.franklinwh.com/document/apower-2-datasheet">aPower 2 datasheet</a>. Product site: <a href="https://www.franklinwh.com/">franklinwh.com</a>.</td><td><b>Yes, if approved.</b> Official generator charging and 2-wire auto-start are documented, including an Eco mode that starts and stops on state of charge. A no-solar generator configuration is <b>not in the official supported list</b>. Official sources: the <a href="https://enphase.com/download/generator-integration-enphase-energy-system-tech-brief">Generator integration technical brief</a> and the <a href="https://enphase.com/download/iq-system-controller-3-data-sheet">IQ System Controller 3/3G datasheet</a>.</td></tr>
<tr><td>Auto-starts the generator</td><td>No. The generator uses its own controls through the downstream transfer switch.</td><td>Yes. 2-wire / dry-contact start, with Auto, manual, and scheduled charging.</td><td>Yes, 2-wire or utility-sense, plus Eco and Quiet Time — if Enphase confirms the no-solar design in writing.</td></tr>
<tr><td>Generator connection</td><td>200 A service-rated ATS, downstream of Gateway 3</td><td>aGate generator module, up to <b>200 A</b></td><td>Built-in port, capped at <b>64 A / 15.36 kW</b></td></tr>
<tr><td>Whole-house winter runtime on batteries</td><td>About 2 days with the tub and EV limited; about 3 days on essentials only</td><td>Similar energy, with 30 kW of power to start the well and run the A/C and hot tub</td><td>Similar energy, but only about 15.4 kW on batteries alone — tight if the A/C and hot tub are both on. Plan a soft starter and on limiting the tub until the generator is up.</td></tr>
<tr><td>Generator time, 7-day winter outage, tub and EV limited</td><td>About <b>5 days continuous</b> after the batteries empty</td><td>Generator cycles to recharge, then shuts off. Roughly <b>20–40 hours</b> over the week if loads stay moderate</td><td>Same idea as FranklinWH, if the no-solar generator design is approved: roughly <b>20–40 hours</b></td></tr>
<tr><td>Propane, 7-day outage, tub and EV limited</td><td>Generator about 250–300 gal, plus 40–70 gal for heat: about <b>290–370 gal</b> total (about 340–430 gal if the tub is heating hard)</td><td>Generator about 50–120 gal, plus heat: about <b>90–190 gal</b></td><td>About <b>90–190 gal</b>, if generator charging without solar is approved</td></tr>
<tr><td>Batteries and controller, planning installed cost</td><td>$33,000–$48,000</td><td>$38,000–$55,000</td><td>$48,000–$68,000</td></tr>
<tr class="rec"><td>Headline package, including generator, Wall Connector, and tank</td><td><b>$48,000–$80,000</b></td><td><b>$53,000–$87,000</b></td><td><b>$61,000–$98,000</b></td></tr>
</tbody>
</table>
</div>

<div class="grid">
<div class="card"><h3>Tesla, if that is the brand you stay with</h3>
<p>Use <b>three Powerwall 3s</b> on Gateway 3, not two. Tesla allows up to four on one Gateway. Three units give 40.5 kWh and 34.5 kW, enough to start the well and run the A/C and hot tub, with a soft starter on the A/C still a good idea. The third unit adds about $9,000–$16,000 over two and often keeps the generator off in ordinary outages. It does not replace the generator or the second tank. Without solar, the Powerwalls recharge only from the grid. Once they are empty, they stay empty until the grid returns.</p></div>
<div class="card"><h3>FranklinWH — the recommended path</h3>
<p>Three aPower 2 batteries (15 kWh and 10 kW each; LFP chemistry; 15-year warranty), the 200 A aGate, and the generator module. In a week-long outage the batteries carry the house for about two days, then the generator starts at 20% charge, powers the house, refills the batteries, and shuts off at 80%. That is the quieter, lower-fuel version of the setup. FranklinWH is a newer company with a shorter local track record than Tesla, so ask the installer to show completed aGate-plus-generator jobs.</p></div>
<div class="card"><h3>Enphase — a maybe</h3>
<p>Official generator charging and auto-start are real, and many Generac Guardian and Cummins units are on Enphase’s tested list. Two limits make it the weakest fit here: output is capped at about <b>15 kW</b> through the System Controller 3G’s generator port (and through the batteries when they run alone), and a battery-only system with a generator and no solar is not a configuration the official technical brief lists as supported. Only pursue it if the installer gets Enphase to confirm that design in writing.</p></div>
</div>

<div class="table-wrap">
<table class="costs wide">
<thead><tr><th>Package item</th><th class="num">3 Tesla Powerwall 3s</th><th class="num">FranklinWH, 3 aPower 2s</th><th class="num">Enphase 8× 5P + 3G</th></tr></thead>
<tbody>
<tr><td>Batteries and controller</td><td class="num">$33,000–$48,000</td><td class="num">$38,000–$55,000</td><td class="num">$48,000–$68,000</td></tr>
<tr><td>Tesla Wall Connector, 60 A, installed</td><td class="num">$1,800–$3,000</td><td class="num">$1,800–$3,000</td><td class="num">$1,800–$3,000</td></tr>
<tr><td>22–26 kW propane generator</td><td class="num">$13,000–$20,000</td><td class="num">$13,000–$20,000</td><td class="num">$11,000–$18,000 (no separate ATS)</td></tr>
<tr><td>Second 500-gal tank, or a 1,000-gal swap</td><td class="num">$0–$9,000</td><td class="num">$0–$9,000</td><td class="num">$0–$9,000</td></tr>
</tbody>
<tfoot><tr><td>Headline package (planning, before tax, no federal credit)</td><td class="num">$48,000–$80,000</td><td class="num">$53,000–$87,000</td><td class="num">$61,000–$98,000</td></tr></tfoot>
</table>
</div>

<p>Local certified installers who can quote more than one of these brands in a single site visit:</p>
<ul>
<li><a href="https://peninsula-solar.com/">Peninsula Solar</a> (Traverse City area) — Tesla, Enphase, and <a href="https://peninsula-solar.com/franklinwh/">FranklinWH</a></li>
<li><a href="https://www.strawberrysolar.com/services/franklinwh-installation/">Strawberry Solar</a> — Tesla, Enphase, and FranklinWH</li>
<li><a href="https://www.thegreenpanel.com/">The Green Panel</a> — Tesla and Enphase</li>
</ul>
</section>

<section id="generator">
<h2>22–26 kW propane standby generator</h2>
<p>Quote the whole-house band: a <b>Generac Guardian</b> 22, 24, or 26 kW, or a similar <b>Cummins QuietConnect</b>. Do not use a 14–18 kW essentials-only unit as the primary option. On Tesla the generator has to carry the house by itself after the batteries are empty, so it should be sized for the whole house, including the well, the furnace blower, the air conditioner, and the hot tub. The same unit works on FranklinWH and Enphase; the transfer equipment is what changes.</p>
<div class="grid">
<div class="card"><h3>How it ties in</h3>
<ul>
<li><b>Tesla:</b> 200 A service-rated automatic transfer switch, cascading downstream of Gateway 3.</li>
<li><b>FranklinWH:</b> aGate generator module, up to 200 A. Prep the generator for 2-wire / dry-contact start.</li>
<li><b>Enphase:</b> no external transfer switch. The generator lands on the System Controller 3G port (80 A breaker, 64 A continuous). A Generac Guardian ships as utility-sense start and may need a 2-wire conversion kit.</li>
</ul></div>
<div class="card"><h3>Cost, fuel, and placement</h3>
<ul>
<li>Installed, including pad, propane connection, permits, and startup: about <b>$13,000–$20,000</b> with a 200 A transfer switch. A bit less if FranklinWH or Enphase is doing the transfer.</li>
<li>Annual service is about $150–$400. Guardian 18–26 kW units are published at 67 dB at 23 ft under load; Cummins QuietConnect is generally a bit quieter.</li>
<li>Published Generac propane use: a 22 kW Guardian burns 2.53 gal/hr at half load and 3.90 at full load; a 26 kW unit burns 2.06 and 3.63. Confirm Cummins figures with the dealer.</li>
<li>A natural pad is the south side yard, near the existing meter and panel, off the septic field. Keep the generator about 10 ft from the propane tank, and follow manufacturer clearances (often 18 in from the wall and 5 ft from openings). County electrical and mechanical permits are required.</li>
</ul></div>
</div>
<p>Generator dealers in the Traverse City area (websites only; this is not a request to contact them): <a href="https://distinctelectrictc.com/generators/">Distinct Electric</a>, <a href="https://www.greatnorthgenerators.com/generators">Great North Generators</a>, <a href="https://bteelectric.com/generators/">Bierlein-Trombley Electric</a>, <a href="https://www.voltageelectriccompany.com/">Voltage Electric</a>, and <a href="https://www.oscelectric.com/generators">OSC / Opperman Electric</a>. For Cummins, use the <a href="https://www.cummins.com/en-na/na/generators/home-standby/find-a-dealer">Cummins dealer locator</a>.</p>
</section>

<section id="propane">
<h2>Second 500-gallon tank, or a single 1,000</h2>
<p>Heat, hot water, the fireplace, and the generator all draw from the same propane system. Usable propane is 80% of the nameplate: a “full” 500-gallon tank holds 400 gallons; two full 500s, or one full 1,000, hold 800. The size and ownership of the existing tank still need to be confirmed. A second tank only applies if the current one is 500 gallons or smaller. If it is already a 1,000, keep it, put the account on auto-fill, and skip the second tank.</p>
<p>A hard winter week of house heat, water heating, and the fireplace is about <b>40–70 gallons</b> even while the batteries cover the electricity. That is why the second tank stays in the plan on every path: FranklinWH and Enphase burn less generator fuel, but heat still uses propane, and a half-full single 500 in January is tight.</p>
<div class="table-wrap">
<table class="costs">
<thead><tr><th>Tank</th><th>Usable when “full”</th><th>7-day whole-house winter outage</th></tr></thead>
<tbody>
<tr><td>One 500 gal, starting full</td><td>400 gal</td><td>Tight or short on Tesla. Possibly enough on FranklinWH or Enphase if it starts full and the tub is limited. A half-full 500 in January is not enough on any path.</td></tr>
<tr><td>1,000 gal, starting full, or existing 500 plus a second 500</td><td>800 gal</td><td>Comfortable on every path, with heat inventory left.</td></tr>
</tbody>
</table>
</div>
<div class="table-wrap">
<table class="costs wide">
<thead><tr><th></th><th>Existing 500 + second 500, manifolded</th><th>Swap to a single 1,000 (remove or relocate the old tank)</th></tr></thead>
<tbody>
<tr><td>Usable fuel when full</td><td>800 gal</td><td>800 gal</td></tr>
<tr><td>Building and lot-line setback (aboveground, NFPA 58 Table 6.4.1.1 and §6.4.1.3)</td><td>Each 500 stays at <b>10 ft</b> from an important building and a buildable property line</td><td>Default for 501–2,000 gal is <b>25 ft</b>. A <b>single</b> tank of 1,200 gal or less may sit at <b>10 ft</b> if it is at least <b>25 ft from any other LP tank over 125 gal</b>. If the old 500 is left nearby, the 1,000 can lose that exception.</td></tr>
<tr><td>Distance between tanks</td><td><b>3 ft</b> between two 251–500 gal tanks</td><td>N/A once the old tank is gone</td></tr>
<tr><td>Cost to own, Midwest / Michigan ranges, installed, not a local bid</td><td>About <b>$2,500–$6,000</b> for the second 500</td><td>About <b>$4,500–$9,000</b> for a 1,000 if buying it; often less if a leased tank is simply swapped</td></tr>
<tr><td>Lease vs own</td><td>Two tanks only work if <b>one supplier</b> owns or is willing to service both</td><td>Cleaner if the current tank is leased: the same company swaps it</td></tr>
</tbody>
</table>
</div>
<p>Michigan adopts NFPA 58. Underground, 2,000 gal or less: 10 ft. Keep the generator about 10 ft from the tank. The 5.13-acre lot has room; stay off the septic field, reserve, and the well’s working area. A supplier will generally not manifold its tank with another company’s leased tank. If the current tank is leased, stay with that supplier for a second 500, or have them swap to a 1,000. Auto-fill or keep-full for winter either way.</p>
<p>Local propane suppliers (websites only): <a href="https://www.trigasco.com/">Tri-Gas</a>, <a href="https://crystalflash.com/locations/traverse-city/">Crystal Flash</a>, <a href="https://www.ferrellgas.com/propane-locations/mi/traverse-city/cass-rd/245540/">Ferrellgas</a>, and <a href="https://www.amerigas.com/locations/propane-offices/michigan/traverse-city/6101-east-traverse-hwy">AmeriGas</a>.</p>
</section>

<section id="charger">
<h2>Tesla Wall Connector</h2>
<p>A standard Tesla Wall Connector (NACS) on a <b>60 A circuit</b> in the garage. Mid-November 2026 hardware price is $635; the Universal Wall Connector (NACS + J1772) is $720. The standard unit is enough if only Teslas will charge here. There is no EV circuit today. The 200 A panel is on the south wall inside the left garage bay, so a 60 A run should be short. Planning cost, hardware, labor, and permit: about <b>$1,800–$3,000</b>. Bundling the charger with the battery install saves a trip. Configure it so it <b>does not charge while the house is on battery or generator backup</b>. On the garage plan, the cable starts at the garage-door end of the house wall so it can reach the Model Y’s driver-side port when the car is nose-in under the lift. See the <a href="index.html#garage">garage gym</a> layout.</p>
<p>The existing 200 A service should be enough for the batteries, one Wall Connector, and the generator, provided the furnace stays propane. A later heat pump with strips, a second charger, or a 50 A RV outlet is what would make 200 A tight.</p>
</section>

<section id="solar">
<h2>Solar was dropped — for now</h2>
<p>Solar is not part of this package, and that is a reasonable call for this house in 2027.</p>
<ul>
<li>The lot is wooded. An unshaded 12 kW array was modeled at about 14,300 kWh/year, but the trees could cut that by 15–30% until a shade study confirms it. The west side is shaded by the state forest each afternoon.</li>
<li>Lake-effect snow sits on a low roof. In a December outage, snow-covered panels produce almost nothing — which is when backup power is most useful.</li>
<li>The 30% federal solar and battery credit does not apply to installations finished after December 31, 2025, and the EV charger credit ended June 30, 2026. A 2027 install gets neither.</li>
<li>The electric utility is Cherryland Electric Cooperative. Energy is about $0.14/kWh, but Cherryland pays only about $0.056/kWh for exports. Against $25,000–$38,000 for a 10–12 kW array, payback would be long, on the order of 15–25 years.</li>
</ul>
<p>Panels can still be added later. The Powerwall 3 already has the solar inverter built in, and FranklinWH and Enphase are also built to take PV. The best future spot is a <b>ground mount in the lawn immediately south of the garage</b>, tilted at 40–45° so snow slides off. The south-facing garage roof is the backup. Stay off the septic field, reserve, and the well’s working area.</p>
<div class="full"><figure><a href="img/687-future-solar-siting.jpg"><img loading="lazy" src="img/687-future-solar-siting.jpg" alt="Aerial of 687 Starflower Ln showing a preferred ground-mount solar area south of the garage, an alternate lawn pocket, and the south garage roof as a backup"></a><figcaption>Future solar option, not in this package. Preferred ground mount (1) is the lawn immediately south of the garage; 1b is an alternate south / southeast pocket; 2 is the south garage roof as a backup. Stay off the drain field, reserve, and the well’s 50 ft working area. Aerial © Esri/Vantor, annotated for this concept.</figcaption></figure></div>
</section>

<section id="lifts">
<h2>Garage car-lift picks</h2>
<p>The <a href="index.html#garage">garage gym plan</a> uses two high-rise 4-post lifts, one in each 10×8 side bay, shifted toward the ridge, with daily cars underneath and weekend cars on top. A 4-post stacker needs about <b>11–12 ft of ceiling</b>. Permit drawings show 10 ft walls rising to about 13′8″ in the flat center; wall height, bay-center height, door-track clearance, and the exact mid-lock drive-under still get measured at the inspection. A Tesla on a 2-post lift needs Tesla lift-point pads. Do not use the top lock on a 4-post until the ceiling is taped.</p>
<div class="grid">
<div class="card"><h3>4-post, for storage</h3>
<ul>
<li><a href="https://www.maxjax.com/products/hd-9-four-post-lift-9000-lbs-capacity-5175861-bendpak">BendPak HD-9</a> — 9,000 lb four-post. The standard-height model. Good for storage if the car underneath is not tall; it does not give the Cadillac XT5 enough drive-under margin.</li>
<li><a href="https://www.maxjax.com/products/hd-9xw-four-post-lift-9000-lbs-capacity-5175863-bendpak">BendPak HD-9XW</a> — taller 9,000 lb four-post. This is the lift already on the garage plan, one in each side bay, because it can take the XT5 or Model Y underneath a car on top at a mid lock.</li>
</ul></div>
<div class="card"><h3>2-post, for service</h3>
<ul>
<li><a href="https://www.bendpak.com/car-lifts/two-post-lifts/10ap-two-post-lift-clearfloor-10000-pound-capacity-5175304-bendpak">BendPak 10AP</a> — 10,000 lb clear-floor two-post.</li>
<li><a href="https://www.maxjax.com/products/al10c-two-post-lift-10000-lbs-capacity-clearfloor-5176251-apex">APEX AL10C</a> — 10,000 lb clear-floor two-post. A Tesla on either of these needs Tesla lift-point pads.</li>
</ul></div>
<div class="card"><h3>Portable</h3>
<ul>
<li><a href="https://www.quickjack.com/car-lifts/portable-car-lifts/8000tlx-extended-portable-car-lift-8000-lbs-capacity-quickjack">QuickJack 8000TLX</a> — 8,000 lb extended portable lift. Useful for service when a floor lift is not in the way of the gym or the Airstream, and it does not depend on the 11–12 ft ceiling a 4-post stacker needs.</li>
</ul></div>
</div>
</section>

<p class="muted" style="margin-top:30px">Concept planning only, not a bid, load calculation, or engineering document. Costs are 2026 Michigan planning ranges and will change with a site visit. Photos © their listing photographers or as credited, used here for private planning reference.</p>
</main></body></html>
