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
