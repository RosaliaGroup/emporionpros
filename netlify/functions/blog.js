// Public client blogs: /blog/{client}/  /blog/{client}/{post}  /blog/{client}/sitemap.xml
// Server-rendered for search engines (title, description, canonical, Article + FAQ schema).
const { sb, esc, sanitize, textOnly, page, SITE } = require('../lib/blog');

const html = (code, body, extra = {}) => ({ statusCode: code, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300', ...extra }, body });
const notFound = () => html(404, page({ title: 'Not found — Emporion Pros', noindex: true, body: '<main><h1>Page not found</h1><p><a href="/">Go to Emporion Pros</a></p></main>' }));

exports.handler = async function (event) {
  let raw = String((event.queryStringParameters && event.queryStringParameters.p) || '');
  if (!raw) {
    // Rewritten requests keep the original path (/blog/{client}/{post}).
    let path = String(event.path || '');
    try { if (event.rawUrl) path = new URL(event.rawUrl).pathname; } catch (e) {}
    raw = path.replace(/^\/(\.netlify\/functions\/)?blog\/?/, '');
  }
  raw = raw.replace(/^\/+|\/+$/g, '');
  const [clientSlug, postSlug] = raw.split('/');
  if (!clientSlug || !/^[a-z0-9-]{2,60}$/.test(clientSlug)) return notFound();

  const c = await sb('blog_clients?select=id,slug,business_name,client_type,niche,service_area,website,phone&active=is.true&slug=eq.' + clientSlug);
  const client = c.ok && c.data && c.data[0];
  if (!client) return notFound();
  const home = `${SITE}/blog/${client.slug}/`;
  const header = `<header class="bh"><div class="in"><a href="${home}">${esc(client.business_name)} <span class="by">Blog</span></a>${client.website ? `<a class="by" href="${esc(client.website)}" rel="noopener">Visit website →</a>` : ''}</div></header>`;

  if (postSlug === 'sitemap.xml') {
    const r = await sb(`blog_posts?select=slug,updated_at&client_id=eq.${client.id}&status=eq.published&order=published_at.desc&limit=1000`);
    const urls = [`<url><loc>${home}</loc></url>`].concat((r.data || []).map((p) => `<url><loc>${home}${p.slug}</loc><lastmod>${String(p.updated_at).slice(0, 10)}</lastmod></url>`));
    return { statusCode: 200, headers: { 'Content-Type': 'application/xml' }, body: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>` };
  }

  if (!postSlug) {
    const r = await sb(`blog_posts?select=slug,title,meta_description,published_at&client_id=eq.${client.id}&status=eq.published&order=published_at.desc&limit=100`);
    const posts = r.data || [];
    const list = posts.length ? posts.map((p) => `<a class="card" href="${home}${esc(p.slug)}"><h2>${esc(p.title)}</h2><p>${esc(p.meta_description || '')}</p></a>`).join('')
      : '<p>New articles are on the way.</p>';
    const title = `${client.business_name} Blog${client.service_area ? ' — ' + client.service_area : ''}`;
    return html(200, page({
      title, description: `Articles and local tips from ${client.business_name}${client.niche ? ' about ' + client.niche : ''}${client.service_area ? ' in ' + client.service_area : ''}.`,
      canonical: home, body: `${header}<main><h1>${esc(client.business_name)} Blog</h1><div class="meta">${esc([client.niche, client.service_area].filter(Boolean).join(' · '))}</div>${list}</main>`
    }));
  }

  if (!/^[a-z0-9-]{3,90}$/.test(postSlug)) return notFound();
  const r = await sb(`blog_posts?select=*&client_id=eq.${client.id}&slug=eq.${postSlug}&status=eq.published`);
  const post = r.ok && r.data && r.data[0];
  if (!post) return notFound();
  const url = home + post.slug;
  const faq = Array.isArray(post.faq) ? post.faq.filter((f) => f && f.q && f.a) : [];
  const sources = Array.isArray(post.sources) ? post.sources.filter((s) => s && /^https?:\/\//.test(s.url || '')) : [];
  const date = new Date(post.published_at || post.created_at);
  const jsonld = [{
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.meta_description || '',
    datePublished: date.toISOString(), dateModified: new Date(post.updated_at || date).toISOString(), mainEntityOfPage: url,
    author: { '@type': 'Organization', name: client.business_name, ...(client.website ? { url: client.website } : {}) },
    publisher: { '@type': 'Organization', name: client.business_name }, keywords: (post.keywords || []).join(', ')
  }];
  if (faq.length) jsonld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  const body = `${header}<main><article><h1>${esc(post.title)}</h1>
<div class="meta">By ${esc(client.business_name)} · ${date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' })} · ${Math.max(1, Math.round(textOnly(post.body_html).split(' ').length / 220))} min read</div>
${sanitize(post.body_html)}
${faq.length ? `<section class="faq"><h2>Frequently asked questions</h2>${faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}</section>` : ''}
<div class="cta"><strong>${esc(client.business_name)}</strong>${client.service_area ? ' · ' + esc(client.service_area) : ''}<br>${client.phone ? `Call <a href="tel:${esc(String(client.phone).replace(/[^0-9+]/g, ''))}">${esc(client.phone)}</a>` : ''}${client.phone && client.website ? ' · ' : ''}${client.website ? `<a href="${esc(client.website)}" rel="noopener">Visit our website</a>` : ''}</div>
${sources.length ? `<div class="src">Sources:<ul>${sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener nofollow">${esc(s.title || s.url)}</a></li>`).join('')}</ul></div>` : ''}
<p class="src"><a href="${home}">← More articles from ${esc(client.business_name)}</a></p></article></main>`;
  return html(200, page({ title: post.title + ' | ' + client.business_name, description: post.meta_description, canonical: url, jsonld, body }));
};
