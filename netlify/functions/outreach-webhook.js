// Receives VAPI end-of-call reports for the "Emporion Pros — Business Outreach" assistant
// and saves the outcome on the matching outreach_prospects row (matched by phone).
// Auth: the report body is NOT trusted. We re-fetch the call from the VAPI API by its id
// (using VAPI_API_KEY) and only accept calls made by the outreach assistant; all saved
// data (phone, transcript, ended reason) comes from that verified API response.
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const OUTREACH_ASSISTANT_ID = 'f9707c25-f508-4836-ba56-adb7ff1dcd04';

// Outcome rules (voicemail / phone menu / early hang-up / conversation) live
// in lib/callOutcome so the reclassify job in outreach-maintenance uses the same ones.
const { classifyCall } = require('./lib/callOutcome');

const json = (code, obj) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'bad json' }); }
  const msg = body.message || {};
  if (msg.type !== 'end-of-call-report') return json(200, { ok: true, ignored: true });

  const callId = String((msg.call && msg.call.id) || '');
  if (!/^[0-9a-f-]{36}$/i.test(callId)) return json(400, { error: 'no call id' });

  // Verify with VAPI
  const vr = await fetch('https://api.vapi.ai/call/' + callId, { headers: { Authorization: 'Bearer ' + process.env.VAPI_API_KEY } });
  if (!vr.ok) return json(401, { error: 'call not verified' });
  const call = await vr.json();
  if (call.assistantId !== OUTREACH_ASSISTANT_ID) return json(401, { error: 'not an outreach call' });

  const phone = (call.customer && call.customer.number) || '';
  if (!phone) return json(200, { ok: true, note: 'no phone' });

  const transcript = String((call.artifact && call.artifact.transcript) || call.transcript || (msg.artifact && msg.artifact.transcript) || '');
  let summary = String((call.analysis && call.analysis.summary) || '');
  if (!summary) {
    // The summary can land a moment after the report; look once more.
    await new Promise((ok) => setTimeout(ok, 4000));
    try {
      const again = await (await fetch('https://api.vapi.ai/call/' + callId, { headers: { Authorization: 'Bearer ' + process.env.VAPI_API_KEY } })).json();
      summary = String((again.analysis && again.analysis.summary) || '');
    } catch (e) { /* no summary */ }
  }
  const ended = String(call.endedReason || msg.endedReason || '');

  // The dialer has already counted this call in call_attempts.
  let attempts = 1;
  try {
    const cur = await (await fetch(SB_URL + '/rest/v1/outreach_prospects?select=call_attempts&phone=eq.' + encodeURIComponent(phone) + '&limit=1',
      { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } })).json();
    if (Array.isArray(cur) && cur[0]) attempts = cur[0].call_attempts || 1;
  } catch (e) { /* default 1 */ }
  const { status } = classifyCall({ transcript, endedReason: ended, callAttempts: attempts, summary });

  const update = {
    status,
    vapi_call_id: callId,
    last_called_at: new Date().toISOString(),
    call_summary: ((summary ? 'SUMMARY: ' + summary + '\n\n' : '') + 'ENDED: ' + ended + '\n\n' + transcript).slice(0, 20000),
    updated_at: new Date().toISOString()
  };

  const res = await fetch(SB_URL + '/rest/v1/outreach_prospects?phone=eq.' + encodeURIComponent(phone), {
    method: 'PATCH',
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(update)
  });

  // Show the outcome in the Business CRM (Abrevo) right away. Best-effort: the
  // hourly business-crm-sync picks it up if this fails.
  if (res.ok) {
    try {
      const crm = require('./lib/businessCrm');
      const rows = await crm.readProspects('phone=eq.' + encodeURIComponent(phone));
      if (rows.length) await crm.push(rows);
    } catch (e) { console.warn('[outreach-webhook] business CRM push failed:', e.message); }
  }
  return json(200, { ok: res.ok, status });
};
