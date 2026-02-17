exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const FUB_API_KEY = process.env.FUB_API_KEY;

  try {
    const webhook = JSON.parse(event.body || '{}');
    
    // Vapi sends call ended webhook with analysis
    if (webhook.type === 'end-of-call-report') {
      const analysis = webhook.analysis || {};
      const structuredData = analysis.structuredData || {};
      const summary = analysis.summary || '';
      const customer = webhook.customer || {};
      
      console.log('Call completed:', {
        customer: customer.name,
        phone: customer.number,
        structuredData,
        summary
      });

      // Push data to FUB if we have the lead info
      if (FUB_API_KEY && structuredData.budget) {
        try {
          // Find or update person in FUB
          const fubResponse = await fetch('https://api.followupboss.com/v1/events', {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
              'Content-Type': 'application/json',
              'X-System': 'EmporionPros',
              'X-System-Key': 'emporionpros2026'
            },
            body: JSON.stringify({
              source: 'Iron 65 AI Call',
              type: 'Note',
              message: `AI Call Completed:
Budget: ${structuredData.budget || 'Not provided'}
Move Date: ${structuredData.moveDate || 'Not provided'}
Income: ${structuredData.income || 'Not provided'}
Credit: ${structuredData.credit || 'Not provided'}
Tour Booked: ${structuredData.tourBooked ? 'Yes' : 'No'}
${structuredData.concerns ? 'Concerns: ' + structuredData.concerns : ''}

Summary: ${summary}`,
              person: {
                emails: [{ value: customer.email }],
                phones: [{ value: customer.number }],
                name: customer.name
              }
            })
          });

          if (fubResponse.ok) {
            console.log('Successfully pushed to FUB');
          }
        } catch (fubErr) {
          console.error('FUB push error:', fubErr);
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ received: true })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };

  } catch (err) {
    console.error('Webhook error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
