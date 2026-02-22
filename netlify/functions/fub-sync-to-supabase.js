// ============================================
// EMPORIONPROS — FUB → Supabase Batch Sync
// ?offset=0&limit=20 (default)
// Call repeatedly with increasing offset to sync all leads
// ============================================

exports.handler = async function(event) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const FUB_API_KEY = process.env.FUB_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!FUB_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing env vars' }) };
  }

  const params = event.queryStringParameters || {};
  const offset = parseInt(params.offset) || 0;
  const limit = Math.min(parseInt(params.limit) || 20, 50);

  try {
    // Fetch from FUB
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
      const errText = await fubRes.text();
      return { statusCode: 200, headers, body: JSON.stringify({ success: false, error: 'FUB: ' + errText }) };
    }

    const fubData = await fubRes.json();
    const people = fubData.people || [];

    // Map to Supabase format
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

    let supaStatus = 0;
    let supaError = null;

    if (leads.length > 0) {
      // Bulk insert to Supabase
      const supaRes = await fetch(
        `${SUPABASE_URL}/rest/v1/leads`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(leads)
        }
      );
      supaStatus = supaRes.status;
      if (!supaRes.ok) supaError = await supaRes.text();
    }

    const hasMore = people.length === limit;

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        success: supaError ? false : true,
        batch: { offset, limit, fetched: people.length, withEmail: leads.length, skippedNoEmail: people.length - leads.length },
        supabase: { status: supaStatus, error: supaError },
        hasMore,
        nextOffset: hasMore ? offset + limit : null
      })
    };

  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
