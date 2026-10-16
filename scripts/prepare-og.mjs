import fs from 'node:fs';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const hash=createHash('sha256');for(const file of ['scripts/build-og.mjs','src/data/catalog.json','src/styles/tokens.css','assets/fonts/CourierPrime-Bold.ttf'])hash.update(fs.readFileSync(file));
const digest=hash.digest('hex'),stamp='public/og/source-hash.txt',manifest='public/og/manifest.json';
const ready=fs.existsSync(manifest)&&Object.entries(JSON.parse(fs.readFileSync(manifest,'utf8'))).every(([slug,image])=>fs.existsSync(`public/og/${image.file}`)&&fs.existsSync(`public/og/${slug}.png`));
if(ready&&fs.existsSync(stamp)&&fs.readFileSync(stamp,'utf8')===digest)console.log('OG source inputs unchanged; generator skipped.');
else{const result=spawnSync(process.execPath,['scripts/build-og.mjs'],{stdio:'inherit',windowsHide:true});if(result.status!==0)process.exit(result.status??1);fs.writeFileSync(stamp,digest);}
