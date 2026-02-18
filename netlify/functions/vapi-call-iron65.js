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
    const { leadName, leadPhone } = body;
    
    if (!leadPhone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing leadPhone' })
      };
    }
    
    let formattedPhone = leadPhone;
    const cleaned = leadPhone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      formattedPhone = '+1' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      formattedPhone = '+' + cleaned;
    }
    
    const callPayload = {
      phoneNumberId: VAPI_PHONE_NUMBER,
      customer: {
        number: formattedPhone,
        name: leadName
      },
      assistant: {
        name: "Aria",
        model: {
          provider: "anthropic",
          model: "claude-sonnet-4-20250514",
          messages: [{
            role: "system",
            content: `You are Aria, a friendly appointment coordinator for Iron 65 Apartments in Newark.

Be conversational and natural. Speak smoothly like a real person - no robotic pauses or choppy delivery.

Your goal: Schedule a tour and collect contact info.

Collect information in THIS order:
1. When they're looking to move in
2. Monthly budget
3. How many bedrooms they need
4. Annual income and credit score
5. Tour date and time that works for them
6. Email address for confirmation

Property details:
- Studio: $2,388/month
- 1BR: $2,700/month
- 1BR Flex: $3,200/month
- Loft: Available (price varies)
- 2BR/2BA Duplex: ~$3,600/month
- 3BR/2BA Duplex: ~$4,700/month

Amenities: 24hr gym, sauna, rooftop lounge, concierge, in-unit washer/dryer
Parking: Street parking available (no on-site)

Current specials:
- 12-month lease: 1 month free
- 18-month lease: $4,000 credit
- 24-month lease: 2 months free
- Sign within 24 hours: Free WiFi for 1 year

If budget or income doesn't qualify:
Mention TheGuarantors.com - they act as a cosigner with free pre-approval at no cost. You'll text them the link.

Speaking style:
- Keep each response under 12 words
- Sound warm and human, not robotic
- No awkward pauses between words
- Speak at normal conversation speed
- Ask ONE question at a time
- Wait for their answer before moving on
- Don't repeat yourself

After booking the tour:
Say "Perfect! You'll get a text with all the details. Talk soon!" then let them say goodbye.`
          }]
        },
        voice: {
          provider: "deepgram",
          voiceId: "aura-asteria-en"
        },
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 600,
        backgroundSound: "off",
        firstMessageMode: "assistant-speaks-first",
        firstMessage: "Hi! This is Aria from Iron 65 in Newark. How are you?",
        serverUrl: "https://emporionpros.com/.netlify/functions/vapi-webhook",
        analysisPlan: {
          structuredDataSchema: {
            type: "object",
            properties: {
              moveDate: { 
                type: "string",
                description: "When they want to move in"
              },
              budget: { 
                type: "string",
                description: "Monthly rent budget"
              },
              bedroomsNeeded: { 
                type: "string",
                description: "Number of bedrooms needed"
              },
              income: { 
                type: "string",
                description: "Annual household income"
              },
              credit: { 
                type: "string",
                description: "Credit score range"
              },
              tourDay: { 
                type: "string",
                description: "Scheduled tour day/date"
              },
              tourTime: { 
                type: "string",
                description: "Scheduled tour time"
              },
              email: { 
                type: "string",
                description: "Email address for confirmation"
              },
              tourBooked: { 
                type: "boolean",
                description: "Was a tour appointment scheduled?"
              },
              phoneConfirmed: { 
                type: "string",
                description: "Phone number confirmed"
              },
              needsCosigner: { 
                type: "boolean",
                description: "Do they need cosigner information?"
              },
              interested: { 
                type: "boolean",
                description: "Are they interested in Iron 65?"
              },
              concerns: { 
                type: "string",
                description: "Any concerns or objections mentioned"
              }
            },
            required: ["tourBooked", "email", "interested"]
          }
        }
      }
    };
    
    const vapiResponse = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + VAPI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(callPayload)
    });
    
    const responseText = await vapiResponse.text();
    
    if (!vapiResponse.ok) {
      return {
        statusCode: vapiResponse.status,
        headers,
        body: JSON.stringify({ error: 'Vapi error: ' + responseText })
      };
    }
    
    const vapiData = JSON.parse(responseText);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        callId: vapiData.id,
        message: 'Call initiated'
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
