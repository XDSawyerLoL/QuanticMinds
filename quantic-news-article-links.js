(()=>{
  const MANIFEST='./news/articles/index.json';
  let map=new Map();

  const apply=()=>{
    document.querySelectorAll('.news-card[data-story]').forEach(card=>{
      const target=map.get(card.dataset.story||'');
      if(!target)return;
      const title=card.querySelector('h2 a');
      const read=card.querySelector('.news-source-link');
      if(title)title.href=target;
      if(read){read.href=target;read.textContent='Lire l’article →'}
      const media=card.querySelector('.news-card-media');
      if(media&&media.tagName!=='A'){
        media.style.cursor='pointer';
        media.setAttribute('role','link');
        media.setAttribute('tabindex','0');
        const go=()=>location.href=target;
        media.onclick=go;
        media.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}};
      }
    });

    const oldStory=new URLSearchParams(location.search).get('story');
    if(oldStory&&map.has(oldStory))location.replace(map.get(oldStory));
  };

  fetch(`${MANIFEST}?v=${Date.now()}`,{cache:'no-store'})
    .then(r=>r.ok?r.json():Promise.reject(new Error('manifest')))
    .then(data=>{map=new Map((data.items||[]).map(x=>[String(x.story||''),String(x.url||'')]));apply();new MutationObserver(apply).observe(document.getElementById('news-grid')||document.body,{childList:true,subtree:true})})
    .catch(()=>{});
})();
