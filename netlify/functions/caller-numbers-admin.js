// TEMPORARY admin endpoint (header x-internal-secret) to add outreach caller-ID numbers.
// actions: search | order {numbers:[...]} | order_status {id} | import {numbers:[...]} | info
const json = (c, o) => ({ statusCode: c, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o, null, 1) });
const EXISTING = '+18623690005';
const EXISTING_VAPI_ID = '9fee0363-5837-401e-9a64-1f09ef92e95c';

exports.handler = async function (event) {
  const given = (event.headers && (event.headers['x-internal-secret'] || event.headers['X-Internal-Secret'])) || '';
  if (!process.env.SMS_INTERNAL_SECRET || given !== process.env.SMS_INTERNAL_SECRET) return json(401, { error: 'Unauthorized' });
  let b = {}; try { b = JSON.parse(event.body || '{}'); } catch (e) {}
  const T = (p, o = {}) => fetch('https://api.telnyx.com/v2' + p, { ...o, headers: { Authorization: 'Bearer ' + process.env.TELNYX_API_KEY, 'Content-Type': 'application/json', ...(o.headers || {}) } }).then(async (r) => ({ ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) }));
  const V = (p, o = {}) => fetch('https://api.vapi.ai' + p, { ...o, headers: { Authorization: 'Bearer ' + process.env.VAPI_API_KEY, 'Content-Type': 'application/json', ...(o.headers || {}) } }).then(async (r) => ({ ok: r.ok, status: r.status, j: await r.json().catch(() => ({})) }));

  const ex = await T('/phone_numbers?filter[phone_number]=' + encodeURIComponent(EXISTING));
  const exNum = ex.j.data && ex.j.data[0];
  if (b.action === 'info') {
    const v = await V('/phone-number/' + EXISTING_VAPI_ID);
    return json(200, { telnyx: exNum && { connection_id: exNum.connection_id, connection_name: exNum.connection_name, messaging_profile_id: exNum.messaging_profile_id, status: exNum.status }, vapi: { provider: v.j.provider, credentialId: v.j.credentialId, name: v.j.name, numberE164CheckEnabled: v.j.numberE164CheckEnabled, server: v.j.server && v.j.server.url, assistantId: v.j.assistantId } });
  }
  if (b.action === 'search') {
    const out = [];
    for (const ac of ['973', '862']) {
      const r = await T(`/available_phone_numbers?filter[country_code]=US&filter[national_destination_code]=${ac}&filter[phone_number_type]=local&filter[features][]=voice&filter[limit]=4`);
      (r.j.data || []).forEach((n) => out.push({ number: n.phone_number, region: (n.region_information || []).map((x) => x.region_name).join(', '), upfront: n.cost_information && n.cost_information.upfront_cost, monthly: n.cost_information && n.cost_information.monthly_cost, currency: n.cost_information && n.cost_information.currency, reservable: n.reservable }));
    }
    return json(200, out);
  }
  if (b.action === 'order') {
    const nums = (b.numbers || []).slice(0, 2);
    if (nums.length !== 2 || !exNum) return json(400, { error: 'need exactly 2 numbers and the existing connection' });
    const r = await T('/number_orders', { method: 'POST', body: JSON.stringify({ phone_numbers: nums.map((n) => ({ phone_number: n })), connection_id: exNum.connection_id, customer_reference: 'Emporion outreach caller IDs' }) });
    return json(r.status, { id: r.j.data && r.j.data.id, status: r.j.data && r.j.data.status, errors: r.j.errors });
  }
  if (b.action === 'order_status') {
    const r = await T('/number_orders/' + encodeURIComponent(String(b.id || '')));
    return json(r.status, { status: r.j.data && r.j.data.status, numbers: r.j.data && (r.j.data.phone_numbers || []).map((p) => ({ n: p.phone_number, s: p.status })) });
  }
  if (b.action === 'import') {
    const v = await V('/phone-number/' + EXISTING_VAPI_ID);
    const out = [];
    for (const n of (b.numbers || []).slice(0, 2)) {
      const r = await V('/phone-number', { method: 'POST', body: JSON.stringify({ provider: 'byo-phone-number', number: n, credentialId: v.j.credentialId, numberE164CheckEnabled: v.j.numberE164CheckEnabled !== false, name: 'Emporion outreach ' + n.slice(-4) }) });
      out.push({ number: n, ok: r.ok, id: r.j.id, error: r.j.message });
    }
    return json(200, out);
  }
  return json(400, { error: 'unknown action' });
};
