self.onmessage=async({data:req})=>{
  try {
    if(!req.judgeUrl)throw new Error('Java Beta needs your self-hosted Judge0 CE URL. Add it in Settings → Java runtime. Code is sent only to that endpoint.');
    const base=new URL(req.judgeUrl);
    if(!['https:','http:'].includes(base.protocol)||base.username||base.password)throw new Error('Use a valid HTTP(S) endpoint without embedded credentials.');
    const url=base.href.replace(/\/$/,'');
    const get=async path=>{const r=await fetch(url+path);if(!r.ok)throw new Error(`Judge0 returned HTTP ${r.status}. Check the URL and CORS settings.`);return r.json();};
    const languages=await get('/languages');const java=languages.find(l=>/^Java \(/.test(l.name))||languages.find(l=>/^Java\b/.test(l.name));
    if(!java)throw new Error('This Judge0 endpoint does not offer Java.');
    const submit=async(source,stdin,options={})=>{
      const r=await fetch(url+'/submissions?base64_encoded=false&wait=false',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language_id:java.id,source_code:source,stdin,cpu_time_limit:Math.max(1,req.timeLimitMs/1000),wall_time_limit:Math.max(5,req.timeLimitMs/1000+2),...options})});
      if(!r.ok)throw new Error(`Could not create Java submission (HTTP ${r.status}).`);
      const {token}=await r.json();if(!token)throw new Error('Judge0 did not return a submission token.');
      for(let i=0;i<100;i++){
        const result=await get('/submissions/'+encodeURIComponent(token)+'?base64_encoded=false');
        if(result.status?.id>2)return result;
        await new Promise(resolve=>setTimeout(resolve,400));
      }
      throw new Error('Judge0 did not finish before the polling deadline.');
    };
    if(req.mode==='program'){
      const normalize=value=>String(value??'').replace(/\r\n?/g,'\n').split('\n').map(line=>line.trimEnd()).join('\n').replace(/\n+$/,'');
      const cases=[];
      for(const test of req.cases){
        const stdin=test.stdin??req.stdin??(typeof test.input?.[0]==='string'?test.input[0]:'');
        const result=await submit(req.code,stdin,{compiler_options:'--release 8',enable_network:false});
        if(result.status?.id===6){self.postMessage({verdict:'compile_error',cases,compileError:{message:result.compile_output||'Java compilation failed.'}});return;}
        if(result.status?.id===5){self.postMessage({verdict:'time_limit',cases});return;}
        if(result.status?.id!==3)throw new Error(result.stderr||result.message||result.status?.description||'Java execution did not complete.');
        const expected=normalize(test.expected),actual=normalize(result.stdout);
        cases.push({id:test.id,passed:actual===expected,expected,actual,stdout:result.stdout||'',runtimeMs:Number(result.time||0)*1000});
      }
      self.postMessage({verdict:cases.every(test=>test.passed)?'accepted':'wrong_answer',cases});
      return;
    }
    const template=await (await fetch('/runners/JavaHarness.txt')).text();
    const imports=req.code.match(/^\s*import\s+[^;]+;/gm)||[];
    const code=req.code.replace(/^\s*import\s+[^;]+;/gm,'').replace(/public\s+class\s+(Solution|MinStack)/g,'class $1');
    const source=imports.join('\n')+'\n'+template.replace('/* IWONS_USER_CODE */',code);
    const result=await submit(source,JSON.stringify(req));
    if(result.status?.id===6){self.postMessage({verdict:'compile_error',cases:[],compileError:{message:result.compile_output||'Java compilation failed.'}});return;}
    if(result.status?.id===5){self.postMessage({verdict:'time_limit',cases:[]});return;}
    if(result.status?.id!==3)throw new Error(result.stderr||result.message||result.status?.description||'Java execution did not complete.');
    self.postMessage(JSON.parse(result.stdout));
  }catch(error){self.postMessage({verdict:'runtime_error',cases:[],compileError:{message:error.message||String(error)}});}
};
