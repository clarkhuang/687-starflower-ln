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

def fig(src, cap):
    return f'<figure><a href="{src}"><img loading="lazy" src="{src}" alt="{html.escape(cap)}"></a><figcaption>{cap}</figcaption></figure>'

def ba(i, cap=None):
    cap = cap or PH[i]
    n = f'{i:02d}'
    alt = html.escape(cap)
    cap_e = html.escape(cap)
    return (
        f'<figure class="ba" data-ba data-i="{i}" data-cap="{cap_e}">\n'
        f'<div class="ba-frame">\n'
        f'<img class="ba-before" src="photos/p{n}.jpg" alt="Listing: {alt}">\n'
        f'<div class="ba-after-wrap"><img class="ba-after" src="img/ba/p{n}-after.jpg" alt="Concept: {alt}"></div>\n'
        f'<div class="ba-handle" style="left:100%"></div>\n'
        f'<input class="ba-range noprint" type="range" min="0" max="100" value="100" aria-label="Reveal listing photo of {alt}">\n'
        f'<div class="ba-hint noprint">Concept — drag to see the listing photo</div>\n'
        f'<button type="button" class="ba-expand noprint" aria-label="Open {alt} full screen">Full screen</button>\n'
        f'</div>\n<figcaption>{cap}</figcaption>\n</figure>'
    )

gal_parts = []
for title, ids in GROUPS:
    gal_parts.append(f'<h3 class="gal-sec">{title}</h3><div class="gal">')
    gal_parts.append(''.join(ba(i) for i in ids))
    gal_parts.append('</div>')
gal = ''.join(gal_parts)
renders = ''.join(fig(f'img/{a}.jpg', b) for a, b in R)

