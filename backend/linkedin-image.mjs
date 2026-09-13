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

export async function uploadArticleThumbnail({token,ownerUrn,imageUrl,linkedinVersion}){
  if(!token||!ownerUrn||!isPublicHttps(imageUrl))return '';
  try{
    const source=await fetch(imageUrl,{headers:{'user-agent':'Mozilla/5.0 QuanticNewsBot/1.0'}});
    if(!source.ok)return '';
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
