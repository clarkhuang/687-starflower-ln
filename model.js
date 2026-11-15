/* 687 Starflower Ln interactive model. Units: feet. three.js X=plan x (east), Y=height, Z=plan y (south). */
(function(){
const H=window.HOUSE, P=new URLSearchParams(location.search);
const SHOT=P.has('shot');
const COL={ext:0xe9e4da,wall:0xf1efea,glass:0x9fc6e0,door:0x4a3a2c,tile:0xd8c3a0,firebox:0x111111,mantel:0x3b2a1e,cabinet:0xf3f1ea,beam:0xfafafa,
 rail:0xf4f4f4,fixture:0xffffff,counter:0xcfc6b8,steel:0x9ca3ab,bookcase:0xf6f4ee,tread:0x6b4f36,closet:0xe8e4dc,shelf:0xd8d2c4,deck:0x8a5a3c,trim:0xffffff,
 porchroof:0x5d5f66,hottub:0x4b4f55,cedar:0xb9824f,cedarlt:0xcf9d68,gravel:0xb8b2a6,none:0xf1efea};
const scene=new THREE.Scene(); scene.background=new THREE.Color(SHOT?0xdfe6ec:0x14171d);
const R=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
const W=SHOT?(+P.get('w')||1600):innerWidth, Ht=SHOT?(+P.get('h')||1000):innerHeight;
R.setPixelRatio(SHOT?1:devicePixelRatio); R.setSize(W,Ht); R.shadowMap.enabled=true; R.toneMapping=THREE.ACESFilmicToneMapping; R.toneMappingExposure=1.0; R.shadowMap.type=THREE.PCFSoftShadowMap;
document.getElementById('view').appendChild(R.domElement);
const cam=new THREE.PerspectiveCamera(+P.get('fov')||60,W/Ht,0.1,2000);
const ctl=new THREE.OrbitControls(cam,R.domElement); ctl.enableDamping=!SHOT;
scene.add(new THREE.HemisphereLight(0xffffff,0x8a8070,0.75)); scene.add(new THREE.AmbientLight(0xffffff,0.28)); if(SHOT){const u=document.getElementById('ui'); if(u)u.style.display='none';}
const sun=new THREE.DirectionalLight(0xfff4e0,0.65); sun.position.set(60,120,90); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-90,right:110,top:90,bottom:-90,near:1,far:400}); scene.add(sun);
const groups={main:new THREE.Group(),lower:new THREE.Group(),garage:new THREE.Group(),site:new THREE.Group(),stair:new THREE.Group(),gstair:new THREE.Group(),ceil:new THREE.Group(),labels:new THREE.Group()};
Object.values(groups).forEach(g=>scene.add(g));
const mats={}; function mat(c,o){const k=c+'|'+(o||1); if(!mats[k]){mats[k]=new THREE.MeshStandardMaterial({color:c,roughness:.85,metalness:0,transparent:(o||1)<1,opacity:o||1});} return mats[k];}
function bx(g,x0,y0,x1,y1,z0,z1,c,o){const m=new THREE.Mesh(new THREE.BoxGeometry(Math.max(x1-x0,.02),Math.max(z1-z0,.02),Math.max(y1-y0,.02)),typeof c==='object'?c:mat(c,o));
 m.position.set((x0+x1)/2,(z0+z1)/2,(y0+y1)/2); m.castShadow=true; m.receiveShadow=true; g.add(m); return m;}
// ground + floors
const ground=new THREE.Mesh(new THREE.PlaneGeometry(600,600),mat(0x6f8f4e)); ground.rotation.x=-Math.PI/2; ground.position.set(20,-1.62,10); ground.receiveShadow=true; groups.site.add(ground);
bx(groups.main,0,0,54,34,-1.05,-0.02,0x6d4c35);          // main floor (dark LVP)
bx(groups.lower,0,0,54,34,H.LZ-0.4,H.LZ-0.01,0xd9d4cc);   // lower floor
bx(groups.lower,0.85,14.25,32.3,33.15,H.LZ-0.009,H.LZ,0x55585c); // storage rubber floor
bx(groups.lower,0.85,0.85,9.45,13.95,H.LZ-0.009,H.LZ,0x4a3a2c);  // office LVP
bx(groups.garage,-40,-4.2,0,45.8,H.GZ-0.5,H.GZ,0xc9c6bf);  // garage slab
// driveway
bx(groups.site,-40,45.8,0,90,-1.64,-1.6,0x3a3a3a);
// ceilings (shown only in interior shots)
bx(groups.ceil,0.46,0.46,53.54,33.54,H.MH,H.MH+0.1,0xfafafa); bx(groups.ceil,0.85,0.85,53.15,33.15,H.LZ+H.LH,H.LZ+H.LH+0.1,0xf6f6f6);
bx(groups.ceil,-39.5,-3.7,-0.5,45.3,H.GZ+13.67,H.GZ+13.8,0xf4f4f4);
// structure boxes
H.B.forEach(b=>{const g=groups[b.lv]; if(!g)return; let o=1; if(b.c==='glass')o=0.35; if(b.c==='none')return;
  bx(g,b.x0,b.y0,b.x1,b.y1,b.z0,b.z1,COL[b.c]??0xcccccc,o);});
