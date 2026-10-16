import fs from "node:fs";
import path from "node:path";
import { assertLearningPublicContent } from "../src/lib/foundations/privacy.ts";

const manifest=JSON.parse(fs.readFileSync("src/data/foundations.json","utf8"));
const publicRoot=path.resolve("public/learn-public"),keysRoot=path.resolve("public/learn-data");
fs.mkdirSync(publicRoot,{recursive:true});fs.mkdirSync(keysRoot,{recursive:true});
const owned=[];
function publish(root,name,value,publicData=false){
 if(publicData)assertLearningPublicContent(value);
 const file=path.resolve(root,name);if(path.dirname(file)!==root)throw new Error("Invalid generated learning asset name");
 fs.writeFileSync(file,JSON.stringify(value)+"\n");owned.push(path.relative(path.resolve("public"),file).replaceAll("\\","/"));
}
for(const course of manifest.courses)for(const station of course.modules){
 if(station.status!=="ready")continue;
 const directory=path.resolve("src/data/learn",course.id,station.slug);
 const read=name=>{const file=path.resolve(directory,name);if(!file.startsWith(directory+path.sep))throw new Error("Invalid module file path");return JSON.parse(fs.readFileSync(file,"utf8"));};
 const index=read("module.json");
 for(const entry of station.lessons){
  if(entry.status!=="ready")continue;
  const lesson=read(`lessons/${entry.slug}.json`);
  publish(publicRoot,`${lesson.id}.json`,lesson,true);publish(keysRoot,`${lesson.id}.json`,read(`keys/${entry.slug}.json`));
 }
 for(const file of index.exerciseFiles){const exercise=read(file);publish(publicRoot,`exercise-${exercise.id}.json`,exercise,true);publish(keysRoot,`exercise-${exercise.id}.json`,read(`keys/exercise-${exercise.slug}.json`));}
 const checkpoint=read(index.checkpointFile);assertLearningPublicContent(checkpoint);publish(keysRoot,`checkpoint-${checkpoint.id}.json`,read("keys/checkpoint.json"));
}
const inventoryFile=path.join(publicRoot,"generated.json");
const previous=fs.existsSync(inventoryFile)?JSON.parse(fs.readFileSync(inventoryFile,"utf8")):[];
for(const name of previous){
 if(owned.includes(name))continue;
 const file=path.resolve("public",name);
 if((path.dirname(file)!==publicRoot&&path.dirname(file)!==keysRoot)||!file.endsWith(".json"))throw new Error("Invalid prior generated learning asset path");
 fs.rmSync(file,{force:true});
}
fs.writeFileSync(inventoryFile,JSON.stringify(owned)+"\n");
console.log(`Prepared ${owned.length} ready learning assets; temporary design samples are separate.`);
