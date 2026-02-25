// ============================================
// EMPORIONPROS — FUB → Supabase Batch Sync
// ?all=true to sync ALL leads in one call
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
  const syncAll = params.all === 'true';
  const limit = Math.min(parseInt(params.limit) || 50, 100);
  let offset = parseInt(params.offset) || 0;
  const maxPages = syncAll ? 30 : 1;

  let totalFetched = 0;
  let totalSynced = 0;
  let errors = [];
  let page = 0;

  try {
    while (page < maxPages) {
      const fubRes = await fetch(
        `https://api.followupboss.com/v1/people?limit=${limit}&offset=${offset}&sort=created&sortDirection=DESC`,
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
        errors.push(`FUB page ${page}: ${errText}`);
        break;
      }

      const fubData = await fubRes.json();
      const people = fubData.people || [];

      if (people.length === 0) break;

      totalFetched += people.length;

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

      if (leads.length > 0) {
        // Call the upsert_fub_leads database function via RPC
        const supaRes = await fetch(
          `${SUPABASE_URL}/rest/v1/rpc/upsert_fub_leads`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'apikey': SUPABASE_SERVICE_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ leads_data: leads })
          }
        );

        if (!supaRes.ok) {
          const errText = await supaRes.text();
          errors.push(`Supabase page ${page}: ${errText}`);
        } else {
          const result = await supaRes.json();
          totalSynced += (typeof result === 'number' ? result : leads.length);
        }
      }

      if (people.length < limit) break;

      offset += limit;
      page++;
    }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        success: errors.length === 0,
        totalFetched,
        totalSynced,
        errors: errors.length > 0 ? errors : undefined,
        syncedAt: new Date().toISOString()
      })
    };
  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
