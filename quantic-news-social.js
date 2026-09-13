(()=>{
  const PREF_KEY='quanticnews.subscription.v1';
  const SESSION_KEY='quanticnews.linkedin.session.v1';
  const API_BASE=String(window.QUANTIC_NEWS_API_BASE||localStorage.getItem('quanticnews.apiBase')||'').replace(/\/$/,'');
  const $=id=>document.getElementById(id);
  let toastTimer;

  function readPrefs(){try{return JSON.parse(localStorage.getItem(PREF_KEY)||'null')||{}}catch{return {}}}
  function writePrefs(patch){const next={...readPrefs(),...patch,updatedAt:new Date().toISOString()};localStorage.setItem(PREF_KEY,JSON.stringify(next));return next}
  function session(){return localStorage.getItem(SESSION_KEY)||''}
  function headers(extra={}){return {accept:'application/json',...(session()?{authorization:`Bearer ${session()}`}:{}) ,...extra}}
  function toast(message){const el=$('qnToast');if(!el){console.log(message);return}el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,5200)}
  function backendPrefs(){const p=readPrefs();return {categories:['IA & Tech'],mode:p.mode||'review',maxPerDay:Number(p.dailyLimit||3),minIntervalMinutes:Number(p.minGap||90),quietStart:p.quietStart||'22:30',quietEnd:p.quietEnd||'07:30'}}
  async function api(path,options={}){if(!API_BASE)throw new Error('backend_not_configured');const r=await fetch(`${API_BASE}${path}`,{...options,headers:headers(options.headers||{})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`http_${r.status}`);return data}

  function updateButton(){const p=readPrefs();const btn=$('qnSubscribeBtn');if(!btn)return;const active=!!p.active;btn.classList.toggle('active',active);btn.textContent=active?'Abonnement actif':'S’abonner'}
  window.updateQnSubscribeButton=updateButton;

  function fillForm(){const p=readPrefs();const mode=document.querySelector(`input[name="qnMode"][value="${p.mode||'review'}"]`);if(mode)mode.checked=true;const daily=$('qnDailyLimit'),gap=$('qnMinGap'),qs=$('qnQuietStart'),qe=$('qnQuietEnd');if(daily)daily.value=String(p.dailyLimit||3);if(gap)gap.value=String(p.minGap||90);if(qs)qs.value=p.quietStart||'22:30';if(qe)qe.value=p.quietEnd||'07:30';setLinkedInUi(!!p.linkedinConnected,p.linkedinName||'',!!p.reconnectRequired)}
  function collect(){return {active:true,mode:document.querySelector('input[name="qnMode"]:checked')?.value||'review',dailyLimit:Number($('qnDailyLimit')?.value||3),minGap:Number($('qnMinGap')?.value||90),quietStart:$('qnQuietStart')?.value||'22:30',quietEnd:$('qnQuietEnd')?.value||'07:30'}}
  function setLinkedInUi(connected,name='',reconnect=false){const status=$('qnLinkedinStatus'),button=$('qnConnectLinkedIn');if(status)status.textContent=connected?(reconnect?'LinkedIn à reconnecter':`LinkedIn connecté${name?` · ${name}`:''}`):'LinkedIn non connecté';if(button)button.textContent=connected&&!reconnect?'Reconnecter LinkedIn':'Connecter LinkedIn';writePrefs({linkedinConnected:connected&&!reconnect,linkedinName:name,reconnectRequired:reconnect});updateButton()}

  function openModal(){fillForm();$('qnSubscribeModal').hidden=false;document.body.classList.add('qn-modal-open')}
  function closeModal(){$('qnSubscribeModal').hidden=true;document.body.classList.remove('qn-modal-open')}
  async function save(){const p=writePrefs(collect());updateButton();let synced=false;if(session()&&API_BASE){try{await api('/me/preferences',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(backendPrefs())});synced=true}catch(e){toast(`Réglages sauvegardés sur cet appareil. Synchronisation LinkedIn impossible : ${e.message}`)}}const state=$('qnSaveState');if(state)state.textContent=synced?'Abonnement synchronisé avec LinkedIn.':(API_BASE?'Réglages enregistrés. Connecte LinkedIn pour activer l’autopublication.':'Réglages enregistrés. Le backend LinkedIn doit encore être relié pour publier automatiquement.');toast(p.mode==='auto'?'Préférences d’autopublication enregistrées.':'Préférences enregistrées en mode validation.');if(synced)setTimeout(closeModal,700)}
  function connectLinkedIn(){if(!API_BASE){toast('Le bouton est prêt, mais le backend OAuth LinkedIn de Quantic News n’est pas encore relié à une URL publique.');return}const returnTo=`${location.origin}${location.pathname}`;location.href=`${API_BASE}/auth/linkedin/start?returnTo=${encodeURIComponent(returnTo)}`}
  async function refreshStatus(){if(!API_BASE||!session()){setLinkedInUi(false);return}try{const me=await api('/me');setLinkedInUi(true,me.name||'',!!me.reconnectRequired)}catch{localStorage.removeItem(SESSION_KEY);setLinkedInUi(false)}}
  function consumeOAuth(){const hash=new URLSearchParams(location.hash.replace(/^#/,''));const s=hash.get('qn_session')||hash.get('lf_session')||hash.get('session');if(s){localStorage.setItem(SESSION_KEY,s);history.replaceState({},'',location.pathname+location.search)}const q=new URLSearchParams(location.search);if(q.get('linkedin')==='connected'){q.delete('linkedin');q.delete('reason');history.replaceState({},'',location.pathname+(q.toString()?`?${q}`:''));toast('LinkedIn connecté. Tu peux activer l’autopublication.')}else if(q.get('linkedin')==='error'){const reason=q.get('reason')||'authorization_failed';q.delete('linkedin');q.delete('reason');history.replaceState({},'',location.pathname+(q.toString()?`?${q}`:''));toast(`Connexion LinkedIn refusée : ${reason}`)}}

  consumeOAuth();
  document.addEventListener('DOMContentLoaded',()=>{
    updateButton();
    $('qnSubscribeBtn')?.addEventListener('click',openModal);
    $('qnCloseSubscribe')?.addEventListener('click',closeModal);
    $('qnSubscribeModal')?.addEventListener('click',e=>{if(e.target===$('qnSubscribeModal'))closeModal()});
    $('qnConnectLinkedIn')?.addEventListener('click',connectLinkedIn);
    $('qnSaveSubscription')?.addEventListener('click',save);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('qnSubscribeModal')?.hidden)closeModal()});
    refreshStatus();
  });
})();
