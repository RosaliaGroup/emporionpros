const IRON65_DATA = require('./iron65-knowledge');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_PHONE = process.env.TWILIO_PHONE;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Twilio credentials not configured' })
    };
  }

  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Claude API key not configured' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { leadName, leadPhone, leadEmail, leadSource } = body;

    // Format phone number to E.164
    let formattedPhone = leadPhone;
    if (leadPhone) {
      const cleaned = leadPhone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        formattedPhone = '+1' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        formattedPhone = '+' + cleaned;
      }
    }

    // Generate AI greeting
    const greeting = `Hi ${leadName}, this is Aria from Iron 65 in Newark. I saw you were interested in our luxury apartments. Do you have 2 minutes to chat about what you're looking for?`;

    // Make the call via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    // TwiML with AI greeting
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${greeting}</Say>
  <Gather input="speech" timeout="5" action="https://${event.headers.host}/.netlify/functions/call-response-iron65?leadId=${body.leadId}">
    <Say voice="Polly.Joanna">I'm listening...</Say>
  </Gather>
  <Say voice="Polly.Joanna">Thanks for your interest! I'll send you a text with more details. Have a great day!</Say>
</Response>`;

    const callParams = new URLSearchParams({
      To: formattedPhone,
      From: TWILIO_PHONE,
      Twiml: twiml,
      Record: 'true',
      RecordingStatusCallback: `https://${event.headers.host}/.netlify/functions/call-recording`
    });

    const callResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: callParams.toString()
    });

    if (!callResponse.ok) {
      const errText = await callResponse.text();
      return {
        statusCode: callResponse.status,
        headers,
        body: JSON.stringify({ error: 'Twilio error: ' + errText })
      };
    }

    const callData = await callResponse.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        callSid: callData.sid,
        status: callData.status,
        message: `Aria is calling ${leadName} at ${formattedPhone}...`
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message, stack: err.stack })
    };
  }
};
