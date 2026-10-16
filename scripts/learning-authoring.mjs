import fs from "node:fs";
import path from "node:path";

// Authored sources live beside the seed scripts. Regenerating the map must never
// erase their status, and draft content must never become a public ready asset.
export function applyAuthoredModules(manifest,root="scripts/learning-content",output="src/data/learn") {
 if(!fs.existsSync(root))return 0;
 let count=0;
 for(const course of manifest.courses)for(const station of course.modules){
  const source=path.resolve(root,course.id,station.slug);
  const entry=path.join(source,"manifest.json");
  if(!fs.existsSync(entry))continue;
  const authored=JSON.parse(fs.readFileSync(entry,"utf8"));
  if(authored.id!==station.id||authored.slug!==station.slug)throw new Error(`Authored station identity differs: ${station.id}`);
  if(!["draft","ready"].includes(authored.status))throw new Error(`Invalid authored status: ${station.id}`);
  if(authored.lessons.length!==station.lessons.length||authored.lessons.some((lesson,index)=>lesson.id!==station.lessons[index].id||lesson.slug!==station.lessons[index].slug))throw new Error(`Authored lesson order differs: ${station.id}`);
  const target=path.resolve(output,course.id,station.slug);
  function copy(directory,destination){
   fs.mkdirSync(destination,{recursive:true});
   for(const item of fs.readdirSync(directory,{withFileTypes:true})){
    if(item.isSymbolicLink())throw new Error("Authored sources cannot contain symlinks.");
    if(item.name==="manifest.json")continue;
    if(item.isDirectory())copy(path.join(directory,item.name),path.join(destination,item.name));
    else if(item.name.endsWith(".json"))fs.copyFileSync(path.join(directory,item.name),path.join(destination,item.name));
   }
  }
  copy(source,target);
  Object.assign(station,authored);
  count++;
 }
 return count;
}
