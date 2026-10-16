import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { applyAuthoredModules } from "../../scripts/learning-authoring.mjs";

it("regenerates authored drafts without opening them or discarding source content",()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),"iwons-authoring-"));
 try{
  const root=path.join(temp,"source"),output=path.join(temp,"output");
  const source=path.join(root,"cp1","meet");fs.mkdirSync(path.join(source,"lessons"),{recursive:true});
  const lesson={id:"cp1-m1-l1",slug:"first-message",status:"draft"};
  const authored={id:"cp1-m1",slug:"meet",status:"draft",lessons:[lesson]};
  fs.writeFileSync(path.join(source,"manifest.json"),JSON.stringify(authored));
  fs.writeFileSync(path.join(source,"lessons","first-message.json"),JSON.stringify({story:"Original authored explanation"}));
  const manifest={courses:[{id:"cp1",modules:[{...authored,status:"planned",lessons:[{...lesson,status:"planned"}]}]}]};
  expect(applyAuthoredModules(manifest,root,output)).toBe(1);
  expect(manifest.courses[0].modules[0].status).toBe("draft");
  expect(JSON.parse(fs.readFileSync(path.join(output,"cp1","meet","lessons","first-message.json"),"utf8")).story).toBe("Original authored explanation");
  fs.writeFileSync(path.join(source,"manifest.json"),JSON.stringify({...authored,lessons:[{...lesson,id:"different"}]}));
  expect(()=>applyAuthoredModules(manifest,root,output)).toThrow("lesson order differs");
 }finally{
  const resolved=path.resolve(temp);if(path.dirname(resolved)!==path.resolve(os.tmpdir())||!path.basename(resolved).startsWith("iwons-authoring-"))throw new Error("Unexpected test directory");
  fs.rmSync(resolved,{recursive:true,force:true});
 }
});
