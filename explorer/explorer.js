/* 687 Starflower Ln 3D explorer.
   World frame: feet, X = east, Y = up, Z = south (three.js right-handed, -Z = north).
   House frame ("model"): plan feet from house-data.js / plan-cubicasa.json, X = plan x, Z = plan y.
   The house root is rotated and placed on the map by matching the garage to the aerial photo. */
(function(){
'use strict';
const Q=new URLSearchParams(location.search), SHOT=Q.has('shot'), MOBILE=matchMedia('(max-width:820px)').matches||('ontouchstart' in window&&innerWidth<1000);
const H=window.HOUSE, FT=3.28084;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmtFtIn=f=>{const s=f<0?'-':'';f=Math.abs(f);let ft=Math.floor(f),inch=Math.round((f-ft)*12);if(inch===12){ft++;inch=0;}return s+ft+'′'+(inch?' '+inch+'″':'');};
const fmtDist=f=>f>2640?(f/5280).toFixed(2)+' mi ('+Math.round(f).toLocaleString()+' ft)':fmtFtIn(f);
const OLDBRAND=new RegExp('\\b'+['Sea','breeze'].join('')+'\\b','gi');
const clean=s=>String(s||'').replace(OLDBRAND,'existing').replace(/\s*\(#\d+\)/g,'');

// ---------- renderer / scene ----------
const W0=SHOT?(+Q.get('w')||1600):innerWidth, H0=SHOT?(+Q.get('h')||1000):innerHeight;
const R=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:SHOT,logarithmicDepthBuffer:true});
R.setPixelRatio(SHOT?1:Math.min(devicePixelRatio,MOBILE?1.5:2)); R.setSize(W0,H0);
R.outputEncoding=THREE.sRGBEncoding; R.toneMapping=THREE.ACESFilmicToneMapping; R.toneMappingExposure=1.05;
R.shadowMap.enabled=!MOBILE; R.shadowMap.type=THREE.PCFSoftShadowMap; R.localClippingEnabled=true;
$('#view').appendChild(R.domElement);
const scene=new THREE.Scene();
const SKY=new THREE.Color(0xbfd3e6); scene.background=SKY; scene.fog=new THREE.Fog(0xbfd3e6,6000,40000);
const cam=new THREE.PerspectiveCamera(55,W0/H0,0.3,120000);
const ctl=new THREE.OrbitControls(cam,R.domElement); ctl.enableDamping=!SHOT; ctl.dampingFactor=0.12; ctl.screenSpacePanning=false;
ctl.maxPolarAngle=Math.PI*0.495; ctl.minDistance=2; ctl.maxDistance=60000; ctl.zoomSpeed=1.2;
ctl.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.ROTATE,RIGHT:THREE.MOUSE.PAN};
const hemi=new THREE.HemisphereLight(0xeaf2ff,0x6b6150,0.75); scene.add(hemi);
scene.add(new THREE.AmbientLight(0xffffff,0.22));
const sun=new THREE.DirectionalLight(0xfff1dc,1.05); sun.castShadow=!MOBILE; sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-150,right:150,top:150,bottom:-150,near:10,far:900}); sun.shadow.bias=-0.0004; scene.add(sun); scene.add(sun.target);

// ---------- layers ----------
const LAYERS=[
 ['structure','Structure & walls',true,'#d9d4c8'],['roof','Roof',true,'#4b4f57'],['furniture','Furniture',true,'#8a6a45'],['gym','Gym',true,'#c2185b'],
 ['vehicles','Vehicles',true,'#9aa3ad'],['outdoor','Outdoor (deck, sauna, shed)',true,'#b9824f'],['power','Backup power & solar',true,'#2e7d32'],
 ['rooms','Room labels',true,'#7fb4c9'],['terrain','Terrain & imagery',true,'#5f7f3f'],['boundary','Lot boundary',true,'#ff4b3a'],['trails','Trails to VASA',true,'#ffa726']];
const L={}; const world=new THREE.Group(); scene.add(world);
const HR=new THREE.Group(); world.add(HR); // house root (model frame)
LAYERS.forEach(([k])=>{L[k]=new THREE.Group(); L[k].name=k; (['terrain','boundary','trails'].includes(k)?world:HR).add(L[k]);});

// ---------- clipping (section) ----------
const clipH=new THREE.Plane(new THREE.Vector3(0,-1,0),8.0), clipG=new THREE.Plane(new THREE.Vector3(0,-1,0),9.9);
const mats={};
function mat(c,o,dom,extra){o=o==null?1:o;const k=c+'|'+o+'|'+dom+'|'+(extra?JSON.stringify(extra):'');if(!mats[k]){
  const m=new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.82,metalness:0,transparent:o<1,opacity:o,depthWrite:o>=0.6,side:THREE.FrontSide},extra||{}));
  if(dom==='house'){m.clippingPlanes=[clipH];m.clipShadows=true;} else if(dom==='garage'){m.clippingPlanes=[clipG];m.clipShadows=true;} mats[k]=m;} return mats[k];}
const domOf=lv=>lv==='garage'?'garage':(lv==='site'||lv==='outdoor'?'site':'house');

// ---------- instanced box collector ----------
const UNIT=new THREE.BoxGeometry(1,1,1); const BATCH={}; const PICK=[]; // pick registry: {mesh, ids[]} ; info objects
const INFOS=[];
const _m=new THREE.Matrix4(),_p=new THREE.Vector3(),_q=new THREE.Quaternion(),_s=new THREE.Vector3(),_e=new THREE.Euler();
function addBox(layer,dom,parentM,x0,y0,x1,y1,z0,z1,color,opacity,info,rotY){ // local plan coords (x,y) + height z
  const w=Math.max(Math.abs(x1-x0),.02),d=Math.max(Math.abs(y1-y0),.02),h=Math.max(Math.abs(z1-z0),.02);
  _p.set((x0+x1)/2,(z0+z1)/2,(y0+y1)/2); _q.setFromEuler(_e.set(0,rotY||0,0)); _s.set(w,h,d); _m.compose(_p,_q,_s); if(parentM)_m.premultiply(parentM);
  const c=(typeof color==='string')?new THREE.Color(color).getHex():color; const k=layer+'|'+dom+'|'+c+'|'+(opacity==null?1:opacity);
  (BATCH[k]=BATCH[k]||{layer,dom,c,o:opacity==null?1:opacity,items:[]}).items.push({m:_m.clone(),info});
}
function flushBoxes(){for(const k in BATCH){const b=BATCH[k];const im=new THREE.InstancedMesh(UNIT,mat(b.c,b.o,b.dom),b.items.length);
  b.items.forEach((it,i)=>im.setMatrixAt(i,it.m)); im.instanceMatrix.needsUpdate=true; im.castShadow=b.o>=0.6; im.receiveShadow=true;
  im.userData.infos=b.items.map(it=>it.info); im.userData.mats=b.items.map(it=>it.m); L[b.layer].add(im);} }
function addMesh(layer,mesh,info){mesh.castShadow=true;mesh.receiveShadow=true;if(info)mesh.userData.info=info;L[layer].add(mesh);return mesh;}
function infoOf(name,extra){return Object.assign({name:clean(name)},extra||{});}
const dims=(w,d,h)=>fmtFtIn(w)+' × '+fmtFtIn(d)+(h?' × '+fmtFtIn(h)+' tall':'');

let PLAN=null, GEO=null;
const LZ=H.LZ, GZ=H.GZ;

// ======================= HOUSE =======================
const COL={ext:0xe7e2d8,wall:0xf3f1ec,glass:0x9fc6e0,door:0x3b2f25,tile:0xd8c3a0,firebox:0x111111,mantel:0x3b2a1e,cabinet:0xf3f1ea,beam:0xfafafa,rail:0xf4f4f4,fixture:0xffffff,
 counter:0xcfc6b8,steel:0x9ca3ab,bookcase:0xf6f4ee,tread:0x6b4f36,closet:0xe8e4dc,shelf:0xd8d2c4,deck:0x8a5a3c,trim:0xffffff,porchroof:0x5d5f66,hottub:0x4b4f55,cedar:0xb9824f,cedarlt:0xcf9d68,gravel:0xb8b2a6};
const SKIPB=new Set(['ext','wall','glass','door']); // replaced by the Cubicasa trace
function buildStructure(){
  const HT=PLAN.heights, MH=HT.main_ceiling;
  // floors
  addBox('structure','house',null,0,0,54,34,-1.05,-0.02,0x6d4c35,1,infoOf('Main floor (dark LVP)',{layer:'Structure'}));
  addBox('structure','house',null,0.4,0.4,53.6,33.6,LZ-0.4,LZ-0.01,0xcfc9bf,1,infoOf('Basement slab',{layer:'Structure'}));
  addBox('structure','house',null,0.89,0.89,10.06,14.38,LZ-0.009,LZ,0x4a3a2c,1,infoOf('Speakeasy floor',{layer:'Structure'}));
  const gi=PLAN.garage_inner; addBox('structure','garage',null,gi[0]-0.5,gi[1]-0.5,0.2,gi[3]+0.5,GZ-0.5,GZ,0xc9c6bf,1,infoOf('Garage slab',{dims:"39′6″ × 49′11″ (Cubicasa)",layer:'Structure'}));
  // traced walls (with openings cut)
  const ops=PLAN.openings;
  PLAN.walls.forEach(w=>{
    const dom=w.lv==='garage'?'garage':'house', col=(w.k==='solid')?0xd9d2c4:((w.lv==='lower'&&false)?COL.wall:COL.wall);
    if(w.diag){const [xa,ya,xb,yb]=w.diag,Lg=Math.hypot(xb-xa,yb-ya),a=Math.atan2(yb-ya,xb-xa);
      const mm=new THREE.Matrix4().makeTranslation((xa+xb)/2,0,(ya+yb)/2).multiply(new THREE.Matrix4().makeRotationY(-a));
      addBox('structure',dom,mm,-Lg/2,-0.17,Lg/2,0.17,w.z0,w.z1,col,1,infoOf(w.k==='header'?'Door header':'Angled wall (family room / utility)',{layer:'Structure',src:'Cubicasa trace'}));return;}
    // split wall by openings lying inside it
    const horiz=(w.x1-w.x0)>=(w.y1-w.y0); let segs=[[horiz?w.x0:w.y0,horiz?w.x1:w.y1]];
    const mine=ops.filter(o=>o.lv===w.lv&&(horiz?(o.o==='h'&&Math.abs((o.y0+o.y1)/2-(w.y0+w.y1)/2)<0.5&&o.x0<w.x1-0.05&&o.x1>w.x0+0.05):(o.o==='v'&&Math.abs((o.x0+o.x1)/2-(w.x0+w.x1)/2)<0.5&&o.y0<w.y1-0.05&&o.y1>w.y0+0.05)));
    const info=infoOf(w.k==='solid'?'Column / chase (per plan)':(w.lv==='garage'?'Garage wall':'Wall'),{dims:dims(w.x1-w.x0,w.y1-w.y0,w.z1-w.z0),layer:'Structure',src:'Cubicasa trace'});
    segs.forEach(([a,b])=>{
      if(horiz)addBox('structure',dom,null,a,w.y0,b,w.y1,w.z0,w.z1,col,1,info); else addBox('structure',dom,null,w.x0,a,w.x1,b,w.z0,w.z1,col,1,info);});
  });
  ops.forEach(o=>{ // openings live in gaps between traced walls: add header, sill, glass / door leaf
    const dom=o.lv==='garage'?'garage':'house', t=Math.max(o.o==='h'?o.y1-o.y0:o.x1-o.x0,0.35);
    const box=(z0,z1,c,op,inf)=>addBox('structure',dom,null,o.x0,o.y0,o.x1,o.y1,z0,z1,c,op,inf);
    const nm={window:'Window',extdoor:'Exterior door',door:'Door',opening:'Cased opening',overhead:'Overhead garage door'}[o.kind];
    const inf=infoOf(nm,{dims:fmtFtIn(o.w)+' wide'+(o.kind!=='opening'?' × '+fmtFtIn(o.head-o.sill)+(o.kind==='window'?' (sill '+fmtFtIn(o.sill-(o.lv==='lower'?LZ:o.lv==='garage'?GZ:0))+')':''):''),layer:'Structure',src:'Cubicasa trace; heights typical'});
    if(o.head<o.top-0.05) box(o.head,o.top,COL.wall,1,inf);
    if(o.kind==='window'){box(o.sill-0.0,o.sill+0.0+0.02,COL.trim,1,inf); if(o.sill>(o.lv==='lower'?LZ:o.lv==='garage'?GZ:0)+0.05) box(o.lv==='lower'?LZ:(o.lv==='garage'?GZ:0),o.sill,COL.wall,1,inf); box(o.sill,o.head,COL.glass,0.32,inf);}
    else if(o.kind==='overhead'){if(Q.has('opendoors'))return;const b=GZ;box(b,o.head,0xe9e9e6,1,inf);}
    else if(o.kind==='extdoor'){const b=o.lv==='garage'?GZ:0; box(b,o.head,o.w>5?COL.glass:0x2b2622,o.w>5?0.35:1,inf);}
  });
  // ceilings (hidden by the section cut unless "Roof")
  addBox('structure','house',null,0.46,0.46,53.54,33.54,MH,MH+0.08,0xfafafa,1,infoOf("Main ceiling, 8′-1⅛″ with 12″ coffers",{layer:'Structure'}));
  addBox('structure','house',null,0.85,0.85,53.15,33.15,LZ+HT.lower_ceiling_finished,LZ+HT.lower_ceiling_finished+0.08,0xf6f6f6,1,infoOf('Basement finished ceiling ≈ 8′ (joists at 8′-9½″)',{layer:'Structure'}));
  // garage scissor vault: 10 ft walls, 4/12 to a 13 ft flat center
  const gx0=gi[0],gx1=gi[2],run=(HT.garage_flat-HT.garage_wall)/HT.garage_vault_pitch, slope=Math.atan(HT.garage_vault_pitch), Ls=run/Math.cos(slope);
  addBox('structure','garage',null,gx0+run,gi[1],gx1-run,gi[3],GZ+HT.garage_flat,GZ+HT.garage_flat+0.08,0xf4f4f4,1,infoOf('Garage flat center, 13′-0″',{layer:'Structure'}));
  [[gx0+run/2,1],[gx1-run/2,-1]].forEach(([cx,sg])=>{const mm=new THREE.Matrix4().makeTranslation(cx,GZ+(HT.garage_wall+HT.garage_flat)/2,(gi[1]+gi[3])/2).multiply(new THREE.Matrix4().makeRotationZ(sg*slope));
    addBox('structure','garage',mm,-Ls/2,gi[1]-(gi[1]+gi[3])/2,Ls/2,gi[3]-(gi[1]+gi[3])/2,-0.04,0.04,0xf4f4f4,1,infoOf('Garage scissor vault, 4/12',{layer:'Structure'}));});
  // coffers (12 in) from house-data beams; fixtures, cabinets, stairs etc. from house-data
  H.B.forEach(b=>{ if(b.c==='none')return; if(['main','lower','garage'].includes(b.lv)&&SKIPB.has(b.c))return;
    if(b.lv==='gstair'&&b.c==='wall')return;
    if(b.lv==='site'){ if(b.y1<=-11.15&&!['trim','deck','porchroof'].includes(b.c))return; // old sauna replaced below
      addBox('outdoor','site',null,b.x0,b.y0,b.x1,b.y1,b.z0,b.z1,COL[b.c]??0xcccccc,1,infoOf(b.t,{dims:dims(b.x1-b.x0,b.y1-b.y0,b.z1-b.z0),layer:'Outdoor'}));return;}
    let z0=b.z0,z1=b.z1; if(b.c==='beam'){z0=PLAN.heights.main_ceiling-PLAN.heights.coffer_depth;z1=PLAN.heights.main_ceiling;}
    const dom=b.lv==='garage'?'garage':'house';
    addBox('structure',dom,null,b.x0,b.y0,b.x1,b.y1,z0,z1,COL[b.c]??0xcccccc,b.c==='glass'?0.35:1,infoOf(b.t||b.c,{dims:dims(b.x1-b.x0,b.y1-b.y0,z1-z0),layer:'Structure'}));});
  (H.R||[]).forEach(s=>{}); // angled lower walls come from the trace now
  // stair check: 15 risers at 7-7/8" = 9'-10 1/8" total rise
}
// ---------- roof ----------
function buildRoof(){
  const plate=PLAN.heights.main_plate, pitch=6/12, ov=1.0;
  // house: gable, ridge along plan x at y=17
  const x0=-ov+0.5,x1=54+ov,y0=-ov,y1=34+ov,yr=17,rise=(yr-y0)*pitch, ridge=plate+yr*pitch, Ls=Math.hypot(yr-y0,rise), sl=Math.atan(pitch);
  const roofC=0x4b4f57;
  [[(y0+yr)/2,-1],[(yr+y1)/2,1]].forEach(([cy,s])=>{const mm=new THREE.Matrix4().makeTranslation((x0+x1)/2,plate+rise/2-ov*pitch,cy).multiply(new THREE.Matrix4().makeRotationX(s*sl));
    addBox('roof','house',mm,-(x1-x0)/2,-Ls/2,(x1-x0)/2,Ls/2,-0.2,0.2,roofC,1,infoOf('House roof, 6/12 (shingle)',{layer:'Roof',src:'roof truss set'}));});
  const tri=(xg)=>{const sh=new THREE.Shape([new THREE.Vector2(y0+ov,0),new THREE.Vector2(y1-ov,0),new THREE.Vector2(yr,rise-0.5)]);const g=new THREE.ShapeGeometry(sh);
    const m=new THREE.Mesh(g,mat(COL.ext,1,'house',{side:THREE.DoubleSide}));m.rotation.y=-Math.PI/2;m.position.set(xg,plate,0);addMesh('roof',m,infoOf('Gable end',{layer:'Roof'}));};
  tri(0.02);tri(53.98);
  addBox('roof','house',null,x0,yr-0.25,x1,yr+0.25,ridge-0.1,ridge+0.25,0x3c4047,1,infoOf('Ridge vent',{layer:'Roof'}));
  // garage: gable, ridge along plan y; south plane = toward -x
  const gi=PLAN.garage_inner, gxa=gi[0]-0.5, gxb=0.5, gxr=(gxa+gxb)/2, half=(gxb-gxa)/2, hs=half+ov, gy0=gi[1]-0.5-ov, gy1=gi[3]+0.66+ov, gplate=GZ+PLAN.heights.garage_wall;
  const eaveH=gplate-ov*pitch, ridgeH=gplate+half*pitch, gL=Math.hypot(hs,hs*pitch);
  [[-1,'Garage roof, south plane (solar)'],[1,'Garage roof, north plane']].forEach(([s,nm])=>{const cx=gxr+s*hs/2, mm=new THREE.Matrix4().makeTranslation(cx,(eaveH+ridgeH)/2,(gy0+gy1)/2).multiply(new THREE.Matrix4().makeRotationZ(-s*sl));
    addBox('roof','garage',mm,-gL/2,(gy0-gy1)/2,gL/2,(gy1-gy0)/2,-0.2,0.2,roofC,1,infoOf(nm,{layer:'Roof'}));});
  const gtri=(yg)=>{const sh=new THREE.Shape([new THREE.Vector2(gxa,0),new THREE.Vector2(gxb,0),new THREE.Vector2(gxr,half*pitch-0.3)]);const g=new THREE.ShapeGeometry(sh);
    const m=new THREE.Mesh(g,mat(COL.ext,1,'garage',{side:THREE.DoubleSide}));m.position.set(0,gplate,yg);addMesh('roof',m,infoOf('Garage gable',{layer:'Roof'}));};
  gtri(gi[1]-0.5);gtri(gi[3]+0.66);
  addBox('roof','garage',null,gxr-0.25,gy0,gxr+0.25,gy1,ridgeH-0.1,ridgeH+0.25,0x3c4047,1,infoOf('Garage ridge',{layer:'Roof'}));
  // solar: 3 rows x 12 portrait panels fill the south plane, 36 in fire path at the driveway (east) end
  const pW=3.7,pL=5.65,cols=12,rows=3,eaveUp=1.4,ss=Math.sin(sl),cs=Math.cos(sl), ex=gxa-ov;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const u=eaveUp+r*(pL+0.1)+pL/2, cx=ex+u*cs, cy=eaveH+u*ss+0.38, z=gi[1]+0.4+c*(pW+0.08)+pW/2;
    const mm=new THREE.Matrix4().makeTranslation(cx,cy,z).multiply(new THREE.Matrix4().makeRotationZ(sl));
    addBox('power','garage',mm,-pL/2,-pW/2,pL/2,pW/2,-0.06,0.06,0x0d2240,1,infoOf('Solar panel (about 430 W)',{layer:'Backup power & solar',note:'36 panels fill the south garage roof plane (about 15.5 kW). A 36-inch fire path stays clear at the driveway end. The final layout needs a shade report.'}));}
}

