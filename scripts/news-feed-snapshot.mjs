import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const out=join(root,'public','news','feed.json');
const sources=['https://raw.githubusercontent.com/XDSawyerLoL/LEFILLIBRE/main/feed.json','https://xdsawyerlol.github.io/LEFILLIBRE/feed.json'];
let data=null;
for(const source of sources){
  try{
    const r=await fetch(source,{headers:{accept:'application/json'}});
    if(!r.ok)continue;
    const candidate=await r.json();
    if(Array.isArray(candidate.items)){data=candidate;break;}
  }catch{}
}
if(!data)throw new Error('Quantic News feed unavailable during build');
await mkdir(dirname(out),{recursive:true});
await writeFile(out,JSON.stringify(data,null,2),'utf8');
console.log(`Quantic News local feed: ${data.items.length} items.`);
