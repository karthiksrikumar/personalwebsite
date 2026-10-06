import * as T from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

RectAreaLightUniformsLib.init();
const query=new URLSearchParams(location.search);
const W=+(query.get('width')||1920),H=+(query.get('height')||1080);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.localClippingEnabled=true;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;document.body.appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#222b38');scene.fog=new T.FogExp2('#222b38',.023);
const pmrem=new T.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.42;
const camera=new T.PerspectiveCamera(40,W/H,.04,180);
const composer=new EffectComposer(renderer);composer.renderTarget1.samples=4;composer.renderTarget2.samples=4;
composer.renderTarget1.stencilBuffer=true;composer.renderTarget2.stencilBuffer=true;
composer.addPass(new RenderPass(scene,camera));
const ao=new SSAOPass(scene,camera,W,H,16);ao.kernelRadius=7;ao.minDistance=.002;ao.maxDistance=.065;composer.addPass(ao);
const bokeh=new BokehPass(scene,camera,{focus:10,aperture:.000025,maxblur:.0025});composer.addPass(bokeh);composer.addPass(new OutputPass());
const floor=new T.Mesh(new T.PlaneGeometry(1000,1000),new T.MeshStandardMaterial({color:'#273039',roughness:1,metalness:0}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.23;floor.receiveShadow=true;scene.add(floor);
scene.add(new T.HemisphereLight('#ecf3ff','#4a3423',.42));
function area(color,power,position,width,height){const l=new T.RectAreaLight(color,power,width,height);l.position.set(...position);l.lookAt(0,1,0);scene.add(l);return l;}
const softbox=area('#fff0d7',4.2,[-6,6,7],7,6);
const fill=area('#c5ddff',2.7,[6,4,6],6,7);
const ceiling=area('#fff3df',2,[0,9,0],16,8);
function spot(color,power,position){const l=new T.SpotLight(color,power,100,.8,.8,1.5);l.position.set(...position);l.target.position.set(0,1,0);l.castShadow=true;l.shadow.mapSize.set(2048,2048);l.shadow.bias=-.00008;l.shadow.normalBias=.008;l.shadow.camera.near=.3;l.shadow.camera.far=100;scene.add(l,l.target);return l;}
const key=spot('#fff1dc',135,[-5,8,5]);const rim=spot('#8abfff',240,[4,6,-5]);
const printPlane=new T.Plane(new T.Vector3(0,-1,0),100);
const printUniforms={height:{value:100},active:{value:0}};
const capGroup=new T.Group(),capPlanes=[];
const ids=['price-of-power','liberty-tug-of-war (1)','capitol-at-auction','capitol-marionette'];
const models=[],inventory=[];
const rig=new T.Group();scene.add(rig);
const partAnalysis=[];
for(const id of ids){
 const library=await new MTLLoader().loadAsync(`/obj/${encodeURIComponent(id)}.mtl`);library.preload();
 const raw=await new OBJLoader().setMaterials(library).loadAsync(`/obj/${encodeURIComponent(id)}.obj`);
 const sourceBox=new T.Box3().setFromObject(raw),size=sourceBox.getSize(new T.Vector3()),center=sourceBox.getCenter(new T.Vector3());
 const scale=5/Math.max(size.x,size.y,size.z);
 const transform=new T.Matrix4().makeTranslation(-center.x*scale,-sourceBox.min.y*scale,-center.z*scale).multiply(new T.Matrix4().makeScale(scale,scale,scale));
 const batches=new Map(),parts=[];let triangles=0;
 raw.updateMatrixWorld(true);
 raw.traverse(o=>{if(!o.isMesh)return;
  if(Array.isArray(o.material))throw new Error(`Unexpected material array: ${id}/${o.name}`);
  const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld).applyMatrix4(transform);geometry.computeBoundingBox();
  parts.push({name:o.name,box:geometry.boundingBox.clone()});triangles+=(geometry.index?.count||geometry.attributes.position.count)/3;
  const name=o.material.name;if(!batches.has(name))batches.set(name,{material:o.material,geometries:[]});batches.get(name).geometries.push(geometry);
 });
 const group=new T.Group(),sculpture=new T.Group();group.add(sculpture);rig.add(group);
 const isLiberty=id.startsWith('liberty');
 if(isLiberty)group.add(capGroup);
 for(const [name,{material:m,geometries}] of batches){
  const metal=/gold|brass|bronze|gilt|wire|castiron|patina/i.test(name);
  const material=new T.MeshStandardMaterial({name,color:m.color,opacity:m.opacity,transparent:m.opacity<1,depthWrite:m.opacity>=1,
   roughness:metal?.37:.6,metalness:metal?.64:.025,side:T.DoubleSide});
  if(isLiberty){
   material.clippingPlanes=[printPlane];material.clipShadows=true;
   material.onBeforeCompile=shader=>{
    shader.uniforms.printHeight=printUniforms.height;shader.uniforms.printActive=printUniforms.active;
    shader.vertexShader='varying float printedY;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n printedY=(modelMatrix*vec4(transformed,1.0)).y;');
    shader.fragmentShader='varying float printedY; uniform float printHeight; uniform float printActive;\n'+shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
     totalEmissiveRadiance += printActive*vec3(0.32,0.15,0.035)*exp(-abs(printedY-printHeight)*220.0);`);
   };
  }
  const merged=mergeGeometries(geometries);
  const mesh=new T.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;sculpture.add(mesh);
  if(isLiberty){
   const order=100+capPlanes.length*3;
   for(const [side,operation] of [[T.BackSide,T.IncrementWrapStencilOp],[T.FrontSide,T.DecrementWrapStencilOp]]){
    const stencil=new T.MeshBasicMaterial({side,depthWrite:false,depthTest:false,colorWrite:false,clippingPlanes:[printPlane],stencilWrite:true,stencilFunc:T.AlwaysStencilFunc,stencilFail:operation,stencilZFail:operation,stencilZPass:operation});
    const shell=new T.Mesh(merged,stencil);shell.renderOrder=order;capGroup.add(shell);
   }
   const capMaterial=new T.MeshStandardMaterial({color:m.color,metalness:metal?.64:.025,roughness:.6,side:T.DoubleSide,stencilWrite:true,stencilRef:0,stencilFunc:T.NotEqualStencilFunc,stencilFail:T.ReplaceStencilOp,stencilZFail:T.ReplaceStencilOp,stencilZPass:T.ReplaceStencilOp});
   const cap=new T.Mesh(new T.PlaneGeometry(8,8),capMaterial);cap.rotation.x=-Math.PI/2;cap.renderOrder=order+1;cap.onAfterRender=()=>renderer.clearStencil();capGroup.add(cap);capPlanes.push(cap);
  }
 }
 const bounds=new T.Box3().setFromObject(sculpture),extent=bounds.getSize(new T.Vector3());
 const plinth=new T.Mesh(new T.BoxGeometry(extent.x+.45,.2,extent.z+.45),new T.MeshStandardMaterial({color:'#45474a',roughness:.43,metalness:.22}));
 plinth.position.y=-.12;plinth.receiveShadow=true;plinth.castShadow=true;group.add(plinth);
 const trim=new T.Mesh(new T.BoxGeometry(extent.x+.47,.018,extent.z+.47),new T.MeshStandardMaterial({color:'#b58d54',metalness:.7,roughness:.38}));trim.position.y=-.135;group.add(trim);
 const details=parts.filter((p,i)=>isLiberty?i<76:id==='price-of-power'?/main_block|portico|roof|flame/.test(p.name):id==='capitol-at-auction'?/main_|wing_|portico_|dome_|drum|tholos|statue|terrace|step/.test(p.name):true);
 const detailBox=new T.Box3();details.forEach(p=>detailBox.union(p.box));
 models.push({id,group,sculpture,bounds,detailBox,height:extent.y,parts});
 inventory.push({id,source:`obj/${id}.obj`,materialSource:`obj/${id}.mtl`,triangles,parts:parts.length,height:extent.y,materials:[...batches.keys()],bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}});
 partAnalysis.push({id,parts:parts.map(p=>({name:p.name,min:p.box.min.toArray(),max:p.box.max.toArray()}))});
}
window.inventory=inventory;window.assemblyParts=partAnalysis[1].parts;
window.assemblyEvents=['pedestal_base','pedestal_cap','waist_rope','crown_band','torch_flame'].map(name=>{
 const part=models[1].parts.find(p=>p.name===name);return {name,time:43+15.2*part.box.max.y/models[1].height};
});
window.filmCuts=[0,7,16,25,34,43,59,66,75];
const clamp=T.MathUtils.clamp,smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const lerp=T.MathUtils.lerp;
function corners(box){return [0,1,2,3,4,5,6,7].map(i=>new T.Vector3(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z));}
// Fit all eight corners in camera coordinates, including geometry depth, rather than guessing a distance.
function fit(box,azimuth,elevation,margin=1.15,lens=42,keep){
 const target=box.getCenter(new T.Vector3()),a=T.MathUtils.degToRad(azimuth),e=T.MathUtils.degToRad(elevation);
 const direction=new T.Vector3(Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e));
 const right=new T.Vector3(Math.cos(a),0,-Math.sin(a)),up=new T.Vector3().crossVectors(direction,right);
 camera.setFocalLength(lens);const tanV=Math.tan(T.MathUtils.degToRad(camera.fov/2)),tanH=tanV*camera.aspect;
 let distance=0;
 for(const point of corners(box)){const v=point.sub(target);distance=Math.max(distance,v.dot(direction)+margin*Math.max(Math.abs(v.dot(right))/tanH,Math.abs(v.dot(up))/tanV));}
 if(keep)for(const point of corners(keep)){const v=point.sub(target);distance=Math.max(distance,v.dot(direction)+1.055*Math.max(Math.abs(v.dot(right))/tanH,Math.abs(v.dot(up))/tanV));}
 camera.position.copy(target).addScaledVector(direction,distance);camera.lookAt(target);camera.updateMatrixWorld(true);
 bokeh.uniforms.focus.value=distance;
}
let checkBoxes=[],isCollection=false,currentShot='';
function solo(index,u){
 const m=models[index];m.group.visible=true;
 const phase=smooth((u-.36)/.64),box=m.bounds.clone();
 const tightening=index===3?0:.3*phase;
 box.min.lerp(m.detailBox.min,tightening);box.max.lerp(m.detailBox.max,tightening);
 const azimuths=[[25,12],[-8,8],[22,7],[14,-5]][index];
 fit(box,lerp(...azimuths,smooth(u)),index===0?19:index===2?18:10,lerp(1.25,1.1,phase),index===1?38:42,m.bounds);
 checkBoxes=[{id:m.id,box:m.bounds}];
}
function collection(u,end=false){
 const union=new T.Box3();checkBoxes=[];isCollection=true;
 models.forEach((m,i)=>{m.group.visible=true;m.group.position.x=(i-1.5)*6.6;const box=m.bounds.clone().translate(m.group.position);union.union(box);checkBoxes.push({id:m.id,box});});
 fit(union,end?lerp(-1.5,0,smooth(Math.min(1,u/.68))):lerp(1.8,0,smooth(u)),10,end?lerp(1.16,1.1,smooth(Math.min(1,u/.68))):lerp(1.25,1.12,smooth(u)),35);
 softbox.width=28;softbox.position.set(-7,7,9);softbox.lookAt(0,1,0);softbox.intensity=5;
 fill.width=28;fill.position.set(8,6,7);fill.lookAt(0,1,0);fill.intensity=3.8;
 ceiling.width=30;ceiling.intensity=3;scene.environmentIntensity=.5;
 key.position.set(-10,12,9);key.target.position.set(0,1,0);key.angle=1.1;key.intensity=320;
 rim.position.set(8,10,-7);rim.target.position.set(0,1,0);rim.angle=1.2;rim.intensity=430;
}
window.renderFrame=time=>{
 const t=clamp(time,0,75);models.forEach(m=>{m.group.visible=false;m.group.position.set(0,0,0);});
 isCollection=false;checkBoxes=[];printPlane.constant=100;printUniforms.height.value=100;printUniforms.active.value=0;
 capGroup.visible=t>=43&&t<58.2;ao.enabled=t<43||t>=59;bokeh.enabled=ao.enabled;
 softbox.width=7;softbox.position.set(-6,6,7);softbox.lookAt(0,1,0);softbox.intensity=4.2;
 fill.width=6;fill.position.set(6,4,6);fill.lookAt(0,1,0);fill.intensity=2.7;ceiling.width=16;ceiling.intensity=2;
 scene.environmentIntensity=.42;renderer.toneMappingExposure=1.12;
 key.position.set(-5+Math.sin(t*.13)*2,8,5);key.target.position.set(0,1,0);key.angle=.8;key.intensity=135;
 rim.position.set(4,6,-5);rim.target.position.set(0,1.5,0);rim.angle=.8;rim.intensity=240;
 if(t<7){currentShot='collection-opening';collection(t/7);}
 else if(t<43){const index=Math.min(3,Math.floor((t-7)/9));currentShot=ids[index];solo(index,(t-7-index*9)/9);}
 else if(t<59){
  currentShot='liberty-layer-build';const m=models[1];m.group.visible=true;
  const progress=clamp((t-43)/15.2,0,1),height=Math.ceil(progress*360)/360*m.height;
  printPlane.constant=height;printUniforms.height.value=height;printUniforms.active.value=progress<1?1:0;
  capPlanes.forEach(cap=>{cap.position.y=height+.0001;});
  fit(m.bounds,lerp(-12,8,smooth((t-43)/16)),14,1.13,40);checkBoxes=[{id:m.id,box:m.bounds}];
 }else if(t<66){
  currentShot='liberty-completed-detail';const m=models[1];m.group.visible=true;
  const u=smooth((t-59)/7),box=m.bounds.clone();box.min.lerp(m.detailBox.min,.3*u);box.max.lerp(m.detailBox.max,.3*u);
  fit(box,lerp(8,0,u),12,lerp(1.16,1.1,u),42,m.bounds);checkBoxes=[{id:m.id,box:m.bounds}];
 }else{currentShot='collection-finale';collection((t-66)/9,true);}
 composer.render();return {time:t,shot:currentShot};
};
window.checkComposition=()=>{
 const rects=checkBoxes.map(({id,box})=>{const p=corners(box).map(v=>v.project(camera));return {id,minX:Math.min(...p.map(v=>v.x)),maxX:Math.max(...p.map(v=>v.x)),minY:Math.min(...p.map(v=>v.y)),maxY:Math.max(...p.map(v=>v.y))};});
 const cropped=rects.filter(r=>r.minX<-.99||r.maxX>.99||r.minY<-.99||r.maxY>.99);
 const overlaps=[];if(isCollection)for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++)if(Math.min(rects[i].maxX,rects[j].maxX)>Math.max(rects[i].minX,rects[j].minX))overlaps.push([rects[i].id,rects[j].id]);
 return {shot:currentShot,rects,cropped,overlaps};
};
window.checkCameraClearance=()=>{
 scene.updateMatrixWorld(true);const ray=new T.Raycaster();ray.near=0;ray.far=camera.near*2;
 const meshes=[];rig.traverseVisible(o=>{if(o.isMesh)meshes.push(o);});const hits=[];
 for(const [x,y] of [[0,0],[-1,-1],[1,-1],[-1,1],[1,1]]){ray.setFromCamera(new T.Vector2(x,y),camera);for(const h of ray.intersectObjects(meshes,false))hits.push({name:h.object.name,distance:h.distance});}return hits;
};
window.renderFrame(70);window.filmReady=true;