H.R.forEach(s=>{const L=Math.hypot(s.xb-s.xa,s.yb-s.ya),a=Math.atan2(s.yb-s.ya,s.xb-s.xa);
  const m=new THREE.Mesh(new THREE.BoxGeometry(L,s.z1-s.z0,s.th),mat(COL[s.c])); m.position.set((s.xa+s.xb)/2,(s.z0+s.z1)/2,(s.ya+s.yb)/2); m.rotation.y=-a; m.castShadow=m.receiveShadow=true; groups[s.lv].add(m);});
// overlays (septic)
H.OV.forEach(o=>{const m=bx(groups.site,o.x0,o.y0,o.x1,o.y1,-1.6,-1.55,new THREE.MeshBasicMaterial({color:o.c,transparent:true,opacity:.45}));});
// ---------- furniture builders ----------
function grp(f){const g=new THREE.Group(); const cx=(f.x0+f.x1)/2, cy=(f.y0+f.y1)/2; g.position.set(cx,f.z0,cy); g.rotation.y=-(f.ang||0)*Math.PI/180; g.userData=f; return g;}
function lb(g,x0,y0,x1,y1,z0,z1,c,o){return bx(g,x0,y0,x1,y1,z0,z1,c,o);} // local box (x,y plan-local)
const BUILD={
 box(f,g,w,d){lb(g,-w/2,-d/2,w/2,d/2,0,f.h,new THREE.Color(f.c||'#888').getHex());},
 zone(f,g,w,d){lb(g,-w/2,-d/2,w/2,d/2,0,.05,new THREE.MeshBasicMaterial({color:f.c,transparent:true,opacity:.5}));},
 rug(f,g,w,d){lb(g,-w/2,-d/2,w/2,d/2,0,f.h,new THREE.Color(f.c||'#5b4d44').getHex());},
 platform(f,g,w,d){lb(g,-w/2,-d/2,w/2,d/2,0,.15,0x1c1c1c); lb(g,-1.2,-d/2,1.2,d/2,.15,.17,0xb08a5a); lb(g,-3.6,-.08,3.6,.08,.8,.95,0x999999); lb(g,-3.3,-1.5,-2.9,1.5,0,1.5,0x2a6fb0);lb(g,2.9,-1.5,3.3,1.5,0,1.5,0x2a6fb0);},
 rig(f,g,w,d){[-w/2,-w/6,w/6,w/2].forEach(x=>{lb(g,x-.15,-d/2,x+.15,-d/2+.3,0,9.5,0x222222);lb(g,x-.15,d/2-.3,x+.15,d/2,0,9.5,0x222222);});
   lb(g,-w/2,-d/2,w/2,d/2,9.2,9.5,0x222222); lb(g,-w/2,-.1,w/2,.1,7.6,7.8,0x444444); lb(g,-1.2,-.04,-1.1,.04,6.5,9.2,0xc8a060);lb(g,1.1,-.04,1.2,.04,6.5,9.2,0xc8a060); lb(g,2.9,-.12,3.1,.12,0,9.2,0xd9c08c);},
 target(f,g,w,d){lb(g,-w/2,-d/2,w/2,d/2,0,f.h,0xe0c36a);},
 tv(f,g,w,d){lb(g,-w/2,-d/2,w/2,d/2,0,f.h,0x0b0b0c);},
 soundbar(f,g,w,d){lb(g,-w/2,-d/2,w/2,d/2,0,f.h,0x1a1a1a);},
 console(f,g,w,d){lb(g,-w/2,-d/2,w/2,d/2,.3,f.h,0xf5f5f3); lb(g,-w/2+.2,-d/2+.2,-w/2+.35,d/2-.2,0,.3,0x222);lb(g,w/2-.35,-d/2+.2,w/2-.2,d/2-.2,0,.3,0x222);},
 art(f,g,w,d){lb(g,-w/2,-d/2,w/2,d/2,0,f.h,0x2a1d15); lb(g,w/2,-d/2+.3,w/2+.02,d/2-.3,.3,f.h-.3,0xcfd8e0);},
 bench(f,g,w,d){lb(g,-w/2,-d/2,w/2,d/2,1.35,1.7,0x101010); [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>lb(g,a*(w/2-.15)-.08,b*(d/2-.1)-.08,a*(w/2-.15)+.08,b*(d/2-.1)+.08,0,1.35,0x101010));},
 ottoman(f,g,w,d){lb(g,-w/2,-d/2,w/2,d/2,.9,f.h,0x2b2420); [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>lb(g,a*(w/2-.1)-.05,b*(d/2-.1)-.05,a*(w/2-.1)+.05,b*(d/2-.1)+.05,0,.9,0x111111)); lb(g,-w/2,-d/2,w/2,d/2,.15,.2,0x111111);},
 chair(f,g,w,d){const c=0x141414; lb(g,-w/2,-d/2,w/2,d/2,.4,1.45,c); lb(g,-w/2,d/2-.75,w/2,d/2,1.45,f.h,c); lb(g,-w/2,-d/2,-w/2+.55,d/2,1.45,2.2,c); lb(g,w/2-.55,-d/2,w/2,d/2,1.45,2.2,c); lb(g,-w/2+.55,-d/2+.1,w/2-.55,d/2-.75,1.45,1.75,0x262626); lb(g,-w/2+.1,-d/2+.1,w/2-.1,d/2-.1,0,.4,0x2a1c12);},
 sectional(f,g,w,d){const c=0x9a9b9d, cs=0xadaeb0; const X0=-w/2,Y0=-d/2; // local: long leg along x at top (y0), short leg along y at left (x0)
   const dep=3.33; lb(g,X0,Y0,X0+w,Y0+dep,0,1.5,c); lb(g,X0,Y0,X0+w,Y0+0.85,1.5,2.8,c);            // long leg + back
   lb(g,X0,Y0+dep,X0+dep,Y0+d,0,1.5,c); lb(g,X0,Y0,X0+0.85,Y0+d,1.5,2.8,c);                        // short leg + back
   lb(g,X0+w-2.9,Y0+dep,X0+w,Y0+5.45,0,1.5,cs);                                                    // chaise on long leg
   lb(g,X0+w-.6,Y0,X0+w,Y0+5.45,1.5,2.1,c); lb(g,X0+.85,Y0+d-.6,X0+dep,Y0+d,1.5,2.1,c);           // arms
   for(let i=0;i<4;i++) lb(g,X0+.95+i*2.6,Y0+.9,X0+3.4+i*2.6,Y0+dep-.1,1.5,1.75,cs);},
 massage(f,g,w,d){lb(g,-w/2,-d/2,w/2,d/2,0,.6,0x2b2b2b); lb(g,-w/2+.35,-d/2+.6,w/2-.35,d/2-.4,.6,1.6,0x3a3a3a); lb(g,-w/2,d/2-1.3,w/2,d/2-.1,1.2,f.h,0x1d1d1d); lb(g,-w/2,-d/2+.5,-w/2+.45,d/2-.4,.6,2.4,0x8f9399);lb(g,w/2-.45,-d/2+.5,w/2,d/2-.4,.6,2.4,0x8f9399); lb(g,-w/2+.4,-d/2,w/2-.4,-d/2+.9,0,1.2,0x2b2b2b);},
 glassdesk(f,g,w,d){lb(g,-w/2,-d/2,w/2,d/2,2.42,2.5,0xbfe3ea,.45); [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>lb(g,a*(w/2-.08)-.05,b*(d/2-.08)-.05,a*(w/2-.08)+.05,b*(d/2-.08)+.05,0,2.42,0x111111)); lb(g,-.1,-1.0,.1,1.0,2.5,3.9,0x111111);},
 officechair(f,g,w,d){const c=f.c?new THREE.Color(f.c).getHex():0x4a4d52; lb(g,-w/2,-d/2,w/2,d/2,0,.25,0x222); lb(g,-.1,-.1,.1,.1,.25,1.4,0x333); lb(g,-w/2+.1,-d/2+.1,w/2-.1,d/2-.1,1.4,1.7,c); lb(g,-w/2+.15,-d/2+.1,-w/2+.35,d/2-.1,1.7,f.h,c);},
 bed(f,g,w,d){const c=new THREE.Color(f.c).getHex(); lb(g,-w/2,-d/2,w/2,d/2,0,1.1,c); lb(g,-w/2+.25,-d/2+.4,w/2-.25,d/2-.2,1.1,2.0,0xf2f2f2); lb(g,-w/2,-d/2,w/2,-d/2+.4,0,f.h,c); lb(g,-w/2+.5,-d/2+.5,w/2-.5,-d/2+1.6,2.0,2.35,0xffffff);},
 kdesk(f,g,w,d){lb(g,-w/2,-d/2,w/2,d/2,2.35,2.5,0xf7f7f7); lb(g,-w/2,-d/2,-w/2+1.3,d/2,0,2.35,0xf0f0f0); lb(g,w/2-.12,-d/2,w/2,d/2,0,2.35,0xf0f0f0); lb(g,-w/2,d/2-.9,w/2,d/2,3.6,3.72,0xf7f7f7); lb(g,-.9,d/2-.5,.9,d/2-.4,2.5,3.6,0x111111);},
 gofficed(f,g,w,d){lb(g,-w/2,-d/2,w/2,-d/2+2.5,0,2.5,0xd8dde6); lb(g,-w/2+3,-d/2+2.6,-w/2+5,-d/2+4.6,0,3.3,0x333); lb(g,w/2-.3,-d/2,w/2,d/2,0,.1,0x7fb4c9);},
 car(f,g,w,d){const c=new THREE.Color(f.c).getHex(); lb(g,-w/2,-d/2,w/2,d/2,.6,2.6,c); lb(g,-w/2+.3,-d/2+3.5,w/2-.3,d/2-3.5,2.6,f.h,0x222a33); [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>lb(g,a*(w/2)-.4,b*(d/2-2.8)-1.1,a*(w/2)+.4,b*(d/2-2.8)+1.1,0,2.2,0x111111));},
 airstream(f,g,w,d){const m=new THREE.Mesh(new THREE.CylinderGeometry(w/2,w/2,d-w,24),mat(0xc9ccd2)); m.rotation.x=Math.PI/2; m.scale.set(1,1,(f.h-1.0)/w); m.position.set(0,1.0+(f.h-1.0)/2,0); m.castShadow=true; g.add(m);
   const s1=new THREE.Mesh(new THREE.SphereGeometry(w/2,24,16),mat(0xc9ccd2)); s1.scale.set(1,(f.h-1.0)/w,1); s1.position.set(0,1.0+(f.h-1)/2,-(d-w)/2); g.add(s1); const s2=s1.clone(); s2.position.z=(d-w)/2; g.add(s2);
   [[-1],[1]].forEach(([a])=>lb(g,a*w/2-.35,-1.2,a*w/2+.35,1.2,0,2.2,0x111111));},
 piano(f,g,w,d){ // outline: u from bass(east) side, v from keyboard
   const pts=[[0,0],[4.83,0],[4.83,1.7],[4.62,2.9],[3.95,3.8],[3.1,4.55],[2.65,5.35],[2.4,6.15],[1.9,6.72],[1.0,6.92],[0.3,6.85],[0,6.6]];
   const sh=new THREE.Shape(); pts.forEach(([u,v],i)=>{const x=w/2-u, y=-d/2+v; i?sh.lineTo(x,-y):sh.moveTo(x,-y);});
   const body=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:1.05,bevelEnabled:false}),new THREE.MeshStandardMaterial({color:0x07070a,roughness:.25,metalness:.1}));
   body.rotation.x=-Math.PI/2; body.position.y=2.05; body.castShadow=true; g.add(body);
   const lid=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.06,bevelEnabled:false}),new THREE.MeshStandardMaterial({color:0x0a0a0d,roughness:.2,metalness:.1}));
   const piv=new THREE.Group(); piv.position.set(w/2,3.12,0); g.add(piv); lid.rotation.x=-Math.PI/2; lid.position.set(-w/2,0,0); piv.add(lid); piv.rotation.z=-0.62; // opens toward treble (west) side
   lb(g,-w/2,-d/2-.05,w/2,-d/2+1.0,2.35,2.55,0xf3f0e6); lb(g,-w/2,-d/2-.05,w/2,-d/2+.15,2.0,2.62,0x07070a); // keys + key slip
   [[w/2-.4,-d/2+.6],[-w/2+.6,-d/2+.6],[w/2-1.0,d/2-.6]].forEach(([x,y])=>lb(g,x-.18,y-.18,x+.18,y+.18,0,2.05,0x07070a)); lb(g,-.4,-d/2+2.0,.4,-d/2+2.3,0,.25,0x8a6a2a);
   const stick=lb(g,-w/2+.4,-.05,-w/2+.5,.05,3.1,5.4,0x111111);}
};
const FU={}; H.FU.forEach(f=>{const g=grp(f); const w=f.x1-f.x0, d=f.y1-f.y0; let ww=w,dd=d; if(Math.abs(Math.sin((f.ang||0)*Math.PI/180))>0.7&&f.kind!=='massage'){ww=d;dd=w;}
  (BUILD[f.kind]||BUILD.box)(f,g,f.kind==='chair'||f.kind==='massage'?Math.min(w,d):ww,f.kind==='chair'||f.kind==='massage'?Math.max(w,d):dd); (groups[f.lv]||groups.main).add(g); FU[f.id]=g;});
