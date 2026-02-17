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

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Twilio credentials not configured' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { leadName, leadPhone, agentName } = body;

    // TEST MODE - Call Ana instead of the lead
    const testPhone = '+18624239396';
    const actualPhone = testPhone; // Use Ana's number for testing

    // Initiate call via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    // TwiML for AI-powered call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hi Ana, this is Aria, your AI assistant from Emporion Pros. This is a test call to demonstrate the AI calling feature. I would normally be calling ${leadName} right now to follow up on their property inquiry. The system is working perfectly! You can now call real leads by clicking the call button on any lead in your Follow Up Boss dashboard. Have a great day!
  </Say>
</Response>`;

    const callParams = new URLSearchParams({
      To: actualPhone,
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
        message: `TEST CALL: Calling Ana at ${actualPhone} to demonstrate the system...`
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
