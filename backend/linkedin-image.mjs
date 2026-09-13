const allowedImageType=new Set(['image/jpeg','image/png','image/gif']);

function isPublicHttps(raw){
  try{
    const u=new URL(raw);
    if(u.protocol!=='https:')return false;
    const h=u.hostname.toLowerCase();
    if(h==='localhost'||h.endsWith('.local')||/^127\./.test(h)||/^10\./.test(h)||/^192\.168\./.test(h)||/^169\.254\./.test(h))return false;
    const m=h.match(/^172\.(\d+)\./);if(m&&Number(m[1])>=16&&Number(m[1])<=31)return false;
    return true;
  }catch{return false}
}

async function safeFetch(raw,options={},maxRedirects=3){
  let url=raw;
  for(let n=0;n<=maxRedirects;n++){
    if(!isPublicHttps(url))return null;
    const r=await fetch(url,{...options,redirect:'manual'});
    if(r.status>=300&&r.status<400&&r.headers.get('location')){
      url=new URL(r.headers.get('location'),url).href;
      continue;
    }
    return r;
  }
  return null;
}

async function discoverImage(imageUrl,sourceUrl){
  if(isPublicHttps(imageUrl))return imageUrl;
  if(!isPublicHttps(sourceUrl))return '';
  try{
    const page=await safeFetch(sourceUrl,{headers:{'user-agent':'Mozilla/5.0 QuanticNewsBot/1.0','accept':'text/html'}});
    if(!page?.ok)return '';
    const html=(await page.text()).slice(0,800000);
    const match=html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i)||html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i);
    if(!match?.[1])return '';
    const found=new URL(match[1],sourceUrl).href;
    return isPublicHttps(found)?found:'';
  }catch{return ''}
}

export async function uploadArticleThumbnail({token,ownerUrn,imageUrl,sourceUrl,linkedinVersion}){
  if(!token||!ownerUrn)return '';
  const resolved=await discoverImage(imageUrl,sourceUrl);
  if(!resolved)return '';
  try{
    const source=await safeFetch(resolved,{headers:{'user-agent':'Mozilla/5.0 QuanticNewsBot/1.0','accept':'image/*'}});
    if(!source?.ok)return '';
    const type=(source.headers.get('content-type')||'').split(';')[0].toLowerCase();
    if(!allowedImageType.has(type))return '';
    const bytes=Buffer.from(await source.arrayBuffer());
    if(!bytes.length||bytes.length>15*1024*1024)return '';

    const init=await fetch('https://api.linkedin.com/rest/images?action=initializeUpload',{
      method:'POST',
      headers:{authorization:`Bearer ${token}`,'content-type':'application/json','X-Restli-Protocol-Version':'2.0.0','Linkedin-Version':linkedinVersion},
      body:JSON.stringify({initializeUploadRequest:{owner:ownerUrn}})
    });
    const data=await init.json().catch(()=>({}));
    if(!init.ok||!data?.value?.uploadUrl||!data?.value?.image)return '';

    const upload=new URL(data.value.uploadUrl);
    if(!upload.hostname.endsWith('linkedin.com')&&!upload.hostname.endsWith('licdn.com'))return '';
    const sent=await fetch(upload.href,{method:'PUT',headers:{authorization:`Bearer ${token}`,'content-type':type},body:bytes});
    if(!sent.ok)return '';
    return data.value.image;
  }catch{return ''}
}
