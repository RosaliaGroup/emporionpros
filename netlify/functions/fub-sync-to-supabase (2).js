// ============================================
// EMPORIONPROS — FUB → Supabase Sync (Batch)
// Fetches leads from FUB, bulk upserts to Supabase
// Uses Supabase upsert (single API call) instead of per-lead check+insert
// ============================================

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
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
  const limit = Math.min(parseInt(params.limit) || 20, 100);

  try {
    // Step 1: Fetch from FUB
    const fubRes = await fetch(
      `https://api.followupboss.com/v1/people?limit=${limit}&offset=${offset}&sort=created`,
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
          'Content-Type': 'application/json',
          'X-System': 'EmporionPros',
          'X-System-Key': 'emporionpros2026'
        }
      }
    );

    if (!fubRes.ok) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'FUB error: ' + fubRes.status }) };
    }

    const fubData = await fubRes.json();
    const people = fubData.people || [];

    // Step 2: Map to Supabase format, skip leads without email
    const now = new Date().toISOString();
    const leads = people
      .filter(p => p.emails && p.emails[0] && p.emails[0].value)
      .map(p => ({
        name: [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown',
        email: p.emails[0].value.toLowerCase().trim(),
        phone: (p.phones && p.phones[0]) ? p.phones[0].value : null,
        source: 'fub',
        status: 'new',
        updated_at: now
      }));

    if (leads.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'No leads with email', fetched: people.length, offset, hasMore: people.length === limit }) };
    }

    // Step 3: Bulk upsert to Supabase (one API call)
    // This requires a unique constraint on email — if it doesn't exist, it just inserts
    const supaRes = await fetch(
      `${SUPABASE_URL}/rest/v1/leads`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal,resolution=merge-duplicates'
        },
        body: JSON.stringify(leads)
      }
    );

    const supaStatus = supaRes.status;
    let supaError = null;

    if (!supaRes.ok) {
      supaError = await supaRes.text();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: supaRes.ok,
        batch: { offset, limit, fetched: people.length, withEmail: leads.length },
        supabase: { status: supaStatus, error: supaError },
        hasMore: people.length === limit,
        nextOffset: people.length === limit ? offset + limit : null
      })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
