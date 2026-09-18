const API_BASE=String(window.QUANTIC_PULSE_API_BASE||'').replace(/\/$/,'');
const TOKEN_KEY='quantic_pulse_token';
const state={token:localStorage.getItem(TOKEN_KEY)||'',user:null,feed:'following',view:'home',replyTo:null,authMode:'login'};
const feed=document.getElementById('pulse-feed');
const textarea=document.getElementById('pulse-text');
const publish=document.getElementById('pulse-publish');
const count=document.getElementById('pulse-count');
const composer=document.getElementById('composer');
const feedTabs=document.getElementById('feed-tabs');
const viewTitle=document.getElementById('view-title');
const authModal=document.getElementById('auth-modal');
const authForm=document.getElementById('auth-form');
const authError=document.getElementById('auth-error');

function esc(v){return String(v||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
function initials(user){const s=(user?.displayName||user?.handle||'?').trim().split(/\s+/).slice(0,2).map(function(x){return x[0]||''}).join('');return s.toUpperCase()||'?'}
function timeAgo(iso){const t=Date.parse(iso),d=Math.max(0,Date.now()-t),m=Math.floor(d/60000);if(m<1)return'maintenant';if(m<60)return m+' min';const h=Math.floor(m/60);if(h<24)return h+' h';const days=Math.floor(h/24);if(days<7)return days+' j';return new Date(t).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}
function setStatus(title,text){feed.innerHTML='<div class="pulse-status"><strong>'+esc(title)+'</strong>'+esc(text||'')+'</div>'}
function errorText(e){const map={unauthorized:'Connexion requise.',invalid_credentials:'Identifiant ou mot de passe incorrect.',handle_taken:'Cet identifiant est déjà pris.',invalid_handle:'Identifiant : 3 à 24 caractères, lettres minuscules, chiffres ou _.',weak_password:'Le mot de passe doit contenir au moins 10 caractères.',rate_limited:'Trop de requêtes. Réessaie plus tard.',not_found:'Élément introuvable.',blocked:'Cette conversation est bloquée.'};return map[e?.message]||e?.message||'Une erreur est survenue.'}
async function api(path,options={}){
  const headers={'content-type':'application/json',...(options.headers||{})};
  if(state.token)headers.authorization='Bearer '+state.token;
  const response=await fetch(API_BASE+path,{...options,headers});
  const data=await response.json().catch(function(){return{}});
  if(!response.ok){const err=new Error(data.error||'request_failed');err.status=response.status;err.data=data;throw err}
  return data
}
function openAuth(mode='login'){state.authMode=mode;authModal.hidden=false;updateAuthModal();setTimeout(function(){document.getElementById('auth-handle').focus()},20)}
function closeAuth(){authModal.hidden=true;authError.textContent=''}
function updateAuthModal(){
  const register=state.authMode==='register';
  document.getElementById('auth-title').textContent=register?'Créer un compte':'Se connecter';
  document.getElementById('auth-copy').textContent=register?'Choisis ton identité Pulse. Ton nom civil n’est pas obligatoire.':'Retrouve ton fil, tes abonnements, tes messages et tes cercles.';
  document.getElementById('display-name-field').hidden=!register;
  document.getElementById('auth-switch').textContent=register?'J’ai déjà un compte':'Créer un compte';
  document.getElementById('auth-password').autocomplete=register?'new-password':'current-password';
}
function updateAccount(){
  const user=state.user;
  const name=document.getElementById('account-name'),handle=document.getElementById('account-handle'),av=document.getElementById('account-avatar'),cav=document.getElementById('composer-avatar'),button=document.getElementById('auth-button');
  if(user){name.textContent=user.displayName;handle.textContent='@'+user.handle;av.textContent=initials(user);cav.textContent=initials(user);button.textContent='@'+user.handle;textarea.placeholder="Qu'est-ce qui mérite de circuler ?"}
  else{name.textContent='Connexion';handle.textContent='Créer un compte';av.textContent='?';cav.textContent='?';button.textContent='Se connecter';textarea.placeholder='Connecte-toi pour publier';}
}
function requireAuth(){if(state.user)return true;openAuth('login');return false}
function setView(view,title){
  state.view=view;viewTitle.textContent=title||'Pulse';
  document.querySelectorAll('[data-view]').forEach(function(b){b.classList.toggle('active',b.dataset.view===view)});
  feedTabs.hidden=view!=='home';
  composer.hidden=view!=='home';
}
function renderPost(post){
  const u=post.author||{},liked=post.viewer?.liked,reposted=post.viewer?.reposted,bookmarked=post.viewer?.bookmarked;
  let quote='';
  if(post.quote){quote='<div class="pulse-post-link"><div><small>@'+esc(post.quote.author.handle)+'</small><strong>'+esc(post.quote.body)+'</strong></div></div>'}
  return '<article class="pulse-post" data-id="'+esc(post.id)+'">'+
    '<div class="pulse-avatar">'+esc(initials(u))+'</div>'+
    '<div class="pulse-post-main">'+
      '<div class="pulse-post-head"><button data-profile="'+esc(u.handle)+'">'+esc(u.displayName||u.handle)+'</button>'+(u.verified?'<span class="pulse-badge">◆</span>':'')+'<span>@'+esc(u.handle)+' · '+esc(timeAgo(post.createdAt))+'</span></div>'+
      '<p>'+esc(post.body)+'</p>'+quote+
      '<div class="pulse-actions">'+
        '<button class="pulse-action" data-action="reply">◌ '+Number(post.counts?.replies||0)+'</button>'+
        '<button class="pulse-action '+(reposted?'active':'')+'" data-action="repost">↻ '+Number(post.counts?.reposts||0)+'</button>'+
        '<button class="pulse-action '+(liked?'liked':'')+'" data-action="like">♡ '+Number(post.counts?.likes||0)+'</button>'+
        '<button class="pulse-action '+(bookmarked?'active':'')+'" data-action="bookmark">▱</button>'+
        '<button class="pulse-action" data-action="share">↗</button>'+
        '<button class="pulse-action danger" data-action="report">!</button>'+
      '</div>'+
    '</div>'+
  '</article>'
}
function renderPosts(posts,emptyText='Aucune publication pour le moment.'){if(!posts?.length){setStatus('Rien ici pour le moment',emptyText);return}feed.innerHTML=posts.map(renderPost).join('')}
async function loadHome(){
  setView('home','Pulse');setStatus('Chargement du fil','');
  try{const d=await api('/api/pulse/feed?mode='+state.feed+'&limit=40');renderPosts(d.posts,state.user&&state.feed==='following'?'Suis des comptes ou publie le premier message de ton fil.':'Aucune publication publique.') }
  catch(e){setStatus('Pulse indisponible',errorText(e))}
}
async function loadExplore(query=''){
  setView('explore','Explorer');
  if(query.trim().length<2){feed.innerHTML='<section class="pulse-view"><div class="pulse-view-head"><h2>Explorer Pulse</h2><p>Recherche des personnes, des sujets et des publications.</p></div></section>';return}
  setStatus('Recherche','');
  try{
    const d=await api('/api/pulse/search?q='+encodeURIComponent(query.trim()));
    let html='<section class="pulse-view"><div class="pulse-view-head"><h2>Résultats</h2><p>'+esc(query)+'</p></div><div class="pulse-card-list">';
    d.users.forEach(function(u){html+='<div class="pulse-card pulse-user-card"><div class="pulse-avatar">'+esc(initials(u))+'</div><div><strong>'+esc(u.displayName)+'</strong><small>@'+esc(u.handle)+' · '+u.followers+' abonnés</small></div><button class="pulse-mini-button" data-profile="'+esc(u.handle)+'">Voir</button></div>'});
    html+='</div></section>';
    if(d.posts?.length)html+=d.posts.map(renderPost).join('');
    if(!d.users?.length&&!d.posts?.length)html+='<div class="pulse-status"><strong>Aucun résultat</strong>Essaie une autre recherche.</div>';
    feed.innerHTML=html;
  }catch(e){setStatus('Recherche impossible',errorText(e))}
}
async function loadCircles(){
  setView('circles','Cercles');setStatus('Chargement des cercles','');
  try{
    const d=await api('/api/pulse/circles');
    let html='<section class="pulse-view"><div class="pulse-view-head"><h2>Cercles</h2><p>Des communautés publiques ou privées avec leurs propres conversations.</p></div>';
    if(state.user)html+='<form class="pulse-inline-form two" id="circle-create"><input name="name" minlength="3" maxlength="60" placeholder="Nom du cercle" required><input name="description" maxlength="240" placeholder="Description"><button class="pulse-mini-button primary">Créer</button></form>';
    html+='<div class="pulse-card-list">';
    if(!d.circles.length)html+='<div class="pulse-card"><p>Aucun cercle public pour le moment.</p></div>';
    d.circles.forEach(function(c){html+='<div class="pulse-card"><div class="pulse-card-row"><div><h3>'+esc(c.name)+'</h3><div class="pulse-card-meta">'+c.memberCount+' membres · '+esc(c.visibility)+'</div></div><button class="pulse-mini-button '+(c.joined?'':'primary')+'" data-circle-join="'+esc(c.id)+'">'+(c.joined?'Quitter':'Rejoindre')+'</button></div><p>'+esc(c.description||'')+'</p></div>'});
    feed.innerHTML=html+'</div></section>';
  }catch(e){setStatus('Cercles indisponibles',errorText(e))}
}
async function loadNotifications(){
  if(!requireAuth())return;
  setView('notifications','Notifications');setStatus('Chargement','');
  try{
    const d=await api('/api/pulse/notifications');
    let html='<section class="pulse-view"><div class="pulse-view-head"><h2>Notifications</h2><p>Les interactions importantes, sans fabriquer une boucle d’attention.</p></div><div class="pulse-card-list">';
    if(!d.notifications.length)html+='<div class="pulse-card"><p>Aucune notification.</p></div>';
    d.notifications.forEach(function(n){const actor=n.actor||{};html+='<div class="pulse-card pulse-notification '+(n.read?'':'unread')+'"><strong>'+esc(actor.displayName||'Quelqu’un')+'</strong> '+esc(notificationLabel(n.type))+'<div class="pulse-card-meta">'+esc(timeAgo(n.createdAt))+'</div></div>'});
    feed.innerHTML=html+'</div></section>';await api('/api/pulse/notifications/read',{method:'POST',body:'{}'});
  }catch(e){setStatus('Notifications indisponibles',errorText(e))}
}
function notificationLabel(type){return{like:'a aimé ta publication.',repost:'a repartagé ta publication.',reply:'a répondu à ta publication.',quote:'a cité ta publication.',follow:'s’est abonné à ton profil.',message:'t’a envoyé un message.'}[type]||'a interagi avec toi.'}
async function loadSaved(){
  if(!requireAuth())return;
  setView('saved','Enregistrés');setStatus('Chargement','');
  try{const d=await api('/api/pulse/me/bookmarks');renderPosts(d.posts,'Tu n’as encore enregistré aucune publication.')}catch(e){setStatus('Enregistrés indisponibles',errorText(e))}
}
async function loadProfile(handle){
  if(!handle){if(!requireAuth())return;handle=state.user.handle}
  setView('profile','Profil');setStatus('Chargement du profil','');
  try{
    const d=await api('/api/pulse/users/'+encodeURIComponent(handle)),u=d.user,self=state.user&&state.user.id===u.id;
    let actions='';
    if(self)actions='<button class="pulse-mini-button primary" data-profile-edit>Modifier</button><button class="pulse-mini-button" data-export>Exporter mes données</button><button class="pulse-mini-button danger" data-logout>Déconnexion</button>';
    else if(state.user)actions='<button class="pulse-mini-button primary" data-follow="'+esc(u.handle)+'">'+(u.isFollowing?'Se désabonner':'Suivre')+'</button><button class="pulse-mini-button" data-message-user="'+esc(u.handle)+'">Message</button><button class="pulse-mini-button danger" data-block="'+esc(u.handle)+'">Bloquer</button>';
    feed.innerHTML='<section class="pulse-profile-hero"><div class="pulse-avatar">'+esc(initials(u))+'</div><h2>'+esc(u.displayName)+'</h2><div class="handle">@'+esc(u.handle)+'</div><p>'+esc(u.bio||'Aucune bio pour le moment.')+'</p><div class="pulse-profile-stats"><span><strong>'+u.followers+'</strong> abonnés</span><span><strong>'+u.following+'</strong> abonnements</span></div><div class="pulse-profile-actions">'+actions+'</div></section>'+((d.posts||[]).map(renderPost).join('')||'<div class="pulse-status"><strong>Aucune publication</strong></div>');
  }catch(e){setStatus('Profil indisponible',errorText(e))}
}
async function loadMessages(){
  if(!requireAuth())return;
  setView('messages','Messages');setStatus('Chargement','');
  try{
    const d=await api('/api/pulse/conversations');
    let html='<section class="pulse-view"><div class="pulse-view-head"><h2>Messages privés</h2><p>Conversations directes entre comptes Pulse.</p></div><form class="pulse-inline-form two" id="new-message"><input name="handle" placeholder="@identifiant" required><input name="body" maxlength="2000" placeholder="Message" required><button class="pulse-mini-button primary">Envoyer</button></form><div class="pulse-card-list">';
    if(!d.conversations.length)html+='<div class="pulse-card"><p>Aucune conversation.</p></div>';
    d.conversations.forEach(function(c){if(!c.user)return;html+='<button class="pulse-card pulse-user-card" data-conversation="'+esc(c.user.handle)+'"><div class="pulse-avatar">'+esc(initials(c.user))+'</div><div><strong>'+esc(c.user.displayName)+'</strong><small>'+esc(c.lastMessage?.body||'Nouvelle conversation')+'</small></div><span>›</span></button>'});
    feed.innerHTML=html+'</div></section>';
  }catch(e){setStatus('Messages indisponibles',errorText(e))}
}
async function loadConversation(handle){
  if(!requireAuth())return;
  setView('messages','@'+handle);setStatus('Chargement','');
  try{
    const d=await api('/api/pulse/messages/'+encodeURIComponent(handle));
    let html='<section class="pulse-view"><div class="pulse-view-head"><h2>'+esc(d.user.displayName)+'</h2><p>@'+esc(d.user.handle)+'</p></div><div class="pulse-message-list">';
    d.messages.forEach(function(m){html+='<div class="pulse-message '+(m.senderId===state.user.id?'mine':'')+'">'+esc(m.body)+'<small>'+esc(timeAgo(m.createdAt))+'</small></div>'});
    html+='</div><form class="pulse-message-form" id="conversation-form" data-handle="'+esc(handle)+'"><input name="body" maxlength="2000" placeholder="Écrire un message…" required><button class="pulse-mini-button primary">Envoyer</button></form></section>';
    feed.innerHTML=html;
  }catch(e){setStatus('Conversation indisponible',errorText(e))}
}
async function loadCirclePreview(){
  try{
    const d=await api('/api/pulse/circles'),target=document.getElementById('circle-preview');
    target.innerHTML=d.circles.slice(0,3).map(function(c){return'<button class="circle" data-view="circles"><span class="circle-mark">'+esc(c.name.slice(0,2).toUpperCase())+'</span><span><strong>'+esc(c.name)+'</strong><small>'+c.memberCount+' membres</small></span><b>›</b></button>'}).join('')||'<div class="pulse-panel-loading">Aucun cercle public.</div>';
  }catch{document.getElementById('circle-preview').innerHTML='<div class="pulse-panel-loading">Indisponible</div>'}
}
function setReply(postId,handle){state.replyTo=postId;const context=document.getElementById('pulse-context');context.hidden=false;context.textContent='Réponse à @'+handle;document.getElementById('cancel-context').hidden=false;textarea.focus()}
function clearReply(){state.replyTo=null;document.getElementById('pulse-context').hidden=true;document.getElementById('cancel-context').hidden=true}
async function publishPost(){
  if(!requireAuth())return;
  const body=textarea.value.trim();if(!body)return;
  publish.disabled=true;
  try{await api('/api/pulse/posts',{method:'POST',body:JSON.stringify({body,replyToId:state.replyTo})});textarea.value='';count.textContent='0 / 420';clearReply();await loadHome()}
  catch(e){alert(errorText(e));publish.disabled=false}
}
async function toggleAction(postId,action){if(!requireAuth())return;try{await api('/api/pulse/posts/'+encodeURIComponent(postId)+'/'+action,{method:'POST',body:'{}'});if(state.view==='home')await loadHome()}catch(e){alert(errorText(e))}}
async function reportPost(postId){if(!requireAuth())return;const reason=prompt('Pourquoi signales-tu cette publication ?');if(!reason)return;try{await api('/api/pulse/report',{method:'POST',body:JSON.stringify({targetType:'post',targetId:postId,reason})});alert('Signalement transmis.')}catch(e){alert(errorText(e))}}
async function doLogout(){try{await api('/api/pulse/auth/logout',{method:'POST',body:'{}'})}catch{}state.token='';state.user=null;localStorage.removeItem(TOKEN_KEY);updateAccount();loadHome()}
async function exportData(){
  if(!requireAuth())return;
  try{const d=await api('/api/pulse/export'),blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='quantic-pulse-export.json';a.click();setTimeout(function(){URL.revokeObjectURL(a.href)},1000)}catch(e){alert(errorText(e))}
}
async function editProfile(){
  if(!state.user)return;
  const displayName=prompt('Nom affiché',state.user.displayName);if(displayName===null)return;
  const bio=prompt('Bio',state.user.bio||'');if(bio===null)return;
  try{const d=await api('/api/pulse/me',{method:'PATCH',body:JSON.stringify({displayName,bio})});state.user=d.user;updateAccount();loadProfile(state.user.handle)}catch(e){alert(errorText(e))}
}
async function restoreSession(){
  if(!state.token){updateAccount();return}
  try{const d=await api('/api/pulse/me');state.user=d.user}catch{state.token='';localStorage.removeItem(TOKEN_KEY)}updateAccount()
}
async function health(){
  try{const d=await api('/api/pulse/health');document.getElementById('api-state').textContent=d.storage==='mysql'?'MySQL connecté':'Serveur connecté';document.getElementById('api-state').title='Stockage : '+d.storage}
  catch{document.getElementById('api-state').textContent='Hors ligne'}
}

textarea.addEventListener('input',function(){count.textContent=textarea.value.length+' / 420';publish.disabled=!textarea.value.trim()});
publish.addEventListener('click',publishPost);
document.getElementById('cancel-context').addEventListener('click',clearReply);
document.getElementById('compose-focus').addEventListener('click',function(){if(requireAuth()){setView('home','Pulse');textarea.focus();window.scrollTo({top:0,behavior:'smooth'})}});
document.getElementById('mobile-compose').addEventListener('click',function(){if(requireAuth()){setView('home','Pulse');textarea.focus();window.scrollTo({top:0,behavior:'smooth'})}});
document.getElementById('auth-button').addEventListener('click',function(){state.user?loadProfile(state.user.handle):openAuth('login')});
document.getElementById('account-button').addEventListener('click',function(){state.user?loadProfile(state.user.handle):openAuth('register')});
document.getElementById('auth-close').addEventListener('click',closeAuth);
document.getElementById('auth-switch').addEventListener('click',function(){state.authMode=state.authMode==='login'?'register':'login';updateAuthModal()});
authModal.addEventListener('click',function(e){if(e.target===authModal)closeAuth()});
authForm.addEventListener('submit',async function(e){
  e.preventDefault();authError.textContent='';
  const handle=document.getElementById('auth-handle').value.trim().replace(/^@/,'').toLowerCase(),password=document.getElementById('auth-password').value,displayName=document.getElementById('auth-display-name').value.trim();
  try{
    const path=state.authMode==='register'?'/api/pulse/auth/register':'/api/pulse/auth/login';
    const body=state.authMode==='register'?{handle,password,displayName}:{handle,password};
    const d=await api(path,{method:'POST',body:JSON.stringify(body)});state.token=d.token;state.user=d.user;localStorage.setItem(TOKEN_KEY,d.token);closeAuth();authForm.reset();updateAccount();await loadHome();await loadCirclePreview()
  }catch(err){authError.textContent=errorText(err)}
});
document.querySelectorAll('.pulse-tab').forEach(function(btn){btn.addEventListener('click',function(){state.feed=btn.dataset.feed;document.querySelectorAll('.pulse-tab').forEach(function(x){x.classList.toggle('active',x===btn)});loadHome()})});
document.querySelectorAll('[data-view]').forEach(function(btn){btn.addEventListener('click',function(){const v=btn.dataset.view;if(v==='home')loadHome();else if(v==='explore')loadExplore(document.getElementById('pulse-search').value);else if(v==='circles')loadCircles();else if(v==='notifications')loadNotifications();else if(v==='messages')loadMessages();else if(v==='saved')loadSaved();else if(v==='profile')loadProfile()})});
let searchTimer;
document.getElementById('pulse-search').addEventListener('input',function(e){clearTimeout(searchTimer);const q=e.target.value;searchTimer=setTimeout(function(){if(q.trim().length>=2)loadExplore(q)},250)});

document.addEventListener('click',async function(e){
  const profile=e.target.closest('[data-profile]');if(profile){loadProfile(profile.dataset.profile);return}
  const post=e.target.closest('.pulse-post'),action=e.target.closest('[data-action]');
  if(post&&action){
    const pid=post.dataset.id;
    if(action.dataset.action==='like'||action.dataset.action==='repost'||action.dataset.action==='bookmark'){toggleAction(pid,action.dataset.action);return}
    if(action.dataset.action==='reply'){const handle=post.querySelector('[data-profile]')?.dataset.profile||'';setView('home','Pulse');setReply(pid,handle);return}
    if(action.dataset.action==='share'){const shareUrl=location.origin+location.pathname+'?post='+encodeURIComponent(pid);if(navigator.share)navigator.share({title:'Quantic Pulse',url:shareUrl}).catch(function(){});else navigator.clipboard?.writeText(shareUrl);return}
    if(action.dataset.action==='report'){reportPost(pid);return}
  }
  const join=e.target.closest('[data-circle-join]');if(join){if(!requireAuth())return;try{await api('/api/pulse/circles/'+encodeURIComponent(join.dataset.circleJoin)+'/join',{method:'POST',body:'{}'});loadCircles();loadCirclePreview()}catch(err){alert(errorText(err))}return}
  const follow=e.target.closest('[data-follow]');if(follow){try{await api('/api/pulse/users/'+encodeURIComponent(follow.dataset.follow)+'/follow',{method:'POST',body:'{}'});loadProfile(follow.dataset.follow)}catch(err){alert(errorText(err))}return}
  const block=e.target.closest('[data-block]');if(block){if(!confirm('Bloquer @'+block.dataset.block+' ?'))return;try{await api('/api/pulse/users/'+encodeURIComponent(block.dataset.block)+'/block',{method:'POST',body:'{}'});loadHome()}catch(err){alert(errorText(err))}return}
  const message=e.target.closest('[data-message-user]');if(message){loadConversation(message.dataset.messageUser);return}
  const convo=e.target.closest('[data-conversation]');if(convo){loadConversation(convo.dataset.conversation);return}
  if(e.target.closest('[data-export]')){exportData();return}
  if(e.target.closest('[data-profile-edit]')){editProfile();return}
  if(e.target.closest('[data-logout]')){doLogout();return}
});

document.addEventListener('submit',async function(e){
  if(e.target.id==='circle-create'){e.preventDefault();if(!requireAuth())return;const f=new FormData(e.target);try{await api('/api/pulse/circles',{method:'POST',body:JSON.stringify({name:f.get('name'),description:f.get('description')})});loadCircles();loadCirclePreview()}catch(err){alert(errorText(err))}}
  if(e.target.id==='new-message'){e.preventDefault();const f=new FormData(e.target);try{await api('/api/pulse/messages',{method:'POST',body:JSON.stringify({handle:String(f.get('handle')||'').replace(/^@/,''),body:f.get('body')})});loadMessages()}catch(err){alert(errorText(err))}}
  if(e.target.id==='conversation-form'){e.preventDefault();const f=new FormData(e.target),handle=e.target.dataset.handle;try{await api('/api/pulse/messages',{method:'POST',body:JSON.stringify({handle,body:f.get('body')})});loadConversation(handle)}catch(err){alert(errorText(err))}}
});

(async function init(){await health();await restoreSession();await Promise.all([loadHome(),loadCirclePreview()])})();
