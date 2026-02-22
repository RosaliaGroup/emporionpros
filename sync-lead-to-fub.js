// ============================================
// EMPORIONPROS — Supabase → FUB Sync
// Netlify Function: sync-lead-to-fub.js
// 
// When a new lead is created on the website (Supabase),
// this pushes it to Follow Up Boss via POST /v1/events.
// 
// Trigger: Called by Supabase database webhook on leads INSERT
// OR called manually from the dashboard.
//
// FUB docs say: Use POST /v1/events (NOT /v1/people) to send
// new leads — this triggers automations and proper assignment.
// ============================================

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  const SYNC_SECRET = process.env.SYNC_SECRET; // Optional: verify webhook calls

  if (!FUB_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'FUB_API_KEY not configured' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    // Support two formats:
    // 1. Direct call: { name, email, phone, source, page, message, role }
    // 2. Supabase webhook: { type: "INSERT", record: { ... } }
    let lead;
    if (body.type === 'INSERT' && body.record) {
      // Supabase database webhook format
      lead = body.record;
    } else if (body.name || body.email) {
      // Direct call format
      lead = body;
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing lead data' }) };
    }

    // Validate required field
    if (!lead.email && !lead.phone) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Lead must have email or phone' }) };
    }

    // Skip if this lead came FROM FUB (prevent loop)
    if (lead.source === 'fub' || lead.source === 'Follow Up Boss') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, skipped: true, reason: 'Lead originated from FUB' })
      };
    }

    // Parse name into first/last
    const nameParts = (lead.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Build FUB event payload
    // POST /v1/events triggers automations (action plans, assignment, notifications)
    const fubPayload = {
      source: 'EmporionPros',
      system: 'EmporionPros',
      type: mapLeadType(lead.role, lead.page),
      message: lead.message || `New lead from ${lead.page || 'website'}`,
      person: {
        firstName: firstName,
        lastName: lastName,
        emails: lead.email ? [{ value: lead.email }] : [],
        phones: lead.phone ? [{ value: lead.phone }] : [],
        tags: buildTags(lead)
      },
      property: {
        street: getPropertyFromPage(lead.page),
        city: 'Newark',
        state: 'NJ'
      }
    };

    // Send to FUB
    const fubResponse = await fetch('https://api.followupboss.com/v1/events', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
        'Content-Type': 'application/json',
        'X-System': 'EmporionPros',
        'X-System-Key': 'emporionpros2026'
      },
      body: JSON.stringify(fubPayload)
    });

    const fubData = await fubResponse.text();

    if (!fubResponse.ok) {
      console.error('FUB API error:', fubResponse.status, fubData);
      return {
        statusCode: fubResponse.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'FUB API error',
          status: fubResponse.status,
          detail: fubData
        })
      };
    }

    const fubResult = JSON.parse(fubData);

    // Optionally update Supabase lead with FUB person ID for future syncing
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY && lead.id && fubResult.id) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            source: lead.source || 'website',
            updated_at: new Date().toISOString()
          })
        });
      } catch (updateErr) {
        console.error('Failed to update Supabase lead:', updateErr.message);
        // Don't fail the whole request for this
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        fubPersonId: fubResult.id,
        message: `Lead ${lead.email || lead.phone} synced to FUB`
      })
    };

  } catch (err) {
    console.error('sync-lead-to-fub error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapLeadType(role, page) {
  if (page && page.includes('iron-65')) return 'Property Inquiry';
  if (page && page.includes('iron-pointe')) return 'Property Inquiry';
  if (role === 'vendor') return 'Vendor Application';
  if (role === 'agent') return 'Agent Registration';
  if (page && page.includes('list-property')) return 'Listing Inquiry';
  return 'General Inquiry';
}

function buildTags(lead) {
  const tags = ['EmporionPros'];
  if (lead.role) tags.push(lead.role);
  if (lead.page) {
    if (lead.page.includes('iron-65')) tags.push('Iron 65');
    if (lead.page.includes('iron-pointe')) tags.push('Iron Pointe');
    if (lead.page.includes('vendor')) tags.push('Vendor');
    if (lead.page.includes('grant')) tags.push('Grants');
  }
  return tags;
}

function getPropertyFromPage(page) {
  if (!page) return '';
  if (page.includes('iron-65') || page.includes('iron65')) return '65 Lincoln Park';
  if (page.includes('iron-pointe') || page.includes('ironpointe')) return '39 Madison St';
  return '';
}
