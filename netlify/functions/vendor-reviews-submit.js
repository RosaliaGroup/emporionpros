// Businesses add their review profiles (Google, Yelp, ...) and selected reviews to their directory listing.
// Everything is saved as PENDING; the Emporion Pros team checks each link and quote against the original
// before anything is shown publicly. Public POST, validated here (no direct table access for visitors).
const SB = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_KEY;
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const json = (c, o) => ({ statusCode: c, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) });

// Review sites we accept, matched on the link's host.
const SITES = [
  [/(^|\.)google\.[a-z.]+$|(^|\.)g\.page$|(^|\.)goo\.gl$|(^|\.)maps\.app\.goo\.gl$/, 'Google'],
  [/(^|\.)yelp\.com$/, 'Yelp'], [/(^|\.)facebook\.com$|(^|\.)fb\.com$/, 'Facebook'],
  [/(^|\.)angi\.com$|(^|\.)angieslist\.com$/, 'Angi'], [/(^|\.)homeadvisor\.com$/, 'HomeAdvisor'],
  [/(^|\.)bbb\.org$/, 'BBB'], [/(^|\.)houzz\.com$/, 'Houzz'], [/(^|\.)nextdoor\.com$/, 'Nextdoor'],
  [/(^|\.)thumbtack\.com$/, 'Thumbtack'], [/(^|\.)porch\.com$/, 'Porch'], [/(^|\.)trustpilot\.com$/, 'Trustpilot'],
  [/(^|\.)zillow\.com$/, 'Zillow'], [/(^|\.)realtor\.com$/, 'Realtor.com'], [/(^|\.)avvo\.com$/, 'Avvo']
];
function siteOf(raw) {
  try {
    const u = new URL(String(raw || '').trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    const host = u.hostname.toLowerCase();
    const hit = SITES.find(([rx]) => rx.test(host));
    return hit ? { site: hit[1], url: u.href.slice(0, 500) } : null;
  } catch (e) { return null; }
}
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  let b; try { b = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Bad request' }); }
  if (b.website_url) return json(200, { ok: true }); // honeypot

  const vendorId = Number(b.vendor_id);
  const name = clean(b.contact_name, 80), phone = clean(b.contact_phone, 30), email = clean(b.contact_email, 120);
  if (!vendorId || !name || (!phone && !email)) return json(400, { error: 'Please give your name and a phone number or email.' });
  if (!b.owner_confirm) return json(400, { error: 'Please confirm you own or manage this business.' });

  const links = [], bad = [];
  for (const raw of (Array.isArray(b.links) ? b.links : []).slice(0, 8)) {
    if (!String(raw || '').trim()) continue;
    const s = siteOf(raw); if (s) { if (!links.some((l) => l.url === s.url)) links.push(s); } else bad.push(clean(raw, 120));
  }
  const reviews = [];
  for (const r of (Array.isArray(b.reviews) ? b.reviews : []).slice(0, 5)) {
    const quote = clean(r && r.quote, 600);
    if (!quote) continue;
    const s = siteOf(r.source_url);
    if (!s) { bad.push(clean(r.source_url, 120) || '(missing link for a review)'); continue; }
    const rating = Number(r.rating);
    reviews.push({ source: s.site, source_url: s.url, quote, reviewer: clean(r.reviewer, 60) || null,
      rating: rating >= 1 && rating <= 5 ? Math.round(rating) : null, review_date: /^\d{4}-\d{2}-\d{2}$/.test(r.review_date || '') ? r.review_date : null });
  }
  if (bad.length) return json(400, { error: 'These links are not from a review site we accept (Google, Yelp, Facebook, Angi, BBB, Houzz, Nextdoor, Thumbtack and similar): ' + bad.join(', ') });
  if (!links.length && !reviews.length) return json(400, { error: 'Add at least one review page link or one review.' });

  const v = await (await fetch(SB + '/rest/v1/vendors?select=id&status=eq.active&id=eq.' + vendorId, { headers: H })).json().catch(() => []);
  if (!Array.isArray(v) || !v.length) return json(404, { error: 'Listing not found.' });
  const pend = await fetch(SB + '/rest/v1/vendor_review_submissions?select=id&status=eq.pending&vendor_id=eq.' + vendorId, { headers: { ...H, Prefer: 'count=exact', Range: '0-0' } });
  if (Number(((pend.headers.get('content-range') || '').split('/')[1]) || 0) >= 3) return json(429, { error: 'We already have submissions waiting for this listing. Our team will review them shortly.' });

  const ins = await fetch(SB + '/rest/v1/vendor_review_submissions', { method: 'POST', headers: { ...H, Prefer: 'return=minimal' },
    body: JSON.stringify({ vendor_id: vendorId, contact_name: name, contact_phone: phone || null, contact_email: email || null, links, reviews }) });
  if (!ins.ok) return json(500, { error: 'Could not save. Please email info@emporionpros.com.' });
  return json(200, { ok: true, links: links.length, reviews: reviews.length });
};
