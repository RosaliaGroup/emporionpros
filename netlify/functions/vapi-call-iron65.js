exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const VAPI_API_KEY = process.env.VAPI_API_KEY;
  const VAPI_PHONE_NUMBER = process.env.VAPI_PHONE_NUMBER;

  if (!VAPI_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Vapi API key not configured' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { leadName, leadPhone, leadEmail, leadSource, leadId } = body;

    let formattedPhone = leadPhone;
    if (leadPhone) {
      const cleaned = leadPhone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        formattedPhone = '+1' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        formattedPhone = '+' + cleaned;
      }
    }

    // Simplified Vapi call with default voice
    const callPayload = {
      phoneNumberId: VAPI_PHONE_NUMBER,
      customer: {
        number: formattedPhone
      },
      assistantId: null,
      assistant: {
        name: "Aria",
        model: {
          provider: "anthropic",
          model: "claude-sonnet-4-20250514",
          messages: [
            {
              role: "system",
              content: `You are Aria, a leasing agent for Iron 65 luxury apartments in Newark, NJ.

GOAL: Qualify the lead and book a tour.

COLLECT:
1. Monthly budget
2. Move-in date
3. Annual income
4. Credit score

PROPERTY INFO:
- Studio: $2,388/mo
- 1BR: $2,700/mo
- 1BR Flex: $3,200/mo

FEES: $50 app fee, $1k-1.5mo deposit, $75/mo pet fee

AMENITIES: Gym, sauna, rooftop, concierge, in-unit W/D

SPECIALS:
12mo: 1 free month
18mo: $4k credit
24mo: 2 free months
Sign in 24hrs = free WiFi 1yr

TOUR: https://calendly.com/ana-rosaliagroup/65-iron-tour

Keep responses under 30 words. Be natural and conversational.`
            }
          ]
        },
        voice: "jennifer-playht",
        firstMessage: `Hi ${leadName}, this is Aria from Iron 65 in Newark. You reached out about our luxury apartments - do you have 2 minutes to chat?`,
        endCallMessage: "Perfect! You'll get a confirmation text. Looking forward to showing you Iron 65!",
        serverUrl: "https://startling-beijinho-6bd2e5.netlify.app/.netlify/functions/vapi-webhook"
      }
    };

    const vapiResponse = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(callPayload)
    });

    if (!vapiResponse.ok) {
      const errText = await vapiResponse.text();
      return {
        statusCode: vapiResponse.status,
        headers,
        body: JSON.stringify({ error: 'Vapi error: ' + errText })
      };
    }

    const vapiData = await vapiResponse.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        callId: vapiData.id,
        status: vapiData.status,
        message: `Aria is calling ${leadName}...`
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