// labels
function label(text,x,y,z,size,color){const c=document.createElement('canvas'),k=c.getContext('2d');k.font='bold 44px sans-serif';const tw=k.measureText(text).width;c.width=tw+30;c.height=64;
 k.font='bold 44px sans-serif';k.fillStyle='rgba(15,17,21,.78)';k.fillRect(0,0,c.width,c.height);k.fillStyle=color||'#ffd9a8';k.fillText(text,15,47);
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));s.scale.set(size*c.width/c.height,size,1);s.position.set(x,z,y);s.renderOrder=9;groups.labels.add(s);return s;}
const LBL={main:[],lower:[],garage:[],site:[]};
H.ROOMS.forEach(([lv,n,dm,x0,y0,x1,y1])=>{const base={main:0,lower:H.LZ,garage:H.GZ}[lv]; LBL[lv].push(label(n+(dm?'  '+dm:''),(x0+x1)/2,(y0+y1)/2,base+(lv==='garage'?12:7.6),1.1,'#cfe6f0'));});
[['piano',4.6],['cigar1',3.4],['tbench',2.4],['sect',3.6],['tv',4.2],['massage',4.6],['gdesk',4.0],['bed',5.2],['kdesk',4.8],['cplunge',4],['airstream',11],['office',4],['rig',11]].forEach(([id,h])=>{const f=H.FU.find(q=>q.id===id); LBL[f.lv].push(label(f.name,(f.x0+f.x1)/2,(f.y0+f.y1)/2,f.z0+h,0.8));});
LBL.site.push(label('9×16 wood-fired skid sauna (perpendicular to the deck)',36.5,-20,9.5,1.1)); LBL.site.push(label('Hot tub (included)',31,-5,4.5,0.9)); LBL.site.push(label('Septic reserve - keep clear',23,-24,1.5,1.0,'#ffe58a')); LBL.site.push(label('Drain field (approx.)',-24,-26,1.5,1.0,'#ffb36b'));
// ---------- levels ----------
let mode=P.get('level')||'all';
function setLevel(m){mode=m; const ex=(m==='exploded');
 groups.main.visible=groups.stair.visible=(m!=='lower'&&m!=='garage-only'); groups.lower.visible=groups.gstair.visible=(m!=='main'); groups.garage.visible=(m!=='lower');
 groups.site.visible=(m==='all'||m==='site'||m==='main'||m==='exploded'); ground.visible=(m==='all'||m==='main'||m==='site');
 const off=ex?16:0; [groups.main,groups.stair,groups.garage].forEach(g=>g.position.y=off); groups.ceil.position.y=off;
 LBL.main.forEach(s=>s.visible=groups.main.visible);LBL.lower.forEach(s=>s.visible=groups.lower.visible);LBL.garage.forEach(s=>s.visible=groups.garage.visible);LBL.site.forEach(s=>s.visible=groups.site.visible);
 if(ex){LBL.main.forEach(s=>s.position.y=s.userData.y0+off);}else{LBL.main.forEach(s=>s.position.y=s.userData.y0);} LBL.garage.forEach(s=>s.position.y=s.userData.y0+(ex?off:0));}
