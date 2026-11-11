// Send one SMS through Telnyx. Env: TELNYX_API_KEY, TELNYX_FROM_NUMBER (E.164, e.g. +18625551234),
// optional TELNYX_MESSAGING_PROFILE_ID, SMS_DRY_RUN=true to log without sending.
async function sendTelnyxSms(to, text) {
  const apiKey = process.env.TELNYX_API_KEY;
  const from = process.env.TELNYX_FROM_NUMBER;
  if (!apiKey || !from) return { ok: false, status: 500, error: 'Telnyx not configured (TELNYX_API_KEY / TELNYX_FROM_NUMBER)' };
  let digits = String(to).replace(/\D/g, '');
  if (digits.length === 10) digits = '1' + digits;
  const toE164 = '+' + digits;
  if (String(process.env.SMS_DRY_RUN).toLowerCase() === 'true') {
    console.log('[SMS_DRY_RUN] would send to', toE164, '| length', text.length);
    return { ok: true, status: 200, id: 'dry-run', to: toE164 };
  }
  const body = { from, to: toE164, text };
  if (process.env.TELNYX_MESSAGING_PROFILE_ID) body.messaging_profile_id = process.env.TELNYX_MESSAGING_PROFILE_ID;
  const res = await fetch('https://api.telnyx.com/v2/messages', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const raw = await res.text();
  let json = {}; try { json = JSON.parse(raw); } catch (e) {}
  if (!res.ok) return { ok: false, status: res.status, error: raw };
  return { ok: true, status: 200, id: (json.data && json.data.id) || null, to: toE164 };
}

exports.handler = async function(event, context) {

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const { phone, message } = data;

    if (!phone) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Phone number is required' }) };
    }
    if (!message) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message is required' }) };
    }

    const result = await sendTelnyxSms(phone, message);
    if (!result.ok) {
      console.error('Telnyx error:', result.error);
      return { statusCode: result.status || 500, headers, body: JSON.stringify({ error: 'SMS error: ' + result.error }) };
    }
    console.log('SMS SENT via Telnyx to:', result.to, '| id:', result.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'SMS sent',
        to: result.to,
        id: result.id
      })
    };

  } catch (err) {
    console.error('❌ SMS ERROR:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
