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
    
    // RESPOND IMMEDIATELY - Don't await anything!
    const response = {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };
    
    // Process async AFTER responding (don't await)
    if (webhook.type === 'end-of-call-report') {
      processCallReport(webhook, FUB_API_KEY).catch(console.error);
    }
    
    return response;
    
  } catch (err) {
    console.error('Webhook error:', err);
    return {
      statusCode: 200, // Still return 200 even on error!
      headers,
      body: JSON.stringify({ received: true })
    };
  }
};

// This runs AFTER the response is sent
async function processCallReport(webhook, FUB_API_KEY) {
  const analysis = webhook.analysis || {};
  const structuredData = analysis.structuredData || {};
  const summary = analysis.summary || '';
  const customer = webhook.customer || {};
  
  console.log('Call completed:', {
    customer: customer.name,
    phone: customer.number,
    email: structuredData.email,
    tourBooked: structuredData.tourBooked,
    needsCosigner: structuredData.needsCosigner
  });
  
  // Send SMS confirmation if tour was booked
  if (structuredData.tourBooked && customer.number) {
    try {
      await fetch('https://startling-beijinho-6bd2e5.netlify.app/.netlify/functions/send-tour-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: customer.number,
          email: structuredData.email || customer.email || '',
          name: customer.name || 'there',
          tourDate: structuredData.tourDate || 'your scheduled date',
          tourTime: structuredData.tourTime || 'your scheduled time',
          needsCosigner: structuredData.needsCosigner || false
        })
      });
      console.log('Tour SMS sent to:', customer.number);
    } catch (smsError) {
      console.error('SMS send failed:', smsError);
    }
  }
  
  // Push data to FUB if we have the API key
  if (FUB_API_KEY && (structuredData.budget || structuredData.email)) {
    try {
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
Email: ${structuredData.email || 'Not provided'}
Budget: ${structuredData.budget || 'Not provided'}
Move Date: ${structuredData.moveDate || 'Not provided'}
Bedrooms Needed: ${structuredData.bedroomsNeeded || 'Not provided'}
Income: ${structuredData.income || 'Not provided'}
Tour Booked: ${structuredData.tourBooked ? 'Yes - ' + structuredData.tourDate + ' ' + structuredData.tourTime : 'No'}
Needs Cosigner: ${structuredData.needsCosigner ? 'Yes - Link sent' : 'No'}
${structuredData.concerns ? 'Concerns: ' + structuredData.concerns : ''}

Summary: ${summary}`,
          person: {
            emails: structuredData.email ? [{ value: structuredData.email }] : [],
            phones: customer.number ? [{ value: customer.number }] : [],
            name: customer.name || 'Unknown'
          }
        })
      });
      
      if (fubResponse.ok) {
        console.log('Successfully pushed to FUB');
      } else {
        console.error('FUB returned error:', await fubResponse.text());
      }
    } catch (fubErr) {
      console.error('FUB push error:', fubErr);
    }
  }
}
