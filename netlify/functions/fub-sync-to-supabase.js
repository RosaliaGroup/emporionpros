// ============================================
// EMPORIONPROS — FUB → Supabase Polling Sync
// Netlify Function: fub-sync-to-supabase.js
//
// Pulls leads from FUB and upserts into Supabase.
// No webhooks or owner access needed.
// 
// Call on schedule (Netlify scheduled function)
// or manually from dashboard.
// ============================================

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const FUB_API_KEY = process.env.FUB_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!FUB_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: 'Missing env vars', hasFUB: !!FUB_API_KEY, hasSupaURL: !!SUPABASE_URL, hasSupaKey: !!SUPABASE_SERVICE_KEY })
    };
  }

  const AUTH = 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64');

  try {
    // Pull all leads from FUB with pagination
    let allPeople = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const fubRes = await fetch(
        `https://api.followupboss.com/v1/people?limit=${limit}&offset=${offset}&sort=created&fields=allFields`,
        {
          headers: {
            'Authorization': AUTH,
            'Content-Type': 'application/json',
            'X-System': 'EmporionPros',
            'X-System-Key': 'emporionpros2026'
          }
        }
      );

      if (!fubRes.ok) {
        const errText = await fubRes.text();
        return { statusCode: fubRes.status, headers, body: JSON.stringify({ error: 'FUB API error: ' + errText }) };
      }

      const data = await fubRes.json();
      const people = data.people || [];
      allPeople = allPeople.concat(people);

      // Check if there are more pages
      if (people.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
        // Safety: max 5000 leads per sync
        if (offset >= 5000) hasMore = false;
      }
    }

    // Upsert each lead into Supabase
    let created = 0, updated = 0, skipped = 0, errors = 0;

    for (const person of allPeople) {
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

      const leadData = {
        name,
        email,
        phone: phone || (existing.length > 0 ? existing[0].phone : null),
        source: existing.length > 0 ? existing[0].source : 'fub',
        status,
        updated_at: new Date().toISOString()
      };

      let res;
      if (existing.length > 0) {
        // Update — don't overwrite source if lead came from website
        res = await fetch(
          `${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(email)}`,
          {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'apikey': SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ name, phone: leadData.phone, status, updated_at: leadData.updated_at })
          }
        );
        if (res.ok) updated++; else errors++;
      } else {
        // Insert new
        leadData.created_at = new Date().toISOString();
        res = await fetch(
          `${SUPABASE_URL}/rest/v1/leads`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'apikey': SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify(leadData)
          }
        );
        if (res.ok) created++; else errors++;
      }
    }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        success: true,
        total_fub: allPeople.length,
        created,
        updated,
        skipped,
        errors,
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
