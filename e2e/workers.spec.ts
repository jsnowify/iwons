import {test,expect} from '@playwright/test';
test('static disposable JS and strict TypeScript workers execute without page chunks',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const results=[];
  for(const language of ['javascript','typescript']){
   results.push(await new Promise((resolve,reject)=>{
    const worker=new Worker('/runners/js/worker.js',{type:'module'});const timer=setTimeout(()=>{worker.terminate();reject(new Error('Worker deadline'));},30000);
    worker.onerror=event=>{clearTimeout(timer);worker.terminate();reject(new Error(event.message));};
    worker.onmessage=event=>{if(event.data.status)return;clearTimeout(timer);worker.terminate();resolve(event.data);};
    worker.postMessage({language,strictTypes:language==='typescript',action:'submit',code:language==='typescript'?'function double(n:number):number{return n*2}':'function double(n){return n*2}',functionName:'double',mode:'function',cases:[{id:'one',input:[4],expected:8}],timeLimitMs:2000});
   }));
  }return results;
 });
 for(const item of result)expect(item).toMatchObject({verdict:'accepted'});
});
