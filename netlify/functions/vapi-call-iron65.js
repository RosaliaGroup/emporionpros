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

Your goal: Schedule a tour and collect info.

IMPORTANT - Ask questions in EXACTLY this order:
1. When they're looking to move in
2. Monthly budget
3. How many bedrooms they need
4. Annual income and credit score
5. Tour date and time that works for them
6. Email address for confirmation

Property info:
- Studio: $2,388
- 1BR: $2,700
- 1BR Flex: $3,200
- Loft: varies
- 2BR/2BA Duplex: ~$3,600
- 3BR/2BA Duplex: ~$4,700

Amenities: Gym, sauna, rooftop, concierge, in-unit washer/dryer
Parking: Street only
Specials: 12mo=1mo free, 18mo=$4k credit, 24mo=2mo free

If budget/income doesn't work: Mention TheGuarantors.com - free cosigner approval.

Speaking style:
- Keep responses under 12 words
- Sound like a real human - warm and friendly
- No awkward pauses
- Speak at normal conversation speed
- One question at a time
- Don't repeat yourself

After booking: "Perfect! You'll get a text with details. Talk soon!"`
          }]
        },
        voice: {
          provider: "deepgram",
          voiceId: "luna"
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
              tourBooked: { 
                type: "boolean",
                description: "Was a tour appointment scheduled?"
              },
              tourDay: { 
                type: "string",
                description: "Day/date of scheduled tour"
              },
              tourTime: { 
                type: "string",
                description: "Time of scheduled tour"
              },
              email: { 
                type: "string",
                description: "Email address provided"
              },
              phoneConfirmed: { 
                type: "string",
                description: "Phone number confirmed"
              },
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
                description: "Number of bedrooms"
              },
              income: { 
                type: "string",
                description: "Annual household income"
              },
              credit: { 
                type: "string",
                description: "Credit score"
              },
              needsCosigner: { 
                type: "boolean",
                description: "Do they need cosigner info?"
              },
              interested: { 
                type: "boolean",
                description: "Are they interested?"
              },
              concerns: { 
                type: "string",
                description: "Any concerns mentioned"
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
```

---

## ✅ Updated Question Order (Lines 53-58):
```
1. When they're looking to move in
2. Monthly budget
3. How many bedrooms they need
4. Annual income and credit score
5. Tour date and time that works for them
6. Email address for confirmation
