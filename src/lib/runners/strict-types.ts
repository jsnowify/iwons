import * as ts from "typescript";
const declarations = `declare const console: {log(...values:unknown[]):void;warn(...values:unknown[]):void;error(...values:unknown[]):void;info(...values:unknown[]):void};
declare const process: {stdin:unknown;stdout:{write(value:string):void}};
declare function require(name:'fs'|'node:fs'): {readFileSync(path:string|number,encoding:string):string;writeFileSync(path:string,value:string,encoding?:string):void;existsSync(path:string):boolean};
declare function require(name:'readline'|'node:readline'): {createInterface(options:unknown):{on(event:'line',fn:(line:string)=>void):any;on(event:'close',fn:()=>void):any;close():void;[Symbol.asyncIterator]():AsyncIterableIterator<string>}};`;
export async function checkTypes(code:string) {
  const files = new Map<string,string>([["/solution.ts",code],["/iwons.d.ts",declarations]]);
  async function load(name:string):Promise<void> {
    const file=`/${name}`; if(files.has(file))return;
    const response=await fetch(`/runners/ts-lib/${name}`); if(!response.ok)throw new Error("The TypeScript standard library could not load. Retry before submitting.");
    const text=await response.text();files.set(file,text);
    await Promise.all([...text.matchAll(/<reference lib="([^"]+)"/g)].map(match=>load(`lib.${match[1]}.d.ts`)));
  }
  await load("lib.es2022.d.ts");
  const options:ts.CompilerOptions={strict:true,noEmit:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None,lib:["lib.es2022.d.ts"],skipLibCheck:true};
  const host:ts.CompilerHost={getSourceFile:(name,language)=>{const text=files.get(name);return text===undefined?undefined:ts.createSourceFile(name,text,language,true);},getDefaultLibFileName:()=>"/lib.es2022.d.ts",writeFile:()=>{},getCurrentDirectory:()=>"/",getDirectories:()=>[],fileExists:name=>files.has(name),readFile:name=>files.get(name),getCanonicalFileName:name=>name,useCaseSensitiveFileNames:()=>true,getNewLine:()=>"\n"};
  const program=ts.createProgram(["/solution.ts","/iwons.d.ts"],options,host);
  return ts.getPreEmitDiagnostics(program).filter(diagnostic=>diagnostic.category===ts.DiagnosticCategory.Error).map(diagnostic=>({message:ts.flattenDiagnosticMessageText(diagnostic.messageText,"\n"),...(diagnostic.file && diagnostic.start!==undefined ? {line:diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line+1}:{})}));
}