Object.values(LBL).flat().forEach(s=>s.userData.y0=s.position.y);
groups.ceil.visible=P.has('ceil'); groups.labels.visible=!P.has('nolabels');
const IL=[]; [[24,6.8,26,0xffd2a0],[10,6.8,8,0xffffff],[45,6.8,10,0xffffff],[20,H.LZ+7.5,8,0xffffff],[45,H.LZ+7.5,8,0xffffff],[5,H.LZ+7.5,7,0xffe2c0],[15,H.LZ+7.5,26,0xffffff],[-20,H.GZ+12,10,0xffffff],[-20,H.GZ+12,32,0xffffff]].forEach(([x,z,y,c])=>{const l=new THREE.PointLight(c,0.22,34,1.8); l.position.set(x,z,y); l.visible=false; scene.add(l); IL.push(l);});
// ---------- views ----------
const V={
 overview:{p:[78,58,82],t:[10,-3,12],lv:'all',l:'Overview (roofless)'},
 exploded:{p:[72,46,72],t:[18,-2,14],lv:'exploded',l:'Exploded: main over lower'},
 main_aerial:{p:[27,55,48],t:[24,0,18],lv:'main',l:'Main floor from above'},
 lower_aerial:{p:[26,40,48],t:[22,-9.84,12],lv:'lower',l:'Lower level from above'},
 great_nw:{p:[16.2,5.5,15.6],t:[28,3.4,31],lv:'main',ceil:1,l:'Great room from kitchen corner (listing-photo angle)'},
 great_foyer:{p:[34.5,5.5,31.5],t:[18,3.2,22],lv:'main',ceil:1,l:'Great room from the front door'},
 great_dining:{p:[20,5.5,6],t:[22,2.8,30],lv:'main',ceil:1,l:'Through the dining arch to the piano'},
 family_ne:{p:[29.8,-4.34,15.5],t:[12,-7.4,2],lv:'lower',ceil:1,l:'Family room: sectional corner'},
 family_tv:{p:[13.5,-6.2,2.8],t:[17,-6.0,18.4],lv:'lower',ceil:1,l:'Family room: view from the sectional'},
 office:{p:[9.0,-4.6,13.2],t:[2.5,-7.4,3],lv:'lower',ceil:1,l:'Secret office'},
 kidroom:{p:[41,-4.4,13.5],t:[49,-7.4,2],lv:'lower',ceil:1,l:"Kid's room"},
 storage:{p:[30,-4.4,30],t:[0,-6,16],lv:'lower',ceil:1,l:'Storage room + garage stair door'},
 garage_gym:{p:[-29,5.3,25.5],t:[-14,2.8,-2],lv:'all',ceil:1,l:'Garage: gym, plunge, office'},
 garage_top:{p:[-20,62,32],t:[-20,0,18],lv:'all',l:'Garage from above'},
 sauna:{p:[58,16,-46],t:[36.5,3,-20],lv:'all',l:'9×16 skid sauna, 16 ft out from the deck'},
 stair_route:{p:[-24,12,42],t:[2,-6,12],lv:'lower',l:'Garage stair to storage (move route)'}
};
function jump(id){const v=V[id]; if(!v)return false; setLevel(v.lv); groups.ceil.visible=!!v.ceil||P.has('ceil'); groups.labels.visible=P.has('labels')||(!v.ceil&&!P.has('nolabels')); IL.forEach(l=>l.visible=!!v.ceil); cam.position.set(...v.p); ctl.target.set(...v.t); if(v.fov)cam.fov=v.fov; cam.updateProjectionMatrix(); ctl.update(); return true;}
const sel=document.getElementById('views'); if(sel){Object.entries(V).forEach(([k,v])=>{const o=document.createElement('option');o.value=k;o.textContent=v.l;sel.append(o);}); sel.onchange=()=>jump(sel.value);}
document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{setLevel(b.dataset.level);});
const cb=document.getElementById('ceil'); if(cb)cb.onchange=()=>groups.ceil.visible=cb.checked;
const lbb=document.getElementById('lbl'); if(lbb)lbb.onchange=()=>groups.labels.visible=lbb.checked;
jump(P.get('view')||'overview'); if(P.get('level'))setLevel(P.get('level'));
addEventListener('resize',()=>{if(SHOT)return;cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();R.setSize(innerWidth,innerHeight);});
(function loop(){ctl.update();R.render(scene,cam); if(!SHOT)requestAnimationFrame(loop); else {window.READY=true; document.title='READY';}})();
window.sf={scene,jump,V,setLevel};
})();
