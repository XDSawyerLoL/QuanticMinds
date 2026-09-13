import { readFile, writeFile } from 'node:fs/promises';

const sourceUrl=new URL('./server.mjs',import.meta.url);
const runtimeUrl=new URL('./server-runtime.mjs',import.meta.url);
let code=await readFile(sourceUrl,'utf8');

if(!code.includes("./linkedin-image.mjs")){
  code=code.replace("import { randomBytes, createHash, createHmac, createCipheriv, createDecipheriv, timingSafeEqual } from 'node:crypto';", "import { randomBytes, createHash, createHmac, createCipheriv, createDecipheriv, timingSafeEqual } from 'node:crypto';\nimport { uploadArticleThumbnail } from './linkedin-image.mjs';");
}

code=code.replace(
  "function quanticStoryUrl(item){const u=new URL(FRONTEND_URL);u.searchParams.set('story',String(item.url||item.articleUrl||item.title||''));return u.href}",
  "function qnHash8(s){let h=0x811c9dc5;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,0x01000193)}return(h>>>0).toString(16).padStart(8,'0')}\nfunction qnSlug(s){return String(s||'article').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,84)||'article'}\nfunction qnArticleFile(item){try{const p=new URL(item.articleUrl||'').pathname.split('/').pop()||'';if(/^[a-z0-9][a-z0-9._-]*\\.html$/i.test(p))return p}catch{}return `${qnSlug(item.title)}-${qnHash8(item.url||item.articleUrl||item.title||'')}.html`}\nfunction quanticStoryUrl(item){return `https://xdsawyerlol.github.io/QuanticMinds/news/articles/${qnArticleFile(item)}`}")
;

const oldBlock=`async function createLinkedInPost(token,sub,item,commentary){
  const opt=optimizePost(item);
  const base={author:sub.linkedinUrn,commentary:cleanText(commentary||opt.commentary,3000),visibility:'PUBLIC',distribution:{feedDistribution:'MAIN_FEED',targetEntities:[],thirdPartyDistributionChannels:[]},lifecycleState:'PUBLISHED',isReshareDisabledByAuthor:false};
  const article={...base,content:{article:{source:opt.url,title:opt.title.slice(0,200),description:opt.description.slice(0,256)}}};
  let r=await fetch('https://api.linkedin.com/rest/posts',{method:'POST',headers:{authorization:\`Bearer \${token}\`,'content-type':'application/json','X-Restli-Protocol-Version':'2.0.0','Linkedin-Version':LINKEDIN_VERSION},body:JSON.stringify(article)});
  let text=await r.text();
  if(!r.ok&&r.status>=400&&r.status<500){r=await fetch('https://api.linkedin.com/rest/posts',{method:'POST',headers:{authorization:\`Bearer \${token}\`,'content-type':'application/json','X-Restli-Protocol-Version':'2.0.0','Linkedin-Version':LINKEDIN_VERSION},body:JSON.stringify(base)});text=await r.text()}
  if(!r.ok)throw new Error(\`linkedin_post_failed:\${r.status}:\${text.slice(0,180)}\`);
  return r.headers.get('x-restli-id')||'published'
}`;

const newBlock=`async function createLinkedInPost(token,sub,item,commentary){
  const opt=optimizePost(item);
  const base={author:sub.linkedinUrn,commentary:cleanText(commentary||opt.commentary,3000),visibility:'PUBLIC',distribution:{feedDistribution:'MAIN_FEED',targetEntities:[],thirdPartyDistributionChannels:[]},lifecycleState:'PUBLISHED',isReshareDisabledByAuthor:false};
  const thumbnail=await uploadArticleThumbnail({token,ownerUrn:sub.linkedinUrn,imageUrl:item.image||'',linkedinVersion:LINKEDIN_VERSION});
  const articleFields={source:opt.url,title:opt.title.slice(0,200),description:opt.description.slice(0,256)};
  if(thumbnail)articleFields.thumbnail=thumbnail;
  const article={...base,content:{article:articleFields}};
  let r=await fetch('https://api.linkedin.com/rest/posts',{method:'POST',headers:{authorization:\`Bearer \${token}\`,'content-type':'application/json','X-Restli-Protocol-Version':'2.0.0','Linkedin-Version':LINKEDIN_VERSION},body:JSON.stringify(article)});
  let text=await r.text();
  if(!r.ok&&r.status>=400&&r.status<500){r=await fetch('https://api.linkedin.com/rest/posts',{method:'POST',headers:{authorization:\`Bearer \${token}\`,'content-type':'application/json','X-Restli-Protocol-Version':'2.0.0','Linkedin-Version':LINKEDIN_VERSION},body:JSON.stringify(base)});text=await r.text()}
  if(!r.ok)throw new Error(\`linkedin_post_failed:\${r.status}:\${text.slice(0,180)}\`);
  return r.headers.get('x-restli-id')||'published'
}`;

if(code.includes(oldBlock))code=code.replace(oldBlock,newBlock);
else if(!code.includes('uploadArticleThumbnail({token,ownerUrn:sub.linkedinUrn'))throw new Error('LinkedIn post function patch target not found');

await writeFile(runtimeUrl,code,'utf8');
await import(`./server-runtime.mjs?v=${Date.now()}`);
