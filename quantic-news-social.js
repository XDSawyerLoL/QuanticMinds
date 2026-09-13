(()=>{
  const PREF_KEY='quanticnews.subscription.v1';
  const SESSION_KEY='quanticnews.linkedin.session.v1';
  const API_BASE=String(window.QUANTIC_NEWS_API_BASE||localStorage.getItem('quanticnews.apiBase')||'').replace(/\/$/,'');
  const $=id=>document.getElementById(id);
  let toastTimer,smartStory='';

  function ensureUi(){
    const updated=$('news-updated');
    if(updated&&!$('qnSubscribeBtn')){
      const wrap=document.createElement('div');wrap.className='news-toolbar-actions';
      updated.parentNode.insertBefore(wrap,updated);wrap.appendChild(updated);
      const btn=document.createElement('button');btn.id='qnSubscribeBtn';btn.className='news-subscribe-btn';btn.type='button';btn.textContent='S’abonner';wrap.appendChild(btn);
    }
    if(!$('qnSubscribeModal')){
      const modal=document.createElement('div');modal.id='qnSubscribeModal';modal.className='qn-modal';modal.hidden=true;
      modal.innerHTML=`<section class="qn-dialog" role="dialog" aria-modal="true" aria-labelledby="qnSubscribeTitle"><div class="qn-dialog-head"><div><h2 id="qnSubscribeTitle">Mon Quantic News</h2><p>Choisissez le rythme et le mode de diffusion des actualités technologiques vers LinkedIn.</p></div><button class="qn-close" id="qnCloseSubscribe" type="button" aria-label="Fermer">×</button></div><div class="qn-dialog-body"><div class="qn-step"><div class="qn-step-title">1 · Mode de publication</div><div class="qn-mode-grid"><label class="qn-mode"><strong><input type="radio" name="qnMode" value="review" checked> Validation</strong><small>Conserver les réglages sans publier automatiquement.</small></label><label class="qn-mode"><strong><input type="radio" name="qnMode" value="auto"> Automatique</strong><small>Publier une actualité éligible selon vos limites.</small></label></div></div><div class="qn-step"><div class="qn-step-title">2 · Rythme</div><div class="qn-settings"><div class="qn-field"><label for="qnDailyLimit">Maximum par jour</label><select id="qnDailyLimit"><option value="1">1</option><option value="2">2</option><option value="3" selected>3</option><option value="4">4</option><option value="6">6</option></select></div><div class="qn-field"><label for="qnMinGap">Délai minimum</label><select id="qnMinGap"><option value="60">1 heure</option><option value="90" selected>1 h 30</option><option value="120">2 heures</option><option value="180">3 heures</option></select></div><div class="qn-field"><label for="qnQuietStart">Silence à partir de</label><input id="qnQuietStart" type="time" value="22:30"></div><div class="qn-field"><label for="qnQuietEnd">Reprise à</label><input id="qnQuietEnd" type="time" value="07:30"></div></div></div><div class="qn-step"><div class="qn-step-title">3 · LinkedIn</div><div class="qn-linkedin-box"><div><strong id="qnLinkedinStatus">LinkedIn non relié</strong><p>La liaison sécurisée est nécessaire uniquement pour l’envoi automatique.</p></div><button class="qn-connect" id="qnConnectLinkedIn" type="button">Relier LinkedIn</button></div></div><div class="qn-launch-row"><span class="qn-save-state" id="qnSaveState">Préférences enregistrées sur cet appareil.</span><button class="qn-launch" id="qnSaveSubscription" type="button">Activer l’abonnement</button></div></div></section>`;
      document.body.appendChild(modal);
    }
    if(!$('qnSmartShareModal')){
      const modal=document.createElement('div');modal.id='qnSmartShareModal';modal.className='qn-modal';modal.hidden=true;
      modal.innerHTML=`<section class="qn-dialog qn-smart-dialog" role="dialog" aria-modal="true" aria-labelledby="qnSmartTitle"><div class="qn-dialog-head"><div><div class="qn-smart-kicker">LinkedIn Smart Share</div><h2 id="qnSmartTitle">Publication optimisée</h2><p>Quantic News prépare un texte sémantique clair, ciblé et lisible par le moteur de recommandation LinkedIn. Vous pouvez le modifier avant publication.</p></div><button class="qn-close" id="qnCloseSmart" type="button" aria-label="Fermer">×</button></div><div class="qn-dialog-body"><div class="qn-smart-score"><div><span>Thème détecté</span><strong id="qnSmartTopic">Analyse…</strong></div><div><span>Stratégie</span><strong>mots-clés naturels · 3 hashtags max · question ciblée</strong></div></div><div class="qn-step"><div class="qn-step-title">Mots-clés intégrés</div><div class="qn-keywords" id="qnSmartKeywords"><span>Analyse de l’article…</span></div></div><div class="qn-step"><div class="qn-step-title">Texte LinkedIn</div><textarea class="qn-smart-text" id="qnSmartText" maxlength="3000" aria-label="Texte LinkedIn optimisé"></textarea><div class="qn-smart-counter"><span>La première ligne porte les principaux signaux sémantiques.</span><b id="qnSmartCount">0 / 3000</b></div></div><div class="qn-smart-actions"><button class="qn-smart-cancel" id="qnSmartCancel" type="button">Annuler</button><button class="qn-smart-publish" id="qnSmartPublish" type="button">Publier sur LinkedIn</button></div></div></section>`;
      document.body.appendChild(modal);
    }
    if(!$('qnToast')){const t=document.createElement('div');t.id='qnToast';t.className='qn-toast';t.hidden=true;document.body.appendChild(t)}
  }

  function readPrefs(){try{return JSON.parse(localStorage.getItem(PREF_KEY)||'null')||{}}catch{return {}}}
  function writePrefs(patch){const next={...readPrefs(),...patch,updatedAt:new Date().toISOString()};localStorage.setItem(PREF_KEY,JSON.stringify(next));return next}
  function session(){return localStorage.getItem(SESSION_KEY)||''}
  function headers(extra={}){return {accept:'application/json',...(session()?{authorization:`Bearer ${session()}`}:{}) ,...extra}}
  function toast(message){const el=$('qnToast');if(!el)return;el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,5200)}
  function backendPrefs(){const p=readPrefs();return {categories:['IA & Tech'],mode:p.mode||'review',maxPerDay:Number(p.dailyLimit||3),minIntervalMinutes:Number(p.minGap||90),quietStart:p.quietStart||'22:30',quietEnd:p.quietEnd||'07:30'}}
  async function api(path,options={}){if(!API_BASE)throw new Error('backend_not_configured');const r=await fetch(`${API_BASE}${path}`,{...options,headers:headers(options.headers||{})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`http_${r.status}`);return data}

  function updateButton(){const p=readPrefs(),btn=$('qnSubscribeBtn');if(!btn)return;btn.classList.toggle('active',!!p.active);btn.textContent=p.active?'Abonnement actif':'S’abonner'}
  function setLinkedInUi(connected,name='',reconnect=false){const status=$('qnLinkedinStatus'),button=$('qnConnectLinkedIn');if(status)status.textContent=connected?(reconnect?'LinkedIn à relier de nouveau':`LinkedIn relié${name?` · ${name}`:''}`):'LinkedIn non relié';if(button)button.textContent=connected&&!reconnect?'Relier à nouveau':'Relier LinkedIn';writePrefs({linkedinConnected:connected&&!reconnect,linkedinName:name,reconnectRequired:reconnect});updateButton()}
  function fillForm(){const p=readPrefs(),mode=document.querySelector(`input[name="qnMode"][value="${p.mode||'review'}"]`);if(mode)mode.checked=true;if($('qnDailyLimit'))$('qnDailyLimit').value=String(p.dailyLimit||3);if($('qnMinGap'))$('qnMinGap').value=String(p.minGap||90);if($('qnQuietStart'))$('qnQuietStart').value=p.quietStart||'22:30';if($('qnQuietEnd'))$('qnQuietEnd').value=p.quietEnd||'07:30';setLinkedInUi(!!p.linkedinConnected,p.linkedinName||'',!!p.reconnectRequired)}
  function collect(){return {active:true,mode:document.querySelector('input[name="qnMode"]:checked')?.value||'review',dailyLimit:Number($('qnDailyLimit')?.value||3),minGap:Number($('qnMinGap')?.value||90),quietStart:$('qnQuietStart')?.value||'22:30',quietEnd:$('qnQuietEnd')?.value||'07:30'}}
  function openModal(){const m=$('qnSubscribeModal');if(!m)return;fillForm();m.hidden=false;document.body.classList.add('qn-modal-open')}
  function closeModal(){const m=$('qnSubscribeModal');if(!m)return;m.hidden=true;if($('qnSmartShareModal')?.hidden!==false)document.body.classList.remove('qn-modal-open')}
  function closeSmart(){const m=$('qnSmartShareModal');if(!m)return;m.hidden=true;smartStory='';if($('qnSubscribeModal')?.hidden!==false)document.body.classList.remove('qn-modal-open')}
  async function save(){const p=writePrefs(collect());updateButton();let synced=false;if(session()&&API_BASE){try{await api('/me/preferences',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(backendPrefs())});synced=true}catch(e){toast(`Préférences conservées localement. Synchronisation impossible : ${e.message}`)}}const state=$('qnSaveState');if(state)state.textContent=synced?'Abonnement synchronisé.':(API_BASE?'Préférences enregistrées. Reliez LinkedIn pour l’envoi automatique.':'Préférences enregistrées. Le service serveur LinkedIn reste à relier.');toast(p.mode==='auto'?'Mode automatique enregistré.':'Mode validation enregistré.');if(synced)setTimeout(closeModal,700)}
  function connectLinkedIn(){if(!API_BASE){toast('La liaison LinkedIn nécessite encore l’URL du service sécurisé Quantic News.');return}const returnTo=`${location.origin}${location.pathname}`;location.href=`${API_BASE}/auth/linkedin/start?returnTo=${encodeURIComponent(returnTo)}`}
  async function refreshStatus(){if(!API_BASE||!session()){setLinkedInUi(false);return}try{const me=await api('/me');setLinkedInUi(true,me.name||'',!!me.reconnectRequired)}catch{localStorage.removeItem(SESSION_KEY);setLinkedInUi(false)}}
  function consumeReturn(){const hash=new URLSearchParams(location.hash.replace(/^#/,''));const s=hash.get('qn_session')||hash.get('lf_session')||hash.get('session');if(s){localStorage.setItem(SESSION_KEY,s);history.replaceState({},'',location.pathname+location.search)}const q=new URLSearchParams(location.search);if(q.get('linkedin')==='connected'){q.delete('linkedin');q.delete('reason');history.replaceState({},'',location.pathname+(q.toString()?`?${q}`:''));toast('LinkedIn relié. Le mode automatique peut être activé.')}}
  function updateSmartCount(){const t=$('qnSmartText');if($('qnSmartCount')&&t)$('qnSmartCount').textContent=`${t.value.length} / 3000`}
  async function openSmartShare(story,fallbackUrl=''){
    ensureUi();
    if(!API_BASE||!session()){
      toast('Reliez LinkedIn à Quantic News pour utiliser le partage optimisé.');
      openModal();
      return;
    }
    smartStory=String(story||'');
    const m=$('qnSmartShareModal');m.hidden=false;document.body.classList.add('qn-modal-open');
    $('qnSmartTopic').textContent='Analyse…';$('qnSmartKeywords').innerHTML='<span>Analyse de l’article…</span>';$('qnSmartText').value='';updateSmartCount();
    const pub=$('qnSmartPublish');pub.disabled=true;pub.textContent='Préparation…';
    try{
      const p=await api('/me/share-preview',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({story:smartStory})});
      $('qnSmartTopic').textContent=p.topic||'Technologie';
      $('qnSmartKeywords').innerHTML=[...(p.keywords||[]),...(p.hashtags||[])].map(x=>`<span>${String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</span>`).join('')||'<span>Technologie</span>';
      $('qnSmartText').value=p.commentary||'';updateSmartCount();pub.disabled=false;pub.textContent='Publier sur LinkedIn';
    }catch(e){
      closeSmart();toast(`Optimisation indisponible : ${e.message}`);if(fallbackUrl)window.open(fallbackUrl,'_blank','noopener');
    }
  }
  async function publishSmart(){if(!smartStory)return;const btn=$('qnSmartPublish'),text=$('qnSmartText')?.value||'';btn.disabled=true;btn.textContent='Publication…';try{const r=await api('/me/share',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({story:smartStory,commentary:text})});toast(`Publié sur LinkedIn${r.postId?' · publication confirmée':''}.`);closeSmart()}catch(e){toast(`Publication impossible : ${e.message}`);btn.disabled=false;btn.textContent='Publier sur LinkedIn'}}

  window.QuanticNewsSocial={smartShare:openSmartShare};
  consumeReturn();
  document.addEventListener('DOMContentLoaded',()=>{
    ensureUi();updateButton();
    $('qnSubscribeBtn')?.addEventListener('click',openModal);
    $('qnCloseSubscribe')?.addEventListener('click',closeModal);
    $('qnSubscribeModal')?.addEventListener('click',e=>{if(e.target===$('qnSubscribeModal'))closeModal()});
    $('qnConnectLinkedIn')?.addEventListener('click',connectLinkedIn);
    $('qnSaveSubscription')?.addEventListener('click',save);
    $('qnCloseSmart')?.addEventListener('click',closeSmart);
    $('qnSmartCancel')?.addEventListener('click',closeSmart);
    $('qnSmartShareModal')?.addEventListener('click',e=>{if(e.target===$('qnSmartShareModal'))closeSmart()});
    $('qnSmartPublish')?.addEventListener('click',publishSmart);
    $('qnSmartText')?.addEventListener('input',updateSmartCount);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSmart();closeModal()}});
    refreshStatus();
  });
})();
