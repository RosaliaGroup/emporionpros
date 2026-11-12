// Shared helpers for the Emporion Pros client blog feature.
const SB = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
const SITE = 'https://emporionpros.com';

async function sb(path, opts = {}) {
  const res = await fetch(SB + '/rest/v1/' + path, {
    ...opts,
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  return { ok: res.ok, status: res.status, data };
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Whitelist HTML sanitizer for post bodies (posts are shown on emporionpros.com, so no scripts/styles/handlers).
const ALLOWED = new Set(['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'a', 'blockquote', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr']);
function safeHref(h) {
  const v = String(h || '').trim();
  if (/^(https?:)?\/\//i.test(v) || v.startsWith('/') || v.startsWith('#') || /^mailto:/i.test(v) || /^tel:/i.test(v)) {
    if (/^\/\//.test(v)) return 'https:' + v;
    return v;
  }
  return '';
}
function sanitize(html) {
  let s = String(html || '');
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<(script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|template|noscript)[\s\S]*?<\/\1\s*>/gi, '');
  s = s.replace(/<(script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|template|noscript|link|meta|base)[^>]*>/gi, '');
  return s.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (m, tag, attrs) => {
    const t = tag.toLowerCase();
    if (!ALLOWED.has(t)) return '';
    if (m.startsWith('</')) return '</' + t + '>';
    if (t === 'a') {
      const hm = attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = safeHref(hm ? (hm[2] ?? hm[3] ?? hm[4]) : '');
      if (!href) return '<a>';
      const ext = /^https?:/i.test(href) && !href.startsWith(SITE);
      return '<a href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener nofollow"' : '') + '>';
    }
    return '<' + t + '>';
  });
}
const textOnly = (html) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const STYLE = `
:root{--ink:#0a0f1a;--paper:#f7f5f0;--copper:#c8622a;--slate:#5b6576;--border:rgba(10,15,26,.1);--card:#fff}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.7 'Outfit',system-ui,sans-serif}
a{color:var(--copper)}header.bh{background:var(--ink);color:#fff;padding:14px 16px}header.bh .in{max-width:760px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
header.bh a{color:#fff;text-decoration:none;font-weight:700}header.bh .by{font-size:13px;opacity:.7;font-weight:400}
main{max-width:760px;margin:0 auto;padding:32px 16px 64px}h1{font:800 clamp(28px,5vw,40px)/1.15 'Fraunces',Georgia,serif;margin:0 0 12px}
h2{font:700 24px/1.3 'Fraunces',Georgia,serif;margin:36px 0 10px}h3{font-size:19px;margin:26px 0 8px}
.meta{color:var(--slate);font-size:14px;margin-bottom:28px}.card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;margin:0 0 14px;display:block;text-decoration:none;color:inherit}
.card h2{margin:0 0 6px;font-size:21px}.card p{margin:0;color:var(--slate);font-size:15px}
.faq{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:6px 20px;margin-top:36px}.faq h3{margin-top:18px}
.cta{background:var(--ink);color:#fff;border-radius:14px;padding:22px;margin-top:36px}.cta a{color:#fff;font-weight:700}
.src{font-size:13px;color:var(--slate);margin-top:28px}.src li{margin:2px 0}footer{text-align:center;font-size:12px;color:var(--slate);padding:24px 16px}
blockquote{border-left:3px solid var(--copper);margin:20px 0;padding:4px 16px;color:var(--slate)}table{border-collapse:collapse;width:100%}td,th{border:1px solid var(--border);padding:8px;text-align:left}
@media(max-width:600px){body{font-size:16px}}`;

function page({ title, description, canonical, jsonld, body, noindex }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(description || '')}">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description || '')}">${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Fraunces:opsz,wght@9..144,700;9..144,800&display=swap" rel="stylesheet">
<style>${STYLE}</style>${(jsonld || []).map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('')}
</head><body>${body}<footer>Published on <a href="${SITE}">Emporion Pros</a> · <a href="${SITE}/privacy">Privacy</a></footer></body></html>`;
}

// On-page checks shown to the client and stored with the post (not a "score").
function seoChecklist(p) {
  const t = String(p.title || ''), m = String(p.meta_description || ''), body = String(p.body_html || ''), kw = String(p.focus_keyword || '').toLowerCase();
  const words = textOnly(body).split(' ').filter(Boolean).length;
  const h2 = (body.match(/<h2/gi) || []).length;
  const internal = (body.match(/href="(\/|https:\/\/emporionpros\.com)/gi) || []).length;
  return {
    title_length_ok: t.length >= 30 && t.length <= 65,
    meta_length_ok: m.length >= 110 && m.length <= 160,
    keyword_in_title: !!kw && t.toLowerCase().includes(kw),
    keyword_in_intro: !!kw && textOnly(body).slice(0, 400).toLowerCase().includes(kw),
    word_count: words, word_count_ok: words >= 700,
    subheadings: h2, subheadings_ok: h2 >= 3,
    faq_count: (p.faq || []).length, faq_ok: (p.faq || []).length >= 3,
    sources_count: (p.sources || []).length,
    internal_links: internal
  };
}

async function wpPublish(client, post) {
  if (!client.wp_url || !client.wp_user || !client.wp_app_password) return { skipped: true };
  const base = client.wp_url.replace(/\/+$/, '');
  if (!/^https:\/\//i.test(base)) return { error: 'WordPress address must start with https://' };
  const faqHtml = (post.faq || []).length ? '<h2>Frequently asked questions</h2>' + post.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('') : '';
  const res = await fetch(base + '/wp-json/wp/v2/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(client.wp_user + ':' + client.wp_app_password).toString('base64') },
    body: JSON.stringify({ title: post.title, content: sanitize(post.body_html) + faqHtml, excerpt: post.meta_description || '', slug: post.slug, status: 'publish' })
  }).catch((e) => ({ ok: false, status: 0, json: async () => ({ message: String(e) }) }));
  const j = await res.json().catch(() => ({}));
  if (!res.ok) return { error: (j && (j.message || j.code)) || 'WordPress error ' + res.status };
  return { url: j.link };
}

async function publishPost(client, post) {
  const now = new Date().toISOString();
  const wp = await wpPublish(client, post);
  const patch = { status: 'published', published_at: post.published_at || now, updated_at: now, checklist: seoChecklist(post) };
  if (wp.url) { patch.wp_post_url = wp.url; patch.wp_error = null; }
  if (wp.error) patch.wp_error = String(wp.error).slice(0, 300);
  await sb('blog_posts?id=eq.' + Number(post.id), { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(patch) });
  return { ...patch, url: `${SITE}/blog/${client.slug}/${post.slug}` };
}

module.exports = { sb, esc, sanitize, textOnly, page, seoChecklist, publishPost, wpPublish, SITE };
