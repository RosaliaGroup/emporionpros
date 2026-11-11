// Receives VAPI end-of-call reports for the "Emporion Pros — Business Outreach" assistant
// and saves the outcome on the matching outreach_prospects row (matched by phone).
// Auth: VAPI sends header x-internal-secret (configured on the assistant's server settings).
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

const NO_CONTACT = /voicemail|no-answer|did-not-answer|busy|failed|error|rejected|unanswered/i;
const DNC = /\b(do not|don't|dont|stop) call|take (me|us) off|remove (me|us|our number)|not interested\b/i;

exports.handler = async function (event) {
  const headers = { 'Content-Type': 'application/json' };
  const secret = process.env.SMS_INTERNAL_SECRET;
  const given = (event.headers && (event.headers['x-internal-secret'] || event.headers['X-Internal-Secret'])) || '';
  if (!secret || given !== secret) return { statusCode: 401, headers, body: '{"error":"Unauthorized"}' };

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, headers, body: '{"error":"bad json"}' }; }
  const msg = body.message || {};
  if (msg.type !== 'end-of-call-report') return { statusCode: 200, headers, body: '{"ok":true,"ignored":true}' };

  const call = msg.call || {};
  const phone = (msg.customer && msg.customer.number) || (call.customer && call.customer.number) || '';
  if (!phone) return { statusCode: 200, headers, body: '{"ok":true,"note":"no phone"}' };

  const transcript = String((msg.artifact && msg.artifact.transcript) || msg.transcript || '');
  const summary = String((msg.analysis && msg.analysis.summary) || '');
  const ended = String(msg.endedReason || '');
  const callerSaid = transcript.split('\n').filter((l) => /^(User|Customer)\s*:/i.test(l)).join('\n');

  let status = 'called';
  if (DNC.test(callerSaid)) status = 'do_not_call';
  else if (NO_CONTACT.test(ended) || !callerSaid.trim()) status = 'no_answer';

  const update = {
    status,
    vapi_call_id: call.id || null,
    last_called_at: new Date().toISOString(),
    call_summary: ((summary ? 'SUMMARY: ' + summary + '\n\n' : '') + 'ENDED: ' + ended + '\n\n' + transcript).slice(0, 20000),
    updated_at: new Date().toISOString()
  };

  const res = await fetch(SB_URL + '/rest/v1/outreach_prospects?phone=eq.' + encodeURIComponent(phone), {
    method: 'PATCH',
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(update)
  });
  return { statusCode: 200, headers, body: JSON.stringify({ ok: res.ok, status }) };
};