// ---------- furniture ----------
const hex=(c,d)=>new THREE.Color(c||d).getHex();
function ctx(layer,dom,M,info){return{
  lb:(x0,y0,x1,y1,z0,z1,c,o)=>addBox(layer,dom,M,x0,y0,x1,y1,z0,z1,c,o,info),
  raw:(m)=>{const g=new THREE.Group();g.matrixAutoUpdate=false;g.matrix.copy(M);g.add(m);m.userData.info=info;m.castShadow=m.receiveShadow=true;L[layer].add(g);return m;},
  mesh:(geo,c,o,ex,setup)=>{const m=new THREE.Mesh(geo,mat(c,o,dom,ex));setup&&setup(m);const g=new THREE.Group();g.matrixAutoUpdate=false;g.matrix.copy(M);g.add(m);m.userData.info=info;m.castShadow=m.receiveShadow=true;L[layer].add(g);return m;}};}
const legs4=(C,w,d,inset,h,c,t)=>[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>C.lb(a*(w/2-inset)-t,b*(d/2-inset)-t,a*(w/2-inset)+t,b*(d/2-inset)+t,0,h,c));
const BUILD={
 box(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,0,f.h,hex(f.c,'#888'));},
 zone(f,C,w,d){if(Q.has('studio'))return;C.lb(-w/2,-d/2,w/2,d/2,0,.04,hex(f.c),.45);},
 rug(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,0,Math.max(f.h,.03),hex(f.c,'#5b4d44'));},
 platform(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,0,.15,0x1c1c1c);C.lb(-1.2,-d/2,1.2,d/2,.15,.17,0xb08a5a);C.lb(-3.6,-.08,3.6,.08,.8,.95,0x999999);C.lb(-3.3,-1.5,-2.9,1.5,0,1.5,0x2a6fb0);C.lb(2.9,-1.5,3.3,1.5,0,1.5,0x2a6fb0);},
 rig(f,C,w,d){const h=Math.min(f.h,9.5);[-w/2,w/2].forEach(x=>{C.lb(x-.13,-d/2,x+.13,-d/2+.26,0,h,0x1e1e1e);C.lb(x-.13,d/2-.26,x+.13,d/2,0,h,0x1e1e1e);});
   C.lb(-w/2,-d/2,w/2,-d/2+.2,h-.25,h,0x1e1e1e);C.lb(-w/2,d/2-.2,w/2,d/2,h-.25,h,0x1e1e1e);C.lb(-w/2,-.06,w/2,.06,h-.5,h-.38,0x777777);
   [-w/2,w/2].forEach(x=>C.lb(x-.13,-d/2,x+.13,d/2,h-.25,h,0x1e1e1e));C.lb(-w/2+.4,-d/2-.05,w/2-.4,-d/2+.05,4.3,4.42,0xb0b0b0);
   [[-w/2-.25,-d/2-.6],[-w/2-.25,d/2+.4],[w/2+.05,-d/2-.6],[w/2+.05,d/2+.4]].forEach(([x,y])=>C.lb(x,y,x+.2,y+.2,0,.25,0x333333));},
 roundtable(f,C,w,d){const c=hex(f.c,'#3b2414');C.mesh(new THREE.CylinderGeometry(w/2,w/2,.12,40),c,1,{roughness:.45},m=>m.position.y=f.h-.06);C.lb(-.12,-.12,.12,.12,.15,f.h-.12,0x1a1a1a);},
 table(f,C,w,d){const c=hex(f.c,'#8a6a45');C.lb(-w/2,-d/2,w/2,d/2,f.h-.12,f.h,c);legs4(C,w,d,.25,f.h-.12,f.h>3?c:0x222222,.1);
   if(f.h>3){C.lb(-w/2+.3,-d/2+.3,w/2-.3,-d/2+.38,.9,1.0,c);C.lb(-w/2+.3,d/2-.38,w/2-.3,d/2-.3,.9,1.0,c);}},
 barstool(f,C,w,d){const c=hex(f.c,'#4a2c1a');C.lb(-.62,-.62,.62,.62,2.45,2.62,c);legs4(C,1.24,1.24,.12,2.45,c,.05);C.lb(-.55,-.04,.55,.04,.9,.98,c);
   const back=(f.y0+f.y1)/2<6.4?1:-1; // backs face away from the table
   C.lb(-.6,back>0?-.62:.5,.6,back>0?-.5:.62,2.62,f.h,c);},
 barcart(f,C,w,d){const c=hex(f.c,'#b8913f');legs4(C,w,d,.05,f.h,c,.04);C.lb(-w/2,-d/2,w/2,d/2,f.h-.6,f.h-.55,0x2a1a10);C.lb(-w/2,-d/2,w/2,d/2,.8,.85,0x2a1a10);
   [-.9,-.4,.1,.6].forEach((x,i)=>C.lb(x-.12,-.12,x+.12,.12,f.h-.55,f.h-.55+.9+(i%2)*.25,i%2?0x3d6b3a:0x6b3a1e));},
 pubtable(f,C,w,d){const c=hex(f.c,'#3a2416'),h=f.h;C.lb(-w/2,-d/2,w/2,d/2,h-.1,h,c);
   [Math.PI/4,-Math.PI/4].forEach(r=>C.mesh(new THREE.BoxGeometry(Math.min(w,d)*1.38,.006,.03),0x6b4529,1,{},m=>{m.position.y=h+.004;m.rotation.y=r;}));
   C.lb(-w/2+.06,-d/2+.06,w/2-.06,d/2-.06,h-.45,h-.1,c);legs4(C,w,d,.16,h-.45,c,.1);},
 counterchair(f,C,w,d){const c=hex(f.c,'#3a2416'),sc=0xa59a8a,s=2.15,h=f.h;legs4(C,w,d,.07,s-.12,c,.055);
   C.lb(-w/2+.04,-d/2+.04,w/2-.04,d/2-.04,s-.12,s+.06,sc);C.lb(-w/2+.1,-d/2+.1,w/2-.1,-d/2+.15,.75,.82,c);C.lb(-w/2+.1,d/2-.15,w/2-.1,d/2-.1,.75,.82,c);
   const F=f.face||'S',T=.1;let E;if(F==='S')E=[-w/2,-d/2,w/2,-d/2+T,'x'];else if(F==='N')E=[-w/2,d/2-T,w/2,d/2,'x'];else if(F==='W')E=[-w/2,-d/2,-w/2+T,d/2,'y'];else E=[w/2-T,-d/2,w/2,d/2,'y'];
   const[x0,y0,x1,y1,ax]=E;C.lb(x0,y0,x1,y1,h-.28,h,c);
   for(let i=0;i<6;i++){const u=i/5;if(ax==='x'){const x=x0+.05+(x1-x0-.1)*u;C.lb(x-.045,y0,x+.045,y1,s+.06,h-.28,c);}else{const y=y0+.05+(y1-y0-.1)*u;C.lb(x0,y-.045,x1,y+.045,s+.06,h-.28,c);}}},
 barcart2(f,C,w,d){const oak=hex(f.c,'#c8923f'),h=f.h;legs4(C,w,d,.05,h-.04,oak,.05);C.lb(-w/2,-d/2,w/2,d/2,h-.14,h-.04,oak);
   C.lb(-w/2+.1,-d/2+.1,w/2-.1,d/2-.1,h-.05,h,0xdcd0bb);C.lb(-w/2,-d/2,w/2,d/2,.5,.58,oak);C.lb(-w/2+.1,-d/2+.1,w/2-.1,d/2-.1,.58,.6,0xdcd0bb);
   const r0=-w/2+.25,r1=w/2-.25,q0=-d/2+.2,q1=d/2-.2,rh=.8;[[r0,q0],[r1,q0],[r0,q1],[r1,q1]].forEach(([x,y])=>C.lb(x-.015,y-.015,x+.015,y+.015,h,h+rh,0x111111));
   [h+.02,h+rh/2,h+rh].forEach(z=>{C.lb(r0,q0,r1,q0+.02,z-.01,z+.01,0x111111);C.lb(r0,q1-.02,r1,q1,z-.01,z+.01,0x111111);});
   for(let i=0;i<5;i++){const x=r0+.12+i*(r1-r0-.24)/4;[h+.16,h+.55].forEach(z=>C.mesh(new THREE.CylinderGeometry(.11,.11,q1-q0+.1,14),i%2?0x2f4a2a:0x4a1622,1,{roughness:.3},m=>{m.rotation.x=Math.PI/2;m.position.set(x,z,0);}));}},
 futon(f,C,w,d){const cs=hex(f.c,'#a89f91');legs4(C,w,d,.15,.55,0xc9ccd0,.045);const bk=w/2-.42;
   C.lb(-w/2,-d/2,bk,d/2,.55,1.4,cs);C.lb(bk,-d/2,w/2,d/2,.55,2.75,0x9b9285);C.lb(-w/2+.05,-d/2,w/2-.05,-d/2+.06,.5,.6,0xc9ccd0);C.lb(-w/2+.05,d/2-.06,w/2-.05,d/2,.5,.6,0xc9ccd0);},
 plunge(f,C,w,d){const c=0xf4f4f2,h=f.h,L=w>=d,a=L?w:d,b=L?d:w;const B=(u0,v0,u1,v1,z0,z1,col)=>L?C.lb(u0,v0,u1,v1,z0,z1,col):C.lb(v0,u0,v1,u1,z0,z1,col);
   B(-a/2+.35,-b/2+.12,a/2-.35,b/2-.12,0,.35,c);B(-a/2+.18,-b/2+.06,a/2-.18,b/2-.06,.35,.8,c);B(-a/2,-b/2,a/2,b/2,.8,.95,c);
   B(-a/2,-b/2,-a/2+.12,b/2,.95,h,c);B(a/2-.12,-b/2,a/2,b/2,.95,h,c);B(-a/2,-b/2,a/2,-b/2+.12,.95,h,c);B(-a/2,b/2-.12,a/2,b/2,.95,h,c);
   B(-a/2+.12,-b/2+.12,a/2-.12,b/2-.12,.95,h-.3,0x9fd8ee);},
 pchiller(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,0,f.h,0xf4f4f2);C.lb(-w/2+.25,-d/2-.01,w/2-.25,-d/2,.3,1.1,0x9a9a9a);},
 xebex(f,C,w,d){const K=0x1b1b1b,R=0x2b2b2b;C.lb(-w/2,-d/2,-w/2+.25,d/2,0,1.0,K);C.lb(w/2-.25,-d/2,w/2,d/2,0,1.0,K);
   for(let i=0;i<14;i++){const z0=-d/2+.35+i*(d-.9)/14,z1=z0+(d-.9)/14-.02,u=(i+.5)/14,y=.55+1.4*Math.pow(u-.55,2);C.lb(-w/2+.27,z0,w/2-.27,z1,y-.08,y,R);}
   C.lb(-w/2,d/2-.5,w/2,d/2-.2,0,.4,K);C.lb(-.12,d/2-.45,.12,d/2-.25,.4,4.3,K);C.lb(-.55,d/2-.6,.55,d/2-.2,4.3,4.75,0x333333);
   C.lb(-w/2+.05,d/2-2.6,-w/2+.18,d/2-.3,3.3,3.42,0x888888);C.lb(w/2-.18,d/2-2.6,w/2-.05,d/2-.3,3.3,3.42,0x888888);
   C.lb(-w/2+.05,d/2-.45,-w/2+.18,d/2-.3,1.0,3.42,0x888888);C.lb(w/2-.18,d/2-.45,w/2-.05,d/2-.3,1.0,3.42,0x888888);},
 skirow(f,C,w,d){const K=0x1a1a1a,A=0x9ea3a8;C.lb(-.18,-d/2,.18,d/2-1.6,.35,.55,A);C.lb(-w/2+.3,-d/2,w/2-.3,-d/2+.2,0,.35,K);
   C.lb(-.35,-d/2+3.0,.35,-d/2+3.9,.55,.75,K);C.lb(-.6,d/2-1.1,.6,d/2-.5,0,.3,K);
   C.mesh(new THREE.CylinderGeometry(.95,.95,.55,28),0x222222,1,{},m=>{m.rotation.z=Math.PI/2;m.position.set(0,1.25,d/2-1.25);});
   C.lb(-.2,d/2-1.7,.2,d/2-1.3,.3,7.0,K);C.lb(-.45,d/2-1.75,.45,d/2-1.4,6.6,6.9,K);C.lb(-.35,d/2-2.3,.35,d/2-1.8,.35,.5,K);},
 floorglute(f,C,w,d){const K=0x161616,R=0xb01c1c;C.lb(-w/2,-d/2,w/2,-d/2+.17,0,.25,K);C.lb(-w/2,d/2-.17,w/2,d/2,0,.25,K);C.lb(-w/2,-d/2,-w/2+.25,d/2,0,.2,K);
   C.lb(-w/2+.75,-d/2+.08,w/2-.05,d/2-.08,.4,.62,0x111111);C.lb(-w/2+.05,-d/2,-w/2+.25,d/2,.2,1.2,R);
   C.mesh(new THREE.CylinderGeometry(.16,.16,d-.35,18),0x111111,1,{},m=>{m.rotation.x=Math.PI/2;m.position.set(-w/2+.3,1.3,0);});
   C.mesh(new THREE.CylinderGeometry(.16,.16,d-.35,18),0x111111,1,{},m=>{m.rotation.x=Math.PI/2;m.position.set(-w/2+.55,.85,0);});},
 pendant(f,C,w,d){C.lb(-.02,-.02,.02,.02,f.h-.05,f.h+1.0,0x111111);C.mesh(new THREE.CylinderGeometry(.15,.45,.5,20),hex(f.c,'#c9a24a'),1,{metalness:.6,roughness:.3,emissive:0x553311},m=>m.position.y=f.h-.25);},
 lift(f,C,w,d){const c=hex(f.c,'#6a1b9a');[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>C.lb(a*w/2-(a>0?.6:0),b*d/2-(b>0?.6:0),a*w/2+(a<0?.6:0),b*d/2+(b<0?.6:0),0,f.h,c));
   C.lb(-w/2+.7,-d/2+.6,-w/2+2.5,d/2-.6,6.3,6.6,0x555a60);C.lb(w/2-2.5,-d/2+.6,w/2-.7,d/2-.6,6.3,6.6,0x555a60);C.lb(-w/2,-d/2,w/2,-d/2+.6,6.0,6.6,c);C.lb(-w/2,d/2-.6,w/2,d/2,6.0,6.6,c);},
 loft(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,0,f.h,0xb9a27e);C.lb(-w/2,d/2-.12,w/2,d/2,f.h,f.h+.9,0xf4f2ec);[[-w/2+.3,d/2-.3],[0,d/2-.3],[w/2-.3,d/2-.3],[-w/2+.3,-d/2+.3],[w/2-.3,-d/2+.3]].forEach(([x,y])=>C.lb(x-.3,y-.3,x+.3,y+.3,f.h,4.4,0xf4f2ec));},
 gofficeloft(f,C,w,d){const c=0xd8dde6;C.lb(-w/2,d/2-.3,w/2-3.2,d/2,0,f.h,c,.55);C.lb(w/2-.3,-d/2,w/2,d/2,0,f.h,c,.55);C.lb(w/2-3.2,d/2-.15,w/2-.3,d/2-.1,0,6.8,0x9fc6e0,.45);},
 target(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,0,f.h,0xe0c36a);},
 tv(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,0,f.h,0x0b0b0c);}, soundbar(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,0,f.h,0x1a1a1a);},
 console(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,.3,f.h,0xf5f5f3);C.lb(-w/2+.2,-d/2+.2,-w/2+.35,d/2-.2,0,.3,0x222222);C.lb(w/2-.35,-d/2+.2,w/2-.2,d/2-.2,0,.3,0x222222);},
 art(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,0,f.h,0x2a1d15);C.lb(w/2,-d/2+.3,w/2+.02,d/2-.3,.3,f.h-.3,0xcfd8e0);},
 bench(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,1.35,1.7,0x101010);legs4(C,w,d,.12,1.35,0x101010,.08);},
 ottoman(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,.9,f.h,0x2b2420);legs4(C,w,d,.1,.9,0x111111,.05);C.lb(-w/2,-d/2,w/2,d/2,.15,.2,0x111111);},
 chair(f,C,w,d){const c=0x141414;C.lb(-w/2,-d/2,w/2,d/2,.4,1.45,c);C.lb(-w/2,d/2-.75,w/2,d/2,1.45,f.h,c);C.lb(-w/2,-d/2,-w/2+.55,d/2,1.45,2.2,c);C.lb(w/2-.55,-d/2,w/2,d/2,1.45,2.2,c);C.lb(-w/2+.55,-d/2+.1,w/2-.55,d/2-.75,1.45,1.75,0x262626);C.lb(-w/2+.1,-d/2+.1,w/2-.1,d/2-.1,0,.4,0x2a1c12);},
 sectional(f,C,w,d){const c=0x9a9b9d,cs=0xadaeb0,X0=-w/2,Y0=-d/2,dep=3.33;C.lb(X0,Y0,X0+w,Y0+dep,0,1.5,c);C.lb(X0,Y0,X0+w,Y0+.85,1.5,2.8,c);C.lb(X0,Y0+dep,X0+dep,Y0+d,0,1.5,c);C.lb(X0,Y0,X0+.85,Y0+d,1.5,2.8,c);
   C.lb(X0+w-2.9,Y0+dep,X0+w,Y0+5.45,0,1.5,cs);C.lb(X0+w-.6,Y0,X0+w,Y0+5.45,1.5,2.1,c);C.lb(X0+.85,Y0+d-.6,X0+dep,Y0+d,1.5,2.1,c);for(let i=0;i<4;i++)C.lb(X0+.95+i*2.6,Y0+.9,X0+3.4+i*2.6,Y0+dep-.1,1.5,1.75,cs);},
 massage(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,0,.6,0x2b2b2b);C.lb(-w/2+.35,-d/2+.6,w/2-.35,d/2-.4,.6,1.6,0x3a3a3a);C.lb(-w/2,d/2-1.3,w/2,d/2-.1,1.2,f.h,0x1d1d1d);C.lb(-w/2,-d/2+.5,-w/2+.45,d/2-.4,.6,2.4,0x8f9399);C.lb(w/2-.45,-d/2+.5,w/2,d/2-.4,.6,2.4,0x8f9399);},
 glassdesk(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,2.42,2.5,0xbfe3ea,.45);legs4(C,w,d,.08,2.42,0x111111,.05);C.lb(-.1,-1.0,.1,1.0,2.5,3.9,0x111111);},
 standdesk(f,C,w,d){const top=3.55;C.lb(-w/2,-d/2,w/2,d/2,top-.1,top,0x8a6a45);[-w/2+.5,w/2-.5].forEach(x=>{C.lb(x-.12,-.12,x+.12,.12,0,top-.1,0x202020);C.lb(x-.12,-d/2+.15,x+.12,d/2-.15,0,.1,0x202020);});
   C.lb(-1.2,d/2-.35,1.2,d/2-.25,top+.6,top+1.9,0x0b0b0c);C.lb(-.08,d/2-.4,.08,d/2-.2,top,top+.7,0x202020);C.lb(-w/2-.2,-d/2-2.2,-w/2+.6,-d/2-1.4,0,2.3,0x3a3a3a);},
 partition(f,C,w,d){const h=f.h,oak=0xc9a777,pan=0xf2efe8;const L_=Math.max(w,d),alongX=w>=d;const n=Math.max(1,Math.round(L_/2.6));
   for(let i=0;i<=n;i++){const t=-L_/2+i*L_/n;alongX?C.lb(t-.06,-.12,t+.06,.12,0,h,oak):C.lb(-.12,t-.06,.12,t+.06,0,h,oak);
     alongX?C.lb(t-.06,-.5,t+.06,.5,0,.06,oak):C.lb(-.5,t-.06,.5,t+.06,0,.06,oak);}
   alongX?C.lb(-L_/2,-.06,L_/2,.06,.3,h-.15,pan):C.lb(-.06,-L_/2,.06,L_/2,.3,h-.15,pan);
   alongX?C.lb(-L_/2,-.08,L_/2,.08,h-.12,h,oak):C.lb(-.08,-L_/2,.08,L_/2,h-.12,h,oak);},
 officechair(f,C,w,d){const c=f.c?hex(f.c):0x4a4d52;C.lb(-w/2,-d/2,w/2,d/2,0,.25,0x222222);C.lb(-.1,-.1,.1,.1,.25,1.4,0x333333);C.lb(-w/2+.1,-d/2+.1,w/2-.1,d/2-.1,1.4,1.7,c);C.lb(-w/2+.15,-d/2+.1,-w/2+.35,d/2-.1,1.7,f.h,c);},
 bed(f,C,w,d){const c=hex(f.c);C.lb(-w/2,-d/2,w/2,d/2,0,1.1,c);C.lb(-w/2+.25,-d/2+.4,w/2-.25,d/2-.2,1.1,2.0,0xf2f2f2);C.lb(-w/2,-d/2,w/2,-d/2+.4,0,f.h,c);C.lb(-w/2+.5,-d/2+.5,w/2-.5,-d/2+1.6,2.0,2.35,0xffffff);},
 kdesk(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,2.35,2.5,0xf7f7f7);C.lb(-w/2,-d/2,-w/2+1.3,d/2,0,2.35,0xf0f0f0);C.lb(w/2-.12,-d/2,w/2,d/2,0,2.35,0xf0f0f0);C.lb(-w/2,d/2-.9,w/2,d/2,3.6,3.72,0xf7f7f7);},
 gofficed(f,C,w,d){C.lb(-w/2,-d/2,w/2,-d/2+2.5,0,2.5,0xd8dde6);},
 car(f,C,w,d){if(/911|porsche/i.test(f.name||'')||f.id==='porsche')return BUILD.p911(f,C,w,d);if(f.id==='modely')return BUILD.modely(f,C,w,d);if(f.id==='xt5')return BUILD.xt5(f,C,w,d);const c=hex(f.c),low=/911|porsche/i.test(f.name),hb=low?3.3:4.6,hBody=low?1.9:2.5;
   C.lb(-w/2+.1,-d/2+.3,w/2-.1,d/2-.3,.55,hBody,c);C.lb(-w/2+.4,-d/2+(low?4.6:3.6),w/2-.4,d/2-(low?3.4:3.0),hBody,Math.min(f.h,hb+.2),0x1d2630);
   C.lb(-w/2+.45,-d/2+(low?4.8:3.8),w/2-.45,d/2-(low?3.6:3.2),Math.min(f.h,hb+.2),Math.min(f.h,hb+.28),c);
   [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>C.mesh(new THREE.CylinderGeometry(1.05,1.05,.75,20),0x111111,1,{},m=>{m.rotation.z=Math.PI/2;m.position.set(a*(w/2-.3),1.05,b*(d/2-3.0));}));
   C.lb(-w/2+.5,-d/2+.25,-w/2+1.3,-d/2+.32,1.6,2.0,0xf5f5f5);C.lb(w/2-1.3,-d/2+.25,w/2-.5,-d/2+.32,1.6,2.0,0xf5f5f5);C.lb(-w/2+.4,d/2-.32,w/2-.4,d/2-.25,1.7,2.0,0xb3261e);},
 p911(f,C,w,d){const MB=0x070708, MATTE={roughness:1,metalness:0}, y0=-d/2;
   const pr=[[0,.5],[0,1.45],[.5,1.85],[3.9,2.3],[5.9,3.95],[7.7,4.05],[10.6,3.0],[d-.7,2.35],[d,2.05],[d,.5]];
   const sh=new THREE.Shape();pr.forEach(([u,v],i)=>i?sh.lineTo(y0+u,v):sh.moveTo(y0+u,v));
   C.mesh(new THREE.ExtrudeGeometry(sh,{depth:w-.2,bevelEnabled:false}),MB,1,MATTE,m=>{m.rotation.y=-Math.PI/2;m.position.x=(w-.2)/2;});
   const gl=0x0b1118; C.lb(-w/2+.05,y0+6.0,-w/2+.12,y0+9.6,3.0,3.8,gl);C.lb(w/2-.12,y0+6.0,w/2-.05,y0+9.6,3.0,3.8,gl);
   C.lb(-w/2+.6,y0+4.2,w/2-.6,y0+4.4,2.45,3.7,gl);
   C.lb(-w/2+.35,d/2-.55,w/2-.35,d/2-.1,2.35,2.6,MB);C.lb(-w/2+.3,d/2-.08,w/2-.3,d/2-.02,1.55,1.75,0xb3261e);
   C.lb(-w/2+.45,y0+.02,-w/2+1.15,y0+.1,1.35,1.7,0xf5f5f5);C.lb(w/2-1.15,y0+.02,w/2-.45,y0+.1,1.35,1.7,0xf5f5f5);
   [[-1,y0+2.7],[1,y0+2.7],[-1,d/2-2.9],[1,d/2-2.9]].forEach(([a,y])=>C.mesh(new THREE.CylinderGeometry(1.08,1.08,.8,22),0x111111,1,{roughness:.9},m=>{m.rotation.z=Math.PI/2;m.position.set(a*(w/2-.3),1.08,y);}));},
 sprinter(f,C,w,d){const S=0xc4c8cd, MET={metalness:.55,roughness:.38}, T=0x1a1a1a, G=0x121a22, y0=-d/2, H=f.h;
   const box=(x0,ya,x1,yb,z0,z1,c,ex)=>C.mesh(new THREE.BoxGeometry(x1-x0,z1-z0,yb-ya),c,1,ex||MET,m=>m.position.set((x0+x1)/2,(z0+z1)/2,(ya+yb)/2));
   // hood + front clip (nose toward the back wall, -y)
   box(-w/2+.25,y0+.35,w/2-.25,y0+3.1,1.2,4.05,S);box(-w/2+.15,y0,w/2-.15,y0+.4,.95,2.15,T,{roughness:.8});
   box(-w/2+.9,y0-.02,w/2-.9,y0+.36,2.25,3.55,0x0d0d0d,{roughness:.6});
   C.lb(-w/2+.35,y0-.03,-w/2+1.0,y0+.05,3.15,3.6,0xf2f2f2);C.lb(w/2-1.0,y0-.03,w/2-.35,y0+.05,3.15,3.6,0xf2f2f2);
   // raked windshield
   C.mesh(new THREE.BoxGeometry(w-.5,3.45,.12),G,1,{roughness:.15,metalness:.3},m=>{m.position.set(0,5.65,y0+3.55);m.rotation.x=0.42;});
   // high-roof body
   box(-w/2,y0+3.1,w/2,d/2,2.0,4.1,S);box(-w/2,y0+4.35,w/2,d/2,4.1,H-.12,S);box(-w/2+.12,y0+4.35,w/2-.12,d/2-.05,H-.12,H,S);
   box(-w/2+.4,y0+3.35,w/2-.4,y0+4.4,7.2,H-.12,S);
   // black lower trim / rocker + rear bumper
   box(-w/2-.02,y0+.4,w/2+.02,d/2-.3,.95,2.9,T,{roughness:.85});box(-w/2,d/2-.3,w/2,d/2+.12,.9,1.95,T,{roughness:.85});
   // windows: cab doors, sliding-door glass, rear doors
   [-1,1].forEach(a=>{const x=a*(w/2+.015);
     C.lb(x-.04,y0+4.4,x+.04,y0+7.0,4.5,6.9,G);C.lb(x-.04,y0+11.0,x+.04,y0+14.0,4.7,6.9,G);
     C.lb(x-.03,y0+7.15,x+.03,y0+7.22,2.0,8.3,0x8e939a);
     // mirrors (stick out past the 6'7" body)
     C.lb(a>0?w/2+.05:-w/2-.75,y0+4.35,a>0?w/2+.75:-w/2-.05,y0+4.6,5.2,6.4,T);});
   C.lb(-w/2+.3,d/2+.01,-.07,d/2+.05,4.85,7.9,G);C.lb(.07,d/2+.01,w/2-.3,d/2+.05,4.85,7.9,G);C.lb(-.04,d/2,.04,d/2+.06,2.0,H-.4,0x8e939a);
   [-1,1].forEach(a=>{const xa=a<0?-w/2-.02:w/2-.36,xb=a<0?-w/2+.36:w/2+.02;C.lb(xa,d/2-.3,xb,d/2+.07,3.3,4.8,0xc1121f);C.lb(xa,d/2-.3,xb,d/2+.07,2.75,3.3,0xd9d9d6);});C.lb(-w/2-.05,d/2-.1,w/2+.05,d/2+.4,1.0,1.75,T,{roughness:.85});C.lb(-.9,d/2+.3,.9,d/2+.75,1.0,1.2,0x2a2a2a);C.lb(-1.95,d/2+.04,-1.0,d/2+.08,2.0,2.5,0xf2f2ef);C.lb(.55,d/2+.04,1.1,d/2+.09,3.85,4.0,T);C.lb(-.4,d/2-.05,.4,d/2+.06,H-.35,H-.2,0xc1121f);const DT=(txt,cw,ch,font)=>{const cv=document.createElement('canvas');cv.width=cw;cv.height=ch;const g=cv.getContext('2d');g.fillStyle='#d8dbe0';g.font=font;g.textAlign='center';g.textBaseline='middle';g.fillText(txt,cw/2,ch/2);const tx=new THREE.CanvasTexture(cv);tx.encoding=THREE.sRGBEncoding;tx.anisotropy=8;return tx;};const DC=(tx,x,z,pw,ph,col)=>{const mm=new THREE.MeshStandardMaterial({map:tx,transparent:true,roughness:.35,metalness:.6,color:col||0xffffff,clippingPlanes:[clipG]});const m=new THREE.Mesh(new THREE.PlaneGeometry(pw,ph),mm);m.position.set(x,z,d/2+.07);C.raw(m);};DC(DT('AIRSTREAM',1024,128,'bold 96px Arial'),-2.35,4.05,1.45,.18);DC(DT('INTERSTATE X',1024,128,'bold italic 96px Arial'),2.3,4.1,1.6,.2,0x1a1a1a);DC(DT('4WD',256,128,'bold 90px Arial'),2.75,3.9,.3,.15,0x1a1a1a);C.mesh(new THREE.CylinderGeometry(.22,.22,.05,28),0xc9ccd0,1,{metalness:.9,roughness:.2},m=>{m.rotation.x=Math.PI/2;m.position.set(0,4.45,d/2+.08);});
   // roof: A/C pod + solar panel
   [-1,1].forEach(a=>C.lb(a*(w/2-.25)-.08,y0+4.6,a*(w/2-.25)+.08,d/2-.4,H+.05,H+.42,0x121212));for(let yy=y0+4.8;yy<d/2-.5;yy+=1.6)C.lb(-w/2+.25,yy-.06,w/2-.25,yy+.06,H+.3,H+.4,0x121212);C.lb(-1.35,d/2-3.6,1.35,d/2-.9,H,H+.85,0x1b1b1b);C.lb(-w/2+.5,y0+5.2,w/2-.5,y0+11.0,H+.1,H+.2,0x0d2240);C.lb(-1.6,y0+4.3,1.6,y0+4.6,H+.1,H+.45,0x0f0f0f);C.lb(-1.5,y0+4.25,1.5,y0+4.3,H+.15,H+.4,0xf4f6ff);
   // wheels: front axle near the nose, dual rear
   [[y0+2.75,1],[d/2-6.3,1]].forEach(([y])=>[-1,1].forEach(a=>C.mesh(new THREE.CylinderGeometry(1.25,1.25,.75,22),0x111111,1,{roughness:.9},m=>{m.rotation.z=Math.PI/2;m.position.set(a*(w/2-.28),1.25,y);})));},
 franklinbat(f,C,w,d){// FranklinWH aPower 2 style: slim white floor-standing unit, dark side band, LED bar
   const W=0xf1f2f2; C.lb(-w/2,-d/2,w/2,d/2,0,.25,0x6b6f74);C.mesh(new THREE.BoxGeometry(w,f.h-.25,d),W,1,{roughness:.45,metalness:.05},m=>m.position.set(0,.25+(f.h-.25)/2,0));
   C.lb(w/2,-d/2,w/2+.02,-d/2+.3,.35,f.h-.05,0x3a3e44);C.lb(w/2,-.55,w/2+.02,.55,f.h-.95,f.h-.86,0x41b6e6);
   C.lb(w/2,d/2-.55,w/2+.02,d/2-.25,f.h-.6,f.h-.3,0x9aa0a6);},
 franklingate(f,C,w,d){// FranklinWH aGate style: wall-mounted white smart panel with a dark display strip
   C.mesh(new THREE.BoxGeometry(w,f.h,d),0xf1f2f2,1,{roughness:.45},m=>m.position.set(0,f.h/2,0));
   C.lb(w/2,-d/2+.25,w/2+.02,d/2-.25,f.h-.9,f.h-.55,0x2b2e33);C.lb(w/2+.02,-.25,w/2+.04,.25,f.h-.75,f.h-.68,0x41b6e6);},
 airstream(f,C,w,d){const sil=0xc9ccd2,body=d-w,hb=f.h-1.0;
   C.mesh(new THREE.CylinderGeometry(w/2,w/2,body,28,1,true),sil,1,{metalness:.55,roughness:.35},m=>{m.rotation.x=Math.PI/2;m.scale.set(1,1,hb/w);m.position.set(0,1.0+hb/2,0);});
   [-1,1].forEach(s=>C.mesh(new THREE.SphereGeometry(w/2,24,16),sil,1,{metalness:.55,roughness:.35},m=>{m.scale.set(1,hb/w,1);m.position.set(0,1.0+hb/2,s*body/2);}));
   C.lb(-w/2+.2,-1.4,-w/2+.25,1.4,0,2.2,0x111111);C.lb(w/2-.25,-1.4,w/2-.2,1.4,0,2.2,0x111111);
   [-1,1].forEach(a=>C.mesh(new THREE.CylinderGeometry(1.25,1.25,.8,20),0x111111,1,{},m=>{m.rotation.z=Math.PI/2;m.position.set(a*(w/2-.25),1.25,1.5);}));
   C.lb(-w/2+.6,d/2-3.2,w/2-.6,d/2-1.0,4.0,5.4,0x1d2630);},
 suvp(f,C,w,d,P,col,o){const L0=P[P.length-1][0],s=d/L0,y0=-d/2,Y=u=>y0+u*s,MAT=o.mat||{metalness:.5,roughness:.3},G=0x0c1117,GM={metalness:.6,roughness:.08};
   const sh=new THREE.Shape();P.forEach(([u,v],i)=>i?sh.lineTo(Y(u),v):sh.moveTo(Y(u),v));
   C.mesh(new THREE.ExtrudeGeometry(sh,{depth:w-.5,bevelEnabled:true,bevelSize:.13,bevelThickness:.12,bevelSegments:3}),col,1,MAT,m=>{m.rotation.y=-Math.PI/2;m.position.x=(w-.5)/2;});
   const gs=new THREE.Shape();o.side.forEach(([u,v],i)=>i?gs.lineTo(Y(u),v):gs.moveTo(Y(u),v));
   [-1,1].forEach(a=>C.mesh(new THREE.ExtrudeGeometry(gs,{depth:.05,bevelEnabled:false}),G,1,GM,m=>{m.rotation.y=-Math.PI/2;m.position.x=a>0?(w-.5)/2+.15:-(w-.5)/2-.1;}));
   const slab=(ua,va,ub,vb,ins,c,ex)=>{const ya=Y(ua),yb=Y(ub),L=Math.hypot(yb-ya,vb-va),an=Math.atan2(vb-va,yb-ya);
     C.mesh(new THREE.BoxGeometry(w-2*ins,.05,L),c,1,ex||GM,m=>{m.rotation.x=-an;m.position.set(0,(va+vb)/2+Math.cos(an)*.09,(ya+yb)/2-Math.sin(an)*.09);});};
   o.glass.forEach(g=>slab(...g,.55,G));
   (o.wheels||[]).forEach(([u,r])=>[-1,1].forEach(a=>{C.mesh(new THREE.CylinderGeometry(r,r,.78,28),0x111111,1,{roughness:.9},m=>{m.rotation.z=Math.PI/2;m.position.set(a*(w/2-.42),r,Y(u));});
     C.mesh(new THREE.CylinderGeometry(r*.66,r*.66,.8,24),o.rim||0x9a9ea3,1,{metalness:.8,roughness:.3},m=>{m.rotation.z=Math.PI/2;m.position.set(a*(w/2-.41),r,Y(u));});}));
   [-1,1].forEach(a=>C.lb(a>0?w/2-.1:-w/2-.4,Y(o.mir[0]),a>0?w/2+.4:-w/2+.1,Y(o.mir[0])+.35,o.mir[1],o.mir[1]+.45,col));
   (o.lights||[]).forEach(L=>C.lb(...L));},
 modely(f,C,w,d){BUILD.suvp(f,C,w,d,[[0,.55],[0,1.95],[.35,2.4],[3.3,2.95],[7.3,5.3],[10.6,5.25],[13.8,4.5],[15.3,3.5],[15.7,2.9],[15.7,.55]],0xf3f4f5,
   {mat:{metalness:.25,roughness:.25},side:[[3.7,3.2],[7.15,5.08],[10.5,5.05],[13.2,4.45],[13.5,3.3]],glass:[[3.3,2.95,7.3,5.3],[7.3,5.3,10.6,5.25],[10.6,5.25,13.8,4.5]],wheels:[[3.1,1.05],[12.7,1.05]],rim:0x3a3d42,mir:[4.2,3.3],
    lights:[[-w/2+.25,d/2-.1,-w/2+1.5,d/2+.08,3.05,3.45,0xb3101b],[w/2-1.5,d/2-.1,w/2-.25,d/2+.08,3.05,3.45,0xb3101b],[-w/2+.3,-d/2-.05,-w/2+1.4,-d/2+.2,2.3,2.55,0xeef2f5],[w/2-1.4,-d/2-.05,w/2-.3,-d/2+.2,2.3,2.55,0xeef2f5],[-.55,d/2-.05,.55,d/2+.1,1.6,2.1,0xf7f7f2]]});},
 xt5(f,C,w,d){const K=0x0b0b0c;BUILD.suvp(f,C,w,d,[[0,.65],[0,2.3],[.3,2.95],[3.3,3.35],[6.1,5.25],[6.6,5.5],[13.7,5.45],[15.6,4.95],[16.1,3.6],[16.3,2.5],[16.3,.65]],K,
   {mat:{metalness:.6,roughness:.18},side:[[3.6,3.5],[6.0,5.12],[13.5,5.25],[15.3,4.8],[15.6,3.6]],glass:[[3.3,3.35,6.1,5.25],[15.6,4.95,16.1,3.6]],wheels:[[3.2,1.2],[12.6,1.2]],rim:0xc4c8cc,mir:[4.0,3.6],
    lights:[[-1.7,-d/2-.06,1.7,-d/2+.05,1.5,2.75,0xb9bdc2],[-w/2+.2,d/2-.25,-w/2+.5,d/2+.06,2.4,4.3,0xb3101b],[w/2-.5,d/2-.25,w/2-.2,d/2+.06,2.4,4.3,0xb3101b],[-w/2+.25,-d/2-.04,-w/2+1.2,-d/2+.2,2.6,2.85,0xeef2f5],[w/2-1.2,-d/2-.04,w/2-.25,-d/2+.2,2.6,2.85,0xeef2f5],[-.55,d/2-.04,.55,d/2+.1,2.1,2.6,0xf7f7f2],[-w/2+.6,d/2-.06,w/2-.6,d/2+.08,2.75,2.85,0xb9bdc2]]});},
 peloton(f,C,w,d){const K=0x1c1c1c,R=0xc8102e;C.lb(-w/2+.25,-d/2,w/2-.25,-d/2+.35,0,.15,K);C.lb(-w/2+.25,d/2-.35,w/2-.25,d/2,0,.15,K);C.lb(-.12,-d/2+.2,.12,d/2-.2,.1,.35,K);
   C.mesh(new THREE.CylinderGeometry(.75,.75,.22,28),0x2a2a2a,1,{metalness:.5,roughness:.35},m=>{m.rotation.z=Math.PI/2;m.position.set(0,1.1,-d/2+1.0);});
   C.lb(-.12,-d/2+.5,.12,-d/2+.8,.3,3.4,K);C.lb(-.55,-d/2+.55,.55,-d/2+.85,3.35,3.5,K);C.lb(-.85,-d/2+.3,.85,-d/2+.38,3.6,4.55,0x0b0b0c);C.lb(-.8,-d/2+.38,.8,-d/2+.4,3.65,4.5,0x2a3f55);
   C.lb(-.1,d/2-1.35,.1,d/2-1.15,.3,2.9,K);C.lb(-.28,d/2-1.55,.28,d/2-.85,2.9,3.05,K);C.lb(-.07,-d/2+.8,.07,d/2-1.2,1.45,1.6,R);},
 abike(f,C,w,d){const K=0x1a1a1a;C.lb(-w/2,-d/2,w/2,-d/2+.3,0,.2,K);C.lb(-w/2,d/2-.3,w/2,d/2,0,.2,K);C.lb(-.1,-d/2,.1,d/2,.15,.4,K);
   C.mesh(new THREE.CylinderGeometry(1.05,1.05,.55,32),0x2b2b2b,1,{metalness:.3,roughness:.5},m=>{m.rotation.z=Math.PI/2;m.position.set(0,1.45,-d/2+1.15);});
   C.lb(-.12,-d/2+1.6,.12,-d/2+1.85,.3,3.0,K);[-1,1].forEach(a=>C.lb(a*.45-.05,-d/2+1.2,a*.45+.05,-d/2+1.5,2.2,4.3,K));
   C.lb(-.1,d/2-1.3,.1,d/2-1.1,.3,3.1,K);C.lb(-.35,d/2-1.55,.35,d/2-.8,3.1,3.25,K);C.lb(-.3,-d/2+1.9,.3,-d/2+2.1,3.0,3.5,0x333333);},
 gcab(f,C,w,d){const G=0x5d626a,S=0xb5b9be,n=Math.max(2,Math.round(w/2.2));C.lb(-w/2,-d/2,w/2,d/2,0,.3,0x2b2b2b);C.lb(-w/2,-d/2,w/2,d/2-.05,.3,3.0,G);
   for(let i=1;i<n;i++){const x=-w/2+i*w/n;C.lb(x-.02,d/2-.07,x+.02,d/2-.02,.35,2.95,0x3c4046);C.lb(x-.02,-d/2+1.1,x+.02,-d/2+1.2,5.05,f.h-.05,0x3c4046);}
   for(let i=0;i<n;i++){const x=-w/2+(i+.5)*w/n;C.lb(x-.35,d/2-.04,x+.35,d/2,2.6,2.66,S);C.lb(x-.3,-d/2+1.15,x+.3,-d/2+1.2,5.2,5.26,S);}
   C.lb(-w/2,-d/2,w/2,d/2+.05,3.0,3.15,0x9a7b55);C.lb(-w/2,-d/2,w/2,-d/2+.08,3.15,5.0,0x9ea3a8);C.lb(-w/2,-d/2,w/2,-d/2+1.15,5.0,f.h,G);
   C.lb(-w/2+.2,-d/2+.85,w/2-.2,-d/2+1.12,4.92,5.0,0xfff3d0);},
 dbrack(f,C,w,d){const K=0x1b1b1b;[-w/2+.1,w/2-.1].forEach(x=>C.lb(x-.08,-d/2,x+.08,d/2,0,2.6,K));C.lb(-w/2,-d/2+.1,w/2,-d/2+.9,1.2,1.3,K);C.lb(-w/2,0,w/2,d/2-.1,2.0,2.1,K);
   const n=Math.floor((w-.4)/.55);for(let i=0;i<n;i++){const x=-w/2+.35+i*.55;[[-d/2+.5,1.3,.22],[d/2-.55,2.1,.24]].forEach(([y,z,r])=>C.mesh(new THREE.CylinderGeometry(r,r,.5,6),0x151515,1,{},m=>{m.position.set(x,z+r,y);}));}},
 plates(f,C,w,d){const K=0x1b1b1b;C.lb(-w/2,-d/2,w/2,d/2,0,.15,K);[-w/2+.6,w/2-.6].forEach(x=>{for(let k=0;k<5;k++)C.mesh(new THREE.CylinderGeometry(.74,.74,.12,30),0x111111,1,{},m=>{m.rotation.z=Math.PI/2;m.position.set(x+(k-2)*.16,.78,0);});});C.lb(-.06,-.06,.06,.06,0,1.8,K);},
 bartree(f,C,w,d){const K=0x1b1b1b;C.lb(-w/2+.2,-d/2+.2,w/2-.2,d/2-.2,0,.12,K);C.lb(-.12,-.12,.12,.12,0,1.0,K);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;C.mesh(new THREE.CylinderGeometry(.05,.05,7.2,10),0xb8bcc2,1,{metalness:.8,roughness:.3},m=>m.position.set(Math.cos(a)*.3,3.7,Math.sin(a)*.3));}},
 gbench(f,C,w,d){[-d/2+.5,d/2-.5].forEach(y=>{C.lb(-w/2+.2,y-.42,w/2-.2,y+.42,1.2,1.45,0x121212);C.lb(-w/2+.5,y-.1,w/2-.5,y+.1,.15,1.2,0x2a2a2a);C.lb(-w/2+.3,y-.45,-w/2+.6,y+.45,0,.15,0x2a2a2a);C.lb(w/2-.6,y-.45,w/2-.3,y+.45,0,.15,0x2a2a2a);});},
 plyo(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,0,2.5,0xc7a473);C.lb(-w/2+.15,d/2,w/2-.15,d/2+.01,.6,1.9,0xa8875a);C.mesh(new THREE.SphereGeometry(.45,20,14),0x151515,1,{},m=>m.position.set(-w/2+.5,2.95,0));C.mesh(new THREE.SphereGeometry(.4,20,14),0x151515,1,{},m=>m.position.set(w/2-.5,2.9,0));},
 ghd(f,C,w,d){const K=0x1a1a1a,L=w>=d,a=L?w:d,B=(u0,v0,u1,v1,z0,z1,c)=>L?C.lb(u0,v0,u1,v1,z0,z1,c):C.lb(v0,u0,v1,u1,z0,z1,c);
   B(-a/2,-1.2,a/2,-1.0,0,.25,K);B(-a/2,1.0,a/2,1.2,0,.25,K);B(-a/2+.8,-.15,a/2-1.6,.15,.2,3.2,K);B(-a/2+.6,-.6,-a/2+2.6,.6,3.2,3.55,0x111111);B(a/2-1.4,-.12,a/2-1.1,.12,.2,3.0,K);B(a/2-1.5,-.7,a/2-.9,.7,2.6,2.8,0x9ea3a8);B(a/2-1.5,-.65,a/2-1.1,.65,3.0,3.35,0x111111);},
 srack(f,C,w,d){const K=0x1b1b1b;C.lb(-w/2,-d/2,w/2,d/2,0,.1,K);[-d/2+.05,d/2-.05].forEach(y=>C.lb(-w/2,y-.05,w/2,y+.05,0,5.5,K));[1.0,2.4,3.8,5.2].forEach(z=>C.lb(-w/2,-d/2,w/2,d/2,z,z+.06,K));
   [[0x2b6cb0,1.3],[0x111111,2.7],[0x8b1e2b,4.1]].forEach(([c,z],i)=>C.mesh(new THREE.CylinderGeometry(.25,.25,d-.3,16),c,1,{},m=>{m.rotation.x=Math.PI/2;m.position.set(0,z+.25,0);}));},
 boat(f,C,w,d){const L=Math.max(w,d),Wd=Math.min(w,d),kay=/kayak/i.test(f.name||''),hh=kay?.95:.38,c=hex(f.c);
   C.mesh(new THREE.SphereGeometry(.5,32,16,0,Math.PI*2,0,Math.PI/2),c,1,{roughness:.35,metalness:.05},m=>{m.scale.set(w>=d?L:Wd,hh*2,w>=d?Wd:L);m.position.y=.05;});
   C.mesh(new THREE.SphereGeometry(.5,32,8,0,Math.PI*2,Math.PI/2,Math.PI/2),kay?0x222222:0xf2f2f2,1,{roughness:.5},m=>{m.scale.set(w>=d?L:Wd,.12,w>=d?Wd:L);m.position.y=.06;});
   if(kay)C.mesh(new THREE.CylinderGeometry(.5,.5,.1,24),0x111111,1,{},m=>{m.scale.set(w>=d?2.6:1.3,1,w>=d?1.3:2.6);m.position.y=hh+.02;});
   else C.lb(-.6,-.6,.6,.6,hh,hh+.03,0x333333);},
 ring(f,C,w,d){C.mesh(new THREE.TorusGeometry(.38,.07,12,28),0xc8a26a,1,{roughness:.6},m=>{m.position.y=.4;});},
 kallax(f,C,w,d){const W2=0xf3f1ea,L=w>=d,a=L?w:d,b=L?d:w,h=f.h,n=Math.max(1,Math.round(a/1.2)),m=Math.max(1,Math.round(h/1.2));const B=(u0,v0,u1,v1,z0,z1,c)=>L?C.lb(u0,v0,u1,v1,z0,z1,c):C.lb(v0,u0,v1,u1,z0,z1,c);
   for(let i=0;i<=n;i++){const u=-a/2+i*a/n;B(u-.06,-b/2,u+.06,b/2,0,h,W2);}for(let j=0;j<=m;j++){const z=j*h/m;B(-a/2,-b/2,a/2,b/2,Math.max(0,z-.06),Math.min(h,z+.06),W2);}
   for(let i=0;i<n;i++)for(let j=0;j<m;j++)if((i+j)%3===0){const u=-a/2+(i+.5)*a/n,z=j*h/m;B(u-.48,-b/2+.1,u+.48,b/2-.1,z+.07,z+.95,[0x9a8f80,0x3b3b3b,0xd9d4c8][(i*7+j)%3]);}},
 gdesk(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,2.42,2.52,0xe8e4dc);legs4(C,w,d,.12,2.42,0x2a2a2a,.06);C.lb(-.12,-1.0,.12,1.0,2.52,2.6,0x222222);C.lb(-.06,-1.1,.02,1.1,2.9,4.1,0x0b0b0c);C.lb(-.12,-.1,.0,.1,2.52,2.9,0x222222);},
 wconn(f,C,w,d){C.lb(-w/2,-d/2,w/2,d/2,3.6,4.8,0xf4f4f4);C.lb(-w/2+.1,-d/2-.01,w/2-.1,-d/2+.02,3.75,4.65,0x1a1a1a);},
 piano(f,C,w,d){const pts=[[0,0],[4.83,0],[4.83,1.7],[4.62,2.9],[3.95,3.8],[3.1,4.55],[2.65,5.35],[2.4,6.15],[1.9,6.72],[1.0,6.92],[0.3,6.85],[0,6.6]];
   const sh=new THREE.Shape();pts.forEach(([u,v],i)=>{const x=w/2-u,y=-d/2+v;i?sh.lineTo(x,-y):sh.moveTo(x,-y);});
   C.mesh(new THREE.ExtrudeGeometry(sh,{depth:1.05,bevelEnabled:false}),0x07070a,1,{roughness:.25,metalness:.1},m=>{m.rotation.x=-Math.PI/2;m.position.y=2.05;});
   C.lb(-w/2,-d/2-.05,w/2,-d/2+1.0,2.35,2.55,0xf3f0e6);C.lb(-w/2,-d/2-.05,w/2,-d/2+.15,2.0,2.62,0x07070a);
   [[w/2-.4,-d/2+.6],[-w/2+.6,-d/2+.6],[w/2-1.0,d/2-.6]].forEach(([x,y])=>C.lb(x-.18,y-.18,x+.18,y+.18,0,2.05,0x07070a));}
};
function classify(f){const n=f.name||'',id=f.id||'';
  if(/^(apw|agate|genmod|esszone|pvstub|geninlet)/.test(id)||/franklin|battery|generator|solar/i.test(n))return'power';
  if(['car','airstream','sprinter','lift'].includes(f.kind)||id==='wallconn')return'vehicles';
  if(f.lv==='garage'){ if(id==='loft'||id==='cab'||/fixed/i.test(n)&&/loft|cabinet|workbench/i.test(n))return'structure';
    if(/^(goffice|gdesk|gchair|sdesk)/.test(id)||/office|desk|task chair/i.test(n))return'furniture'; return'gym';}
  if(f.lv==='site')return'outdoor'; return'furniture';}
