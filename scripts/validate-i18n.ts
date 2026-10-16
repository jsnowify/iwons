import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export function validateLearningTranslations(value: unknown, location = "content"): { errors:string[]; warnings:string[] } {
  const errors:string[]=[],warnings:string[]=[];
  const object=(item:unknown):item is Record<string,unknown>=>!!item&&typeof item==="object"&&!Array.isArray(item);
  const shape=(item:unknown):unknown=>Array.isArray(item)?item.map(shape):object(item)?Object.fromEntries(Object.keys(item).sort().map(key=>[key,shape(item[key])])):typeof item;
  function visit(item:unknown,at:string){
    if(Array.isArray(item)){item.forEach((child,index)=>visit(child,`${at}[${index}]`));return;}
    if(!object(item))return;
    if(object(item.translations)){
      const copies=item.translations,status=item.translationStatus;
      if(!object(copies.en)||!object(status))errors.push(`${at}: English source and translation statuses are required.`);
      for(const language of ["en","fil","ceb"]){
        if(!Object.hasOwn(copies,language))errors.push(`${at}: explicitly mark ${language} missing with null.`);
        if(!object(status)||!["draft","reviewed"].includes(String(status[language])))errors.push(`${at}: invalid ${language} translation status.`);
        const copy=copies[language];if(copy===null)continue;
        if(!object(copy)){errors.push(`${at}: ${language} copy must be an object.`);continue;}
        if(JSON.stringify(shape(copy))!==JSON.stringify(shape(copies.en)))errors.push(`${at}: ${language} structure differs from English.`);
        if(language!=="en"&&JSON.stringify(copy)===JSON.stringify(copies.en))errors.push(`${at}: ${language} copy is identical to English.`);
        for(const key of ["code","starterCode","referenceSolution","expectedOutput","stdin","cases","correctOptionId"]){if(Object.hasOwn(copy,key))errors.push(`${at}: keep ${key} outside human-language translations.`);}
        if(language!=="en"&&JSON.stringify(copy).match(/\b(?:the program|this lesson|you can|return value)\b/i))warnings.push(`${at}: review possible untranslated English in ${language}.`);
      }
    }
    for(const [key,child]of Object.entries(item))if(key!=="translations"&&key!=="translationStatus")visit(child,`${at}.${key}`);
  }
  visit(value,location);return {errors,warnings};
}
function files(directory:string):string[]{return !fs.existsSync(directory)?[]:fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(directory,entry.name)):entry.name.endsWith(".json")?[path.join(directory,entry.name)]:[]);}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const results=files("src/data/learn").map(file=>validateLearningTranslations(JSON.parse(fs.readFileSync(file,"utf8")),file));
 const errors=results.flatMap(result=>result.errors);const warnings=results.flatMap(result=>result.warnings);
 for(const warning of warnings)console.warn(warning);
 if(errors.length)throw new Error(errors.join("\n"));
 console.log(`Learning translation checks passed: ${results.length} files; ${warnings.length} review warnings. Missing translations remain explicit.`);
}
