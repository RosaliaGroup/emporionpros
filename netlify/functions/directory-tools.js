// VAPI tool server for the main Emporion line (Aria): find_vendor, log_directory_lead,
// and dynamic transfer destinations. Every request is checked against the VAPI API.
const { findVendors, logLead, transferDestination, verifyCall } = require('../lib/directory');
const json = (c, o) => ({ statusCode: c, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) });

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  let body = {}; try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'bad json' }); }
  const msg = body.message || {};
  const callId = (msg.call && msg.call.id) || '';
  const call = await verifyCall(callId);
  if (!call) return json(401, { error: 'unverified call' });
  const callerNumber = call.customer && call.customer.number;

  if (msg.type === 'transfer-destination-request') {
    const destination = await transferDestination(callId);
    if (!destination) return json(200, { error: 'No business selected yet. Ask which business they want, use find_vendor and log_directory_lead first.' });
    return json(200, { destination });
  }

  const calls = msg.toolCallList || msg.toolCalls || [];
  const results = [];
  for (const tc of calls) {
    const fn = tc.function || {};
    let args = fn.arguments || {};
    if (typeof args === 'string') { try { args = JSON.parse(args); } catch (e) { args = {}; } }
    let result;
    try {
      if (fn.name === 'find_vendor') {
        const m = await findVendors(args.query);
        result = m.length ? JSON.stringify({ matches: m, note: 'Confirm the right business with the caller using name and town. Never read out phone numbers.' })
          : JSON.stringify({ matches: [], note: 'No match in the directory. Offer to take their details so the Emporion team can help.' });
      } else if (fn.name === 'log_directory_lead') {
        const r = await logLead(callId, args, callerNumber);
        result = JSON.stringify(r.ok ? { saved: true, vendor: r.vendor, next: 'Tell the caller their request is saved, then use transferCall to connect them.' } : { saved: false, error: r.error });
      } else {
        result = JSON.stringify({ error: 'unknown tool' });
      }
    } catch (e) { result = JSON.stringify({ error: 'temporary problem, take their details instead' }); }
    results.push({ toolCallId: tc.id, result });
  }
  return json(200, { results });
};
