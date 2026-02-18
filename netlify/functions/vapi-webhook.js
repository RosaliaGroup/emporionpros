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
    
    // Log what we received
    console.log('Vapi webhook received:', webhook.type);
    
    // RESPOND IMMEDIATELY
    const response = {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };
    
    // Process async AFTER responding
    if (webhook.type === 'end-of-call-report') {
      processCallReport(webhook, FUB_API_KEY).catch(console.error);
    }
    
    return response;
    
  } catch (err) {
    console.error('Webhook error:', err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };
  }
};

async function processCallReport(webhook, FUB_API_KEY) {
  const analysis = webhook.analysis || {};
  const structuredData = analysis.structuredData || {};
  const summary = analysis.summary || '';
  const customer = webhook.customer || {};
  
  console.log('Call completed:', {
    customer: customer.name,
    phone: customer.number,
    email: structuredData.email,
    tourBooked: structuredData.tourBooked
  });
  
  // Send SMS if tour was booked
  if (structuredData.tourBooked && customer.number) {
    try {
      console.log('Sending SMS to:', customer.number);
      
      const smsResponse = await fetch('https://emporionpros.com/.netlify/functions/send-tour-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: customer.number,
          email: structuredData.email || '',
          name: customer.name || 'there',
          tourDay: structuredData.tourDay || 'your scheduled date',
          tourTime: structuredData.tourTime || 'your scheduled time',
          needsCosigner: structuredData.needsCosigner || false
        })
      });
      
      if (smsResponse.ok) {
        console.log('SMS sent successfully');
      } else {
        console.error('SMS failed:', await smsResponse.text());
      }
    } catch (smsError) {
      console.error('SMS error:', smsError);
    }
  }
  
  // Push to FUB
  if (FUB_API_KEY && structuredData.email) {
    try {
      console.log('Pushing to FUB...');
      
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
Email: ${structuredData.email}
Budget: ${structuredData.budget}
Move Date: March 1st
Bedrooms: ${structuredData.bedroomsNeeded}
Income: ${structuredData.income}
Credit: ${structuredData.credit}
Tour Booked: Yes - ${structuredData.tourDay} ${structuredData.tourTime}

Summary: ${summary}`,
          person: {
            emails: [{ value: structuredData.email }],
            phones: customer.number ? [{ value: customer.number }] : [],
            name: customer.name || 'Unknown'
          }
        })
      });
      
      if (fubResponse.ok) {
        console.log('FUB push successful');
      } else {
        console.error('FUB error:', await fubResponse.text());
      }
    } catch (fubErr) {
      console.error('FUB push error:', fubErr);
    }
  }
}
