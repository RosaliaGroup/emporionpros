// Line-type check before outbound AI calls (TCPA: no AI-voice calls to cell phones without consent).
// POST { numbers: ["+19735551234", ...] } with header x-internal-secret.
// Returns [{ number, type: "landline"|"mobile"|"voip"|..., carrier }] via Telnyx Number Lookup.
exports.handler = async function (event) {
  const headers = { 'Content-Type': 'application/json' };
  const secret = process.env.SMS_INTERNAL_SECRET;
  const given = (event.headers && (event.headers['x-internal-secret'] || event.headers['X-Internal-Secret'])) || '';
  if (!secret || given !== secret) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'POST only' }) };

  let numbers = [];
  try { numbers = (JSON.parse(event.body || '{}').numbers || []).slice(0, 50); } catch (e) {}
  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Telnyx not configured' }) };

  const results = await Promise.all(numbers.map(async (raw) => {
    let digits = String(raw).replace(/\D/g, '');
    if (digits.length === 10) digits = '1' + digits;
    const num = '+' + digits;
    try {
      const res = await fetch('https://api.telnyx.com/v2/number_lookup/' + encodeURIComponent(num) + '?type=carrier', {
        headers: { Authorization: 'Bearer ' + apiKey }
      });
      const json = await res.json();
      const c = (json.data && json.data.carrier) || {};
      return { number: num, type: c.type || 'unknown', carrier: c.name || '', status: res.status };
    } catch (e) {
      return { number: num, type: 'error', carrier: '', status: 0 };
    }
  }));
  return { statusCode: 200, headers, body: JSON.stringify(results) };
};
