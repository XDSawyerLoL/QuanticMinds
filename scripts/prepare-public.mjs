import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir=join(root,'public');
await mkdir(publicDir,{recursive:true});

for(const name of ['script.js','quantic-news-config.js','quantic-news-social.js','news.js','quantic-news-article-links.js']){
  await copyFile(join(root,name),join(publicDir,name));
}

console.log('Copied static JavaScript for GitHub Pages.');
