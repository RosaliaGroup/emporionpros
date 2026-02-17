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

    // Generate AI conversation script using Claude
    const systemPrompt = `You are Aria, an AI leasing agent for Iron 65 luxury apartments in Newark, NJ. 

Your goal: Qualify the lead and book a tour.

Property Info:
${JSON.stringify(IRON65_DATA, null, 2)}

Conversation Style:
- Friendly, professional, concise
- Ask ONE question at a time
- Listen carefully to answers
- Match their energy (formal/casual)
- Use their name naturally

Required Info to Collect:
1. Monthly budget
2. Move-in date  
3. Annual household income
4. Credit score range (Excellent/Good/Fair/Building)

After collecting info:
- Recommend best unit based on budget
- Book tour via Calendly
- Mention 24-hour urgency bonus if applicable

Keep responses under 40 words. Be natural, not robotic.`;

    const userPrompt = `You're calling ${leadName} who inquired about Iron 65 via ${leadSource}. Generate the opening greeting for this call.`;

    // Call Claude API for AI script
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ],
        system: systemPrompt
      })
    });

    const claudeData = await claudeResponse.json();
    const aiGreeting = claudeData.content[0].text;

    // Make the call via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    // TwiML with AI greeting
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${aiGreeting}</Say>
  <Gather input="speech" timeout="5" action="https://${event.headers.host}/.netlify/functions/call-response-iron65?leadId=${body.leadId}">
    <Say voice="Polly.Joanna">I'm listening...</Say>
  </Gather>
  <Say voice="Polly.Joanna">I'll send you a text with more info. Have a great day!</Say>
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
        message: `Aria is calling ${leadName} at ${formattedPhone}...`,
        aiGreeting: aiGreeting
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
