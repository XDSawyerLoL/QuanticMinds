import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../pulse.html', import.meta.url), 'utf8');
const js = await readFile(new URL('../pulse.js', import.meta.url), 'utf8');

const idMatches = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((m) => m[1]);
const duplicateIds = idMatches.filter((id, index) => idMatches.indexOf(id) !== index);
assert.deepEqual([...new Set(duplicateIds)], [], 'pulse.html contains duplicate IDs');

const requiredByJs = [...js.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
for (const id of new Set(requiredByJs)) {
  assert.ok(idMatches.includes(id), 'pulse.js expects missing DOM id: ' + id);
}

for (const view of ['home','explore','circles','notifications','messages','saved','profile']) {
  assert.ok(html.includes('data-view="' + view + '"'), 'Missing navigation view: ' + view);
}

for (const oldSymbol of ['⌂','⌕','◉','✉','◇','◎','♡','↻','▱','＋']) {
  assert.equal(html.includes(oldSymbol) || js.includes(oldSymbol), false, 'Legacy placeholder icon returned: ' + oldSymbol);
}

assert.ok(html.indexOf('pulse-config.js') < html.indexOf('pulse.js'), 'Pulse config must load before the app');
assert.ok(html.includes('id="auth-modal"'), 'Authentication modal is required');
assert.ok(html.includes('id="pulse-feed"'), 'Feed container is required');
assert.ok(html.includes('id="pulse-publish"'), 'Publish control is required');

console.log('Pulse UI contract OK:', idMatches.length, 'DOM ids checked');
