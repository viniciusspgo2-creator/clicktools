import fs from 'node:fs';
import Module from 'node:module';
import {createRequire} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
const root=new URL('../../',import.meta.url).pathname.replace(/\/$/,'');
const require=createRequire(root+'/package.json');const ts=require('typescript');
Module._extensions['.ts']=(mod,filename)=>{const result=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,esModuleInterop:true}});mod._compile(result.outputText,filename);};
const {useMockupStore:store}=require(root+'/src/components/tools/mockup/state/store.ts');
const {adjustPixels}=require(root+'/src/components/tools/mockup/lib/art-adjustments.ts');
const {resolvePrintArea,PRINT_TOP_MAX,CIRC_CM}=require(root+'/src/components/tools/mockup/lib/config.ts');
const {buildModel,supportHeight,MODELS}=require(root+'/src/components/tools/mockup/scene/model-geometry.ts');
const THREE=require('three');
test('full-height full-wrap default plus legacy press mode',()=>{store.getState().resetAll();const area=resolvePrintArea(store.getState().art);assert.equal(area.printBottom,0);assert.equal(area.printTop,PRINT_TOP_MAX);assert.equal(area.arcCm,CIRC_CM);assert.ok(Math.abs(resolvePrintArea({areaMode:'padrao'}).heightCm-8.7)<.001);});
test('neutral image adjustments preserve every RGBA byte',()=>{const pixels=new Uint8ClampedArray([0,0,0,0,19,128,254,255,255,64,8,128]);const original=pixels.slice();adjustPixels(pixels,3,1,{});assert.deepEqual(pixels,original);});
test('color changes preserve alpha and sharpening leaves flat fields unchanged',()=>{const p=new Uint8ClampedArray(9*4).fill(100);for(let i=3;i<p.length;i+=4)p[i]=128;const o=p.slice();adjustPixels(p,3,3,{sharpness:.7});assert.deepEqual(p,o);adjustPixels(p,3,3,{brightness:.5,temperature:.3});assert.ok(p[0]>100);for(let i=3;i<p.length;i+=4)assert.equal(p[i],128);});
test('clone separates the full piece including handle and keeps artwork independent',()=>{store.getState().resetAll();const s=store.getState();s.select('hero');s.duplicateSelected();const c=store.getState().companions[0];assert.ok(Math.hypot(c.posX-s.mug.posX,c.posZ-s.mug.posZ)>=14);s.patchObjectArt(c.id,{text:'Independent'});assert.notEqual(store.getState().art.text,'Independent');});
test('locks prevent transforms and artwork edits',()=>{const c=store.getState().companions[0];const s=store.getState();s.patchObject(c.id,{locked:true});s.patchObject(c.id,{posX:90});s.patchObjectArt(c.id,{text:'blocked'});const current=store.getState().companions[0];assert.equal(current.posX,c.posX);assert.notEqual(current.art.text,'blocked');s.patchObject(c.id,{locked:false});});
test('undo redo retain objects and layer order',()=>{const s=store.getState();s.select('hero');const before=store.getState().companions.length;s.duplicateSelected();const id=store.getState().companions.at(-1).id;s.undo();assert.equal(store.getState().companions.length,before);s.redo();assert.equal(store.getState().companions.length,before+1);assert.ok(store.getState().layerOrder.includes(id));});
test('all composition presets produce expected counts with finite transforms',()=>{for(const [k,count]of Object.entries({solo:1,pair:2,trio:3,row:4,fan:3,stack:2,gift:2})){store.getState().compose(k);const s=store.getState();assert.equal(s.companions.length+1,count);for(const c of s.companions)assert.ok(Number.isFinite(c.posX+c.posZ+c.scale));}});
test('all six mug geometries have finite normals UVs and safe support in every orientation',()=>{for(const model of MODELS){const m=buildModel(model.id);for(const a of [m.body.attributes.position,m.body.attributes.normal,m.body.attributes.uv])for(const value of a.array)assert.ok(Number.isFinite(value),model.id);for(const x of [0,Math.PI/2,Math.PI]){const h=supportHeight(m.body,m.handle,new THREE.Euler(x,.5,.2),m.def.hasHandle);assert.ok(Number.isFinite(h)&&h>0,model.id);}m.body.dispose();m.handle.dispose();}});

test('hydration preserves valid saved order and drops unknown ids',()=>{store.getState().compose('pair');const s=store.getState();const id=s.companions[0].id;s.hydrate({companions:s.companions,layerOrder:[id,'unknown','hero',id]});assert.deepEqual(store.getState().layerOrder,[id,'hero']);});

const {visibleMugBounds}=require(root+'/src/components/tools/mockup/scene/studio-refs.ts');
test('framing updates parent transforms before a new render',()=>{const scene=new THREE.Scene();const group=new THREE.Group();group.name='mockup-mugs';scene.add(group);const object=new THREE.Group();group.add(object);const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,2,2));object.add(mesh);scene.updateMatrixWorld(true);object.position.x=15;const box=visibleMugBounds(scene);assert.equal(box.min.x,14);assert.equal(box.max.x,16);mesh.geometry.dispose();});


test('old unsupported containers are migrated to classic on load',()=>{store.getState().hydrate({mug:{model:'squeeze'}});assert.equal(store.getState().mug.model,'classic');});
test('20 second video preference loads unchanged',()=>{store.getState().hydrate({video:{duration:20}});assert.equal(store.getState().video.duration,20);});
test('reset keeps uploaded artwork only when requested',()=>{store.getState().setArtImage({imageId:'demo',name:'print.png',width:800,height:600});store.getState().resetAll(true);assert.equal(store.getState().art.imageId,'demo');store.getState().resetAll(false);assert.equal(store.getState().art.imageId,null);});