// Garage = the site overhaul's garage-fit plan v3 (39'6" x 49'11"), snapped to the Cubicasa openings
// (W2 window y 7.6-11.5, W1 window y 23.4-27.3, man door y 40.4-43.9, house door y 24-27, stair x>-4.75 y 2-13.5).
// Model axes: x = south(-39.5) .. house wall(-0.5); y = back wall(-4.44) .. door wall(45.5).
const GFIT={
 cab:[-36.1,-4.44,-24.4,-2.3,'Existing gray cabinets + lit workbench (back wall, rear left, fixed; position per the Cubicasa plan)'],
 dbrack:[-24.0,-3.9,-19.6,-2.0], plates:[-19.3,-3.9,-15.5,-2.0], bartree:[-15.2,-3.9,-13.3,-2.0], plyo:[-13.0,-3.9,-10.6,-2.0], bench:[-10.3,-4.1,-5.6,-2.3],
 srack:[-39.5,2.6,-38.81,4.7,'Wall rack: rollers, bands, mats, light DBs (beside the TV)'], gtv:[-39.5,-0.55,-39.2,2.45,'TV on the south wall, centered on the futon (plan v6)'],
 goffice:[-39.5,4.75,-29.43,14.4,'Garage office zone at the south (back) window, about 10′ × 9′8″: open, defined by IKEA PAX / IVAR / KALLAX pieces and a curtain, no built walls'],
 gdesk2:[-39.2,7.0,-36.7,12.0], 
 agate:[-39.45,15.8,-38.66,17.6], genmod:[-39.45,17.8,-38.86,19.0],
 apw0:[-39.45,19.7,-38.46,22.2], apw1:[-39.45,28.0,-38.46,30.5], apw2:[-39.45,30.7,-38.46,33.2],
 esszone:[-39.5,15.5,-35.55,33.6], pvstub:[-39.35,33.4,-39.11,33.65],
 tread:[-34.9,19.58,-31.98,25.5], rower:[-30.5,16.92,-27.58,25.5],

 xt5:[-35.0,28.6,-28.9,44.6,'Cadillac XT5 (left / south bay, nose-in)'],
 airstream:[-23.29,19.9,-16.71,44.9],
 lift:[-12.84,19.03,-3.76,35.5,'One 4-post lift (HD-9XW class), right bay: front posts ~10 ft in, just behind the end of the door tracks (8 ft door, standard-lift track, wall-mount opener); Model Y under, 911 on top'],
 modely:[-11.4,28.83,-5.18,44.5,'Tesla Model Y (white), parked just inside the right door, under the lift'], porsche:[-11.3,20.23,-5.28,35.0],
 // plan v5 (Clark's corrections, Nov 24): overhead work right of center, futon set back facing the TV, The Plunge
 platform:[-23.78,9.77,-15.88,17.76,'8×8 lifting platform, right of center under the 13 ft flat (plan v5)'], rig:[-23.78,6.38,-15.88,9.67,'Sturdy 4-post rig (our current rack, set up as a 4-post): pull-ups, rings + rope bar in front (plan v5, right of center)'], wbt:[-27.95,6.25,-26.75,6.3,'Wall-ball target, 10 ft line (9 ft women), on the loft front face at the front-left ceiling hanger, above the ~8.3 ft deck edge (the loft has no floor posts); 3.5 ft throw zone in front'], sbA:[-17.65,9.97,-17.35,17.96,'Ceiling strongback for rings + rope, right of center at the overhead-work line (truss letter required)'], rstrap0:[-17.54,16.02,-17.46,16.1], ring0:[-17.65,15.81,-17.35,16.31], rstrap1:[-17.54,14.35,-17.46,14.43], ring1:[-17.65,14.14,-17.35,14.64], rope:[-17.6,11.97,-17.4,12.17], ropemat:[-19.47,10.07,-15.53,14.06], cplunge:[-12.84,9.24,-7.29,11.87], pchiller:[-12.6,7.95,-11.1,9.05], gpax1:[-39.2,12.49,-35.92,14.4], gpax2:[-35.9,12.49,-32.62,14.4], givar:[-32.55,12.73,-29.95,14.4], gkallax1:[-30.71,4.77,-29.43,9.6], gkallax2:[-38.5,4.77,-33.67,6.05], gcurtain:[-33.6,4.87,-30.75,4.95], sup:[-26.9,-3.57,-15.9,-0.9], kayak1:[-26.5,-0.6,-16.0,1.9], kayak2:[-26.5,2.1,-16.0,4.6], nglute:[-22.2,1.0,-17.03,3.0,'Rogue Floor Glute (our own, from FL) for Nordic curls / glute-ham raises: 62 × 24 in, roller 15–20 in tall; ~7 ft clear fall-forward lane toward the GHD'], peloton:[-27.64,0.91,-25.66,4.9], abike:[-25.07,0.71,-23.1,4.9], futon:[-31.2,-2.0,-28.57,3.9,'Futon sofa (existing), 71 × 31.5 in, 33 in tall (71 × 42 in open), gray-beige, chrome legs: front edge about 8 ft from the TV on the south wall, facing it (plan v6)'], stretch:[-38.6,-2.0,-31.5,4.4,'Stretch / bodyweight / TV area (clear floor between the TV and the futon)'], mats:[-39.3,-2.2,-7.1,18.6,'Rogue black rubber gym mats (3/4 in), whole gym floor']
};
// Speakeasy (behind the bookcase) = 9'2" x 13'6" per the Cubicasa plan: interior x 0.89-10.06, y 0.89-14.38.
const SPK={x0:0.89,y0:0.89,x1:10.06,y1:14.38};
const SPKFU={spanelW:[0.89,0.89,1.01,14.38],spanelS:[1.01,0.89,10.06,1.01],spanelN:[1.01,14.26,10.06,14.38],srug:[2.6,4.6,8.35,10.67],
 stable:[3.725,5.885,7.225,9.385],stool_s0:[4.725,4.45,6.225,6.05],stool_s1:[4.725,9.22,6.225,10.82],stool_s2:[2.25,6.885,3.85,8.385],stool_s3:[7.1,6.885,8.7,8.385],
 barcart:[4.29,1.01,6.665,2.47],spend:[5.225,7.385,5.725,7.885]};
