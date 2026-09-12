(() => {
  const FEED='https://xdsawyerlol.github.io/LEFILLIBRE/feed.json';
  const grid=document.getElementById('news-grid');
  const updated=document.getElementById('news-updated');
  const filters=[...document.querySelectorAll('.news-filter')];
  if(!grid) return;
  let items=[];
  let current='all';
  const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const ago=iso=>{const d=new Date(iso),m=Math.max(0,Math.round((Date.now()-d)/60000));if(m<60)return `${m} min`;const h=Math.floor(m/60);if(h<24)return `${h} h`;return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})};
  const hay=i=>`${i.category||''} ${i.title||''} ${i.summary||''}`.toLowerCase();
  const match=(i,f)=>{const h=hay(i);if(f==='all')return true;if(f==='ai')return /ia|intelligence artificielle|ai\b|tech|logiciel|cloud|cyber|numéri|ordinateur|semi-conduct|processeur|nas/.test(h);if(f==='robot')return /robot|robotique|androïde|humanoïde|automatisation|drone/.test(h);if(f==='product')return /produit|app|application|smartphone|ordinateur|navigateur|browser|logiciel|plateforme|device|nas|écran|puce/.test(h);if(f==='future')return /innovation|futur|recherche|prototype|startup|laboratoire|quantique|espace|énergie|mobilité/.test(h);return true};
  const render=()=>{const list=items.filter(i=>match(i,current));grid.innerHTML=list.length?list.map(i=>`<article class="news-card"><div class="news-card-media" style="${i.image?`background-image:linear-gradient(180deg,rgba(2,7,13,.04),rgba(2,7,13,.18)),url('${esc(i.image)}')`:''}"></div><div class="news-card-body"><div class="news-card-meta"><span>${esc(i.source||'Source')}</span><span>•</span><span>${ago(i.publishedAt)}</span>${i.category?`<span>•</span><span>${esc(i.category)}</span>`:''}</div><h2>${esc(i.title)}</h2><p>${esc((i.summary||'').slice(0,260))}${(i.summary||'').length>260?'…':''}</p><div class="news-card-actions"><span>Quantic News</span><a href="${esc(i.url)}" target="_blank" rel="noopener">Lire la source →</a></div></div></article>`).join(''):'<div class="news-empty">Aucune actualité ne correspond à ce filtre pour le moment.</div>'};
  filters.forEach(b=>b.addEventListener('click',()=>{filters.forEach(x=>x.classList.remove('active'));b.classList.add('active');current=b.dataset.filter||'all';render()}));
  fetch(FEED,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('feed');return r.json()}).then(data=>{items=(data.items||[]).sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt));updated.textContent=data.updatedAt?`Mis à jour ${ago(data.updatedAt)}`:'Flux connecté';render()}).catch(()=>{updated.textContent='Flux indisponible';grid.innerHTML='<div class="news-empty">Impossible de charger le flux Quantic News pour le moment. Réessaie dans quelques minutes.</div>'});
})();
