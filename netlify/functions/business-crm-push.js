// Manual push of Emporion Pros outreach businesses to the Business CRM in Abrevo.
// POST with header x-internal-secret: BUSINESS_SYNC_SECRET
//   {"action":"backfill"}            every prospect
//   {"action":"since","hours":3}     prospects updated in the last N hours
// The hourly business-crm-sync function does the "since" push on a schedule.
const crypto = require('crypto');
const crm = require('./lib/businessCrm');

const json = (code, obj) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });

function secretOk(event) {
  const want = process.env.BUSINESS_SYNC_SECRET || '';
  const h = event.headers || {};
  const got = String(h['x-internal-secret'] || h['X-Internal-Secret'] || '');
  return want.length >= 24 && got.length === want.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  if (!secretOk(event)) return json(401, { error: 'unauthorized' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'bad json' }); }
  try {
    let filter = '';
    if (body.action === 'since') {
      const hours = Math.min(Math.max(Number(body.hours) || 3, 1), 24 * 30);
      filter = 'updated_at=gte.' + encodeURIComponent(new Date(Date.now() - hours * 3600e3).toISOString());
    } else if (body.action !== 'backfill') {
      return json(400, { error: 'action must be backfill or since' });
    }
    const rows = await crm.readProspects(filter);
    const sent = rows.length ? await crm.push(rows) : 0;
    return json(200, { ok: true, read: rows.length, sent });
  } catch (e) {
    console.warn('[business-crm-push]', e.message);
    return json(502, { ok: false, error: e.message });
  }
};
