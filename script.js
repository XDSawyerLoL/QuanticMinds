(() => {
  const ensureStyles = () => {
    ['./visuals.css','./public/fixes.css','./atlas.css','./hero.css','./brand-v2.css','./images-v2.css','./brand-official.css'].forEach(href => {
      const name = href.split('/').pop();
      if (document.querySelector(`link[href$="${name}"],link[href*="${name}?"]`)) return;
      const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href; document.head.appendChild(link);
    });
  };
  ensureStyles();

  const scriptEl=[...document.scripts].find(s=>/\/script\.js(?:\?|$)/.test(s.src));
  const logoUrl=scriptEl?new URL('assets/quantic-minds-logo.svg?v=official-20260913',scriptEl.src).href:'./assets/quantic-minds-logo.svg?v=official-20260913';
  document.querySelectorAll('.brand').forEach(brand=>{
    const existing=brand.querySelector('.brand-logo');
    if(existing){existing.src=logoUrl;brand.classList.add('brand-has-official');return;}
    const img=document.createElement('img');
    img.className='brand-logo';
    img.alt='Quantic Minds — Intelligence · Innovation · Impact';
    img.addEventListener('load',()=>{brand.prepend(img);brand.classList.add('brand-has-official')},{once:true});
    img.src=logoUrl;
  });

  document.querySelectorAll('a[href^="projects.html"]').forEach(a=>{const href=a.getAttribute('href')||'projects.html';a.setAttribute('href',href.replace(/^projects\.html/,'solutions.html'))});
  document.querySelectorAll('.nav a,.mobile-nav a,.footer-links a').forEach(a=>{const href=(a.getAttribute('href')||'').split('#')[0];if(href==='solutions.html')a.textContent='Solutions'});
  document.querySelectorAll('.future-section .eyebrow').forEach(el=>{if(/NOS PROJETS/i.test(el.textContent))el.textContent='NOS SOLUTIONS'});
  document.querySelectorAll('.future-section-head>a').forEach(a=>{if(/projets/i.test(a.textContent))a.textContent='Voir toutes les solutions →'});
  document.querySelectorAll('.future-actions a[href="solutions.html"]').forEach(a=>{if(/projets/i.test(a.textContent))a.innerHTML='Découvrir nos solutions <span>→</span>'});

  const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const addNewsLink=(nav,mobile=false)=>{if(!nav||nav.querySelector('a[href="news.html"]'))return;const a=document.createElement('a');a.href='news.html';a.textContent='Quantic News';if(!mobile)a.setAttribute('data-nav','');const careers=nav.querySelector('a[href="careers.html"]');nav.insertBefore(a,careers||null)};
  document.querySelectorAll('.nav').forEach(n=>addNewsLink(n));document.querySelectorAll('.mobile-nav').forEach(n=>addNewsLink(n,true));document.querySelectorAll('.footer-links').forEach(n=>{if(!n.querySelector('a[href="news.html"]')){const a=document.createElement('a');a.href='news.html';a.textContent='Quantic News';n.appendChild(a)}});
  const toggle=document.querySelector('.mobile-toggle'),mobile=document.querySelector('.mobile-nav');if(toggle&&mobile){toggle.addEventListener('click',()=>mobile.classList.toggle('open'));mobile.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>mobile.classList.remove('open')))}
  document.querySelectorAll('[data-nav]').forEach(a=>{const h=(a.getAttribute('href')||'').split('#')[0].toLowerCase();if(h===file||(file==='projects.html'&&h==='solutions.html')||(file===''&&h==='index.html'))a.classList.add('active')});
  const subjectParam=new URLSearchParams(location.search).get('subject'),subjectField=document.querySelector('[name="subject"]');if(subjectParam&&subjectField){[...subjectField.options].forEach(o=>{if(o.value.toLowerCase()===subjectParam.toLowerCase()||o.textContent.toLowerCase()===subjectParam.toLowerCase())subjectField.value=o.value})}
  const form=document.querySelector('[data-contact-form]');if(form){form.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(form),subject=encodeURIComponent(fd.get('subject')||'Contact Quantic Minds'),body=encodeURIComponent(`Nom : ${fd.get('name')||''}\nEntreprise : ${fd.get('company')||''}\nEmail : ${fd.get('email')||''}\n\n${fd.get('message')||''}`);location.href=`mailto:contact@quanticminds.fr?subject=${subject}&body=${body}`})}
  if(['lab.html','research.html','press.html','careers.html'].includes(file)){const hero=document.querySelector('.page-hero');if(hero&&!document.querySelector('.visual-showcase')){const sec=document.createElement('section');sec.className='visual-showcase';sec.innerHTML=`<div class="visual-showcase-grid"><div class="visual-shot lab-photo"><div class="visual-label">Quantic Minds<b>Le laboratoire</b></div></div><div class="visual-shot team-photo"><div class="visual-label">People<b>Les esprits du Lab</b></div></div><div class="visual-shot product-photo"><div class="visual-label">Products<b>Construire autrement</b></div></div></div>`;hero.insertAdjacentElement('afterend',sec)}}
  const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const timeAgo=iso=>{const d=new Date(iso),mins=Math.max(0,Math.round((Date.now()-d.getTime())/60000));if(mins<60)return `${mins} min`;const h=Math.floor(mins/60);if(h<24)return `${h} h`;return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})};
  const techMatch=i=>/\bia\b|intelligence artificielle|robot|tech|numéri|logiciel|cyber|semi-conduct|cloud|ordinateur|nas|smartphone|innovation|startup|internet|data|automatisation|quantique|puce|hardware|software/i.test(`${i.category||''} ${i.title||''} ${i.summary||''}`);
  const buildHomeNews=async()=>{if(!(file==='index.html'||file===''))return;const anchor=document.querySelector('.products-band');if(!anchor||document.querySelector('.news-teaser'))return;const sec=document.createElement('section');sec.className='news-teaser';sec.innerHTML=`<div class="wrap"><div class="news-teaser-head"><div class="news-teaser-logo" aria-label="Quantic News"></div><p>Le flux technologique de Quantic Minds : IA, robotique, logiciels, cybersécurité et nouveaux usages.</p><a class="pill-btn" href="news.html">Ouvrir Quantic News →</a></div><div class="news-teaser-grid"><div class="news-empty">Chargement du flux…</div></div></div>`;anchor.insertAdjacentElement('afterend',sec);try{const r=await fetch('https://xdsawyerlol.github.io/LEFILLIBRE/feed.json',{cache:'no-store'});if(!r.ok)throw new Error('feed');const data=await r.json(),items=(data.items||[]).filter(i=>i.image&&techMatch(i)).slice(0,3),grid=sec.querySelector('.news-teaser-grid');grid.innerHTML=items.length?items.map(i=>`<a class="news-mini" href="${esc(i.url)}" target="_blank" rel="noopener"><div class="news-mini-media" style="background-image:url('${esc(i.image)}')"></div><div class="news-mini-copy"><div class="news-mini-meta">${esc(i.source)} · ${timeAgo(i.publishedAt)}</div><h3>${esc(i.title)}</h3><p>${esc((i.summary||'').slice(0,145))}${(i.summary||'').length>145?'…':''}</p><span class="news-mini-more">Lire la source →</span></div></a>`).join(''):'<div class="news-empty">Aucune actualité technologique illustrée disponible pour le moment.</div>'}catch(e){sec.querySelector('.news-teaser-grid').innerHTML='<div class="news-empty">Le flux Quantic News est momentanément indisponible.</div>'}};
  buildHomeNews();
})();