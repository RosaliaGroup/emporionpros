exports.handler = async function(event, context) {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_PHONE = process.env.TWILIO_PHONE;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const { phone, message } = data;

    if (!phone) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Phone number is required' }) };
    }
    if (!message) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message is required' }) };
    }

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Twilio credentials not configured' }) };
    }

    // Format phone number
    let formattedPhone = phone;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      formattedPhone = '+1' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      formattedPhone = '+' + cleaned;
    }

    console.log('=== SENDING SMS ===');
    console.log('To:', formattedPhone);
    console.log('Message length:', message.length);

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: formattedPhone,
        From: TWILIO_PHONE,
        Body: message
      })
    });

    const responseData = await response.text();

    if (!response.ok) {
      console.error('Twilio error:', responseData);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Twilio error: ' + responseData })
      };
    }

    let parsed = {};
    try { parsed = JSON.parse(responseData); } catch(e) {}

    console.log('✅ SMS SENT to:', formattedPhone, '| SID:', parsed.sid || 'unknown');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'SMS sent',
        to: formattedPhone,
        sid: parsed.sid || null
      })
    };

  } catch (err) {
    console.error('❌ SMS ERROR:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
