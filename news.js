(() => {
  const FEEDS=[
    './news/feed.json',
    'https://raw.githubusercontent.com/XDSawyerLoL/LEFILLIBRE/main/feed.json',
    'https://xdsawyerlol.github.io/LEFILLIBRE/feed.json'
  ];
  const MANIFEST='./news/articles/index.json';
  const QUANTIC_NEWS_URL='https://xdsawyerlol.github.io/QuanticMinds/news.html';
  const grid=document.getElementById('news-grid');
  const updated=document.getElementById('news-updated');
  const filters=[...document.querySelectorAll('.news-filter')];
  if(!grid)return;

  let items=[];
  let current='all';
  let articleMap=new Map();

  const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const ago=iso=>{const d=new Date(iso),m=Math.max(0,Math.round((Date.now()-d)/60000));if(!Number.isFinite(m))return '';if(m<60)return `${m} min`;const h=Math.floor(m/60);if(h<24)return `${h} h`;return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})};
  const hay=i=>`${i.category||''} ${i.source||''} ${i.title||''} ${i.summary||''}`.toLowerCase();
  const techSource=i=>/01net|frandroid|numerama|techcrunch|the verge|wired|ars technica|zdnet|clubic|cnet|engadget|tom's hardware|les numériques|korben|macg|next\.ink|venturebeat/i.test(i.source||'');
  const eligible=i=>String(i.category||'').toLowerCase().includes('tech')||techSource(i)||/\bia\b|intelligence artificielle|artificial intelligence|openai|chatgpt|anthropic|gemini|mistral|robot|tech|numéri|logiciel|cyber|semi-conduct|cloud|ordinateur|smartphone|innovation|startup|internet|data|automatisation|quantique|puce|hardware|software|processeur|plateforme|application|iphone|android|windows|linux|apple|google|microsoft|nvidia|amd|intel|tesla|spacex/.test(hay(i));
  const match=(i,f)=>{const h=hay(i);if(f==='all')return true;if(f==='ai')return /\bia\b|intelligence artificielle|artificial intelligence|openai|chatgpt|anthropic|gemini|mistral|machine learning|modèle|agent|cloud|cyber|numéri|logiciel/.test(h);if(f==='robot')return /robot|robotique|androïde|humanoïde|automatisation|drone/.test(h);if(f==='product')return /produit|app|application|smartphone|iphone|android|ordinateur|navigateur|browser|logiciel|plateforme|device|nas|écran|puce|apple|google|microsoft|nvidia|amd|intel/.test(h);if(f==='future')return /innovation|futur|recherche|prototype|startup|laboratoire|quantique|espace|énergie|mobilité|spacex|tesla/.test(h);return true};
  const storyKey=i=>String(i.url||i.articleUrl||i.title||'');
  const fallbackStoryUrl=i=>`${QUANTIC_NEWS_URL}?story=${encodeURIComponent(storyKey(i))}`;
  const articleUrl=i=>articleMap.get(storyKey(i))||fallbackStoryUrl(i);
  const externalSource=i=>{const u=String(i.url||'').trim();return u&&!/xdsawyerlol\.github\.io\/LEFILLIBRE/i.test(u)?u:''};
  const shareHref=i=>`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl(i))}`;
  const deepLink=new URLSearchParams(location.search).get('story')||'';

  async function fetchJson(url){
    const glue=url.includes('?')?'&':'?';
    const r=await fetch(`${url}${glue}v=${Date.now()}`,{cache:'no-store'});
    if(!r.ok)throw new Error(`${url}:${r.status}`);
    return r.json();
  }

  async function loadFeed(){
    let lastError;
    for(const url of FEEDS){
      try{
        const data=await fetchJson(url);
        if(!Array.isArray(data.items))throw new Error('bad_feed');
        return data;
      }catch(e){lastError=e;}
    }
    throw lastError||new Error('feed_unavailable');
  }

  async function loadManifest(){
    try{
      const data=await fetchJson(MANIFEST);
      articleMap=new Map((data.items||[]).map(x=>[String(x.story||''),String(x.url||'')]).filter(x=>x[0]&&x[1]));
    }catch{
      articleMap=new Map();
    }
  }

  const wireSmartShare=()=>{
    grid.querySelectorAll('[data-smart-share]').forEach(btn=>btn.addEventListener('click',()=>{
      const key=btn.dataset.story||'';
      const item=items.find(x=>storyKey(x)===key);
      if(!item)return;
      const smart=window.QuanticNewsSocial?.smartShare;
      if(smart)smart(key,shareHref(item));
      else window.open(shareHref(item),'_blank','noopener');
    }));
  };

  const render=()=>{
    const list=items.filter(i=>match(i,current));
    grid.innerHTML=list.length?list.map(i=>{
      const source=externalSource(i);
      const page=articleUrl(i);
      const mediaStyle=i.image?`background-image:linear-gradient(180deg,rgba(2,7,13,.04),rgba(2,7,13,.18)),url('${esc(i.image)}')`:'';
      return `<article class="news-card" data-story="${esc(storyKey(i))}"><a class="news-card-media" href="${esc(page)}" aria-label="Lire ${esc(i.title)}" style="${mediaStyle}"></a><div class="news-card-body"><div class="news-card-meta"><span>${esc(i.source||'Source')}</span><span>•</span><span>${ago(i.publishedAt)}</span>${i.category?`<span>•</span><span>${esc(i.category)}</span>`:''}</div><h2><a href="${esc(page)}">${esc(i.title)}</a></h2><p>${esc((i.summary||'').slice(0,260))}${(i.summary||'').length>260?'…':''}</p><div class="news-card-actions"><button class="news-share-linkedin" type="button" data-smart-share data-story="${esc(storyKey(i))}" aria-label="Partager cet article Quantic News sur LinkedIn">in&nbsp; Partager</button><a class="news-source-link" href="${esc(page)}">Lire l’article →</a>${source?`<a class="news-source-original" href="${esc(source)}" target="_blank" rel="noopener noreferrer">Source originale ↗</a>`:''}</div></div></article>`;
    }).join(''):'<div class="news-empty">Aucune actualité technologique ne correspond à ce filtre pour le moment.</div>';
    wireSmartShare();
  };

  filters.forEach(b=>b.addEventListener('click',()=>{
    filters.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    current=b.dataset.filter||'all';
    render();
  }));

  Promise.all([loadFeed(),loadManifest()]).then(([data])=>{
    if(deepLink&&articleMap.has(deepLink)){
      location.replace(articleMap.get(deepLink));
      return;
    }
    items=(data.items||[]).filter(eligible).sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt)).slice(0,60);
    if(deepLink&&!items.some(i=>storyKey(i)===deepLink)){
      const extra=(data.items||[]).find(i=>storyKey(i)===deepLink);
      if(extra)items.unshift(extra);
    }
    if(updated)updated.textContent=data.updatedAt?`${items.length} actus tech · mis à jour ${ago(data.updatedAt)}`:`${items.length} actus tech`;
    render();
  }).catch(err=>{
    console.error('Quantic News feed error',err);
    if(updated)updated.textContent='Flux indisponible';
    grid.innerHTML='<div class="news-empty">Impossible de charger Quantic News pour le moment. Actualise la page.</div>';
  });
})();