// Jenny's actual pieces (tape photos, Nov 23): 42x42x36 in high-top + 4 counter chairs, 28.5x17.5x34.5 in oak/marble bar cart.
const SPKX={stable:{kind:'pubtable',h:3.0,c:'#3a2416',name:"Jenny's high-top table: 42 × 42 in, 36 in tall, espresso wood, diagonal 4-way veneer top, thick apron, square legs (34 in to each side wall)"},
 stool_s0:{face:'S'},stool_s1:{face:'N'},stool_s2:{face:'W'},stool_s3:{face:'E'},
 barcart:{kind:'barcart2',h:2.875,c:'#c8923f',name:"Jenny's bar cart: honey-oak frame, beige cultured-marble inset top, 28.5 × 17.5 in, 34.5 in tall, black wire wine rack on top"}};
function planOverrides(FU){
  let list=FU.filter(f=>!/^(tire rack|mini-?split)/i.test(f.name||'')&&!/added light|mini-?split/i.test((f.name||''))&&f.lv!=='site');
  list.forEach(f=>{const g=f.lv==='garage'?GFIT[f.id]:(f.lv==='lower'?SPKFU[f.id]:null); if(!g)return;
    Object.assign(f,{x0:g[0],y0:g[1],x1:g[2],y1:g[3]}); if(g[4])f.name=g[4]; if(f.id==='airstream')Object.assign(f,{kind:'sprinter',h:9.75,name:'2022 Airstream Interstate 24X: Mercedes Sprinter high-roof Class B van, about 24′6″–25′ × 6′7″ (plus mirrors) × 9′9″, nose-in in the center bay'});
    if(f.id==='porsche')f.name='Porsche 911 Carrera 4 GTS (992), matte black (on top of the lift)';
    if(f.id==='lift')f.c='#8e9297'; if(f.id==='xt5')f.c='#0b0b0c';
    if(f.id==='nglute')Object.assign(f,{kind:'floorglute',h:1.4});
    if(f.id==='tread')Object.assign(f,{kind:'xebex',h:5.0,name:'Curved treadmill: Xebex Runner Smart Connect (our own), 71 × 35 × 60 in, non-motorized; console toward the doors'});
    if(f.id==='rower')Object.assign(f,{kind:'skirow',h:3.4,name:'EnergyFit Ski-Row Air (our own, from FL): rower 103 × 33 × 40 in, flips up to a ski-erg (54 in long, 84 in tall)'});
    if(f.id==='cplunge')Object.assign(f,{kind:'plunge',h:2.17,c:'#f4f4f2',name:'Cold plunge: The Plunge (original), white acrylic laydown tub, 66⅝ × 31½ × 26 in, by the stair wall'});
    if(f.id==='pchiller')Object.assign(f,{kind:'pchiller',h:1.45,c:'#f4f4f2',name:'Plunge Pro Chiller (white), behind the tub'});
    if(/^apw/.test(f.id))Object.assign(f,{kind:'franklinbat',x1:f.x0+0.8,h:3.6,name:f.name.replace(/\(.*\)/,'(FranklinWH aPower 2-style floor unit)')});
    if(f.id==='agate')Object.assign(f,{kind:'franklingate',x1:f.x0+0.45,z0:1.6,h:2.6,name:'FranklinWH aGate (wall-mounted smart panel)'});
    if(f.id==='genmod')Object.assign(f,{kind:'franklingate',x1:f.x0+0.4,z0:2.6,h:1.3,name:'FranklinWH generator module (wall unit)'});
    f.src=(f.lv==='garage'?'garage fit plan v5 (Cubicasa 39′6″ × 49′11″)':'Cubicasa plan, 9′2″ × 13′6″');});
  list.forEach(f=>{if(f.lv!=='lower')return; if(/^stool_s/.test(f.id))Object.assign(f,{kind:'counterchair',h:3.7,c:'#3a2416',name:'Matching counter-height chair: dark brown wood, taupe upholstered seat, tall slatted back'}); if(SPKX[f.id])Object.assign(f,SPKX[f.id]); if(SPKFU[f.id]&&/^(stable|stool_s|barcart)/.test(f.id))f.src="Jenny's tape measurements; Cubicasa room 9′2″ × 13′6″";});
  list.forEach(f=>{
    const KK={peloton:['peloton',4.6],abike:['abike',4.3],cab:['gcab',7.0],dbrack:['dbrack',2.8],plates:['plates',1.6],bartree:['bartree',7.3],bench:['gbench',1.5],plyo:['plyo',3.4],ghd:['ghd',3.6],srack:['srack',5.6],sup:['boat',.45],kayak1:['boat',1.0],kayak2:['boat',1.0],ring0:['ring',.8],ring1:['ring',.8],gkallax1:['kallax',4.83],gkallax2:['kallax',2.5],gdesk2:['gdesk',4.1],wallconn:['wconn',5]};
    if(Q.has('studio')&&['ropemat','pvstub'].includes(f.id))f.kind='zone';
    if(f.lv==='garage'&&KK[f.id])Object.assign(f,{kind:KK[f.id][0],h:KK[f.id][1]});
  });
  if(!list.some(f=>/standing/i.test(f.name||''))){ const g=list.find(f=>f.id==='gdesk2');
    if(g){Object.assign(g,{kind:'standdesk',name:'Standing desk at the south (back) window W2 (new), faces the window',h:3.6,src:'plan update'});} list=list.filter(f=>f.id!=='gchair'); }
  if(!list.some(f=>/partition|divider/i.test(f.name||''))){
    const P=(id,x0,y0,x1,y1,nm)=>({id,name:nm||'Freestanding partition, oak frame + white panels (IKEA-style)',lv:'lower',kind:'partition',x0,y0,x1,y1,z0:LZ,h:6.6,ang:0,src:'basement plan (concept)',room:'Utility / storage'});
    list.push(P('partA',3.0,23.35,9.0,23.65,'Partition: mechanical zone, left run'),P('partB',12.0,23.35,19.0,23.65,'Partition: mechanical zone, right run (3 ft access gap)'),
      P('partC',18.85,19.2,19.15,23.5,'Partition: mechanical zone return'),P('partD',21.5,24.35,29.0,24.65,'Partition: secondary office, front'),P('partE',21.35,24.5,21.65,32.9,'Partition: secondary office, side'));
  }
  return list;}
