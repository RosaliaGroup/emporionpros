// Adds businesses to the outreach list (protected: header x-internal-secret).
// POST { category, places: [{ name, phone, address, place_id, website? }] }  (max 60 per request)
// For each NEW phone number: Telnyx line-type lookup, then insert into outreach_prospects.
//  - landline / fixed line / voip / toll free  -> ai_call_allowed = true,  status 'queued'
//  - mobile / unknown / lookup error            -> ai_call_allowed = false, status 'manual' (human follow-up only)
// Existing phones / place ids are skipped (no second lookup, no overwrite).
const AI_OK = ['landline', 'fixed line', 'voip', 'toll free'];

function e164(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10) d = '1' + d;
  return d.length === 11 && d[0] === '1' ? '+' + d : null;
}
function cityOf(address) {
  const parts = String(address || '').split(',').map((s) => s.trim());
  return parts.length >= 3 ? parts[parts.length - 3] : null;
}

exports.handler = async function (event) {
  const json = (c, o) => ({ statusCode: c, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) });
  const secret = process.env.SMS_INTERNAL_SECRET;
  const given = (event.headers && (event.headers['x-internal-secret'] || event.headers['X-Internal-Secret'])) || '';
  if (!secret || given !== secret) return json(401, { error: 'Unauthorized' });
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'bad json' }); }
  const category = String(body.category || '').slice(0, 60) || null;
  const county = body.county ? String(body.county).slice(0, 40) : null;
  const places = (body.places || []).slice(0, 60);

  const SB = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_KEY;
  const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

  // normalize + de-dupe within the request
  const seen = new Set();
  const items = [];
  for (const p of places) {
    const phone = e164(p.phone);
    if (!phone || seen.has(phone) || !p.name) continue;
    seen.add(phone);
    items.push({ ...p, phone });
  }
  if (!items.length) return json(200, { added: 0, skipped: places.length });

  // skip phones already on file
  const inList = items.map((i) => '"' + i.phone + '"').join(',');
  const existing = await (await fetch(SB + '/rest/v1/outreach_prospects?select=phone&phone=in.(' + encodeURIComponent(inList) + ')', { headers: H })).json();
  const have = new Set((existing || []).map((r) => r.phone));
  const fresh = items.filter((i) => !have.has(i.phone));

  const rows = await Promise.all(fresh.map(async (i) => {
    let type = 'unknown';
    try {
      const r = await fetch('https://api.telnyx.com/v2/number_lookup/' + encodeURIComponent(i.phone) + '?type=carrier', {
        headers: { Authorization: 'Bearer ' + process.env.TELNYX_API_KEY }
      });
      const j = await r.json();
      type = String(((j.data && j.data.carrier) || {}).type || 'unknown').toLowerCase();
    } catch (e) { type = 'unknown'; }
    const ok = AI_OK.includes(type);
    return {
      business_name: String(i.name).slice(0, 120),
      category,
      county,
      phone: i.phone,
      line_type: type,
      ai_call_allowed: ok,
      status: ok ? 'queued' : 'manual',
      address: i.address ? String(i.address).slice(0, 200) : null,
      city: cityOf(i.address),
      website: i.website ? String(i.website).slice(0, 200) : null,
      google_place_id: i.place_id || null,
      source: 'google_places'
    };
  }));

  let added = 0;
  if (rows.length) {
    const res = await fetch(SB + '/rest/v1/outreach_prospects?on_conflict=phone', {
      method: 'POST',
      headers: { ...H, Prefer: 'resolution=ignore-duplicates,return=representation' },
      body: JSON.stringify(rows)
    });
    const out = await res.json().catch(() => []);
    if (!res.ok) return json(500, { error: 'insert failed', detail: out });
    added = out.length;
  }
  const ai = rows.filter((r) => r.ai_call_allowed).length;
  return json(200, { received: places.length, already_on_file: items.length - fresh.length, added, ai_callable: ai, manual_only: rows.length - ai });
};
