import * as T from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
RectAreaLightUniformsLib.init();

const query = new URLSearchParams(location.search);
const W = +(query.get('width') || 1920), H = +(query.get('height') || 1080);
const renderer = new T.WebGLRenderer({ antialias:true, preserveDrawingBuffer:true, powerPreference:'high-performance' });
renderer.setSize(W,H); renderer.setPixelRatio(1);
renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.1;
renderer.outputColorSpace=T.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene=new T.Scene(); scene.background=new T.Color('#05070a');
scene.fog=new T.FogExp2('#05070a',.014);
const pmrem=new T.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;
scene.environmentIntensity=.23;
const camera=new T.PerspectiveCamera(35,W/H,.04,150);
const composer=new EffectComposer(renderer);
composer.renderTarget1.samples=4;composer.renderTarget2.samples=4;
composer.addPass(new RenderPass(scene,camera));
const ao=new SSAOPass(scene,camera,W,H,16);ao.kernelRadius=9;ao.minDistance=.002;ao.maxDistance=.075;composer.addPass(ao);
const bokeh=new BokehPass(scene,camera,{focus:7,aperture:.00014,maxblur:.006});
composer.addPass(bokeh); composer.addPass(new OutputPass());
const floor=new T.Mesh(new T.PlaneGeometry(160,160),new T.MeshStandardMaterial({color:'#0c0f14',roughness:.48,metalness:.22}));
floor.rotation.x=-Math.PI/2; floor.position.y=-.12; floor.receiveShadow=true; scene.add(floor);
const rig=new T.Group(); scene.add(rig);
function spot(color,power,pos,size){
 const l=new T.SpotLight(color,power,70,Math.PI/5,.8,1.5); l.position.set(...pos); l.castShadow=true;
 l.shadow.mapSize.set(size,size); l.shadow.bias=-.00008; l.shadow.normalBias=.008;
 l.shadow.camera.near=.5; l.shadow.camera.far=70; scene.add(l,l.target); return l;
}
const key=spot('#ffe4c3',300,[-5,8,5],2048);
const rim=spot('#b7d7ff',380,[3,6,-4],2048);
const fill=new T.RectAreaLight('#c9deff',3,5,7);fill.position.set(6,3,4);fill.lookAt(0,1,0);scene.add(fill);
scene.add(new T.HemisphereLight('#b8c4de','#1c1510',.22));
const ids=['capitol-at-auction','capitol-marionette','price-of-power','machina-mundi','stadium','south-windsor-high-school','blocky-cow','head'];
const models=[], inventory=[];
for(const id of ids){
 let object, materialNames=[];
 if(id==='head'){
  const g=await new STLLoader().loadAsync('/obj/head.stl');g.computeVertexNormals();g.computeBoundingBox();
  const size=g.boundingBox.getSize(new T.Vector3());if(size.z>size.y*1.12)g.rotateX(-Math.PI/2);
  object=new T.Group();object.add(new T.Mesh(g,new T.MeshStandardMaterial({name:'scan porcelain',color:'#ccc0a5',roughness:.53})));
 }else{
  const lib=await new MTLLoader().loadAsync(`/obj/${id}.mtl`);lib.preload();
  object=await new OBJLoader().setMaterials(lib).loadAsync(`/obj/${id}.obj`);
 }
 let sourceParts=0;object.traverse(o=>{if(o.isMesh)sourceParts++;});
 // Batch static draw calls by original material. All source triangles are retained.
 if(id!=='capitol-at-auction' && id!=='head'){
  object.updateMatrixWorld(true);const batches=new Map();
  object.traverse(o=>{if(!o.isMesh)return;if(Array.isArray(o.material))throw new Error('Unexpected multi-material OBJ mesh');
   const k=o.material.name;if(!batches.has(k))batches.set(k,{material:o.material,geometries:[]});
   batches.get(k).geometries.push(o.geometry.clone().applyMatrix4(o.matrixWorld));
  });
  object=new T.Group();for(const {material,geometries} of batches.values())object.add(new T.Mesh(mergeGeometries(geometries),material));
 }
 const box=new T.Box3().setFromObject(object), size=box.getSize(new T.Vector3()), center=box.getCenter(new T.Vector3());
 const scale=4/Math.max(size.x,size.y,size.z);
 object.scale.setScalar(scale);object.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
 const group=new T.Group();group.add(object);rig.add(group);group.updateMatrixWorld(true);
 const parts=[]; let triangles=0;
 object.traverse(o=>{if(!o.isMesh)return;
  o.castShadow=true;o.receiveShadow=true;
  const convert=m=>{
   materialNames.push(m.name);
   const metal=/brass|gold|gilt|wire|steel|metal|copper|bronze/i.test(m.name);
   const n=new T.MeshStandardMaterial({name:m.name,color:m.color,opacity:m.opacity,transparent:m.opacity<1,depthWrite:m.opacity>=1,metalness:metal?.78:.04,roughness:metal?.3:.57,side:T.DoubleSide});
   // Microscopic surface modulation, without altering the supplied silhouette.
   n.onBeforeCompile=s=>{
    s.vertexShader='varying vec3 filmPosition;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n filmPosition = position;');
    s.fragmentShader='varying vec3 filmPosition;\n'+s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor = clamp(roughnessFactor + 0.025*sin(filmPosition.x*197.0)*sin(filmPosition.y*313.0),0.12,0.95);`);};
   return n;
  };
  o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);
  const b=new T.Box3().setFromObject(o);
  triangles+=(o.geometry.index?.count || o.geometry.attributes.position.count)/3;
  parts.push({mesh:o,base:o.position.y,lo:b.min.y,hi:b.max.y});
 });
 parts.sort((a,b)=>a.lo-b.lo||a.hi-b.hi);
 const height=size.y*scale;
 const plinth=new T.Mesh(new T.CylinderGeometry(2.55,2.62,.14,96),new T.MeshStandardMaterial({color:'#111318',metalness:.45,roughness:.34}));
 plinth.position.y=-.075;plinth.receiveShadow=true;plinth.castShadow=true;group.add(plinth);
 models.push({id,group,object,parts,height,scale});
 inventory.push({id,triangles,parts:sourceParts,height,materials:[...new Set(materialNames)]});
}
window.inventory=inventory;
window.assemblyParts=models[0].parts.map(p=>({name:p.mesh.name,lo:p.lo,hi:p.hi,base:p.base}));
const foundation=models[0].parts.find(p=>p.mesh.name==='platform_body').lo;
const buildStart=p=>p.mesh.name.startsWith('platform_')?0:Math.max(0,.84*(.8*p.lo+.2*p.hi-foundation)/(models[0].height-foundation));
window.assemblyEvents=models[0].parts.filter(p=>/^(platform_body|terrace|main_block|main_cornice|dome_podium|drum|dome_shell|tholos|statue_head)$/.test(p.mesh.name)).map(p=>{
 const target=Math.min(1,Math.max(0,(buildStart(p)+.115-.02)/.98));let a=0,b=1;
 for(let i=0;i<40;i++){const u=(a+b)/2;if(u*u*(3-2*u)<target)a=u;else b=u;}
 return {name:p.mesh.name,time:20+16.4*(a+b)/2};
});
const smooth=t=>{t=T.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const vec=(a,b,t)=>new T.Vector3(...a).lerp(new T.Vector3(...b),smooth(t));
function shot(index,t,p0,p1,a0,a1,lens=65){
 const m=models[index];m.group.visible=true;
 camera.setFocalLength(lens);camera.position.copy(vec(p0,p1,t));
 const target=vec(a0,a1,t);camera.lookAt(target);
 bokeh.uniforms.focus.value=camera.position.distanceTo(target);
}
function gallery(t,wide){
 const positions=[[-3.5,0,0],[3.5,0,0],[-3.6,0,-6],[3.6,0,-6],[-8.2,0,-6],[8.2,0,-6],[-8.2,0,0],[8.2,0,0]];
 models.forEach((m,i)=>{m.group.visible=true;m.group.position.set(...positions[i]);m.group.rotation.y=i===3?-.2:0;m.group.scale.setScalar(i>3?.72:1);});
 camera.setFocalLength(wide?38:42);
 camera.position.copy(wide?vec([1,9,26],[0,10,28],t):vec([-.25,2.4,1.2],[.4,4.9,13],t));
 const target=wide?new T.Vector3(0,1,-2):vec([2,2.2,-5],[0,1,-2],t);camera.lookAt(target);bokeh.uniforms.focus.value=camera.position.distanceTo(target);
 bokeh.uniforms.aperture.value=.00005;
 key.position.set(-8,13,7);key.target.position.set(0,0,-2);key.angle=.95;key.intensity=400;
 rim.position.set(5,11,-12);rim.target.position.set(0,1,-2);rim.angle=1;rim.intensity=450;
 scene.environmentIntensity=.3; fill.intensity=1.4;
}
window.renderFrame=(time)=>{
 const t=Math.max(0,Math.min(60,time));
 models.forEach(m=>{m.group.visible=false;m.group.position.set(0,0,0);m.group.rotation.set(0,0,0);m.group.scale.setScalar(1);m.parts.forEach(p=>{p.mesh.visible=true;p.mesh.position.y=p.base;});});
 key.position.set(-5+Math.sin(t*.16)*1.6,8,5);key.target.position.set(0,1.2,0);key.angle=Math.PI/5;key.intensity=110;
 rim.position.set(3,6,-4);rim.target.position.set(0,1.8,0);rim.angle=Math.PI/5;rim.intensity=170;
 fill.intensity=1;scene.environmentIntensity=.2;renderer.toneMappingExposure=1;
 bokeh.uniforms.aperture.value=.00012;bokeh.uniforms.maxblur.value=.005;
 const h=models[0].height;
 if(t<8){const u=t/8;
  shot(0,u,[2.1,1.1,3.1],[5.5,3.6,8.2],[.15,.95,.4],[0,h*.45,0],75);
  key.intensity*=smooth(t/5);rim.intensity*=.08+.92*smooth(t/6);fill.intensity*=smooth(t/7);
  renderer.toneMappingExposure*=.04+.96*smooth(t/3.5);scene.environmentIntensity*=smooth(t/5);
 }else if(t<12){shot(1,(t-8)/4,[3.6,2.6,5.6],[3.05,2.85,5.1],[0,2.1,0],[0,2.3,0],90);
 }else if(t<16){shot(2,(t-12)/4,[-3.8,2.7,5.6],[-3.2,2.3,5.2],[0,1.5,0],[.2,1.3,0],85);
 }else if(t<20){shot(3,(t-16)/4,[1.9,4.3,4.1],[1.45,3.8,3.8],[0,.6,0],[.1,.8,0],85);
 }else if(t<38){
  const u=(t-20)/18, build=.02+.98*smooth(Math.min(1,(t-20)/16.4));
  if(t<25)shot(0,(t-20)/5,[3.8,1.55,5.9],[3.45,1.9,5.65],[0,.25,0],[0,.7,0],70);
  else if(t<33.5)shot(0,(t-25)/8.5,[3.5,2.1,5.5],[3.1,4.2,5.6],[0,.9,0],[0,h*.88,0],78);
  else shot(0,(t-33.5)/4.5,[4.6,4.6,7.3],[5.5,4.5,9],[0,h*.57,0],[0,h*.48,0],58);
  const m=models[0];m.parts.forEach(p=>{
   const start=buildStart(p);
   const progress=smooth((build-start)/.115);
   p.mesh.visible=build>start;
   p.mesh.position.y=p.base+(1-progress)*.45/m.scale;
  });
 }else if(t<44){gallery((t-38)/6,false);
 }else if(t<50){gallery((t-44)/6,true);
 }else{
  const u=smooth(Math.min(1,(t-50)/7.1));
  shot(0,u,[4.7,3.4,7.1],[6.7,4.5,10.3],[0,h*.52,0],[0,h*.45,0],55);
  key.intensity*=.8+.2*smooth((t-50)/4);
 }
 composer.render();
 // Letterbox-free 1080p frame; fading is applied once during encoding.
 return {time:t,drawCalls:renderer.info.render.calls};
};
window.checkCameraClearance=()=>{
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 const ray=new T.Raycaster();ray.near=0;ray.far=camera.near*2;
 const meshes=[];rig.traverseVisible(o=>{if(o.isMesh)meshes.push(o);});
 const hits=[];
 for(const [x,y] of [[0,0],[-1,-1],[1,-1],[-1,1],[1,1]]){
  ray.setFromCamera(new T.Vector2(x,y),camera);
  for(const hit of ray.intersectObjects(meshes,false))hits.push({name:hit.object.name,distance:hit.distance});
 }
 return hits;
};
window.renderFrame(55);window.filmReady=true;