function buildFurniture(){
  const FU=planOverrides(JSON.parse(JSON.stringify(H.FU)));
  FU.forEach(f=>{const layer=classify(f), dom=f.lv==='garage'?'garage':'house';
    const w=f.x1-f.x0,d=f.y1-f.y0,ang=(f.ang||0)*Math.PI/180; let ww=w,dd=d;
    if(Math.abs(Math.sin(ang))>0.7&&f.kind!=='massage'){ww=d;dd=w;}
    const M=new THREE.Matrix4().makeTranslation((f.x0+f.x1)/2,f.z0,(f.y0+f.y1)/2).multiply(new THREE.Matrix4().makeRotationY(-ang));
    const info=infoOf(f.name,{dims:dims(Math.abs(w),Math.abs(d),f.h),room:f.room,src:f.src,layer:LAYERS.find(l=>l[0]===layer)[1],id:f.id});
    const sq=f.kind==='chair'||f.kind==='massage';
    (BUILD[f.kind]||BUILD.box)(f,ctx(layer,dom,M,info),sq?Math.min(w,d):ww,sq?Math.max(w,d):dd);});
  // backup power extras: portable dual-fuel generator inlet outside the south garage wall (no standby generator)
  const gi=PLAN.garage_inner;
  addBox('power','site',null,gi[0]-0.95,18.1,gi[0]-0.55,19.0,GZ+1.8,GZ+2.6,0x5e35b1,1,infoOf('Generator inlet box (portable dual-fuel generator)',{layer:'Backup power & solar',note:'Portable dual-fuel generator plugs in here; it runs outdoors, well away from doors and windows. No standby generator.'}));
  addBox('power','site',null,gi[0]-12.5,16.5,gi[0]-9.5,19.0,GZ-0.9,GZ-0.6,0x9e9e9e,1,infoOf('Generator pad (portable unit runs here)',{layer:'Backup power & solar'}));
  addBox('power','site',null,gi[0]-12.2,16.8,gi[0]-9.8,18.7,GZ-0.6,GZ+1.4,0xd84315,1,infoOf('Portable dual-fuel generator (stored inside, run outside)',{layer:'Backup power & solar'}));
}

// ---------- outdoor: 8x13 portable skid sauna + existing shed ----------
function buildOutdoor(){
  const G=-1.62, SID=0xb7bab5, TRIM=0xf7f7f5, ROOF=0x3f434a, BLK=0x151515;
  const sInfo=n=>infoOf(n,{layer:'Outdoor',note:'8′ × 13′ portable skid sauna (concept): changing room off the hot-tub deck, then a 7′ × 7′ hot room with two 7-foot lie-flat benches. Gray lap siding, white trim and a 2.5:12 shingle shed roof to match the shed and house.'});
  const X0=32,X1=40,Y0=-25,Y1=-12, FL=G+1.1, hiTop=G+10.0, loTop=G+8.17, wt=0.45;
  const B=(x0,y0,x1,y1,z0,z1,c,o,n)=>addBox('outdoor','house',null,x0,y0,x1,y1,z0,z1,c,o,sInfo(n||'Portable skid sauna'));
  B(X0-1.5,Y0-1.5,X1+1.5,Y1,G-0.02,G+0.06,0xb8b2a6,1,'Compacted gravel pad');
  [X0+0.4,(X0+X1)/2,X1-0.4].forEach(x=>B(x-.23,Y0-.3,x+.23,Y1-.05,G,G+.46,0x6f5a3f,1,'6×6 PT skid with tow eyes'));
  B(X0,Y0,X1,Y1,G+.46,FL,0x8a6a45,1,'Floor framing');
  const wallTop=x=>loTop+(x-X0)/(X1-X0)*(hiTop-loTop)-0.55;
  // long walls (x = X0 low side, x = X1 high side) with openings
  const longWall=(x,top,ops)=>{let y=Y0;ops.concat([[Y1,Y1,0,0]]).forEach(([a,b,s,h])=>{if(a>y)B(x-wt/2,y,x+wt/2,a,FL,top,SID);if(b>a){B(x-wt/2,a,x+wt/2,b,FL,FL+s,SID);B(x-wt/2,a,x+wt/2,b,FL+h,top,SID);B(x-wt/2+.05,a,x+wt/2-.05,b,FL+s,FL+h,0x1b2530,.55,'Window');
      [[a-.25,a],[b,b+.25]].forEach(([p,q])=>B(x-wt/2-.04,p,x+wt/2+.04,q,FL+s-.2,FL+h+.2,TRIM,1,'White casing'));}y=b;});};
  longWall(X0,wallTop(X0),[[-23.6,-21.6,2.6,4.6],[-15.6,-13.4,3.0,6.3]]);
  longWall(X1,wallTop(X1),[[-15.6,-13.4,3.0,6.3]]);
  // end walls with door
  B(X0,Y1-wt,34.6,Y1,FL,wallTop(34.6),SID);B(37.3,Y1-wt,X1,Y1,FL,wallTop(X1),SID);B(34.6,Y1-wt,37.3,Y1,FL+6.7,wallTop(37.3),SID);
  B(34.65,Y1-wt+.05,37.25,Y1-.05,FL,FL+6.7,BLK,1,'32″ black half-lite door (outswing to the deck)');B(35.0,Y1-.06,36.9,Y1-.03,FL+3.6,FL+6.2,0x1b2530,.6,'Door lite');
  B(X0,Y0,X1,Y0+wt,FL,wallTop(X1),SID,1,'Yard end (stove fired from outside)');
  // interior partition with glass sauna door
  const yP=Y1-wt-4.8; B(X0,yP-.2,34.8,yP+.2,FL,wallTop(34.8),0xd9b27c,1,'Cedar partition');B(36.85,yP-.2,X1,yP+.2,FL,wallTop(X1),0xd9b27c,1,'Cedar partition');
  B(34.8,yP-.04,36.85,yP+.04,FL,FL+6.17,0xa8d5e2,.4,'24″ × 74″ tempered glass sauna door');B(34.8,yP-.2,36.85,yP+.2,FL+6.17,wallTop(36.85),0xd9b27c);
  // benches on the high wall: upper 24" @ 38", lower 22" @ 18", both 7 ft long (lie-flat)
  const by0=Y0+wt+.05, by1=yP-.25;
  B(X1-wt-2.0,by0,X1-wt,by1,FL+3.0,FL+3.17,0xe2c08f,1,'Upper bench 24″ × 84″ at 38″ (lie-flat #1)');B(X1-wt-2.0,by0,X1-wt-1.85,by1,FL,FL+3.0,0xd9b27c,1,'Bench riser');
  B(X1-wt-3.85,by0,X1-wt-2.0,by1,FL+1.33,FL+1.5,0xe2c08f,1,'Lower bench 22″ × 84″ at 18″ (lie-flat #2)');
  B(33.0,Y0+wt+.3,34.6,Y0+wt+1.9,FL,FL+2.6,0x262626,1,'Wood-fired sauna stove (fired from outside)');
  B(32.6,Y1-wt-4.5,33.4,Y1-wt-0.6,FL+1.4,FL+1.6,0xd9b27c,1,'Changing-room bench + hooks');
  // shed roof 2.5:12, low at X0, with overhangs, white fascia
  const rp=Math.atan(2.5/12), rx0=X0-.75, rx1=X1+.75, ry0=Y0-1, ry1=Y1+1, rz0=loTop-(0.75*2.5/12), rz1=hiTop+(0.75*2.5/12);
  const rl=Math.hypot(rx1-rx0,rz1-rz0); const mm=new THREE.Matrix4().makeTranslation((rx0+rx1)/2,(rz0+rz1)/2-.25,(ry0+ry1)/2).multiply(new THREE.Matrix4().makeRotationZ(rp));
  addBox('outdoor','house',mm,-rl/2,(ry0-ry1)/2,rl/2,(ry1-ry0)/2,-.2,.2,ROOF,1,sInfo('Shingle shed roof, 2.5:12'));
  addBox('outdoor','house',mm,-rl/2,(ry0-ry1)/2,rl/2,(ry1-ry0)/2,-.45,-.2,TRIM,1,sInfo('White fascia + vented soffit'));
  [[X0,Y0],[X1,Y0],[X0,Y1],[X1,Y1]].forEach(([x,y])=>B(x-(x>X0?wt:0)-.05,y-(y>Y0?wt:0)-.05,x+(x>X0?0:wt)+.05,y+(y>Y0?0:wt)+.05,FL,wallTop(x),TRIM,1,'White corner board'));
  const cy=Y0+1.2; B(33.55,cy-.27,34.05,cy+.27,FL+2.6,wallTop(33.8)+0.55+3.4,0x2b2b2b,1,'6″ Class-A chimney, spark arrestor (3 ft above the roof)');
  // existing shed (position approximate, from the aerial and listing photos): gray lap, white trim, roll-up door, shed roof
  const sx=6.8, sy=-87.3, W=12, D=10, shInfo=n=>infoOf(n,{layer:'Outdoor',note:'Existing rear shed. Position estimated from the aerial and listing photos (±10 ft); size estimated at about 12′ × 10′.'});
  const SB=(x0,y0,x1,y1,z0,z1,c,o,n)=>addBox('outdoor','house',null,sx+x0,sy+y0,sx+x1,sy+y1,z0,z1,c,o,shInfo(n||'Existing shed'));
  const sTop=G+9.2, sBack=G+7.8, swt=.4;
  SB(-W/2,-D/2,W/2,D/2,G,G+.35,0xbdbdbd,1,'Concrete pad');
  SB(-W/2,-D/2,-W/2+swt,D/2,G+.35,sBack,SID);SB(W/2-swt,-D/2,W/2,D/2,G+.35,sBack,SID);SB(-W/2,-D/2,W/2,-D/2+swt,G+.35,sBack,SID);
  SB(-W/2,D/2-swt,-3,D/2,G+.35,sTop-.4,SID);SB(3,D/2-swt,W/2,D/2,G+.35,sTop-.4,SID);SB(-3,D/2-swt,3,D/2,G+7.3,sTop-.4,SID);
  SB(-3,D/2-swt+.05,3,D/2-.05,G+.35,G+7.3,0x1d1d1d,1,'Black roll-up door');
  [-4.7,4.0].forEach(x=>{SB(x-.05,D/2-.06,x+1.4,D/2+.03,G+4.0,G+6.1,0x1b2530,.6,'Window');SB(x-.25,D/2,x+1.6,D/2+.05,G+3.8,G+6.3,TRIM,1,'White casing');});
  const sp=Math.atan((sTop-sBack)/(D+1.5)), sl2=Math.hypot(D+1.5,sTop-sBack); const sm=new THREE.Matrix4().makeTranslation(sx,(sTop+sBack)/2,sy+.25).multiply(new THREE.Matrix4().makeRotationX(-sp));
  addBox('outdoor','house',sm,-W/2-.75,-sl2/2,W/2+.75,sl2/2,-.15,.15,0x2b2e33,1,shInfo('Shed roof (dark), white soffit'));
  SB(-2.5,D/2,2.5,D/2+4,G-.02,G+.05,0xcfc7b4,1,'Exposed-aggregate apron');
}
// ---------- room labels ----------
const LABELS=[]; // {el, pos(Vector3 world), layer, kind, lv}
function addLabel(text,pos,cls,layer,lv,minD,maxD){const el=document.createElement('div');el.className='lb '+(cls||'');el.innerHTML=text;$('#labels').appendChild(el);
  const o={el,pos,layer,lv,minD:minD||0,maxD:maxD||1e9};LABELS.push(o);return o;}
