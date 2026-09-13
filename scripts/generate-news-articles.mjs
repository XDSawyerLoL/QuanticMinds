import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const OUT=join(ROOT,'public','news','articles');
const BASE='https://xdsawyerlol.github.io/QuanticMinds/news/articles/';
const NEWS_HOME='https://xdsawyerlol.github.io/QuanticMinds/news.html';
const FEEDS=[
  'https://raw.githubusercontent.com/XDSawyerLoL/LEFILLIBRE/main/feed.json',
  'https://xdsawyerlol.github.io/LEFILLIBRE/feed.json'
];

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const techSource=i=>/01net|frandroid|numerama|techcrunch|the verge|wired|ars technica|zdnet|clubic|cnet|engadget|tom's hardware|les numériques|korben|macg|next\.ink|venturebeat/i.test(i.source||'');
const hay=i=>`${i.category||''} ${i.source||''} ${i.title||''} ${i.summary||''}`.toLowerCase();
const eligible=i=>String(i.category||'').toLowerCase().includes('tech')||techSource(i)||/\bia\b|intelligence artificielle|artificial intelligence|openai|chatgpt|anthropic|gemini|mistral|robot|tech|numéri|logiciel|cyber|semi-conduct|cloud|ordinateur|smartphone|innovation|startup|internet|data|automatisation|quantique|puce|hardware|software|processeur|plateforme|application|iphone|android|windows|linux|apple|google|microsoft|nvidia|amd|intel|tesla|spacex/.test(hay(i));
const storyKey=i=>String(i.url||i.articleUrl||i.title||'');
const slugify=s=>String(s||'article').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,84)||'article';
function hash8(s){let h=0x811c9dc5;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,0x01000193)}return (h>>>0).toString(16).padStart(8,'0')}
function articleFile(i){try{const p=new URL(i.articleUrl||'').pathname.split('/').pop()||'';if(/^[a-z0-9][a-z0-9._-]*\.html$/i.test(p))return p}catch{}return `${slugify(i.title)}-${hash8(storyKey(i))}.html`}
function articleUrl(i){return BASE+articleFile(i)}
function externalSource(i){const u=String(i.url||'').trim();return u&&!/xdsawyerlol\.github\.io\/LEFILLIBRE/i.test(u)?u:''}
function fmtDate(iso){try{return new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',dateStyle:'long',timeStyle:'short'}).format(new Date(iso))}catch{return ''}}
async function loadFeed(){let last;for(const url of FEEDS){try{const r=await fetch(`${url}?v=${Date.now()}`,{headers:{accept:'application/json'}});if(!r.ok)throw new Error(`feed_${r.status}`);const d=await r.json();if(!Array.isArray(d.items))throw new Error('bad_feed');return d}catch(e){last=e}}throw last||new Error('feed_unavailable')}
async function discoverImage(i){if(i.image)return String(i.image);const src=externalSource(i);if(!src)return '';try{const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),5000);const r=await fetch(src,{signal:ctl.signal,headers:{'user-agent':'Mozilla/5.0 QuanticNewsBot/1.0'}});clearTimeout(t);if(!r.ok)return '';const html=(await r.text()).slice(0,700000);const m=html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i)||html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i);return m?.[1]?new URL(m[1],src).href:''}catch{return ''}}

