exports.handler = async function(event) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  const step = (event.queryStringParameters || {}).step || 'ping';

  try {
    // Step 1: Just ping
    if (step === 'ping') {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, step: 'ping', env: { hasFUB: !!process.env.FUB_API_KEY, hasSupaURL: !!process.env.SUPABASE_URL, hasSupaKey: !!process.env.SUPABASE_SERVICE_KEY } }) };
    }

    // Step 2: Test FUB only
    if (step === 'fub') {
      const res = await fetch('https://api.followupboss.com/v1/people?limit=2', {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(process.env.FUB_API_KEY + ':').toString('base64'),
          'X-System': 'EmporionPros', 'X-System-Key': 'emporionpros2026'
        }
      });
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: res.ok, step: 'fub', status: res.status, count: (data.people || []).length }) };
    }

    // Step 3: Test Supabase only
    if (step === 'supa') {
      const res = await fetch(process.env.SUPABASE_URL + '/rest/v1/leads?limit=2', {
        headers: { 'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY, 'apikey': process.env.SUPABASE_SERVICE_KEY }
      });
      const data = await res.json();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: res.ok, step: 'supa', status: res.status, count: data.length }) };
    }

    // Step 4: Full sync (2 leads only)
    if (step === 'sync') {
      const fubRes = await fetch('https://api.followupboss.com/v1/people?limit=2', {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(process.env.FUB_API_KEY + ':').toString('base64'),
          'X-System': 'EmporionPros', 'X-System-Key': 'emporionpros2026'
        }
      });
      const fubData = await fubRes.json();
      const people = fubData.people || [];
      const leads = people.filter(p => p.emails && p.emails[0]).map(p => ({
        name: [p.firstName, p.lastName].filter(Boolean).join(' '),
        email: p.emails[0].value.toLowerCase().trim(),
        phone: (p.phones && p.phones[0]) ? p.phones[0].value : null,
        source: 'fub', status: 'new', updated_at: new Date().toISOString()
      }));

      const supaRes = await fetch(process.env.SUPABASE_URL + '/rest/v1/leads', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(leads)
      });
      const supaText = await supaRes.text();
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, step: 'sync', fubCount: people.length, leadsToSync: leads.length, supaStatus: supaRes.status, supaResponse: supaText }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ error: 'Use ?step=ping|fub|supa|sync' }) };
  } catch(err) {
    return { statusCode: 200, headers, body: JSON.stringify({ error: err.message, stack: err.stack }) };
  }
};
