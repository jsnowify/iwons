import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=path.resolve('public/og');fs.mkdirSync(root,{recursive:true});
const manifestPath=path.join(root,'manifest.json');
const previous=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):{};
const tokens=fs.readFileSync('src/styles/tokens.css','utf8').split(':root[data-theme=')[0];
const c=Object.fromEntries([...tokens.matchAll(/--([\w-]+):\s*(#[A-Fa-f0-9]{6})/g)].map(m=>[m[1],m[2]]));
const font=fs.readFileSync('assets/fonts/CourierPrime-Bold.ttf');
const catalog=JSON.parse(fs.readFileSync('src/data/catalog.json','utf8'));
const entries=[{slug:'home',title:'Type it. Test it. Own it.',label:'YOUR NEXT CHAPTER',topics:['9 chapters','500 challenges','54 units']},...catalog.map(p=>({slug:p.slug,title:p.title,label:`LEVEL 0${p.level} / ${p.difficulty.toUpperCase()}`,topics:p.topics}))];
const manifest={};let generated=0,skipped=0,ImageResponse,h;
for(const entry of entries){
 const hash=createHash('sha256').update(JSON.stringify({version:1,entry,tokens})).update(font).digest('hex').slice(0,16);
 const file=`${entry.slug}.${hash}.png`,target=path.join(root,file),alias=path.join(root,`${entry.slug}.png`);
 if(fs.existsSync(target)){skipped++;}
 else{
  if(!ImageResponse){({ImageResponse}=require('next/og'));h=require('react').createElement;}
  const box=(style,...children)=>h('div',{style:{display:'flex',...style}},...children);
  const tree=box({width:'100%',height:'100%',background:c.bg,color:c.ink,padding:38,fontFamily:'Courier'},
   box({flexDirection:'column',width:'100%',border:`3px solid ${c.ink}`,boxShadow:`8px 8px 0 ${c.ink}`,background:c.surface,padding:42},
    box({alignItems:'center',justifyContent:'space-between'},box({fontSize:40},'Iwons',h('span',{style:{marginLeft:8,width:10,height:36,background:c.accent}})),box({fontSize:22,border:`2px solid ${c.ink}`,padding:'10px 18px',transform:'rotate(-3deg)',background:c['accent-2']},entry.label)),
    box({fontSize:18,color:c.muted,letterSpacing:3,marginTop:68},'TYPE IT. TEST IT. OWN IT.'),
    box({fontSize:entry.title.length>42?48:64,lineHeight:1.15,marginTop:18},entry.title),
    box({justifyContent:'space-between',marginTop:'auto',paddingTop:26,borderTop:`2px dashed ${c.ink}`,fontSize:22},h('span',{},entry.topics.join(' / ')),h('span',{},'YOUR NEXT CHAPTER →'))));
  const response=new ImageResponse(tree,{width:1200,height:630,fonts:[{name:'Courier',data:font,weight:700,style:'normal'}]});
  fs.writeFileSync(target,Buffer.from(await response.arrayBuffer()));generated++;
 }
 if(!fs.existsSync(alias)||previous[entry.slug]?.hash!==hash)fs.copyFileSync(target,alias);
 manifest[entry.slug]={hash,file};
}
// Remove only obsolete generated images listed by the previous manifest.
for(const [slug,entry] of Object.entries(previous))if(manifest[slug]?.file!==entry.file&&/^[a-z0-9-]+\.[a-f0-9]{16}\.png$/.test(entry.file))fs.rmSync(path.join(root,entry.file),{force:true});
const serialized=JSON.stringify(manifest,null,2)+'\n';if(!fs.existsSync(manifestPath)||fs.readFileSync(manifestPath,'utf8')!==serialized)fs.writeFileSync(manifestPath,serialized);
console.log(`OG images: ${generated} generated, ${skipped} unchanged. Satori loads only when content changes.`);
