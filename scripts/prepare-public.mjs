import { copyFile, mkdir, cp } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir=join(root,'public');
await mkdir(publicDir,{recursive:true});

for(const name of ['script.js','quantic-news-config.js','quantic-news-social.js','news.js','quantic-news-article-links.js','brand-official.css']){
  await copyFile(join(root,name),join(publicDir,name));
}

// Copy the complete brand/product asset tree instead of maintaining an
// error-prone allow-list. Vite copies public/ into dist/, which is what
// GitHub Pages actually deploys.
const publicAssets=join(publicDir,'assets');
await mkdir(publicAssets,{recursive:true});
await cp(join(root,'assets'),publicAssets,{recursive:true,force:true});

console.log('Copied static JavaScript, branding CSS and the complete Quantic Sillage asset tree for GitHub Pages.');
