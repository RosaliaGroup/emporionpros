// ============================================
// EMPORIONPROS — FUB → Supabase Polling Sync
// Netlify Function: fub-sync-to-supabase.js
//
// Pulls leads from FUB in batches and upserts to Supabase.
// Call multiple times to sync all leads.
//
// Query params:
//   ?offset=0    — start position (default 0)
//   ?limit=50    — leads per batch (default 50)
//   ?days=30     — only sync leads from last N days (default: all)
// ============================================

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const FUB_API_KEY = process.env.FUB_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!FUB_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing env vars' }) };
  }

  const params = event.queryStringParameters || {};
  const offset = parseInt(params.offset) || 0;
  const limit = Math.min(parseInt(params.limit) || 50, 100);
  const days = params.days ? parseInt(params.days) : null;

  const AUTH = 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64');

  try {
    // Build FUB URL
    let fubUrl = `https://api.followupboss.com/v1/people?limit=${limit}&offset=${offset}&sort=created`;
    if (days) {
      const afterDate = Math.floor((Date.now() - days * 86400000) / 1000);
      fubUrl += `&afterDate=${afterDate}`;
    }

    const fubRes = await fetch(fubUrl, {
      headers: {
        'Authorization': AUTH,
        'Content-Type': 'application/json',
        'X-System': 'EmporionPros',
        'X-System-Key': 'emporionpros2026'
      }
    });

    if (!fubRes.ok) {
      const errText = await fubRes.text();
      return { statusCode: fubRes.status, headers, body: JSON.stringify({ error: 'FUB: ' + errText }) };
    }

    const data = await fubRes.json();
    const people = data.people || [];

    // Upsert each lead into Supabase
    let created = 0, updated = 0, skipped = 0;

    for (const person of people) {
      const email = person.emails && person.emails[0] ? person.emails[0].value : null;
      const phone = person.phones && person.phones[0] ? person.phones[0].value : null;

      if (!email) { skipped++; continue; }

      const name = [person.firstName, person.lastName].filter(Boolean).join(' ') || 'Unknown';
      const status = mapStage(person.stage);

      // Check if exists
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(email)}&limit=1`,
        { headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'apikey': SUPABASE_SERVICE_KEY } }
      );
      const existing = await checkRes.json();

      if (existing.length > 0) {
        await fetch(
          `${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(email)}`,
          {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'apikey': SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ name, phone: phone || existing[0].phone, status, updated_at: new Date().toISOString() })
          }
        );
        updated++;
      } else {
        await fetch(
          `${SUPABASE_URL}/rest/v1/leads`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'apikey': SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ name, email, phone, source: 'fub', status, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          }
        );
        created++;
      }
    }

    const hasMore = people.length === limit;

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        success: true,
        batch: { offset, limit, fetched: people.length },
        results: { created, updated, skipped },
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
        syncedAt: new Date().toISOString()
      })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

function mapStage(stage) {
  if (!stage) return 'new';
  const s = stage.toLowerCase();
  if (s.includes('new') || s.includes('lead')) return 'new';
  if (s.includes('contact') || s.includes('attempt')) return 'contacted';
  if (s.includes('qualif') || s.includes('active') || s.includes('warm')) return 'qualified';
  if (s.includes('contract') || s.includes('clos') || s.includes('won')) return 'converted';
  if (s.includes('lost') || s.includes('dead') || s.includes('trash')) return 'lost';
  return 'new';
}
