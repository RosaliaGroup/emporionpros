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

  try {
    const body = JSON.parse(event.body || '{}');
    const { leadName, leadPhone, agentName } = body;

    if (!leadPhone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Lead phone number required' })
      };
    }

    // Initiate call via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    // TwiML for AI-powered call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hi, is this ${leadName}? This is Aria calling on behalf of ${agentName} from Emporion Pros. I saw you were recently looking at homes in the Newark area. I wanted to reach out personally to see if you had any questions or if you'd like to schedule a time to tour some properties. Do you have 2 minutes to chat?
  </Say>
  <Gather input="speech" timeout="5" action="https://${event.headers.host}/.netlify/functions/call-response">
    <Say voice="Polly.Joanna">Please say yes or no after the beep.</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't hear a response. I'll send you a text with my contact info. Have a great day!</Say>
</Response>`;

    const callParams = new URLSearchParams({
      To: leadPhone,
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
        message: `Calling ${leadName} at ${leadPhone}...`
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
