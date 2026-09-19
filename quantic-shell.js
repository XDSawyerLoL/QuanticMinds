(()=>{"use strict";
const SECURE_BRIDGE="http://127.0.0.1:47621";
const APPS=[
["Sillage","index.html"],["Pulse","pulse.html"],["News","news.html"],["Vision","research.html"],["Produits","solutions.html"],["QuanticMail","https://quanticmail.onrender.com"]
];
function el(tag,attrs={},html=""){const n=document.createElement(tag);Object.entries(attrs).forEach(([k,v])=>{if(k==="class")n.className=v;else if(k.startsWith("data-"))n.setAttribute(k,v);else n[k]=v});if(html)n.innerHTML=html;return n}
function ensureEnterButton(){
 let btn=document.querySelector("[data-quantic-enter]");
 if(btn)return btn;
 btn=el("button",{class:"qs-global-enter",type:"button","data-quantic-enter":"true",textContent:"Entrer"});
 const header=document.querySelector(".qs-header-inner");
 const pulse=document.querySelector(".pulse-top-actions");
 if(header){const contact=header.querySelector(".qs-contact");header.insertBefore(btn,contact||header.querySelector(".qs-menu")||null)}
 else if(pulse){pulse.insertBefore(btn,pulse.firstChild)}
 else{btn.style.position="fixed";btn.style.right="22px";btn.style.top="18px";btn.style.zIndex="9000";document.body.appendChild(btn)}
 return btn
}
function createOverlay(){
 if(document.querySelector(".qs-id-overlay"))return document.querySelector(".qs-id-overlay");
 const o=el("div",{class:"qs-id-overlay",hidden:true});
 o.innerHTML='<section class="qs-id-card" role="dialog" aria-modal="true" aria-labelledby="qs-id-title"><button class="qs-id-close" aria-label="Fermer">×</button><span class="qs-id-kicker">Quantic ID</span><h2 id="qs-id-title">Entrer.</h2><p>Activez votre identité Quantic sur cet appareil. Aucun mot de passe n’est demandé.</p><div class="qs-id-state" data-state="idle"><i class="qs-id-dot"></i><div><strong>Identité inactive</strong><span>Quantic Secure ou Quantic Key requis</span></div></div><div class="qs-id-actions"><button class="qs-id-action primary" data-id-detect>Détecter mon identité</button><a class="qs-id-action" href="identity.html" style="display:inline-flex;align-items:center;text-decoration:none">Quantic ID</a></div><p class="qs-id-foot">La clé privée reste sur votre appareil. Sillage ne doit recevoir qu’une preuve cryptographique de possession.</p></section>';
 document.body.appendChild(o);
 o.querySelector(".qs-id-close").addEventListener("click",()=>o.hidden=true);
 o.addEventListener("click",e=>{if(e.target===o)o.hidden=true});
 o.querySelector("[data-id-detect]").addEventListener("click",detectIdentity);
 return o
}
function state(mode,title,detail){const box=document.querySelector(".qs-id-state");if(!box)return;box.dataset.state=mode;box.querySelector("strong").textContent=title;box.querySelector("span").textContent=detail}
async function detectIdentity(){
 state("checking","Recherche en cours…","Quantic Secure et les capacités cryptographiques de l’appareil sont vérifiés");
 let bridge=null;
 try{const c=new AbortController();setTimeout(()=>c.abort(),900);const r=await fetch(SECURE_BRIDGE+"/v1/status",{signal:c.signal,cache:"no-store"});if(r.ok)bridge=await r.json()}catch{}
 if(bridge&&bridge.identityAvailable){
   state("ready","Identité prête",bridge.label||"Quantic Secure a détecté une identité active");
   document.querySelectorAll("[data-quantic-enter]").forEach(b=>b.dataset.ready="true");
   return;
 }
 const webauthn=!!(window.PublicKeyCredential&&navigator.credentials&&window.isSecureContext);
 if(webauthn)state("idle","Quantic Secure non détecté","Cet appareil supporte WebAuthn. Activez Quantic Secure ou insérez votre Quantic Key.");
 else state("idle","Identité indisponible","Utilisez un navigateur sécurisé compatible et activez Quantic Secure.");
}
function appSwitcher(){
 if(document.querySelector(".qs-app-switcher"))return;
 const box=el("div",{class:"qs-app-switcher"}),b=el("button",{type:"button","aria-label":"Applications Quantic",textContent:"⌘"}),m=el("div",{class:"qs-app-menu",hidden:true});
 APPS.forEach(([name,href])=>{const a=el("a",{href});a.innerHTML='<span>'+name+'</span><small>→</small>';m.appendChild(a)});
 b.addEventListener("click",()=>m.hidden=!m.hidden);box.append(b,m);document.body.appendChild(box)
}
function boot(){const b=ensureEnterButton(),o=createOverlay();b.addEventListener("click",()=>{o.hidden=false;detectIdentity()});appSwitcher()}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",boot):boot();
})();