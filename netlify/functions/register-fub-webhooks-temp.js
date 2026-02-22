// TEMPORARY — Delete after running once
// Registers FUB webhooks for 2-way sync
exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const FUB_API_KEY = process.env.FUB_API_KEY;
  if (!FUB_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'FUB_API_KEY not set' }) };
  }

  const AUTH = 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64');
  const WEBHOOK_URL = 'https://emporionpros.com/.netlify/functions/fub-webhook';

  const results = [];

  // List existing webhooks first
  try {
    const listRes = await fetch('https://api.followupboss.com/v1/webhooks', {
      headers: { 'Authorization': AUTH, 'X-System': 'EmporionPros', 'X-System-Key': 'emporionpros2026' }
    });
    const existing = await listRes.json();
    results.push({ step: 'list_existing', data: existing });
  } catch(e) {
    results.push({ step: 'list_existing', error: e.message });
  }

  // Register 3 webhooks
  for (const evt of ['peopleCreated', 'peopleUpdated', 'peopleStageUpdated']) {
    try {
      const res = await fetch('https://api.followupboss.com/v1/webhooks', {
        method: 'POST',
        headers: {
          'Authorization': AUTH,
          'Content-Type': 'application/json',
          'X-System': 'EmporionPros',
          'X-System-Key': 'emporionpros2026'
        },
        body: JSON.stringify({ event: evt, url: WEBHOOK_URL })
      });
      const data = await res.json();
      results.push({ step: 'register_' + evt, status: res.status, ok: res.ok, data });
    } catch(e) {
      results.push({ step: 'register_' + evt, error: e.message });
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, results }, null, 2)
  };
};
