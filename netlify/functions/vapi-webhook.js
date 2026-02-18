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
    // Log the raw body to see what we're receiving
    console.log('Raw webhook body:', event.body);
    
    const webhook = JSON.parse(event.body || '{}');
    
    // Log the parsed webhook
    console.log('Parsed webhook:', JSON.stringify(webhook, null, 2));
    console.log('Webhook type:', webhook.type);
    console.log('Webhook message type:', webhook.message?.type);
    
    // RESPOND IMMEDIATELY
    const response = {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };
    
    // Check different possible event types from Vapi
    const eventType = webhook.type || webhook.message?.type || webhook.event;
    
    console.log('Event type detected:', eventType);
    
    // Process async AFTER responding
    if (eventType === 'end-of-call-report' || webhook.call || webhook.analysis) {
      console.log('Processing call report...');
      processCallReport(webhook, FUB_API_KEY).catch(err => {
        console.error('Process error:', err);
      });
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
  console.log('=== Starting processCallReport ===');
  
  // Handle different webhook structures
  const analysis = webhook.analysis || webhook.call?.analysis || {};
  const structuredData = analysis.structuredData || analysis.structured_data || {};
  const summary = analysis.summary || '';
  const customer = webhook.customer || webhook.call?.customer || {};
  
  console.log('Customer:', customer);
  console.log('Structured Data:', structuredData);
  console.log('Tour Booked:', structuredData.tourBooked);
  
  // Send SMS if tour was booked
  if (structuredData.tourBooked && customer.number) {
    console.log('=== Attempting to send SMS ===');
    console.log('To:', customer.number);
    
    try {
      const smsPayload = {
        phone: customer.number,
        email: structuredData.email || '',
        name: customer.name || 'there',
        tourDay: structuredData.tourDay || 'your scheduled date',
        tourTime: structuredData.tourTime || 'your scheduled time',
        needsCosigner: structuredData.needsCosigner || false
      };
      
      console.log('SMS Payload:', smsPayload);
      
      const smsResponse = await fetch('https://emporionpros.com/.netlify/functions/send-tour-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsPayload)
      });
      
      const smsResult = await smsResponse.text();
      console.log('SMS Response Status:', smsResponse.status);
      console.log('SMS Response:', smsResult);
      
      if (smsResponse.ok) {
        console.log('✅ SMS sent successfully');
      } else {
        console.error('❌ SMS failed:', smsResult);
      }
    } catch (smsError) {
      console.error('❌ SMS error:', smsError);
    }
  } else {
    console.log('Skipping SMS - tourBooked:', structuredData.tourBooked, 'customer.number:', customer.number);
  }
  
  // Push to FUB
  if (FUB_API_KEY && structuredData.email) {
    console.log('=== Attempting FUB push ===');
    
    try {
      const fubPayload = {
        source: 'Iron 65 AI Call',
        type: 'Note',
        message: `AI Call Completed:
Email: ${structuredData.email || 'Not provided'}
Budget: ${structuredData.budget || 'Not provided'}
Move Date: ${structuredData.moveDate || 'Not provided'}
Bedrooms: ${structuredData.bedroomsNeeded || 'Not provided'}
Income: ${structuredData.income || 'Not provided'}
Credit: ${structuredData.credit || 'Not provided'}
Tour Booked: ${structuredData.tourBooked ? 'Yes - ' + structuredData.tourDay + ' ' + structuredData.tourTime : 'No'}
Needs Cosigner: ${structuredData.needsCosigner ? 'Yes' : 'No'}

Summary: ${summary}`,
        person: {
          emails: [{ value: structuredData.email }],
          phones: customer.number ? [{ value: customer.number }] : [],
          name: customer.name || 'Unknown'
        }
      };
      
      console.log('FUB Payload:', JSON.stringify(fubPayload, null, 2));
      
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
      
      const fubResult = await fubResponse.text();
      console.log('FUB Response Status:', fubResponse.status);
      console.log('FUB Response:', fubResult);
      
      if (fubResponse.ok) {
        console.log('✅ FUB push successful');
      } else {
        console.error('❌ FUB error:', fubResult);
      }
    } catch (fubErr) {
      console.error('❌ FUB push error:', fubErr);
    }
  } else {
    console.log('Skipping FUB - API Key:', !!FUB_API_KEY, 'Email:', structuredData.email);
  }
  
  console.log('=== Finished processCallReport ===');
}