function buildRoomLabels(){
  const cub={Garage:"39′6″ × 49′11″"};
  H.ROOMS.forEach(([lv,n,dm,x0,y0,x1,y1])=>{if(lv==='lower'&&/speakeasy/i.test(n)){({x0,y0,x1,y1}=SPK);}if(lv==='garage'){[x0,y0,x1,y1]=PLAN.garage_inner;}const base={main:0,lower:LZ,garage:GZ}[lv];const p=new THREE.Vector3((x0+x1)/2,base+0.4,(y0+y1)/2);HR.updateMatrixWorld(true);HR.localToWorld(p);
    const d=(cub[n]||dm||'').replace(/'/g,'′').replace(/"/g,'″');addLabel(clean(n)+(d?'<br><small>'+d+'</small>':''),p,'room','rooms',lv,0,260);});
  const sp=new THREE.Vector3(36,8,-18.5);HR.localToWorld(sp);addLabel('Skid sauna 8′ × 13′',sp,'room','outdoor','site',0,700);
  const shp=new THREE.Vector3(6.8,9,-87.3);HR.localToWorld(shp);addLabel('Shed',shp,'room','outdoor','site',0,900);
}

// ======================= GEO =======================
let TER={}; let EXAG=1; const NEAR={half:900};
const KX=111320*Math.cos(44.6946*Math.PI/180), KY=111132;
const enu2w=(e,n,y)=>new THREE.Vector3(e,y||0,-n);
const ll2enu=(lon,lat)=>[(lon-GEO.lon0)*KX*FT,(lat-GEO.lat0)*KY*FT];
const enu2ll=(e,n)=>[GEO.lon0+e/FT/KX,GEO.lat0+n/FT/KY];
const merc=(lon,lat)=>[lon*20037508.34/180,Math.log(Math.tan((90+lat)*Math.PI/360))*20037508.34/Math.PI];
function sampleGrid(t,e,n){const j=(e-t.sw[0])/(t.ne[0]-t.sw[0])*(t.nx-1), i=(t.ne[1]-n)/(t.ne[1]-t.sw[1])*(t.ny-1);
  if(i<0||j<0||i>t.ny-1||j>t.nx-1)return null; const i0=Math.floor(i),j0=Math.floor(j),i1=Math.min(i0+1,t.ny-1),j1=Math.min(j0+1,t.nx-1),fi=i-i0,fj=j-j0,h=t.h;
  const v=(a,b)=>h[a*t.nx+b]; return (v(i0,j0)*(1-fj)+v(i0,j1)*fj)*(1-fi)+(v(i1,j0)*(1-fj)+v(i1,j1)*fj)*fi;}
// model-frame pad around the structures so the house sits on a level yard
const PADS=[[-1,-1,55,35],[-41.5,-6,1.5,47.5],[5,-13,38,1],[30,-27,42,-11],[0,-94,14,-80],[-40,46,0,92]];
function padDist(x,y){let m=1e9;for(const [a,b,c,d] of PADS){const dx=Math.max(a-x,0,x-c),dy=Math.max(b-y,0,y-d);m=Math.min(m,Math.hypot(dx,dy));}return m;}
const w2m=new THREE.Matrix4(); // world -> model
function groundY(e,n,raw){ // world height (ft) at ENU e,n
  let hm=sampleGrid(TER.core,e,n); if(hm==null)hm=sampleGrid(TER.region,e,n); if(hm==null)return -1.62;
  let y=(hm-GEO.Eref_m)*FT*EXAG-1.62; if(raw)return y;
  const p=new THREE.Vector3(e,0,-n).applyMatrix4(w2m); const d=padDist(p.x,p.z); if(d<60){const t=THREE.MathUtils.smoothstep(d,4,60);y=-1.62*(1-t)+y*t;} return y;}
function terrainMaterial(tex,holes){ // discards inside the house footprint (so the basement shows) and inside "holes" (finer terrain on top)
  const m=new THREE.MeshLambertMaterial({map:tex,color:0xffffff});
  m.onBeforeCompile=sh=>{sh.uniforms.hInv={value:new THREE.Matrix4().copy(w2m)};sh.uniforms.holes={value:holes||[]};sh.uniforms.nh={value:(holes||[]).length};
    sh.vertexShader='varying vec3 vWP;\n'+sh.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n vWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader='varying vec3 vWP;uniform mat4 hInv;uniform vec4 holes[2];uniform int nh;\n'+sh.fragmentShader.replace('void main() {','void main() {\n vec4 mp=hInv*vec4(vWP,1.0); if(mp.x>0.3&&mp.x<53.7&&mp.z>0.3&&mp.z<33.7) discard;\n for(int i=0;i<2;i++){ if(i<nh){ vec4 hb=holes[i]; if(vWP.x>hb.x&&vWP.x<hb.z&&vWP.z>hb.y&&vWP.z<hb.w) discard; } }');};
  return m;}
function makeTerrain(e0,n0,e1,n1,nx,ny,uvFn,mtl,heightFn){
  const g=new THREE.PlaneGeometry(1,1,nx-1,ny-1); const pos=g.attributes.position, uv=g.attributes.uv;
  for(let i=0;i<pos.count;i++){const ix=i%nx,iy=Math.floor(i/nx);const e=e0+(e1-e0)*ix/(nx-1), n=n1-(n1-n0)*iy/(ny-1);
    pos.setXYZ(i,e,heightFn(e,n),-n); const [u,v]=uvFn(e,n); uv.setXY(i,u,v);}
  g.computeVertexNormals(); const m=new THREE.Mesh(g,mtl); m.receiveShadow=true; m.frustumCulled=false; return m;}
const texLoader=new THREE.TextureLoader();
function loadTex(url){return new Promise(r=>texLoader.load(url,t=>{t.encoding=THREE.sRGBEncoding;t.anisotropy=R.capabilities.getMaxAnisotropy();r(t);},undefined,()=>r(null)));}
async function loadBin(url,nx,ny,hmin){const b=await (await fetch(url)).arrayBuffer();const u=new Uint16Array(b);const h=new Float32Array(u.length);for(let i=0;i<u.length;i++)h[i]=hmin+u[i]/100;return h;}
const TERR_MESH={};
async function buildTerrain(){
  for(const k of ['core','region']){const t=GEO.terrain[k];TER[k]=Object.assign({},t,{h:await loadBin('explorer/'+t.bin,t.nx,t.ny,t.hmin)});}
  HR.updateMatrixWorld(true); w2m.copy(HR.matrixWorld).invert();
  const [tc,tr]=await Promise.all([loadTex('explorer/'+GEO.terrain.core.tex),loadTex('explorer/'+GEO.terrain.region.tex)]);
  TERR_MESH.naipCore=tc; TERR_MESH.naipRegion=tr;
  rebuildTerrain();
}
function gridUV(t){return (e,n)=>[(e-t.sw[0])/(t.ne[0]-t.sw[0]),(n-t.sw[1])/(t.ne[1]-t.sw[1])];}
function rebuildTerrain(){
  ['region','core','near'].forEach(k=>{if(TERR_MESH[k]){L.terrain.remove(TERR_MESH[k]);TERR_MESH[k].geometry.dispose();}});
  const c=GEO.terrain.core, r=GEO.terrain.region;
  const coreHole=new THREE.Vector4(c.sw[0],-c.ne[1],c.ne[0],-c.sw[1]);
  const hc=houseENU(); const nb=[hc[0]-NEAR.half,hc[1]-NEAR.half,hc[0]+NEAR.half,hc[1]+NEAR.half];
  const nearHole=new THREE.Vector4(nb[0]+2,-(nb[3]-2),nb[2]-2,-(nb[1]+2));
  TERR_MESH.region=makeTerrain(r.sw[0],r.sw[1],r.ne[0],r.ne[1],r.nx,r.ny,gridUV(r),terrainMaterial(TERR_MESH.naipRegion,[coreHole,new THREE.Vector4()]),(e,n)=>{const v=sampleGrid(TER.region,e,n);return (v-GEO.Eref_m)*FT*EXAG-1.62-2;});
  TERR_MESH.region.userData.info=infoOf('Terrain: USGS 3DEP LiDAR (20 m grid here)',{layer:'Terrain',note:'Imagery: USDA NAIP 2022, 0.6 m (public domain).'});
  TERR_MESH.core=makeTerrain(c.sw[0],c.sw[1],c.ne[0],c.ne[1],c.nx,c.ny,TERR_MESH.esriCore?TERR_MESH.esriCore.uv:gridUV(c),terrainMaterial(TERR_MESH.esriCore&&IMG==='esri'?TERR_MESH.esriCore.tex:TERR_MESH.naipCore,[nearHole,new THREE.Vector4()]),(e,n)=>groundY(e,n,true));
  TERR_MESH.core.userData.info=infoOf('Terrain: USGS 3DEP 1 m LiDAR (3 m grid)',{layer:'Terrain'});
  const nn=MOBILE?150:240; const useE=TERR_MESH.esriNear&&IMG==='esri';
  TERR_MESH.near=makeTerrain(nb[0],nb[1],nb[2],nb[3],nn,nn,useE?TERR_MESH.esriNear.uv:gridUV(c),terrainMaterial(useE?TERR_MESH.esriNear.tex:TERR_MESH.naipCore,[new THREE.Vector4(),new THREE.Vector4()]),(e,n)=>groundY(e,n));
  TERR_MESH.near.userData.info=infoOf('Ground near the house (LiDAR, leveled around the structures)',{layer:'Terrain'});
  ['region','core','near'].forEach(k=>L.terrain.add(TERR_MESH[k]));
  // apron + driveway stub
  redrapeLines();
}
function houseENU(){const p=new THREE.Vector3(20,0,20);HR.localToWorld(p);return [p.x,-p.z];}
// ---- Esri World Imagery, loaded live (attribution shown) ----
function esriMosaic(z,lonW,latS,lonE,latN){return new Promise(res=>{
  const n=2**z,tx=lon=>(lon+180)/360*n,ty=lat=>(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*n;
  const x0=Math.floor(tx(lonW)),x1=Math.floor(tx(lonE)),y0=Math.floor(ty(latN)),y1=Math.floor(ty(latS));
  const cv=document.createElement('canvas');cv.width=(x1-x0+1)*256;cv.height=(y1-y0+1)*256;const g=cv.getContext('2d');g.fillStyle='#4f6a3a';g.fillRect(0,0,cv.width,cv.height);
  let left=(x1-x0+1)*(y1-y0+1),ok=0;const done=()=>{if(--left>0)return; if(ok<3)return res(null);
    const t=new THREE.CanvasTexture(cv);t.encoding=THREE.sRGBEncoding;t.anisotropy=R.capabilities.getMaxAnisotropy();
    const X=v=>v/n*360-180,Y=v=>Math.atan(Math.sinh(Math.PI*(1-2*v/n)))*180/Math.PI;const mx0=merc(X(x0),0)[0],mx1=merc(X(x1+1),0)[0],my1=merc(0,Y(y0))[1],my0=merc(0,Y(y1+1))[1];
    res({tex:t,uv:(e,nn)=>{const [lo,la]=enu2ll(e,nn);const [mx,my]=merc(lo,la);return [(mx-mx0)/(mx1-mx0),(my-my0)/(my1-my0)];}});};
  for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){const im=new Image();im.crossOrigin='anonymous';im.onload=()=>{g.drawImage(im,(x-x0)*256,(y-y0)*256);ok++;done();};im.onerror=done;
    im.src=`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;}});}
let IMG=Q.get('img')||'esri';
async function loadEsri(){ if(TERR_MESH.esriTried)return; TERR_MESH.esriTried=true;
  const hc=houseENU(); const a=enu2ll(hc[0]-NEAR.half,hc[1]-NEAR.half), b=enu2ll(hc[0]+NEAR.half,hc[1]+NEAR.half);
  const c=GEO.terrain.core.bbox;
  const [near,core]=await Promise.all([esriMosaic(MOBILE?18:19,a[0],a[1],b[0],b[1]),esriMosaic(17,c[0],c[1],c[2],c[3])]);
  if(near)TERR_MESH.esriNear=near; if(core)TERR_MESH.esriCore=core;
  if(!near&&!core){status('Esri imagery unavailable; showing NAIP 2022');} rebuildTerrain();}

// ---------- screen-space wide lines (draped on the terrain) ----------
const LINES=[]; // {pts:[[e,n]], mesh, lift, layer, info}
const lineMat=(color,width,dash,opacity)=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,
  uniforms:{color:{value:new THREE.Color(color)},width:{value:width},res:{value:new THREE.Vector2(W0,H0)},dash:{value:dash||0},opacity:{value:opacity||1}},
  vertexShader:`attribute vec3 prevP;attribute vec3 nextP;attribute float side;attribute float dist;uniform float width;uniform vec2 res;varying float vD;
   #include <common>
   #include <logdepthbuf_pars_vertex>
   void main(){vD=dist;mat4 mv=modelViewMatrix;vec4 a=mv*vec4(position,1.0),p=mv*vec4(prevP,1.0),n=mv*vec4(nextP,1.0);a.xyz*=0.997;p.xyz*=0.997;n.xyz*=0.997;
    vec4 c=projectionMatrix*a,cp=projectionMatrix*p,cn=projectionMatrix*n;float asp=res.x/res.y;
    vec2 s=c.xy/c.w,sp=cp.xy/cp.w,sn=cn.xy/cn.w;s.x*=asp;sp.x*=asp;sn.x*=asp;
    vec2 d1=s-sp,d2=sn-s;vec2 dir=length(d1)<1e-6?normalize(d2):(length(d2)<1e-6?normalize(d1):normalize(normalize(d1)+normalize(d2)));
    vec2 nr=vec2(-dir.y,dir.x);nr.x/=asp;c.xy+=nr*side*width/res.y*c.w;gl_Position=c;
    #include <logdepthbuf_vertex>
   }`,
  fragmentShader:`uniform vec3 color;uniform float dash;uniform float opacity;varying float vD;
   #include <logdepthbuf_pars_fragment>
   void main(){
    #include <logdepthbuf_fragment>
    if(dash>0.0&&mod(vD,dash*2.0)>dash)discard;gl_FragColor=vec4(color,opacity);}`});
function lineGeom(P){ // P: array of Vector3
  const n=P.length,pos=[],prev=[],next=[],side=[],dist=[],idx=[];let acc=0;
  for(let i=0;i<n;i++){const a=P[i],p=P[Math.max(i-1,0)],q=P[Math.min(i+1,n-1)];if(i)acc+=a.distanceTo(P[i-1]);
    for(const s of [-1,1]){pos.push(a.x,a.y,a.z);prev.push(p.x,p.y,p.z);next.push(q.x,q.y,q.z);side.push(s);dist.push(acc);}
    if(i<n-1){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('prevP',new THREE.Float32BufferAttribute(prev,3));
  g.setAttribute('nextP',new THREE.Float32BufferAttribute(next,3));g.setAttribute('side',new THREE.Float32BufferAttribute(side,1));g.setAttribute('dist',new THREE.Float32BufferAttribute(dist,1));g.setIndex(idx);return g;}
function densify(pts,step){const out=[];for(let i=0;i<pts.length-1;i++){const [a,b]=[pts[i],pts[i+1]];const L_=Math.hypot(b[0]-a[0],b[1]-a[1]);const k=Math.max(1,Math.ceil(L_/step));
  for(let j=0;j<k;j++)out.push([a[0]+(b[0]-a[0])*j/k,a[1]+(b[1]-a[1])*j/k]);}out.push(pts[pts.length-1]);return out;}
function addLine(layer,pts,color,width,info,opts){opts=opts||{};const o={pts:densify(pts,opts.step||25),color,width,info,layer,lift:opts.lift||3,dash:opts.dash||0,opacity:opts.opacity||1,ro:opts.ro||0};LINES.push(o);return o;}
function redrapeLines(){LINES.forEach(o=>{if(o.mesh){L[o.layer].remove(o.mesh);o.mesh.geometry.dispose();}
  o.P=o.pts.map(([e,n])=>new THREE.Vector3(e,groundY(e,n)+o.lift,-n));o.mesh=new THREE.Mesh(lineGeom(o.P),o.mat||(o.mat=lineMat(o.color,o.width,o.dash,o.opacity)));
  o.mesh.frustumCulled=false;o.mesh.renderOrder=5+o.ro;L[o.layer].add(o.mesh);});
  LABELS.forEach(l=>{if(l.en){l.pos.set(l.en[0],groundY(l.en[0],l.en[1])+l.lift,-l.en[1]);}});}
function geoLabel(text,en,cls,layer,lift,maxD,minD){const o=addLabel(text,new THREE.Vector3(),cls,layer,'geo',minD||0,maxD||1e9);o.en=en;o.lift=lift||30;return o;}
function buildGeoVectors(){
  // lot boundary (county parcel GIS geometry only)
  GEO.parcel.forEach(r=>{addLine('boundary',r,0xff3b2f,4,infoOf('Lot line (county parcel GIS)',{layer:'Lot boundary',note:'From Grand Traverse County parcel GIS, about '+GEO.parcel_area_ac+' acres. This is a GIS drawing, not a survey: expect a few feet of error. Survey pins govern.'}),{lift:4,step:12,ro:3});});
  GEO.neighbors.forEach(r=>addLine('boundary',r,0xf5e663,1.2,infoOf('Neighboring parcel line (GIS)',{layer:'Lot boundary'}),{lift:3,step:30,opacity:.7}));
  GEO.state_land.forEach(r=>addLine('boundary',r,0x52d273,2,infoOf('State forest land boundary (GIS)',{layer:'Lot boundary',note:'Public state forest land next to the lot. That is where the two-track trail to the VASA network runs.'}),{lift:3,step:30,opacity:.85}));
  // trails
  GEO.trails.forEach(t=>addLine('trails',t.p,0xe8dcc0,1.4,infoOf((t.n||('Unnamed '+t.k))+' (OSM)',{layer:'Trails',note:'OpenStreetMap '+t.k+'. Check DNR rules before you use it.'}),{lift:2.5,step:40,opacity:.75}));
  GEO.roads.forEach(t=>addLine('trails',t.p,0xffffff,2,infoOf((t.n||'Road')+' (OSM)',{layer:'Trails'}),{lift:2.5,step:40,opacity:.8}));
  GEO.vasa.forEach(t=>addLine('trails',t.p,0x2f9bff,3.2,infoOf(t.n+' (VASA network, OSM)',{layer:'Trails to VASA',note:'Part of the VASA Pathway / VASA Singletrack system (TART Trails / Michigan DNR).'}),{lift:3,step:30,ro:1}));
  const rc={walk_riley:0xffa726,to_supply:0xffd54f,to_bartlett:0xff7043};
  GEO.routes.forEach((r,i)=>{const L_=addLine('trails',r.p,rc[r.id]||0xffa726,i===0?6:4.2,infoOf(r.name,{layer:'Trails to VASA',dist:r.mi+' mi',note:(r.id==='walk_riley'?'Backyard path from the shed (inferred, under tree cover) to the old two-track on state forest land, then north across Supply Rd to Riley’s Trail (VASA 8k). ':'')+(r.segments?'Legs: '+r.segments.map(s=>(s[1]||s[0])+' '+(s[2]/1609.34).toFixed(2)+' mi').join(' · '):'')}),{lift:4+i,step:15,ro:2+i});
    if(r.id==='walk_riley'){addLine('trails',r.p.slice(0,3),0xffffff,6,infoOf('Backyard path to the two-track (inferred)',{layer:'Trails to VASA'}),{lift:6,step:6,dash:6,ro:6});}});
  // points + labels
  const hc=houseENU();
  geoLabel('687 Starflower Ln',[hc[0],hc[1]],'pin','boundary',60,40000,180);
  GEO.points.forEach(p=>geoLabel(p.n+(p.mi?'<br><small>'+p.mi+' mi on foot from the shed'+(p.drive?' · '+p.drive:'')+'</small>':''),p.p,/trailhead|25k|Riley|Orange/.test(p.n)?'vasa':'geo','trails',40,60000,150));
  const sl=GEO.state_land[0]; if(sl){const c=sl.reduce((a,b)=>[a[0]+b[0]/sl.length,a[1]+b[1]/sl.length],[0,0]);geoLabel('State forest land',c,'geo','boundary',25,9000,300);}
}

// ======================= UI / NAVIGATION =======================
const status=t=>{$('#status').textContent=t;};
function toWorld(x,h,y){const p=new THREE.Vector3(x,h,y);HR.updateMatrixWorld(true);return HR.localToWorld(p);}
// bookmarks: model-frame camera p/t ([x, height, y]); geo views computed from ENU
const CUT={basement:0,main:1,roof:2};
let V=[];
function buildViews(){
  const r0=GEO.routes[0].p, j=GEO.points[0].p, th=GEO.points[3].p, hc=houseENU();
  const geoV=(pos,tgt)=>({pw:enu2w(pos[0],pos[1],pos[2]),tw:enu2w(tgt[0],tgt[1],tgt[2])});
  V=[
   {k:'overview',l:'Overview',p:[-95,72,100],t:[2,0,18],cut:'main'},
   {k:'front',l:'Front & driveway',p:[-30,14,135],t:[2,7,20],cut:'roof'},
   {k:'gym',l:'Garage gym',p:[-25.5,9.5,31],t:[-20,3.0,8],cut:'main'},
   {k:'goffice',l:'Garage office (south window)',p:[-30.6,5.8,13.6],t:[-39,3.2,9.5],cut:'main'},
   {k:'vehicles',l:'Garage: XT5, Airstream, lift (911 over Model Y)',p:[-5,9,8],t:[-18,4.5,36],cut:'main'},
   {k:'power',l:'Backup power (south wall)',p:[-35.6,5.6,16.2],t:[-39.4,2.6,30],cut:'main'},
   {k:'gymoffice',l:'Gym from the office door',p:[-29.0,4.9,13.0],t:[-14.5,3.0,5.0],cut:'main'},
   {k:'gymhouse',l:'Gym from the house door',p:[-3.0,4.9,22.0],t:[-26,3.0,4.0],cut:'main'},
   {k:'gymbackleft',l:'Gym from the back-left corner',p:[-37.6,5.4,-2.4],t:[-17,3.0,22],cut:'main'},
   {k:'gymbackright',l:'Gym from the back-right corner',p:[-2.6,5.4,-2.6],t:[-24,3.0,18],cut:'main'},
   {k:'gymoverhead',l:'Gym overhead (iso)',p:[-4,30,34],t:[-21,0,10],cut:'main'},
   {k:'gymbackcenter',l:'Gym from the back wall, looking out',p:[-19.5,5.4,-1.2],t:[-19.5,3.2,30],cut:'main'},
   {k:'stretchcorner',l:'Stretch corner, futon and TV',p:[-28.0,5.2,1.0],t:[-39.5,3.0,2.5],cut:'main'},
   {k:'c1',l:'Garage from the front-left corner, high',p:[-38.0,9.5,37.5],t:[-9.5,2.5,0.5],cut:'main'},
   {k:'c2',l:'Garage from the house wall behind the lift, high',p:[-1.5,10,17.5],t:[-36.5,2.5,-0.5],cut:'main'},
   {k:'c3',l:'Garage from the back right, high, looking out',p:[-6.5,9.5,-2.8],t:[-34.5,2.5,40.5],cut:'main'},
   {k:'c4',l:'Garage from the back left, high, looking out',p:[-38.0,9.5,-2.8],t:[-3.5,2.5,37.5],cut:'main'},
   {k:'va',l:'Gym from the cardio strip toward the house wall',p:[-36.5,5.5,16.5],t:[-0.5,4,5.5],cut:'main'},
   {k:'vb',l:'Gym from the house door toward the back left',p:[-2.5,5.5,23.5],t:[-34.5,4,0.5],cut:'main'},
   {k:'vd',l:'Stretch corner: futon facing the TV',p:[-21.5,5.2,12.5],t:[-39.5,3.5,-0.5],cut:'main'},
   {k:'ve',l:'Along the south wall toward the side door',p:[-30.5,5.5,7.5],t:[-37.5,3.5,41.5],cut:'main'},
   {k:'ph55',l:'Garage from the front left, like listing photo 55',p:[-36.5,5.5,39.5],t:[-9.5,4,0.5],cut:'main'},
   {k:'ph56',l:'Garage back-left corner, like listing photo 56',p:[-17.5,5.5,23.5],t:[-33.5,5,-3.5],cut:'main'},
   {k:'ph57',l:'Garage from the back looking out, like listing photo 57',p:[-14.5,5.5,-0.5],t:[-21.5,4,45.5],cut:'main'},
   {k:'gymtop',l:'Garage plan view from above (true 39′6″ × 49′11″, house wall on the right)',p:[-19.75,78,22.0],t:[-19.75,0,20.5],cut:'main'},
   {k:'doorsin',l:'Garage from the doors',p:[-20,9.0,44.6],t:[-20,3.5,10],cut:'main'},
   {k:'speakeasy',l:'Speakeasy (behind the bookcase)',p:[8.4,-4.3,13.3],t:[3.6,-7.4,3.0],cut:'basement'},
   {k:'piano',l:'Piano lounge',p:[31,5.6,18],t:[22,2.6,25],cut:'main'},
   {k:'living',l:'Living room',p:[16.2,5.5,15.6],t:[28,3.4,31],cut:'main'},
   {k:'boffice',l:'Basement office & storage',p:[9,-4.2,31.5],t:[25,-7.6,25],cut:'basement'},
   {k:'deck',l:'Deck, hot tub & sauna',p:[62,16,-50],t:[33,2,-14],cut:'roof'},
   {k:'sauna_in',l:'Inside the sauna (cut open)',p:[34,9.5,-14],t:[38.5,0,-21],cut:'main'},
   {k:'shed',l:'Shed',p:[40,16,-58],t:[6.8,2,-87],cut:'roof'},
   Object.assign({k:'trail',l:'Trail access from the backyard',cut:'roof',geo:1},geoV([r0[2][0]+160,r0[2][1]-260,140],[r0[2][0],r0[2][1]+120,0])),
   Object.assign({k:'lot',l:'Lot boundary (aerial)',cut:'roof',geo:1},geoV([hc[0]+380,hc[1]-900,820],[hc[0]-60,hc[1]+20,0])),
   Object.assign({k:'vasa',l:'Connector to VASA',cut:'roof',geo:1},geoV([j[0]+900,j[1]-1900,1400],[ (hc[0]+j[0])/2, (hc[1]+j[1])/2+300,0])),
   Object.assign({k:'region',l:'VASA trail system (region)',cut:'roof',geo:1},geoV([hc[0]+5200,hc[1]-9000,9500],[th[0]+1500,th[1]+4500,0])),
  ];
  V.forEach(v=>{if(!v.geo){v.pw=toWorld(...v.p);v.tw=toWorld(...v.t);}});
  const ol=$('#views'); ol.innerHTML=''; V.forEach((v,i)=>{const li=document.createElement('li');li.textContent=v.l;if(v.geo)li.className='geo';li.onclick=()=>goView(v.k);ol.appendChild(li);});
}
function setCut(v,anim){$('#cut').value=v; applyCut();}
function applyCut(){const s=+$('#cut').value; const lerp3=(a,b,c)=>s<=1?a+(b-a)*s:b+(c-b)*(s-1);
  clipH.constant=lerp3(-1.4,8.0,400); clipG.constant=lerp3(-0.55,9.9,400); L.roof.visible=layerOn.roof&&s>1.55;
  LABELS.forEach(l=>{l.cutOk=l.lv==='lower'?s<0.55:(['main','garage'].includes(l.lv)?s>=0.55&&s<1.6:true);});}
// ---- layers UI ----
const layerOn={};
function buildLayerUI(){const ul=$('#layers');LAYERS.forEach(([k,lab,on,c])=>{layerOn[k]=on;const li=document.createElement('li');li.innerHTML=`<span class="eye">👁</span>${lab}<span class="sw" style="background:${c}"></span>`;
  li.onclick=()=>{layerOn[k]=!layerOn[k];li.classList.toggle('off',!layerOn[k]);L[k].visible=layerOn[k];applyCut();};ul.appendChild(li);});}
// ---- camera animation ----
let anim=null;
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function flyTo(pw,tw,dur,cb){const p0=cam.position.clone(),t0=ctl.target.clone();const d=p0.distanceTo(pw);dur=dur||Math.min(3.2,0.9+Math.log10(1+d/40)*0.9);
  anim={t:0,dur,p0,t0,p1:pw.clone(),t1:tw.clone(),lift:d>250?Math.min(d*0.35,6000):0,cb};}
function goView(k,instant){const v=V.find(x=>x.k===k);if(!v)return;stopTour();setMode('orbit');setCut(CUT[v.cut]);
  if(instant||SHOT){cam.position.copy(v.pw);ctl.target.copy(v.tw);ctl.update();}else flyTo(v.pw,v.tw);
  $$('#views li').forEach((li,i)=>li.classList.toggle('on',V[i]===v)); status(v.l);}
// ---- modes: orbit / fly / walk ----
let MODE='orbit'; const keys={}; let yaw=0,pitch=0;
function setMode(m){if(m===MODE)return;MODE=m;$$('#modes button').forEach(b=>b.classList.toggle('on',b.dataset.mode===m));
  ctl.enabled=(m==='orbit');$('#joy').classList.toggle('hidden',m==='orbit'||!('ontouchstart' in window));
  if(m==='orbit'){const f=new THREE.Vector3();cam.getWorldDirection(f);ctl.target.copy(cam.position).addScaledVector(f,Math.max(20,heightAboveGround()*1.2));ctl.update();}
  else{const f=new THREE.Vector3();cam.getWorldDirection(f);yaw=Math.atan2(-f.x,-f.z);pitch=Math.asin(THREE.MathUtils.clamp(f.y,-1,1));
    if(m==='walk'){const p=cam.position;cam.position.y=floorAt(p)+5.5;pitch=0;}}
  status(m==='orbit'?'Orbit: drag to rotate, right-drag to pan, scroll to zoom':m==='fly'?'Fly: W A S D to move, Q / E down / up, Shift for speed, drag to look':'Walk at eye height: W A S D, drag to look');}
function heightAboveGround(){const p=cam.position;return Math.max(5,p.y-groundY(p.x,-p.z));}
function floorAt(p){const m=p.clone().applyMatrix4(w2m);const inH=m.x>0&&m.x<54&&m.z>0&&m.z<34, inG=m.x>-40&&m.x<0.5&&m.z>-4.5&&m.z<46;
  if(inH){const s=+$('#cut').value;return (p.y<-2||s<0.55)?LZ:0;} if(inG)return GZ; return groundY(p.x,-p.z);}
let drag=null;
R.domElement.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,moved:0,id:e.pointerId,btn:e.button};});
addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved+=Math.abs(dx)+Math.abs(dy);drag.x=e.clientX;drag.y=e.clientY;
  if(MODE!=='orbit'){yaw-=dx*0.004;pitch=THREE.MathUtils.clamp(pitch-dy*0.004,-1.45,1.45);}});
addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const click=drag.moved<6&&drag.btn===0;drag=null;if(click)onClick(e);});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;keys[e.code]=true;if(TOUR&&!['ShiftLeft','ShiftRight'].includes(e.code)){stopTour();}
  const k=e.key;
  if(k==='f'||k==='F'){if(!e.ctrlKey)setMode(MODE==='fly'?'orbit':'fly');}
  else if(k==='g'||k==='G')setMode(MODE==='walk'?'orbit':'walk');else if(k==='o'||k==='O')setMode('orbit');
  else if(k==='m'||k==='M')setTool(TOOL==='measure'?'select':'measure');else if(k==='i'||k==='I')setTool('select');
  else if(k==='t'||k==='T')startTour();else if(k==='?')$('#help').classList.toggle('hidden');
  else if(k==='Escape'){clearMeasure();$('#info').classList.add('hidden');$('#help').classList.add('hidden');}
  else if(k==='Home')goView('overview');
  else if((k==='h'||k==='H')&&e.altKey){unhideAll();}else if(k==='h'||k==='H'){hideSelected();}
  else if(e.code==='Numpad7'||e.code==='Numpad1'||e.code==='Numpad3'){axisView(e.code,e.ctrlKey);}
  else if(e.code==='NumpadDecimal'||k==='.'){frameSelected();}
  else if(/^Digit[1-9]$/.test(e.code)&&MODE==='orbit'){const v=V[+e.code.slice(5)-1];if(v)goView(v.k);}
});
addEventListener('keyup',e=>{keys[e.code]=false;});
function axisView(code,neg){const t=ctl.target.clone(),d=Math.max(cam.position.distanceTo(t),60);let off;
  if(code==='Numpad7')off=new THREE.Vector3(0,d,0.001);else if(code==='Numpad1')off=new THREE.Vector3(0,d*0.05,neg?-d:d);else off=new THREE.Vector3(neg?-d:d,d*0.05,0);
  setMode('orbit');flyTo(t.clone().add(off),t,0.8);}
// joystick (touch, fly/walk)
const joy={x:0,y:0};(()=>{const J=$('#joy'),K=$('#joyKnob');let id=null;
  J.addEventListener('pointerdown',e=>{id=e.pointerId;J.setPointerCapture(id);e.stopPropagation();});
  J.addEventListener('pointermove',e=>{if(e.pointerId!==id)return;const r=J.getBoundingClientRect();let x=(e.clientX-r.left-60)/50,y=(e.clientY-r.top-60)/50;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}joy.x=x;joy.y=y;K.style.left=(40+x*40)+'px';K.style.top=(40+y*40)+'px';e.stopPropagation();});
  const end=e=>{if(e.pointerId!==id)return;id=null;joy.x=joy.y=0;K.style.left='40px';K.style.top='40px';};J.addEventListener('pointerup',end);J.addEventListener('pointercancel',end);})();
function navStep(dt){if(MODE==='orbit')return;const fwd=new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
  const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));let sp=MODE==='walk'?6:Math.max(12,heightAboveGround()*0.9);if(keys.ShiftLeft||keys.ShiftRight)sp*=4;
  const mv=new THREE.Vector3();const f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joy.y, s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x;
  if(MODE==='walk'){const fl=new THREE.Vector3(fwd.x,0,fwd.z).normalize();mv.addScaledVector(fl,f).addScaledVector(right,s);}else{mv.addScaledVector(fwd,f).addScaledVector(right,s);mv.y+=(keys.KeyE?1:0)-(keys.KeyQ?1:0);}
  cam.position.addScaledVector(mv,sp*dt);if(MODE==='walk')cam.position.y+= (floorAt(cam.position)+5.5-cam.position.y)*Math.min(1,dt*8);
  else{const gy=groundY(cam.position.x,-cam.position.z)+3;if(cam.position.y<gy&&!insideHouse(cam.position))cam.position.y=gy;}
  cam.lookAt(cam.position.clone().add(fwd));}
function insideHouse(p){const m=p.clone().applyMatrix4(w2m);return m.x>-41&&m.x<55&&m.z>-6&&m.z<47;}

// ---- identify / measure / hide ----
let TOOL='select', SEL=null; const ray=new THREE.Raycaster(); const HIDDEN=[];
function setTool(t){TOOL=t;$$('#tools button').forEach(b=>b.classList.toggle('on',b.dataset.tool===t));if(t!=='measure')clearMeasure();status(t==='measure'?'Measure: click the first point':'Identify: click anything');}
function pick(e){const r=R.domElement.getBoundingClientRect();const v=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
  ray.setFromCamera(v,cam);const objs=[];LAYERS.forEach(([k])=>{if(L[k].visible&&k!=='trails'&&k!=='boundary')L[k].traverse(o=>{if(o.isMesh&&o.visible)objs.push(o);});});
  const hits=ray.intersectObjects(objs,false).filter(h=>{if(!h.point)return false;const mt=h.object.material;const pl=mt&&mt.clippingPlanes;if(pl&&pl.length&&pl[0].distanceToPoint(h.point)<0)return false;return true;});
  return {hit:hits[0],ndc:v};}
function pickLine(e){const r=R.domElement.getBoundingClientRect();let best=null,bd=9;const sv=new THREE.Vector3();
  LINES.forEach(o=>{if(!L[o.layer].visible||!o.P)return;for(let i=0;i<o.P.length;i+=1){sv.copy(o.P[i]).project(cam);if(sv.z>1)continue;const x=(sv.x+1)/2*r.width,y=(1-sv.y)/2*r.height;const d=Math.hypot(x-(e.clientX-r.left),y-(e.clientY-r.top));
    if(d<bd+(o.width>4?3:0)){bd=d;best={o,p:o.P[i]};}}});return best;}
function onClick(e){if(TOUR){stopTour();return;}
  const {hit}=pick(e);
  if(TOOL==='measure'){if(hit)addMeasurePoint(hit.point);return;}
  const ln=pickLine(e); if(ln&&(!hit||ln.p.distanceTo(cam.position)<hit.distance+40)){showInfo(ln.o.info);SEL={line:ln.o,point:ln.p};return;}
  if(!hit){$('#info').classList.add('hidden');SEL=null;return;}
  let info=null;const o=hit.object;if(o.isInstancedMesh&&hit.instanceId!=null){info=o.userData.infos[hit.instanceId];SEL={mesh:o,id:hit.instanceId,point:hit.point};}
  else{let q=o;while(q&&!q.userData.info)q=q.parent;info=q&&q.userData.info;SEL={obj:o,point:hit.point};}
  if(info){const [lo,la]=enu2ll(hit.point.x,-hit.point.z);showInfo(info,hit.point);}}
function showInfo(i,pt){const b=$('#infoBody');let h=`<h3>${i.name}</h3>`;if(i.layer)h+=`<span class="tag">${i.layer}</span>`;if(i.room)h+=`<span class="tag">${i.room}</span>`;
  if(i.dist)h+=`<div><span class="k">Distance:</span> ${i.dist}</div>`;if(i.dims)h+=`<div><span class="k">Size:</span> ${i.dims}</div>`;if(i.src)h+=`<div><span class="k">Source:</span> ${clean(i.src)}</div>`;if(i.note)h+=`<p>${i.note}</p>`;
  if(pt&&GEO){const [lo,la]=enu2ll(pt.x,-pt.z);}
  h+=`<div class="k" style="margin-top:6px;font-size:11px">Press H to hide it or . to frame it</div>`;b.innerHTML=h;$('#info').classList.remove('hidden');}
function hideSelected(){if(!SEL)return;if(SEL.mesh){const m=new THREE.Matrix4();SEL.mesh.getMatrixAt(SEL.id,m);HIDDEN.push({mesh:SEL.mesh,id:SEL.id,m:m.clone()});m.makeScale(0,0,0);SEL.mesh.setMatrixAt(SEL.id,m);SEL.mesh.instanceMatrix.needsUpdate=true;}
  else if(SEL.obj){HIDDEN.push({obj:SEL.obj});SEL.obj.visible=false;}else if(SEL.line){HIDDEN.push({obj:SEL.line.mesh});SEL.line.mesh.visible=false;}$('#info').classList.add('hidden');SEL=null;status('Hidden. Alt+H shows everything again.');}
function unhideAll(){HIDDEN.forEach(h=>{if(h.mesh){h.mesh.setMatrixAt(h.id,h.m);h.mesh.instanceMatrix.needsUpdate=true;}else h.obj.visible=true;});HIDDEN.length=0;status('Everything is visible again');}
function frameSelected(){if(!SEL||!SEL.point)return;const t=SEL.point.clone();const d=SEL.line?600:18;const dir=cam.position.clone().sub(ctl.target).normalize();setMode('orbit');flyTo(t.clone().addScaledVector(dir,d),t,1.0);}
const MS={pts:[],objs:[]};
function addMeasurePoint(p){if(MS.pts.length>=2)clearMeasure();MS.pts.push(p.clone());const s=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshBasicMaterial({color:0xffb74d,depthTest:false}));s.renderOrder=20;s.position.copy(p);s.userData.ms=1;scene.add(s);MS.objs.push(s);
  if(MS.pts.length===2){const [a,b]=MS.pts;const g=lineGeom([a,b]);const m=new THREE.Mesh(g,lineMat(0xffb74d,3));m.renderOrder=20;m.frustumCulled=false;m.material.depthTest=false;scene.add(m);MS.objs.push(m);
    const d=a.distanceTo(b),hz=Math.hypot(a.x-b.x,a.z-b.z),dz=b.y-a.y;const txt=`${fmtDist(d)}  ·  level ${fmtDist(hz)}  ·  rise ${fmtFtIn(dz)}`;
    $('#measureOut').textContent=txt;$('#measureOut').classList.remove('hidden');MS.lbl=addLabel(fmtDist(d),a.clone().add(b).multiplyScalar(.5),'ms','__always','geo');status('Measured. Click again to start a new measurement, or press Esc.');}
  else status('Measure: click the second point');}
function clearMeasure(){MS.objs.forEach(o=>scene.remove(o));MS.objs=[];MS.pts=[];if(MS.lbl){MS.lbl.el.remove();LABELS.splice(LABELS.indexOf(MS.lbl),1);MS.lbl=null;}$('#measureOut').classList.add('hidden');}
// ---- fly-over tour ----
let TOUR=null;
function tourSteps(){const hc=houseENU(),j=GEO.points[0],sk=GEO.points[1],v25=GEO.points[2],th=GEO.points[3],bt=GEO.points[4],P=GEO.parcel[0];
  const bb=P.reduce((a,p)=>[Math.min(a[0],p[0]),Math.min(a[1],p[1]),Math.max(a[2],p[0]),Math.max(a[3],p[1])],[1e9,1e9,-1e9,-1e9]);const pc=[(bb[0]+bb[2])/2,(bb[1]+bb[3])/2];
  const W_=(e,n,y)=>enu2w(e,n,y); const S=[];
  S.push({p:W_(hc[0]+1800,hc[1]-2600,2200),t:W_(hc[0],hc[1],0),d:0.01,c:'687 Starflower Ln',s:'Grand Traverse County, next to Pere Marquette State Forest land'});
  S.push({p:W_(pc[0]+420,pc[1]-760,520),t:W_(pc[0],pc[1],0),d:5,c:'The lot: about '+GEO.parcel_area_ac+' acres (red line)',s:'Lot line from county parcel GIS, not a survey'});
  [[1,-1],[1,1],[-1,1],[-1,-1]].forEach(([a,b],i)=>S.push({p:W_(pc[0]+a*520,pc[1]+b*520,360),t:W_(pc[0],pc[1],0),d:3.2,c:i==0?'Orbiting the boundary':null}));
  S.push({p:toWorld(-70,40,85),t:toWorld(10,2,0),d:4,c:'House, 40 × 50 garage, deck, sauna and shed',s:'Walls traced from the Cubicasa floor plan at true scale',cut:2});
  const r=GEO.routes[0].p; const n=r.length; const idx=[0,2,Math.floor(n*0.2),Math.floor(n*0.45),Math.floor(n*0.7),n-1];
  idx.forEach((k,i)=>{const a=r[Math.min(k,n-1)],b=r[Math.min(k+6,n-1)];const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;
    S.push({p:W_(a[0]-dx/l*260+120,a[1]-dy/l*260,230),t:W_(b[0],b[1],0),d:i?3.2:3.5,c:i==0?'Out the back: the path past the shed to the state-land two-track':(i==3?'Crossing Supply Rd':null),s:i==0?'Backyard path inferred (under the trees); the two-track is on public land':null});});
  S.push({p:W_(j.p[0]+520,j.p[1]-700,620),t:W_(j.p[0],j.p[1],0),d:3.5,c:"Riley’s Trail (VASA 8k): "+j.mi+' mi from the shed',s:'VASA Singletrack (Orange) is '+sk.mi+' mi'});
  S.push({p:W_(v25.p[0]+1200,v25.p[1]-2600,2200),t:W_((v25.p[0]+j.p[0])/2,(v25.p[1]+j.p[1])/2,0),d:5,c:'VASA Pathway 25k classic loop: '+v25.mi+' mi',s:'Blue = VASA trails · orange = connector routes'});
  S.push({p:W_(th.p[0]+2600,th.p[1]-4200,3600),t:W_(th.p[0],th.p[1],0),d:5,c:'VASA Singletrack trailhead, Supply Rd',s:th.mi+' mi on foot or bike · '+th.drive});
  S.push({p:W_(hc[0]+6000,hc[1]-11000,12000),t:W_(bt.p[0],bt.p[1]-6000,0),d:6,c:'VASA Pathway main trailhead, Bartlett Rd',s:bt.mi+' mi on trails · '+bt.drive});
  S.push({p:W_(hc[0]+1500,hc[1]-2300,1900),t:W_(hc[0],hc[1],0),d:6,c:'Back home',s:'Press T to replay · drag to explore'});
  return S;}
function startTour(){stopTour();setMode('orbit');setCut(2);['terrain','boundary','trails'].forEach(k=>{if(!layerOn[k])$$('#layers li')[LAYERS.findIndex(l=>l[0]===k)].click();});
  TOUR={steps:tourSteps(),i:0};nextTourStep();$('#tourBtn').textContent='■ Stop tour';}
function nextTourStep(){if(!TOUR)return;const s=TOUR.steps[TOUR.i++];if(!s){stopTour(true);return;}
  if(s.cut!=null)setCut(s.cut);if(s.c){$('#caption').innerHTML=s.c+(s.s?'<small>'+s.s+'</small>':'');$('#caption').classList.remove('hidden');}
  if(s.d<0.05){cam.position.copy(s.p);ctl.target.copy(s.t);ctl.update();setTimeout(nextTourStep,900);}else flyTo(s.p,s.t,s.d,nextTourStep);}
function stopTour(keepCaption){if(!TOUR)return;TOUR=null;anim=null;$('#tourBtn').textContent='▶ Fly-over tour';if(!keepCaption)$('#caption').classList.add('hidden');else setTimeout(()=>$('#caption').classList.add('hidden'),4000);}
// ---- labels / compass per frame ----
const _v=new THREE.Vector3();
let INSIDE=false;
function updateLabels(){INSIDE=insideHouse(cam.position)&&cam.position.y<groundY(cam.position.x,-cam.position.z)+16;const w=R.domElement.clientWidth,h=R.domElement.clientHeight;
  LABELS.forEach(l=>{const on=(l.layer==='__always')||(layerOn[l.layer]&&(l.layer!=='outdoor'||true))&&l.cutOk!==false;if(!on){l.el.style.display='none';return;}
    const d=cam.position.distanceTo(l.pos);if(d<l.minD||d>l.maxD||(INSIDE&&l.layer!=='__always'&&!(l.layer==='rooms'&&d<45))){l.el.style.display='none';return;}
    _v.copy(l.pos).project(cam);if(_v.z>1||_v.x<-1.1||_v.x>1.1||_v.y<-1.1||_v.y>1.1){l.el.style.display='none';return;}
    l.el.style.display='block';l.el.style.left=((_v.x+1)/2*w)+'px';l.el.style.top=((1-_v.y)/2*h)+'px';});
  const f=new THREE.Vector3();cam.getWorldDirection(f);const hd=Math.atan2(f.x,-f.z);$('#needle').style.transform=`rotate(${-hd}rad)`;}
$('#compass').onclick=()=>{const t=ctl.target.clone(),d=cam.position.distanceTo(t),el=Math.asin(THREE.MathUtils.clamp((cam.position.y-t.y)/d,-1,1));setMode('orbit');flyTo(t.clone().add(new THREE.Vector3(0,Math.sin(el)*d,Math.cos(el)*d)),t,0.8);};

// ======================= INIT =======================
const CREDITS=[
 'Floor plan: the listing’s Cubicasa scan, traced at its measured scale (24.53 px per ft). Heights come from the house plans and the roof truss set.',
 'Imagery near the house: <a href="https://www.esri.com/">Esri World Imagery</a>, loaded live. Credit: Esri, Maxar, Earthstar Geographics, and the GIS User Community.',
 'Imagery elsewhere: USDA NAIP, Aug 2022, 0.6 m, public domain, via the <a href="https://www.usgs.gov/programs/national-geospatial-program/national-map">USGS National Map</a>. It predates the house.',
 'Terrain: USGS 3DEP 1 m LiDAR DEM (2015 Grand Traverse County / Michigan 13-county projects), resampled to a 3 m grid near the lot and 20 m across the region.',
 'Lot and neighboring lines: Grand Traverse County parcel GIS, geometry only. These are approximate and not a survey.',
 'Trails and roads: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors (ODbL), via the Overpass API. VASA lines were checked against Michigan DNR trail data. Routes are shortest paths on the OSM network.',
 'Rendering: <a href="https://threejs.org">three.js</a> (MIT).'];
function wireUI(){
  $$('#modes button').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));$$('#tools button').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
  $('#tourBtn').onclick=()=>TOUR?stopTour():startTour();$('#helpBtn').onclick=()=>$('#help').classList.toggle('hidden');
  $$('.panel .x').forEach(b=>b.onclick=()=>b.parentElement.classList.add('hidden'));$('#panelBtn').onclick=()=>document.body.classList.toggle('panels');
  $('#cut').oninput=applyCut;$$('.ticks span').forEach(s=>s.onclick=()=>setCut(+s.dataset.cut));
  $$('#imagery button').forEach(b=>b.onclick=()=>{IMG=b.dataset.img;$$('#imagery button').forEach(x=>x.classList.toggle('on',x===b));if(IMG==='esri'&&!TERR_MESH.esriTried)loadEsri();else rebuildTerrain();});
  $('#exag').oninput=()=>{EXAG=+$('#exag').value;$('#exagV').textContent=EXAG+'×';rebuildTerrain();};
  $('#credits').innerHTML=CREDITS.map(c=>'<li>'+c+'</li>').join('');
  addEventListener('resize',()=>{if(SHOT)return;cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();R.setSize(innerWidth,innerHeight);LINES.forEach(o=>o.mat&&o.mat.uniforms.res.value.set(innerWidth,innerHeight));});
}
async function init(){
  status('Loading…');
  const g=GEO_=await (await fetch('explorer/geo.json')).json(); GEO=g; PLAN=await (await fetch('explorer/plan-cubicasa.json')).json();
  HR.rotation.y=-GEO.house.ang; HR.position.set(GEO.house.tx,0,GEO.house.tz); HR.updateMatrixWorld(true); w2m.copy(HR.matrixWorld).invert();
  buildLayerUI(); buildStructure(); buildRoof(); buildFurniture(); buildOutdoor(); flushBoxes(); buildRoomLabels();
  await buildTerrain(); buildGeoVectors(); redrapeLines(); buildViews(); wireUI();
  const hc=houseENU(); sun.position.set(hc[0]-260,420,-hc[1]+260); sun.target.position.set(hc[0],0,-hc[1]);
  if(IMG==='esri')loadEsri(); else $$('#imagery button').forEach(x=>x.classList.toggle('on',x.dataset.img==='naip'));
  const hide=(Q.get('hide')||'').split(',').filter(Boolean); hide.forEach(k=>{if(L[k]){layerOn[k]=false;L[k].visible=false;$$('#layers li')[LAYERS.findIndex(l=>l[0]===k)].classList.add('off');}});
  const v=Q.get('view')||(Q.get('mode')==='flyover'?'lot':'overview'); goView(v,true);
  if(Q.get('cut')!=null)setCut(+Q.get('cut'));
  applyCut(); status(MOBILE?'Drag to orbit · pinch to zoom · ☰ for layers and views':'Drag to orbit · right-drag to pan · 1–9 for views · F fly · M measure · ? help');
  if(Q.get('mode')==='flyover'&&!SHOT)setTimeout(startTour,1200);
  if(SHOT){$('#top').style.display=Q.has('ui')?'':'none';if(!Q.has('ui')){['#left','#right','#status','#compass'].forEach(s=>$(s).style.display='none');}}
  if(Q.has('studio')){$('#labels').style.display='none';cam.fov=+Q.get('fov')||72;cam.updateProjectionMatrix();
    const c=(Q.get('cam')||'').split(',').map(Number);if(c.length===6){cam.position.copy(toWorld(c[0],c[1],c[2]));ctl.target.copy(toWorld(c[3],c[4],c[5]));ctl.update();}
    clipG.constant=40;clipH.constant=40;L.roof.visible=true;hemi.intensity=+(Q.get('hemi')||.5);sun.intensity=+(Q.get('sun')||.6);
    const pi=+(Q.get('pl')||.16);for(const ex of [-30,-10])for(const ey of [38,20,2]){const pl=new THREE.PointLight(0xfff3e2,pi,0,0);pl.position.copy(toWorld(ex,10.5,ey));scene.add(pl);}
    const sc=toWorld(-20,0,22);sun.position.copy(toWorld(-20+70,400,22+90));sun.target.position.copy(sc);sun.target.updateMatrixWorld();
    Object.assign(sun.shadow.camera,{left:-36,right:36,top:36,bottom:-36,near:+(Q.get('near')||398),far:440});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-0.0006;}
  window.EX={scene,cam,ctl,goView,setCut,V,startTour,L,flyTo,loadEsri,TERR_MESH,status,setMode};
}
let GEO_=null; let last=performance.now(), frames=0;
function loop(now){const dt=Math.min(0.05,(now-last)/1000);last=now;
  if(anim){anim.t+=dt/anim.dur;const k=ease(Math.min(anim.t,1));cam.position.lerpVectors(anim.p0,anim.p1,k);cam.position.y+=anim.lift*Math.sin(Math.PI*k);ctl.target.lerpVectors(anim.t0,anim.t1,k);
    cam.lookAt(ctl.target);if(anim.t>=1){const cb=anim.cb;anim=null;ctl.update();cb&&cb();}}
  else if(MODE==='orbit')ctl.update(); else navStep(dt);
  const near=Math.max(0.3,Math.min(5,heightAboveGround()*0.02)); if(Math.abs(cam.near-near)>0.05){cam.near=near;cam.updateProjectionMatrix();}
  R.render(scene,cam); updateLabels(); frames++;
  if(SHOT&&frames>(+Q.get('frames')||40)){window.READY=true;document.title='READY';}
  requestAnimationFrame(loop);}
init().then(()=>requestAnimationFrame(loop)).catch(e=>{console.error(e);status('Error: '+e.message);});
})();