const {MUG}=require(root+'/src/components/tools/mockup/lib/config.ts');
const {createCeramicMaterial}=require(root+'/src/components/tools/mockup/scene/ceramic-material.ts');
const {withPngDpi}=require(root+'/src/components/tools/mockup/exporters/png-dpi.ts');
test('classic 325 ml has an exact straight 8.2 cm wall and 9.55 cm total height',()=>{
  const m=buildModel('classic'), p=m.body.attributes.position;
  assert.ok(Math.abs(m.body.boundingBox.max.y-9.55)<1e-5);
  assert.ok(Math.abs(m.body.boundingBox.min.y)<1e-6);
  const wall=[];
  for(let i=0;i<p.count;i++){
    const y=p.getY(i),r=Math.hypot(p.getX(i),p.getZ(i));
    if(y>0.3&&y<9.3&&r>3.9)wall.push(r);
  }
  assert.ok(wall.length>100);
  assert.ok(Math.max(...wall)-Math.min(...wall)<1e-5,'no taper');
  assert.ok(wall.every(r=>Math.abs(r-4.1)<1e-5));
  m.body.dispose();m.handle.dispose();m.basePrint.dispose();
});
test('classic lip is continuously rounded with the specified wall thickness',()=>{
  const m=buildModel('classic'),p=m.body.attributes.position;
  const radius=(4.1-3.725)/2,cy=9.55-radius,points=[];
  for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i))<1e-7&&p.getZ(i)>0&&p.getY(i)>=cy-1e-6){
    points.push([Math.hypot(p.getX(i),p.getZ(i)),p.getY(i)]);
  }
  assert.ok(points.length>=33);
  for(const [r,y]of points)assert.ok(Math.abs(Math.hypot(r-(4.1-radius),y-cy)-radius)<1e-5);
  assert.ok(Math.abs((4.1-3.725)*10-3.75)<1e-8);
  m.body.dispose();m.handle.dispose();m.basePrint.dispose();
});
test('underside has a 4 mm support ring, a 1.8 mm recess, and an outward facing bottom print',()=>{
  const m=buildModel('classic'),p=m.body.attributes.position,ring=[];
  let centerY;
  for(let i=0;i<p.count;i++){
    const r=Math.hypot(p.getX(i),p.getZ(i));
    if(p.getY(i)<1e-7)ring.push(r);
    if(r<1e-7&&p.getY(i)<0.3)centerY=p.getY(i);
  }
  assert.ok(Math.abs(Math.max(...ring)-Math.min(...ring)-0.4)<1e-5);
  assert.ok(Math.abs(centerY-0.18)<1e-6);
  const n=m.basePrint.attributes.normal;assert.ok(n.getY(200)<-0.9);
  m.body.dispose();m.handle.dispose();m.basePrint.dispose();
});
test('handle welds widen smoothly without entering the ceramic cavity',()=>{
  const m=buildModel('classic'),p=m.handle.attributes.position;
  let end=0,middle=0;
  for(let i=0;i<p.count;i++){
    assert.ok(Math.hypot(p.getX(i),p.getZ(i))>=MUG.innerR,'handle must not pierce interior');
    if(i<41)end=Math.max(end,Math.abs(p.getX(i)));
    if(i>=72*41&&i<73*41)middle=Math.max(middle,Math.abs(p.getX(i)));
  }
  assert.ok(end>middle*1.5,'welds must widen rather than taper into the body');
  for(const v of m.handle.attributes.normal.array)assert.ok(Number.isFinite(v));
  m.body.dispose();m.handle.dispose();m.basePrint.dispose();
});
test('body and handle share one ceramic PBR recipe and the same fidelity shader',()=>{
  store.getState().resetAll();const mug=store.getState().mug;
  const texture=new THREE.Texture();
  const body=createCeramicMaterial(mug,{map:texture});
  const handle=createCeramicMaterial(mug,{color:'#ffffff'});
  for(const key of ['roughness','metalness','clearcoat','clearcoatRoughness','ior','specularIntensity','envMapIntensity','toneMapped'])assert.equal(body[key],handle[key],key);
  assert.equal(body.roughness,0.08);assert.equal(body.ior,1.52);assert.equal(body.specularIntensity,0.9);
  assert.equal(body.aoMap,null);assert.equal(handle.aoMap,null);
  const shader=()=>({fragmentShader:'#include <opaque_fragment>'});
  const a=shader(),b=shader();body.onBeforeCompile(a);handle.onBeforeCompile(b);
  assert.equal(a.fragmentShader,b.fragmentShader);assert.ok(a.fragmentShader.includes('ceramicReflection'));
  body.dispose();handle.dispose();texture.dispose();
});
test('PNG print metadata contains real 300 DPI without changing IDAT image data',async()=>{
  const original=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
  const output=new Uint8Array(await(await withPngDpi(new Blob([original],{type:'image/png'}),300)).arrayBuffer());
  function chunks(data){const list=[];const v=new DataView(data.buffer,data.byteOffset,data.byteLength);for(let i=8;i<data.length;){const n=v.getUint32(i),type=String.fromCharCode(...data.subarray(i+4,i+8));list.push({type,data:data.slice(i+8,i+8+n)});i+=n+12;}return list;}
  const before=chunks(original),after=chunks(output),physical=after.filter(c=>c.type==='pHYs');
  assert.equal(physical.length,1);const v=new DataView(physical[0].data.buffer);assert.equal(v.getUint32(0),11811);assert.equal(v.getUint32(4),11811);assert.equal(physical[0].data[8],1);
  assert.deepEqual(after.find(c=>c.type==='IDAT').data,new Uint8Array(before.find(c=>c.type==='IDAT').data));
});
