// ============================================
// EMPORIONPROS — Excel/CSV Lead Upload
// Netlify Function: upload-leads.js
//
// Accepts JSON array of leads (parsed client-side
// from Excel/CSV) and upserts into Supabase.
// Also pushes new leads to FUB via POST /v1/events.
//
// Expects POST body:
// {
//   "leads": [
//     { "name": "John Smith", "email": "john@test.com", "phone": "5551234567", "source": "excel" },
//     ...
//   ],
//   "pushToFUB": true  // optional, default true
// }
// ============================================

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'POST only' }) };

  const FUB_API_KEY = process.env.FUB_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing Supabase env vars' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const leads = body.leads || [];
    const pushToFUB = body.pushToFUB !== false; // default true

    if (!leads.length) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No leads provided' }) };
    }

    let created = 0, updated = 0, skipped = 0, fubPushed = 0, errors = [];

    for (const lead of leads) {
      // Normalize
      const email = (lead.email || lead.Email || lead.EMAIL || '').trim().toLowerCase();
      const name = (lead.name || lead.Name || lead.NAME || lead['Full Name'] || lead['full_name'] || '').trim();
      const phone = (lead.phone || lead.Phone || lead.PHONE || lead['Phone Number'] || lead['phone_number'] || '').toString().trim();
      const source = (lead.source || lead.Source || 'excel').trim();
      const role = (lead.role || lead.Role || '').trim();
      const message = (lead.message || lead.Message || lead.notes || lead.Notes || '').trim();
      const page = (lead.page || lead.Page || '').trim();

      if (!email && !phone) {
        skipped++;
        continue;
      }

      // Upsert into Supabase
      try {
        let isNew = false;

        if (email) {
          // Check if exists by email
          const checkRes = await fetch(
            `${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(email)}&limit=1`,
            { headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'apikey': SUPABASE_SERVICE_KEY } }
          );
          const existing = await checkRes.json();

          if (existing.length > 0) {
            // Update existing
            await fetch(
              `${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(email)}`,
              {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'apikey': SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                body: JSON.stringify({
                  name: name || existing[0].name,
                  phone: phone || existing[0].phone,
                  source: existing[0].source || source,
                  role: role || existing[0].role,
                  message: message || existing[0].message,
                  updated_at: new Date().toISOString()
                })
              }
            );
            updated++;
          } else {
            isNew = true;
          }
        } else {
          isNew = true;
        }

        if (isNew) {
          const insertRes = await fetch(
            `${SUPABASE_URL}/rest/v1/leads`,
            {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'apikey': SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
              body: JSON.stringify({
                name, email, phone, source, role, message, page,
                status: 'new',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            }
          );
          if (insertRes.ok) created++;
          else {
            const errText = await insertRes.text();
            errors.push({ email, error: errText });
          }
        }

        // Push to FUB if enabled and lead is new
        if (pushToFUB && isNew && FUB_API_KEY && email) {
          try {
            const nameParts = name.split(/\s+/);
            const fubRes = await fetch('https://api.followupboss.com/v1/events', {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
                'Content-Type': 'application/json',
                'X-System': 'EmporionPros',
                'X-System-Key': 'emporionpros2026'
              },
              body: JSON.stringify({
                source: 'EmporionPros',
                system: 'EmporionPros',
                type: 'Excel Import',
                message: message || 'Imported from spreadsheet',
                person: {
                  firstName: nameParts[0] || '',
                  lastName: nameParts.slice(1).join(' ') || '',
                  emails: [{ value: email }],
                  phones: phone ? [{ value: phone }] : [],
                  tags: ['EmporionPros', 'Excel Import']
                }
              })
            });
            if (fubRes.ok) fubPushed++;
          } catch(e) {
            // Don't fail the whole upload for FUB errors
            console.error('FUB push error for', email, e.message);
          }
        }

      } catch(e) {
        errors.push({ email: email || phone, error: e.message });
      }
    }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        success: true,
        total: leads.length,
        created,
        updated,
        skipped,
        fubPushed,
        errors: errors.length,
        errorDetails: errors.slice(0, 10), // First 10 errors max
        syncedAt: new Date().toISOString()
      })
    };

  } catch(err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
