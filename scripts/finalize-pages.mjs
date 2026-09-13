import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const dist=join(root,'dist');
const files=(await readdir(dist)).filter(name=>name.endsWith('.html'));

function injectIntoNav(html,className){
  const re=new RegExp(`<nav class="${className}">([\\s\\S]*?)<\\/nav>`,'i');
  return html.replace(re,(full,inner)=>{
    if(/href="news\.html"/i.test(inner))return full;
    const news=className==='nav'?'<a data-nav href="news.html">Quantic News</a>':'<a href="news.html">Quantic News</a>';
    if(/<a[^>]+href="careers\.html"/i.test(inner))inner=inner.replace(/(<a[^>]+href="careers\.html")/i,`${news}$1`);
    else inner+=news;
    return `<nav class="${className}">${inner}</nav>`;
  });
}

for(const name of files){
  const path=join(dist,name);
  let html=await readFile(path,'utf8');
  html=injectIntoNav(html,'nav');
  html=injectIntoNav(html,'mobile-nav');
  html=html.replace(/src="\.\/script\.js(?:\?v=[^"]*)?"/g,'src="./script.js?v=20260913-5"');
  if(name==='news.html'){
    html=html.replace(/src="\.\/news\.js(?:\?v=[^"]*)?"/g,'src="./news.js?v=8"');
    html=html.replace(/<script src="\.\/quantic-news-article-links\.js(?:\?v=[^"]*)?"><\/script>/g,'');
  }
  await writeFile(path,html,'utf8');
}
console.log(`Finalized ${files.length} deployed HTML pages.`);
