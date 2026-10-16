// Deliberately small Node-style teaching surface. Created anew for each test case.
export function programShim(stdin:string, print:(value:string)=>void) {
  const files = new Map<string,string>();
  const path = (value:unknown) => {
    if (typeof value !== "string" || !value || value.includes("..") || value.includes("\\")) throw new Error("Use a simple virtual file path without '..'.");
    return value.replace(/^\.\//,"").replace(/^\//,"");
  };
  const fs = {
    readFileSync(file:unknown,encoding?:string) {
      if (encoding !== "utf8" && encoding !== "utf-8") throw new Error("The Iwons file shim supports UTF-8 text only.");
      if (file===0) return stdin;
      const name=path(file); if(!files.has(name))throw new Error(`ENOENT: ${name}`); return files.get(name)!;
    },
    writeFileSync(file:unknown,value:unknown,encoding="utf8") { if(encoding!=="utf8"&&encoding!=="utf-8")throw new Error("UTF-8 text only."); const text=String(value); if(text.length>100000)throw new Error("Virtual file exceeds 100 KB.");files.set(path(file),text); },
    existsSync(file:unknown) {return files.has(path(file));},
  };
  const pending:Promise<void>[]=[];
  const readline = { createInterface() {
    const lines = stdin.replace(/\r\n?/g,"\n").split("\n"); if(lines.at(-1)==="")lines.pop();
    const handlers = new Map<string,((line?:string)=>unknown)[]>();
    let closed=false;
    const api = {
      on(event:string,fn:(line?:string)=>unknown) {handlers.set(event,[...(handlers.get(event)??[]),fn]);return api;},
      close() {closed=true;},
      async *[Symbol.asyncIterator]() {for(const line of lines){if(closed)break;yield line;}},
    };
    pending.push(new Promise<void>((resolve,reject)=>setTimeout(async()=>{
      try {for(const line of lines){if(closed)break;for(const fn of handlers.get("line")??[])await fn(line);} for(const fn of handlers.get("close")??[])await fn(); resolve();}catch(error){reject(error);}
    },0)));
    return api;
  }};
  return {
    require(name:string) {if(name==="fs"||name==="node:fs")return fs;if(name==="readline"||name==="node:readline")return readline;throw new Error(`The Iwons input shim does not provide ${name}.`);},
    process:{stdin:{},stdout:{write:(value:unknown)=>print(String(value))}},
    async finish(){await Promise.all(pending); await new Promise(resolve=>setTimeout(resolve,0));},
  };
}
export const normalizeProgramOutput = (value:unknown) => String(value??"").replace(/\r\n?/g,"\n").split("\n").map(line=>line.trimEnd()).join("\n").replace(/\n+$/,"");
