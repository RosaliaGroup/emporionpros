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

  if (!FUB_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'FUB API key not configured' })
    };
  }

  try {
    let allPeople = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    // Paginate through ALL leads in Follow Up Boss
    while (hasMore && offset < 3000) {
      const response = await fetch(`https://api.followupboss.com/v1/people?limit=${limit}&offset=${offset}&sort=updated&direction=desc`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
          'Content-Type': 'application/json',
          'X-System': 'EmporionPros',
          'X-System-Key': 'emporionpros2026'
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ error: 'FUB API error: ' + errText })
        };
      }

      const data = await response.json();
      const people = data.people || [];
      
      if (people.length === 0) {
        hasMore = false;
      } else {
        allPeople = allPeople.concat(people);
        offset += limit;
      }
    }

    const leads = allPeople.map(p => ({
      id: p.id,
      name: [p.firstName, p.lastName].filter(Boolean).join(' ') || 'No name',
      email: (p.emails && p.emails[0]) ? p.emails[0].value : '',
      phone: (p.phones && p.phones[0]) ? p.phones[0].value : '',
      source: p.source || 'Follow Up Boss',
      stage: p.stage || 'New',
      interest: p.price ? `Up to $${Number(p.price).toLocaleString()}` : (p.type || 'Buyer'),
      score: p.temperature === 'Hot' ? 'hot' : p.temperature === 'Warm' ? 'warm' : 'cold',
      aiStatus: 'Pending Call',
      created: p.created,
      updated: p.updated,
      assignedTo: p.assignedTo ? p.assignedTo.name : '',
      tags: p.tags || [],
      lastActivity: p.lastActivityDate || p.updated
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        total: leads.length,
        leads: leads,
        syncedAt: new Date().toISOString()
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