function page(i,image){
  const title=String(i.title||'Actualité technologique').trim();
  const summary=String(i.summary||'').replace(/\s+/g,' ').trim();
  const source=externalSource(i);
  const canonical=articleUrl(i);
  const published=String(i.publishedAt||'');
  const category=String(i.category||'IA & Tech');
  const sourceName=String(i.source||'Source');
  const share=`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonical)}`;
  const imageMeta=image?`<meta property="og:image" content="${esc(image)}"><meta property="og:image:alt" content="${esc(title)}"><meta name="twitter:image" content="${esc(image)}">`:'';
  const hero=image?`<img class="hero" src="${esc(image)}" alt="${esc(title)}" referrerpolicy="no-referrer">`:`<div class="hero fallback"><span>QUANTIC <b>NEWS</b></span></div>`;
  const sourceBtn=source?`<a class="btn ghost" href="${esc(source)}" target="_blank" rel="noopener noreferrer">Source originale ↗</a>`:'';
  const jsonLd=JSON.stringify({'@context':'https://schema.org','@type':'NewsArticle',headline:title,description:summary,datePublished:published||undefined,image:image?[image]:undefined,mainEntityOfPage:canonical,publisher:{'@type':'Organization',name:'Quantic News'},isBasedOn:source||undefined}).replace(/</g,'\\u003c');
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#02070d">
<title>${esc(title)} — Quantic News</title>
<meta name="description" content="${esc(summary.slice(0,300))}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="article"><meta property="og:site_name" content="Quantic News"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(summary.slice(0,300))}"><meta property="og:url" content="${esc(canonical)}">${imageMeta}
${published?`<meta property="article:published_time" content="${esc(published)}">`:''}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(summary.slice(0,300))}">
<script type="application/ld+json">${jsonLd}</script>
<style>
:root{--bg:#02070d;--panel:#07111b;--line:rgba(196,218,240,.17);--text:#f5f7fa;--muted:#9ba8b8;--blue:#0d8cff;--blue2:#66d6ff}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 70% 0,rgba(13,140,255,.13),transparent 28%),var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.shell{width:min(980px,92vw);margin:auto}.top{height:74px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.brand{font-weight:900;letter-spacing:.16em;text-decoration:none;color:#fff}.brand b{color:var(--blue)}.back{color:#a9b7c5;text-decoration:none;font-size:12px}.article{padding:58px 0 80px}.eyebrow{font-size:10px;letter-spacing:.17em;text-transform:uppercase;color:var(--blue2);font-weight:800}.article h1{font-size:clamp(42px,6.4vw,76px);line-height:.99;letter-spacing:-.05em;font-weight:470;margin:15px 0 22px}.summary{font-size:clamp(18px,2.1vw,23px);line-height:1.55;color:#c1ccd7;max-width:900px}.meta{display:flex;gap:15px;flex-wrap:wrap;padding:15px 0;margin:28px 0;border-block:1px solid var(--line);color:#7f91a4;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.hero{display:block;width:100%;max-height:560px;object-fit:cover;border:1px solid var(--line);background:#091725;margin:30px 0}.hero.fallback{min-height:360px;display:grid;place-items:center;background:radial-gradient(circle at 50% 50%,rgba(13,140,255,.2),transparent 35%),#07111b}.hero.fallback span{font-size:35px;letter-spacing:.16em;font-weight:900}.hero.fallback b{color:var(--blue)}.notice{border-left:3px solid var(--blue);background:rgba(13,140,255,.08);padding:18px 20px;color:#9fb0c2;line-height:1.65}.actions{display:flex;gap:11px;flex-wrap:wrap;margin:28px 0}.btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 17px;border-radius:999px;background:#0a66c2;color:#fff;text-decoration:none;font-size:11px;font-weight:800}.btn.ghost{background:#07111b;border:1px solid var(--line);color:#dce7f2}.sourcebox{margin-top:42px;padding-top:22px;border-top:1px solid var(--line);color:#8797a9;font-size:12px}.sourcebox a{color:var(--blue2)}.footer{border-top:1px solid var(--line);padding:24px 0 42px;color:#66798d;font-size:11px}@media(max-width:650px){.top{height:64px}.brand{font-size:13px}.article{padding-top:38px}.article h1{font-size:40px}.summary{font-size:18px}.actions{display:grid}.btn{width:100%}}
</style></head>
<body><div class="shell"><header class="top"><a class="brand" href="${NEWS_HOME}">QUANTIC <b>NEWS</b></a><a class="back" href="${NEWS_HOME}">← Retour au flux</a></header>
<main class="article"><div class="eyebrow">${esc(category)} · ${esc(sourceName)}</div><h1>${esc(title)}</h1><p class="summary">${esc(summary)}</p><div class="meta">${published?`<span>${esc(fmtDate(published))}</span>`:''}<span>Source : ${esc(sourceName)}</span></div>${hero}<div class="notice">Quantic News sélectionne, contextualise et source les actualités technologiques. Pour la lecture intégrale et la vérification, la publication d’origine reste accessible ci-dessous.</div><div class="actions"><a class="btn" href="${share}" target="_blank" rel="noopener noreferrer">Partager sur LinkedIn</a>${sourceBtn}</div>${source?`<div class="sourcebox">Source originale : <a href="${esc(source)}" target="_blank" rel="noopener noreferrer">${esc(sourceName)} ↗</a></div>`:''}</main><footer class="footer">Quantic News — IA, robotique, logiciels, cybersécurité et innovation.</footer></div></body></html>`;
}

const feed=await loadFeed();
const items=feed.items.filter(eligible).sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt)).slice(0,90);
await rm(OUT,{recursive:true,force:true});
await mkdir(OUT,{recursive:true});
const manifest=[];
for(const item of items){
  const image=await discoverImage(item);
  const file=articleFile(item);
  await writeFile(join(OUT,file),page(item,image),'utf8');
  manifest.push({story:storyKey(item),file,url:articleUrl(item),image,title:item.title,source:item.source,publishedAt:item.publishedAt});
}
await writeFile(join(OUT,'index.json'),JSON.stringify({updatedAt:feed.updatedAt||new Date().toISOString(),items:manifest},null,2),'utf8');
console.log(`Generated ${manifest.length} Quantic News article pages.`);
