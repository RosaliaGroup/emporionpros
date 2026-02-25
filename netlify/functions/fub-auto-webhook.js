// ============================================
// EMPORIONPROS — FUB Auto-Sync Webhook
// Receives FUB peopleCreated/peopleUpdated webhooks
// and upserts the lead into Supabase
// ============================================
exports.handler = async function(event) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const FUB_API_KEY = process.env.FUB_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!FUB_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: 'Missing env vars' }) };
  }

  try {
    let rawBody = event.body || '';
    if (event.isBase64Encoded && rawBody) {
      rawBody = Buffer.from(rawBody, 'base64').toString('utf-8');
    }

    const webhook = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    console.log('FUB Webhook event:', webhook.event);
    console.log('Resource IDs:', webhook.resourceIds);

    // Only process people events
    if (!webhook.event || !webhook.event.startsWith('people')) {
      return { statusCode: 200, headers, body: JSON.stringify({ skipped: true, reason: 'Not a people event' }) };
    }

    // Fetch the full people data from FUB using the URI provided
    const fubRes = await fetch(webhook.uri, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
        'Content-Type': 'application/json',
        'X-System': 'EmporionPros',
        'X-System-Key': 'emporionpros2026'
      }
    });

    if (!fubRes.ok) {
      const errText = await fubRes.text();
      console.error('FUB fetch error:', errText);
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'FUB fetch failed', detail: errText }) };
    }

    const fubData = await fubRes.json();
    const people = fubData.people || (fubData.id ? [fubData] : []);

    if (people.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ skipped: true, reason: 'No people in response' }) };
    }

    const now = new Date().toISOString();
    const leads = people.map(p => {
      const email = (p.emails && p.emails[0]) ? p.emails[0].value.toLowerCase().trim() : null;
      const phone = (p.phones && p.phones[0]) ? p.phones[0].value : null;
      return {
        name: [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown',
        email: email || `noemail-fub-${p.id}@placeholder.local`,
        phone: phone,
        source: p.source || 'fub',
        status: 'new',
        created_at: p.created || now,
        updated_at: now
      };
    });

    // Upsert via RPC function
    const supaRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/upsert_fub_leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ leads_data: leads })
    });

    if (!supaRes.ok) {
      const errText = await supaRes.text();
      console.error('Supabase upsert error:', errText);
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'Supabase upsert failed', detail: errText }) };
    }

    const result = await supaRes.json();
    console.log('Upserted', result, 'leads');

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ success: true, event: webhook.event, synced: people.length })
    };

  } catch (err) {
    console.error('Webhook error:', err);
    return { statusCode: 200, headers, body: JSON.stringify({ error: err.message }) };
  }
};
