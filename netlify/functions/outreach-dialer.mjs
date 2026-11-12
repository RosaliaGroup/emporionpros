// Emporion Pros business-outreach dialer.
// Runs every 15 minutes, weekdays 10:00–17:45 New York time (schedule is in UTC; EST = UTC-5).
// Each run places up to BATCH calls via the VAPI API with the "Business Outreach" assistant,
// never more than DAILY_CAP per New York day. Only prospects with ai_call_allowed = true
// (landline / business lines, checked with Telnyx) are ever dialed by the AI.
// Kill switch: env OUTREACH_ENABLED must be "true".
// Caller IDs: env OUTREACH_PHONE_IDS = comma-separated VAPI phone-number ids (rotated).
export const config = { schedule: '*/15 15-22 * * 1-5' };

const ASSISTANT_ID = 'f9707c25-f508-4836-ba56-adb7ff1dcd04';
const DEFAULT_PHONE_IDS = ['9fee0363-5837-401e-9a64-1f09ef92e95c']; // (862) 369-0005
const DAILY_CAP = Number(process.env.OUTREACH_DAILY_CAP || 150);
const BATCH = Number(process.env.OUTREACH_BATCH || 5);
const RETRY_AFTER_DAYS = 2;
// Google listing names often carry SEO junk: "Tony's Moving | Moving NJ | 뉴저지" -> "Tony's Moving"
// National chains/franchise call centers: they don't decide local listings by phone.
const CHAIN = /\b(orkin|terminix|western pest|rentokil|truly nolen|ehrlich|aptive|rollins|two men and a truck|allied van|united van|mayflower|north american van|atlas van|u-?haul|pods\b|roto-?rooter|mr\.? rooter|benjamin franklin plumbing|mister sparky|one hour heating|servpro|servicemaster|servicemaster|molly maid|merry maids|the maids|jan-?pro|coverall|stanley steemer|chemdry|chem-dry|paul davis|belfor|home depot|lowe'?s|sears|abc home|aire serv|mr\.? handyman|handyman connection|certapro|five star painting|sherwin|pillar to post|hometeam inspection|amerispec|wini?\b|world inspection network|keller williams|re\/?max|coldwell|century 21|berkshire hathaway|compass\b|fidelity national|first american title|old republic|stewart title|chicago title|rocket mortgage|wells fargo|chase\b|bank of america)\b/i;
const cleanName = (n) => String(n || '').split(/\s\|\s/)[0].replace(/[^\x20-\x7E’']/g, '').replace(/\s+/g, ' ').trim();
const MAX_ATTEMPTS = 2;

function nyParts(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hour12: false, weekday: 'short'
  }).formatToParts(d).map((x) => [x.type, x.value]));
  return p;
}
// UTC instant of 00:00 today in New York
function nyMidnightUtc(now = new Date()) {
  const p = nyParts(now);
  const guess = new Date(`${p.year}-${p.month}-${p.day}T00:00:00Z`);
  const offH = (Number(nyParts(guess).hour) % 24); // hours NY is behind... compute offset
  // NY local hour at UTC midnight is e.g. 19 (EST) -> offset 5h; 20 (EDT) -> 4h
  const offset = 24 - offH;
  return new Date(guess.getTime() + offset * 3600e3);
}

