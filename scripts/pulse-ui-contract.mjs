import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const html = await readFile(new URL('../pulse.html', import.meta.url), 'utf8');
const moduleDir = new URL('../pulse/', import.meta.url);
const moduleFiles = (await readdir(moduleDir)).filter((name) => name.endsWith('.js')).sort();
const modules = await Promise.all(moduleFiles.map((name) => readFile(new URL('../pulse/' + name, import.meta.url), 'utf8')));
const js = modules.join('\n');

const idMatches = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((m) => m[1]);
const duplicateIds = idMatches.filter((id, index) => idMatches.indexOf(id) !== index);
assert.deepEqual([...new Set(duplicateIds)], [], 'pulse.html contains duplicate IDs');

const requiredByJs = [...js.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
for (const id of new Set(requiredByJs)) {
  assert.ok(idMatches.includes(id), 'Pulse modules expect missing DOM id: ' + id);
}

for (const view of ['home','explore','circles','notifications','messages','saved','profile']) {
  assert.ok(html.includes('data-view="' + view + '"'), 'Missing navigation view: ' + view);
}

for (const oldSymbol of ['⌂','⌕','◉','✉','◇','◎','♡','↻','▱','＋']) {
  assert.equal(html.includes(oldSymbol) || js.includes(oldSymbol), false, 'Legacy placeholder icon returned: ' + oldSymbol);
}

assert.ok(html.indexOf('pulse-config.js') < html.indexOf('pulse/app.js'), 'Pulse config must load before the app module');
assert.ok(html.includes('type="module" src="./pulse/app.js'), 'Pulse must load through the modular app entrypoint');
assert.ok(html.includes('id="auth-modal"'), 'Authentication modal is required');
assert.ok(html.includes('id="pulse-feed"'), 'Feed container is required');
assert.ok(html.includes('id="pulse-publish"'), 'Publish control is required');
const mailLinks=[...html.matchAll(/href=["']https:\/\/quanticmail\.onrender\.com["']/g)];
assert.ok(mailLinks.length>=3, 'QuanticMail must remain directly accessible from Pulse desktop and mobile navigation');

for (const requiredModule of ['app.js','core.js','render.js','session.js','views.js']) {
  assert.ok(moduleFiles.includes(requiredModule), 'Missing Pulse module: ' + requiredModule);
}

console.log('Pulse UI contract OK:', idMatches.length, 'DOM ids and', moduleFiles.length, 'modules checked');
