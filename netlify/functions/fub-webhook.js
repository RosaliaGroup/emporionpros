// ============================================
// EMPORIONPROS — FUB → Supabase Sync
// Netlify Function: fub-webhook.js
//
// Receives webhooks from Follow Up Boss when leads
// are created or updated, and upserts them into Supabase.
//
// FUB webhook payload format:
// {
//   "eventId": "uuid",
//   "eventCreated": "2026-02-22T15:19:21+00:00",
//   "event": "peopleCreated" | "peopleUpdated",
//   "resourceIds": [1234, 5678],
//   "uri": "https://api.followupboss.com/v1/people?id=1234,5678"
// }
//
// The webhook only sends IDs — we must fetch full lead
// data from FUB API using those IDs.
// ============================================

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const FUB_API_KEY = process.env.FUB_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!FUB_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing env vars:', {
      hasFUB: !!FUB_API_KEY,
      hasSupaURL: !!SUPABASE_URL,
      hasSupaKey: !!SUPABASE_SERVICE_KEY
    });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Missing required environment variables' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    console.log('FUB webhook received:', body.event, 'IDs:', body.resourceIds);

    // Validate webhook payload
    if (!body.event || !body.resourceIds || !body.resourceIds.length) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid webhook payload' }) };
    }

    // Only process people events
    const validEvents = ['peopleCreated', 'peopleUpdated', 'peopleStageUpdated'];
    if (!validEvents.includes(body.event)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, skipped: true, reason: `Event ${body.event} not processed` })
      };
    }

    let people;

    // Support direct data pass-through (from dashboard manual sync)
    if (body._directData) {
      const d = body._directData;
      people = [{
        id: d.id,
        firstName: (d.name || '').split(' ')[0],
        lastName: (d.name || '').split(' ').slice(1).join(' '),
        emails: d.email ? [{ value: d.email }] : [],
        phones: d.phone ? [{ value: d.phone }] : [],
        stage: d.stage || 'New',
        assignedTo: d.assignedTo ? { name: d.assignedTo } : null
      }];
    } else {
      // Fetch full lead details from FUB API
      const ids = body.resourceIds.join(',');
      const fubResponse = await fetch(`https://api.followupboss.com/v1/people?id=${ids}`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
          'Content-Type': 'application/json',
          'X-System': 'EmporionPros',
          'X-System-Key': 'emporionpros2026'
        }
      });

      if (!fubResponse.ok) {
        const errText = await fubResponse.text();
        console.error('FUB fetch error:', fubResponse.status, errText);
        return {
          statusCode: 502,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch leads from FUB', status: fubResponse.status })
        };
      }

      const fubData = await fubResponse.json();
      people = fubData.people || [];
    }

    if (people.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, synced: 0, message: 'No people found for given IDs' })
      };
    }

    // Upsert each person into Supabase leads table
    const results = [];

    for (const person of people) {
      const email = person.emails && person.emails[0] ? person.emails[0].value : null;
      const phone = person.phones && person.phones[0] ? person.phones[0].value : null;

      // Must have at least email to upsert (our match key)
      if (!email) {
        results.push({ fubId: person.id, skipped: true, reason: 'No email' });
        continue;
      }

      const name = [person.firstName, person.lastName].filter(Boolean).join(' ') || 'Unknown';

      // Map FUB stage to our status
      const status = mapFubStageToStatus(person.stage);

      // Map assigned agent
      const assignedTo = person.assignedTo ? person.assignedTo.name : null;

      // Check if lead already exists in Supabase (by email)
      const checkResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(email)}&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      const existing = await checkResponse.json();

      const leadData = {
        name: name,
        email: email,
        phone: phone || (existing.length > 0 ? existing[0].phone : null),
        source: existing.length > 0 ? existing[0].source : 'fub',
        status: status,
        updated_at: new Date().toISOString()
      };

      let supaResponse;

      if (existing.length > 0) {
        // UPDATE existing lead
        supaResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/leads?email=eq.${encodeURIComponent(email)}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'apikey': SUPABASE_SERVICE_KEY,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(leadData)
          }
        );
        results.push({
          fubId: person.id,
          email: email,
          action: 'updated',
          supabaseId: existing[0].id
        });
      } else {
        // INSERT new lead
        leadData.source = 'fub';
        leadData.created_at = new Date().toISOString();
        supaResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/leads`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'apikey': SUPABASE_SERVICE_KEY,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(leadData)
          }
        );
        const newLead = await supaResponse.json();
        results.push({
          fubId: person.id,
          email: email,
          action: 'created',
          supabaseId: Array.isArray(newLead) ? newLead[0]?.id : newLead?.id
        });
      }

      if (!supaResponse.ok) {
        const errText = await supaResponse.text();
        console.error('Supabase upsert error:', errText);
        results[results.length - 1].error = errText;
      }
    }

    console.log('FUB webhook processed:', JSON.stringify(results));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        event: body.event,
        synced: results.filter(r => !r.skipped && !r.error).length,
        total: results.length,
        results: results
      })
    };

  } catch (err) {
    console.error('fub-webhook error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};

// ============================================
// HELPER: Map FUB stage to Supabase status
// ============================================
function mapFubStageToStatus(stage) {
  if (!stage) return 'new';
  const s = stage.toLowerCase();
  if (s.includes('new') || s.includes('lead')) return 'new';
  if (s.includes('contact') || s.includes('attempt')) return 'contacted';
  if (s.includes('qualif') || s.includes('active') || s.includes('warm')) return 'qualified';
  if (s.includes('contract') || s.includes('clos') || s.includes('won')) return 'converted';
  if (s.includes('lost') || s.includes('dead') || s.includes('trash') || s.includes('archive')) return 'lost';
  return 'new';
}
