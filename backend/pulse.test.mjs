import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('Quantic Pulse core API survives a realistic user flow', async (t) => {
  const dataDir = await mkdtemp(join(tmpdir(), 'quantic-pulse-test-'));
  process.env.DATA_DIR = dataDir;
  delete process.env.PULSE_DATABASE_URL;
  delete process.env.PULSE_DB_HOST;
  delete process.env.PULSE_DB_USER;
  delete process.env.PULSE_DB_PASSWORD;
  delete process.env.PULSE_DB_NAME;

  const mod = await import('./pulse.mjs?test=' + Date.now());
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const handled = await mod.handlePulse(req, res, url, {});
    if (!handled) {
      res.writeHead(404, {'content-type':'application/json'});
      res.end(JSON.stringify({error:'not_found'}));
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const base = 'http://127.0.0.1:' + address.port;

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(dataDir, { recursive: true, force: true });
  });

  async function request(path, { method='GET', token='', body } = {}) {
    const headers = {};
    if (token) headers.authorization = 'Bearer ' + token;
    if (body !== undefined) headers['content-type'] = 'application/json';
    const response = await fetch(base + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const json = await response.json();
    return { status: response.status, body: json };
  }

  const health = await request('/api/pulse/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.ok, true);
  assert.equal(health.body.storage, 'json');

  const alice = await request('/api/pulse/auth/register', {
    method: 'POST',
    body: { handle: 'alice_test', displayName: 'Alice Test', password: 'stable-password-1' }
  });
  assert.equal(alice.status, 201);
  assert.ok(alice.body.token);

  const bob = await request('/api/pulse/auth/register', {
    method: 'POST',
    body: { handle: 'bob_test', displayName: 'Bob Test', password: 'stable-password-2' }
  });
  assert.equal(bob.status, 201);
  assert.ok(bob.body.token);

  const post = await request('/api/pulse/posts', {
    method: 'POST',
    token: alice.body.token,
    body: { body: 'Premier message stable de Pulse.' }
  });
  assert.equal(post.status, 201);
  assert.equal(post.body.post.body, 'Premier message stable de Pulse.');

  const like = await request('/api/pulse/posts/' + post.body.post.id + '/like', {
    method: 'POST',
    token: bob.body.token,
    body: {}
  });
  assert.equal(like.status, 200);
  assert.equal(like.body.active, true);
  assert.equal(like.body.post.counts.likes, 1);

  const follow = await request('/api/pulse/users/alice_test/follow', {
    method: 'POST',
    token: bob.body.token,
    body: {}
  });
  assert.equal(follow.status, 200);
  assert.equal(follow.body.active, true);

  const bobFeed = await request('/api/pulse/feed?mode=following', { token: bob.body.token });
  assert.equal(bobFeed.status, 200);
  assert.ok(bobFeed.body.posts.some((p) => p.id === post.body.post.id));

  const reply = await request('/api/pulse/posts', {
    method: 'POST',
    token: bob.body.token,
    body: { body: 'Réponse de Bob.', replyToId: post.body.post.id }
  });
  assert.equal(reply.status, 201);

  const replies = await request('/api/pulse/posts/' + post.body.post.id + '/replies', {
    token: alice.body.token
  });
  assert.equal(replies.status, 200);
  assert.equal(replies.body.posts.length, 1);
  assert.equal(replies.body.posts[0].body, 'Réponse de Bob.');

  const circle = await request('/api/pulse/circles', {
    method: 'POST',
    token: alice.body.token,
    body: { name: 'Builders Test', description: 'Communauté de test.' }
  });
  assert.equal(circle.status, 201);

  const joinCircle = await request('/api/pulse/circles/' + circle.body.circle.id + '/join', {
    method: 'POST',
    token: bob.body.token,
    body: {}
  });
  assert.equal(joinCircle.status, 200);
  assert.equal(joinCircle.body.active, true);

  const message = await request('/api/pulse/messages', {
    method: 'POST',
    token: bob.body.token,
    body: { handle: 'alice_test', body: 'Message privé de test.' }
  });
  assert.equal(message.status, 201);

  const conversations = await request('/api/pulse/conversations', { token: alice.body.token });
  assert.equal(conversations.status, 200);
  assert.ok(conversations.body.conversations.some((c) => c.user?.handle === 'bob_test'));

  const exported = await request('/api/pulse/export', { token: alice.body.token });
  assert.equal(exported.status, 200);
  assert.ok(exported.body.data.posts.some((p) => p.id === post.body.post.id));

  const profile = await request('/api/pulse/users/alice_test', { token: bob.body.token });
  assert.equal(profile.status, 200);
  assert.equal(profile.body.user.isFollowing, true);
  assert.equal(profile.body.user.followers, 1);

  const me = await request('/api/pulse/me', { token: alice.body.token });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.handle, 'alice_test');
});