JS = r'''<script>
(function(){
  function bindSlider(frame){
    var wrap=frame.querySelector('.ba-after-wrap');
    var handle=frame.querySelector('.ba-handle');
    var range=frame.querySelector('.ba-range');
    var after=frame.querySelector('.ba-after');
    if(!wrap||!handle||!after) return {set:function(){}, fit:function(){}, wasMoved:function(){return false}};
    function set(v){v=Math.max(0,Math.min(100,+v));wrap.style.width=v+'%';handle.style.left=v+'%';if(range)range.value=v;}
    function fit(){after.style.width=frame.clientWidth+'px';}
    function fromEvent(e){var p=(e.touches&&e.touches[0])||(e.changedTouches&&e.changedTouches[0])||e;var r=frame.getBoundingClientRect();set((p.clientX-r.left)/r.width*100);}
    set(100);fit();
    if(window.ResizeObserver)new ResizeObserver(fit).observe(frame);
    else window.addEventListener('resize',fit);
    if(range)range.addEventListener('input',function(e){set(e.target.value)});
    var down=false,sx=0,sy=0,moved=false;
    frame.addEventListener('pointerdown',function(e){
      if(e.target.closest&&e.target.closest('.ba-expand')) return;
      down=true;moved=false;sx=e.clientX;sy=e.clientY;
      try{frame.setPointerCapture(e.pointerId)}catch(err){}
      fromEvent(e);
    });
    frame.addEventListener('pointermove',function(e){
      if(!down)return;
      if(Math.abs(e.clientX-sx)>6||Math.abs(e.clientY-sy)>6)moved=true;
      fromEvent(e);
    });
    frame.addEventListener('pointerup',function(){down=false});
    frame.addEventListener('pointercancel',function(){down=false});
    return {set:set, fit:fit, wasMoved:function(){return moved}};
  }

  var gridSliders=new Map();
  document.querySelectorAll('[data-ba] .ba-frame').forEach(function(frame){
    gridSliders.set(frame, bindSlider(frame));
  });

  var items=[];
  document.querySelectorAll('#photos [data-ba]').forEach(function(el){
    var before=el.querySelector('.ba-before');
    var after=el.querySelector('.ba-after');
    var cap=(el.getAttribute('data-cap')||(el.querySelector('figcaption')||{}).textContent||'').trim();
    items.push({i:items.length, before:before&&before.src, after:after&&after.src, cap:cap, el:el});
    el.setAttribute('data-idx', String(items.length-1));
  });

  var lb=document.createElement('div');
  lb.id='lb';
  lb.className='lb noprint';
  lb.hidden=true;
  lb.setAttribute('role','dialog');
  lb.setAttribute('aria-modal','true');
  lb.setAttribute('aria-label','Before and after photo viewer');
  lb.innerHTML=
    '<button type="button" class="lb-x" aria-label="Close">&times;</button>'+
    '<button type="button" class="lb-prev" aria-label="Previous photo">&#8249;</button>'+
    '<button type="button" class="lb-next" aria-label="Next photo">&#8250;</button>'+
    '<div class="lb-stage"><div class="ba-frame" id="lb-frame">'+
      '<img class="ba-before" alt="">'+
      '<div class="ba-after-wrap"><img class="ba-after" alt=""></div>'+
      '<div class="ba-handle" style="left:100%"></div>'+
      '<div class="ba-hint">Concept — drag to see the listing photo</div>'+
    '</div></div>'+
    '<div class="lb-bar"><div class="lb-cap"></div><div class="lb-count"></div></div>';
  document.body.appendChild(lb);
  var frame=document.getElementById('lb-frame');
  var imgB=frame.querySelector('.ba-before');
  var imgA=frame.querySelector('.ba-after');
  var capEl=lb.querySelector('.lb-cap');
  var countEl=lb.querySelector('.lb-count');
  var slider=bindSlider(frame);
  var cur=0, open=false;

  function show(i){
    if(!items.length)return;
    cur=(i+items.length)%items.length;
    var it=items[cur];
    imgB.src=it.before; imgB.alt='Listing: '+it.cap;
    imgA.src=it.after; imgA.alt='Concept: '+it.cap;
    capEl.textContent=it.cap;
    countEl.textContent=(cur+1)+' / '+items.length;
    slider.set(100);
    requestAnimationFrame(slider.fit);
  }
  function openAt(i){
    show(i);
    lb.hidden=false;
    open=true;
    document.body.classList.add('lb-on');
    lb.querySelector('.lb-x').focus();
  }
  function close(){
    lb.hidden=true;
    open=false;
    document.body.classList.remove('lb-on');
  }

  items.forEach(function(it){
    var el=it.el;
    var fr=el.querySelector('.ba-frame');
    var st=gridSliders.get(fr);
    fr.addEventListener('click',function(e){
      if(e.target.closest&&e.target.closest('.ba-expand')){e.preventDefault();openAt(it.i);return;}
      if(st&&st.wasMoved())return;
      if(e.target.closest&&e.target.closest('input'))return;
      openAt(it.i);
    });
    var btn=el.querySelector('.ba-expand');
    if(btn)btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openAt(it.i);});
  });

  lb.querySelector('.lb-x').addEventListener('click',close);
  lb.querySelector('.lb-prev').addEventListener('click',function(){show(cur-1)});
  lb.querySelector('.lb-next').addEventListener('click',function(){show(cur+1)});
  lb.addEventListener('click',function(e){if(e.target===lb)close()});

  document.addEventListener('keydown',function(e){
    if(!open)return;
    if(e.key==='Escape'){e.preventDefault();close()}
    else if(e.key==='ArrowLeft'){e.preventDefault();show(cur-1)}
    else if(e.key==='ArrowRight'){e.preventDefault();show(cur+1)}
  });

  var sy=0,sx=0,track=false;
  lb.addEventListener('pointerdown',function(e){
    if(e.target.closest&&e.target.closest('.ba-frame')&&!e.target.closest('.lb-bar')) return;
    track=true;sy=e.clientY;sx=e.clientX;
  });
  lb.addEventListener('pointerup',function(e){
    if(!track)return;track=false;
    var dy=e.clientY-sy,dx=e.clientX-sx;
    if(Math.abs(dy)>50&&Math.abs(dy)>Math.abs(dx)) show(dy<0?cur+1:cur-1);
  });
  var bar=lb.querySelector('.lb-bar');
  var bx=0;
  bar.addEventListener('pointerdown',function(e){bx=e.clientX});
  bar.addEventListener('pointerup',function(e){
    var dx=e.clientX-bx;
    if(Math.abs(dx)>50) show(dx<0?cur+1:cur-1);
  });

  document.querySelectorAll('main figure > a > img, main .fig2 img, main .full img, main .hero img').forEach(function(img){
    if(img.closest('[data-ba]'))return;
    var fig=img.closest('figure');
    if(fig) fig.style.cursor='zoom-in';
    img.style.cursor='zoom-in';
    (fig||img).addEventListener('click',function(e){
      if(e.target.closest&&e.target.closest('a')&&e.target.closest('a').getAttribute('href')&&!e.target.closest('a').querySelector('img'))return;
      e.preventDefault();
      var src=img.getAttribute('src')||'';
      var name=src.split('/').pop().replace('.jpg','');
      var map={'p-garage-doors':'54','p-garage-interior':'55','p-garage-wide':'57','p-sauna-deck':'02','p-sauna-backyard':'59'};
      var num=null;
      var m=src.match(/p(\d{2})-after/);
      if(m) num=m[1];
      else if(map[name]) num=map[name];
      if(num){
        var idx=items.findIndex(function(it){return (it.after||'').indexOf('p'+num+'-after')>=0});
        if(idx>=0){openAt(idx);return;}
      }
      imgB.src=src; imgB.alt=img.alt||'';
      imgA.src=src; imgA.alt=img.alt||'';
      capEl.textContent=(fig&&fig.querySelector('figcaption')&&fig.querySelector('figcaption').textContent)||img.alt||'';
      countEl.textContent='';
      slider.set(100);
      lb.hidden=false;open=true;document.body.classList.add('lb-on');
    });
  });
})();
</script>'''

page = (root/'page.tpl').read_text()
for k, v in {'{{CSS}}': css, '{{GAL}}': gal, '{{RENDERS}}': renders, '{{JS}}': JS}.items():
    page = page.replace(k, v)
(root/'index.html').write_text(page)
backup = (root/'backup-power.tpl').read_text().replace('{{CSS}}', css)
(root/'backup-power.html').write_text(backup)
print('ok', len(page), 'sliders', page.count('data-ba'), 'backup', len(backup))
