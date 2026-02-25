// ============================================
// EMPORIONPROS — Daily Hot Leads AI Caller
// Finds leads from last 7 days with status 'new'
// and triggers VAPI AI calls for each
// Run via: Netlify scheduled function or manual trigger
// ============================================
exports.handler = async function(event) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const VAPI_API_KEY = process.env.VAPI_API_KEY;
  const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
  const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing Supabase env vars' }) };
  }

  try {
    // Check business hours (M-F 9am-6pm, Sat-Sun 10am-5pm EST)
    const now = new Date();
    const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const day = est.getDay(); // 0=Sun, 6=Sat
    const hour = est.getHours();

    let inBusinessHours = false;
    if (day >= 1 && day <= 5) {
      inBusinessHours = hour >= 9 && hour < 18;
    } else {
      inBusinessHours = hour >= 10 && hour < 17;
    }

    if (!inBusinessHours) {
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ skipped: true, reason: 'Outside business hours', currentHourEST: hour, day })
      };
    }

    // Fetch hot leads: new leads from last 7 days with phone, not yet called
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const supaRes = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?status=eq.new&phone=not.is.null&created_at=gte.${sevenDaysAgo.toISOString()}&order=created_at.desc&limit=20`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!supaRes.ok) {
      const errText = await supaRes.text();
      return { statusCode: 200, headers, body: JSON.stringify({ error: 'Supabase query failed', detail: errText }) };
    }

    const leads = await supaRes.json();

    // Filter out placeholder emails and leads without real phones
    const callableLeads = leads.filter(l =>
      l.phone &&
      l.phone.length >= 10 &&
      !l.phone.includes('placeholder') &&
      !l.email?.includes('placeholder.local')
    );

    if (callableLeads.length === 0) {
      return {
        statusCode: 200, headers,
        body: JSON.stringify({ success: true, message: 'No hot leads to call', totalChecked: leads.length })
      };
    }

    // If VAPI is configured, trigger calls
    const results = [];
    if (VAPI_API_KEY && VAPI_ASSISTANT_ID && VAPI_PHONE_NUMBER_ID) {
      for (const lead of callableLeads) {
        try {
          // Clean phone number
          let phone = lead.phone.replace(/[^0-9]/g, '');
          if (phone.length === 10) phone = '+1' + phone;
          else if (phone.length === 11 && phone.startsWith('1')) phone = '+' + phone;
          else if (!phone.startsWith('+')) phone = '+' + phone;

          const vapiRes = await fetch('https://api.vapi.ai/call/phone', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${VAPI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              assistantId: VAPI_ASSISTANT_ID,
              phoneNumberId: VAPI_PHONE_NUMBER_ID,
              customer: {
                number: phone,
                name: lead.name || 'there'
              }
            })
          });

          const vapiData = await vapiRes.json();

          // Update lead status in Supabase
          await fetch(
            `${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'apikey': SUPABASE_SERVICE_KEY,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ status: 'ai_called', updated_at: new Date().toISOString() })
            }
          );

          results.push({ name: lead.name, phone: lead.phone, status: 'called', vapiId: vapiData.id });

          // Small delay between calls to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (callErr) {
          results.push({ name: lead.name, phone: lead.phone, status: 'error', error: callErr.message });
        }
      }
    } else {
      // VAPI not configured — just report the leads that would be called
      for (const lead of callableLeads) {
        results.push({ name: lead.name, phone: lead.phone, status: 'pending_vapi_config' });
      }
    }

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        success: true,
        businessHours: inBusinessHours,
        totalHotLeads: callableLeads.length,
        results,
        timestamp: new Date().toISOString()
      })
    };

  } catch (err) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: err.message }) };
  }
};
