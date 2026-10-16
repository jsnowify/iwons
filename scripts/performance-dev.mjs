import fs from "node:fs";
import path from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {performance} from "node:perf_hooks";
const phase=process.argv[2]||"before",bundler=process.argv[3]||"webpack";
if(!["webpack","turbopack"].includes(bundler))throw new Error("Choose a supported benchmark bundler.");
const workspace=process.cwd(),directory=fs.mkdtempSync(path.join(workspace,`.next-perf-${phase}-`));
const name=path.basename(directory),port=4175;
const originalEnv=fs.readFileSync("next-env.d.ts","utf8");
let log="",child;
const report={phase,bundler,cache:"fresh isolated directory",routes:[]};
try{
 const started=performance.now();
 child=spawn(process.execPath,["node_modules/next/dist/bin/next","dev",`--${bundler}`,"--port",String(port),"--hostname","127.0.0.1"],{cwd:workspace,env:{...process.env,IWONS_PERF_DIST:name},windowsHide:true,stdio:["ignore","pipe","pipe"]});
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error("Dev startup exceeded 45 seconds")),45000);
  const output=data=>{log+=data.toString();if(log.includes("Ready in")){clearTimeout(timer);resolve();}};
  child.stdout.on("data",output);child.stderr.on("data",output);child.once("exit",code=>{clearTimeout(timer);reject(new Error(`Dev exited ${code}`));});child.once("error",reject);
 });
 report.startupSeconds=(performance.now()-started)/1000;
 for(const route of ["/","/problems/receipt-arithmetic-proof-strip/"]){
  const requested=performance.now();try{const response=await fetch(`http://127.0.0.1:${port}${route}`,{signal:AbortSignal.timeout(45000)});await response.text();report.routes.push({route,status:response.status,firstRequestSeconds:(performance.now()-requested)/1000});}catch(error){report.routes.push({route,error:String(error),elapsedSeconds:(performance.now()-requested)/1000});}
 }
}catch(error){report.error=String(error);}
finally{
 if(child&&child.exitCode===null){if(process.platform==="win32")spawnSync("taskkill",["/pid",String(child.pid),"/T","/F"],{windowsHide:true,stdio:"ignore"});else child.kill("SIGTERM");}
 const current=fs.readFileSync("next-env.d.ts","utf8");if(current.includes(name))fs.writeFileSync("next-env.d.ts",originalEnv);
 const config=JSON.parse(fs.readFileSync("tsconfig.json","utf8"));const includes=config.include??[];if(includes.some(item=>item.includes(name))){config.include=includes.filter(item=>!item.includes(name));fs.writeFileSync("tsconfig.json",JSON.stringify(config,null,2)+"\n");}
 if(path.dirname(path.resolve(directory))!==workspace||!path.basename(directory).startsWith(`.next-perf-${phase}-`))throw new Error("Invalid owned benchmark cleanup path");
 fs.rmSync(directory,{recursive:true,force:true,maxRetries:3,retryDelay:200});
 fs.mkdirSync("artifacts/performance",{recursive:true});fs.writeFileSync(`artifacts/performance/${phase}-dev.json`,JSON.stringify(report,null,2)+"\n");fs.writeFileSync(`artifacts/performance/${phase}-dev.log`,log);console.log(JSON.stringify(report));
}
