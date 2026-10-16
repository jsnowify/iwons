import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import type { Track } from "../src/lib/foundations/model-v2";

const normalize=(value:string)=>value.replace(/\r\n?/g,"\n").split("\n").map(line=>line.trimEnd()).join("\n").replace(/\n+$/,"");
export function executeLearningReference(track:Track,source:string,cases:{stdin:string;expected:string}[],jsonOutput=false) {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),"iwons-learning-"));
  const run=(command:string,args:string[],stdin?:string)=>{
    const result=spawnSync(command,args,{cwd:directory,input:stdin,encoding:"utf8",timeout:15000,maxBuffer:1024*1024,env:command==="python"?{...process.env,PYTHONIOENCODING:"utf-8",PYTHONUTF8:"1"}:process.env});
    assert.equal(result.status,0,`${track}: ${result.error?.message??result.stderr}`);return result.stdout;
  };
  try {
    if(track==="java"){
      assert(!/\brecord\s+\w|\bvar\s+\w|"""|case\s+[^:]+->/.test(source),"Use Java 8 required syntax.");
      fs.writeFileSync(path.join(directory,"Main.java"),source);run("javac",["--release","8","-encoding","UTF-8","Main.java"]);
    }else if(track==="typescript"){
      fs.writeFileSync(path.join(directory,"main.ts"),source);
      run(process.execPath,[path.resolve("node_modules/typescript/bin/tsc"),"--strict","--skipLibCheck","--target","es2015","--module","commonjs","--lib","es2022","--types","node","--typeRoots",path.resolve("node_modules/@types"),"main.ts"]);
    }else fs.writeFileSync(path.join(directory,track==="python"?"main.py":"main.js"),source);
    if(track==="python"){
      assert(!/^\s*match\s+.+:/m.test(source),"Use baseline Python syntax in required examples.");
      assert.equal(run("python",["-c","import platform; print(platform.python_version())"]).trim(),"3.14.2","Local Python must match the Pyodide interpreter.");
    }
    if(track==="javascript"||track==="typescript")assert.equal(process.version.slice(1),fs.readFileSync(".node-version","utf8").trim(),"Use the pinned Node version.");
    for(const test of cases){
      const output=track==="java"?run("java",["-Dfile.encoding=UTF-8","-Dstdout.encoding=UTF-8","-Dstderr.encoding=UTF-8","-cp",directory,"Main"],test.stdin):track==="python"?run("python",["main.py"],test.stdin):run(process.execPath,["main.js"],test.stdin);
      if(jsonOutput)assert.deepEqual(JSON.parse(output.trim().split(/\r?\n/).at(-1)!),JSON.parse(test.expected),`${track}: returned values differ`);
      else assert.equal(normalize(output),normalize(test.expected),`${track}: stdout mismatch for input ${JSON.stringify(test.stdin)}`);
    }
    return cases.length;
  }finally{
    // Only our fresh temporary directory is removed, never a user-selected path.
    if(path.dirname(directory)===path.resolve(os.tmpdir())&&path.basename(directory).startsWith("iwons-learning-"))fs.rmSync(directory,{recursive:true,force:true});
  }
}
export function executeLearningFunction(track:Track,source:string,request:{functionName:string;mode:"function"|"operations";cases:{id:string;input:unknown[];expected:unknown}[]}){
  assert(/^[A-Za-z_]\w*$/.test(request.functionName),"Use a valid reference function name.");
  let program=source,stdin="";
  if(track==="javascript"||track==="typescript"){
    const literal=(value:unknown)=>JSON.stringify(value);
    const calls=request.cases.map(test=>{
      if(request.mode==="function")return `${request.functionName}(${test.input.map(literal).join(",")})`;
      const [operations,params]=test.input as [string[],unknown[][]];
      assert(operations.every(name=>/^[A-Za-z_]\w*$/.test(name)),"Invalid operation name.");
      return `(()=>{const instance=new ${request.functionName}(${(params[0]??[]).map(literal).join(",")});return [null,${operations.slice(1).map((name,index)=>`instance.${name}(${params[index+1].map(literal).join(",")})`).join(",")}];})()`;
    });
    program+=`\nconsole.log(JSON.stringify([${calls.join(",")} ]));`;
  }else if(track==="python"){
    const harness=fs.readFileSync("public/runners/harness.py","utf8").replace('json.dumps(iwons_execute(json.loads(iwons_request)))','print(json.dumps([item["actual"] for item in iwons_execute(json.loads(iwons_request))["cases"]]))');
    program=`iwons_request = ${JSON.stringify(JSON.stringify({...request,code:source}))}\n${harness}`;
  }else{
    const imports=source.match(/^\s*import\s+[^;]+;/gm)??[];
    const code=source.replace(/^\s*import\s+[^;]+;/gm,"").replace(/public\s+class\s+/g,"class ");
    program=imports.join("\n")+"\n"+fs.readFileSync("public/runners/JavaHarness.txt","utf8").replace("/* IWONS_USER_CODE */",()=>code)
      .replace('original.println(json(answer));','List<Object> actuals=new ArrayList<>();for(Object item:results){Map<?,?> row=(Map<?,?>)item;if(row.containsKey("error"))throw new RuntimeException(String.valueOf(row.get("error")));actuals.add(row.get("actual"));}original.println(json(actuals));');
    stdin=JSON.stringify(request);
  }
  executeLearningReference(track,program,[{stdin,expected:JSON.stringify(request.cases.map(test=>test.expected))}],true);
  return request.cases.length;
}
