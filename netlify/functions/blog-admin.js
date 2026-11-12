// Admin actions for the daily blog writer (header x-internal-secret = private_config.blog_admin_secret).
// POST {action:"publish", post_id}  -> marks published + pushes to the client's WordPress if connected.
// POST {action:"check", post_id}    -> recomputes and stores the on-page checklist.
const { sb, seoChecklist, publishPost } = require('../lib/blog');
const json = (c, o) => ({ statusCode: c, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) });

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  const given = (event.headers && (event.headers['x-internal-secret'] || event.headers['X-Internal-Secret'])) || '';
  const cfg = await sb('private_config?select=value&key=eq.blog_admin_secret');
  if (given.length < 32 || !cfg.ok || !cfg.data[0] || cfg.data[0].value !== given) return json(401, { error: 'Unauthorized' });
  let b = {}; try { b = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'bad json' }); }
  const pr = await sb('blog_posts?select=*&id=eq.' + Number(b.post_id));
  const post = pr.data && pr.data[0]; if (!post) return json(404, { error: 'post not found' });
  const cr = await sb('blog_clients?select=*&id=eq.' + post.client_id);
  const client = cr.data && cr.data[0]; if (!client) return json(404, { error: 'client not found' });
  if (b.action === 'check') {
    const checklist = seoChecklist(post);
    await sb('blog_posts?id=eq.' + post.id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ checklist }) });
    return json(200, { ok: true, checklist });
  }
  if (b.action === 'publish') return json(200, { ok: true, ...(await publishPost(client, post)) });
  return json(400, { error: 'unknown action' });
};
