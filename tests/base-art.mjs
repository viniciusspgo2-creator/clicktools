import fs from 'node:fs'; import Module,{createRequire} from 'node:module'; import test from 'node:test'; import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),ts=require('typescript');
Module._extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,f);
const {baseArtTransform}=require('../src/components/tools/mockup/lib/base-art.ts');
const {useMockupStore:s}=require('../src/components/tools/mockup/state/store.ts');
test('old projects retain centered base at original scale',()=>assert.deepEqual(baseArtTransform({baseRotation:12}),{scale:1,x:0,y:0}));
test('base controls clamp malformed saved values',()=>{assert.deepEqual(baseArtTransform({baseScale:Infinity,baseOffsetX:4,baseOffsetY:-5}),{scale:1,x:1,y:-1});});
test('base editing stays independent, supports undo and survives hydration',()=>{
 s.getState().resetAll();s.getState().compose('pair');const id=s.getState().companions[0].id;
 const original=s.getState().art;
 s.getState().patchObjectArt(id,{baseImageId:'base-test',baseRotation:23,baseScale:1.5,baseOffsetX:0.2,baseOffsetY:-0.1});
 assert.deepEqual(s.getState().art,original);
 const saved=JSON.parse(JSON.stringify({art:s.getState().art,mug:s.getState().mug,companions:s.getState().companions}));
 s.getState().resetAll();s.getState().hydrate(saved);assert.equal(s.getState().companions[0].art.baseScale,1.5);assert.equal(s.getState().companions[0].art.baseImageId,'base-test');
 s.getState().patchObject(id,{locked:true});s.getState().patchObjectArt(id,{baseScale:2});assert.equal(s.getState().companions[0].art.baseScale,1.5);s.getState().resetAll();
});
