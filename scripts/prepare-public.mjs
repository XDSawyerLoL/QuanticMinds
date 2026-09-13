import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir=join(root,'public');
await mkdir(publicDir,{recursive:true});

for(const name of ['script.js','quantic-news-config.js','quantic-news-social.js','news.js','quantic-news-article-links.js','brand-official.css']){
  await copyFile(join(root,name),join(publicDir,name));
}

const publicAssets=join(publicDir,'assets');
await mkdir(publicAssets,{recursive:true});
await copyFile(join(root,'assets','quantic-minds-logo.png'),join(publicAssets,'quantic-minds-logo.png'));
await copyFile(join(root,'assets','quantic-minds-mark.webp'),join(publicAssets,'quantic-minds-mark.webp'));
await copyFile(join(root,'assets','quantic-news-logo.svg'),join(publicAssets,'quantic-news-logo.svg'));

console.log('Copied static JavaScript, branding CSS and official logo assets for GitHub Pages.');
