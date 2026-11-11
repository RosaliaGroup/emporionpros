// Receives VAPI end-of-call reports for the "Emporion Pros — Business Outreach" assistant
// and saves the outcome on the matching outreach_prospects row (matched by phone).
// Auth: the report body is NOT trusted. We re-fetch the call from the VAPI API by its id
// (using VAPI_API_KEY) and only accept calls made by the outreach assistant; all saved
// data (phone, transcript, ended reason) comes from that verified API response.
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const OUTREACH_ASSISTANT_ID = 'f9707c25-f508-4836-ba56-adb7ff1dcd04';

const NO_CONTACT = /voicemail|no-answer|did-not-answer|busy|failed|error|rejected|unanswered/i;
const DNC = /\b(do not|don't|dont|stop) call|take (me|us) off|remove (me|us|our number)|not interested\b/i;

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
  const summary = String((call.analysis && call.analysis.summary) || '');
  const ended = String(call.endedReason || msg.endedReason || '');
  const callerSaid = transcript.split('\n').filter((l) => /^(User|Customer)\s*:/i.test(l)).join('\n');

  let status = 'called';
  if (DNC.test(callerSaid)) status = 'do_not_call';
  else if (NO_CONTACT.test(ended) || !callerSaid.trim()) status = 'no_answer';

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
  return json(200, { ok: res.ok, status });
};