export function makeDialer({ fetchFn = fetch, env = process.env, now = () => new Date() } = {}) {
  const SB = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_KEY;
  const sbHeaders = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
  const sb = (path, opts = {}) => fetchFn(SB + '/rest/v1/' + path, { ...opts, headers: { ...sbHeaders, ...(opts.headers || {}) } });

  return async function run() {
    if (env.OUTREACH_ENABLED !== 'true') return { skipped: 'disabled' };
    const p = nyParts(now());
    if (env.OUTREACH_START_DATE && `${p.year}-${p.month}-${p.day}` < env.OUTREACH_START_DATE) return { skipped: 'before start date' };
    const hour = Number(p.hour) % 24;
    if (['Sat', 'Sun'].includes(p.weekday) || hour < 10 || hour >= 18) return { skipped: 'outside hours', hour };

    const since = nyMidnightUtc(now()).toISOString();
    const cr = await sb(`outreach_prospects?select=id&last_called_at=gte.${encodeURIComponent(since)}`, { headers: { Prefer: 'count=exact', Range: '0-0' } });
    const done = Number(((cr.headers.get('content-range') || '').split('/')[1]) || 0);
    const n = Math.min(BATCH, DAILY_CAP - done);
    if (n <= 0) return { skipped: 'daily cap reached', done };

    // New prospects first, then one retry for earlier no-answers.
    // New prospects: skip national chains, and mix categories so a round isn't all one trade.
    const pool = await (await sb(`outreach_prospects?select=id,business_name,category,phone,call_attempts&status=eq.queued&ai_call_allowed=is.true&call_attempts=eq.0&order=created_at.asc&limit=300`)).json();
    const chains = (Array.isArray(pool) ? pool : []).filter((r) => CHAIN.test(r.business_name || ''));
    if (chains.length) {
      await sb(`outreach_prospects?id=in.(${chains.map((r) => r.id).join(',')})`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'skipped_chain', updated_at: now().toISOString() }) });
    }
    const byCat = new Map();
    for (const r of (Array.isArray(pool) ? pool : []).filter((r) => !CHAIN.test(r.business_name || ''))) {
      const k = r.category || 'other'; if (!byCat.has(k)) byCat.set(k, []); byCat.get(k).push(r);
    }
    const cats = [...byCat.keys()];
    const start = Math.floor(now().getTime() / 900000) % Math.max(1, cats.length); // rotate starting trade each round
    let rows = [];
    for (let i = 0; rows.length < n && byCat.size; i++) {
      const k = cats[(start + i) % cats.length];
      const list = byCat.get(k);
      if (list && list.length) rows.push(list.shift());
      if (i > n * cats.length + cats.length) break;
    }
    if (rows.length < n) {
      const before = new Date(now().getTime() - RETRY_AFTER_DAYS * 864e5).toISOString();
      const more = await (await sb(`outreach_prospects?select=id,business_name,category,phone,call_attempts&status=eq.no_answer&ai_call_allowed=is.true&call_attempts=lt.${MAX_ATTEMPTS}&last_called_at=lt.${encodeURIComponent(before)}&order=last_called_at.asc&limit=${n - rows.length}`)).json();
      rows = rows.concat(more);
    }
    // One retry for an early hang-up, a day or more later and at a different
    // time of day (at least 2 hours off the first call's hour). A second
    // hang-up turns into 'manual' in the webhook, for a person to call.
    if (rows.length < n) {
      const dayAgo = new Date(now().getTime() - 20 * 3600e3).toISOString();
      const cands = await (await sb(`outreach_prospects?select=id,business_name,category,phone,call_attempts,last_called_at&status=eq.hung_up&ai_call_allowed=is.true&call_attempts=lt.2&last_called_at=lt.${encodeURIComponent(dayAgo)}&order=last_called_at.asc&limit=50`)).json();
      const pick = (Array.isArray(cands) ? cands : []).filter((c) => {
        const h = Number(nyParts(new Date(c.last_called_at)).hour) % 24;
        return Math.abs(h - hour) >= 2;
      }).slice(0, n - rows.length);
      rows = rows.concat(pick);
    }
    // One call back after a receptionist took a message and no one replied.
    if (rows.length < n) {
      const before = new Date(now().getTime() - RETRY_AFTER_DAYS * 864e5).toISOString();
      const more = await (await sb(`outreach_prospects?select=id,business_name,category,phone,call_attempts&status=eq.message_left&ai_call_allowed=is.true&call_attempts=lt.2&last_called_at=lt.${encodeURIComponent(before)}&order=last_called_at.asc&limit=${n - rows.length}`)).json();
      rows = rows.concat(Array.isArray(more) ? more : []);
    }
    if (!rows.length) return { skipped: 'queue empty', done };

    const phoneIds = (env.OUTREACH_PHONE_IDS || DEFAULT_PHONE_IDS.join(',')).split(',').map((s) => s.trim()).filter(Boolean);
    const results = [];
    let failsInRow = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const phoneNumberId = phoneIds[(done + i) % phoneIds.length];
      const nowIso = now().toISOString();
      let patch;
      try {
        const res = await fetchFn('https://api.vapi.ai/call', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + env.VAPI_API_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assistantId: ASSISTANT_ID,
            phoneNumberId,
            customer: { number: r.phone, name: cleanName(r.business_name).slice(0, 40) },
            assistantOverrides: { variableValues: { business_name: cleanName(r.business_name) || 'your business', category: r.category || 'local services' } }
          })
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok && body.id) {
          failsInRow = 0;
          patch = { status: 'dialing', vapi_call_id: body.id, from_number: phoneNumberId };
          results.push({ business: r.business_name, ok: true });
        } else {
          failsInRow++;
          patch = { status: 'failed', call_summary: 'DIAL ERROR ' + res.status + ': ' + JSON.stringify(body).slice(0, 500) };
          results.push({ business: r.business_name, ok: false, status: res.status });
        }
      } catch (e) {
        failsInRow++;
        patch = { status: 'failed', call_summary: 'DIAL ERROR: ' + String(e).slice(0, 300) };
        results.push({ business: r.business_name, ok: false, error: String(e) });
      }
      await sb(`outreach_prospects?id=eq.${r.id}`, {
        method: 'PATCH', headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ ...patch, call_attempts: (r.call_attempts || 0) + 1, last_called_at: nowIso, updated_at: nowIso })
      });
      if (failsInRow >= 3) { results.push({ stopped: '3 dial errors in a row' }); break; }
      await new Promise((ok) => setTimeout(ok, 1500)); // spread calls a little
    }
    return { done_before: done, placed: results };
  };
}

export default async () => {
  const out = await makeDialer()();
  console.log('outreach-dialer', JSON.stringify(out));
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json' } });
};
