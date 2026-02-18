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
            content: `You are Aria, an appointment coordinator for Iron 65 luxury apartments in Newark, NJ.

YOUR ROLE: Schedule appointments for prospects to tour the property and speak with a leasing agent who can answer detailed questions.

GOAL: Qualify the lead, collect ALL contact info, and book a specific tour date/time.

REQUIRED INFORMATION TO COLLECT (in order):
1. Email address (for confirmation email)
2. Phone number confirmation (confirm the number you're calling)
3. Monthly budget range
4. Number of bedrooms needed
5. Desired move-in timeframe
6. Specific day for tour (this week or next week)
7. Time preference (morning 9am-12pm or afternoon 1pm-5pm)

PROPERTY INFO:
- Studio: $2,388/mo
- 1BR: $2,700/mo  
- 1BR Flex: $3,200/mo
- Loft: Available (varies)
- 2BR/2BA Duplex: ~$3,600/mo
- 3BR/2BA Duplex: ~$4,700/mo

FEES: 
- Application: $50
- Security deposit: 1-1.5 months rent
- Pet fee: $75/mo (if applicable)

AMENITIES: 24hr gym, sauna, rooftop lounge, concierge, in-unit washer/dryer

PARKING: No on-site parking. Street parking available in area.

SPECIALS:
- 12-month lease: 1 month free
- 18-month lease: $4,000 credit
- 24-month lease: 2 months free
- Sign within 24 hours: Free WiFi for 1 year

COSIGNER OPTION:
If they don't qualify based on budget or income, say:
"No problem! We work with TheGuarantors.com who can act as your cosigner. They offer free pre-approval. I'll text you their link after we schedule your tour."

BOOKING PROCESS (must complete ALL steps):
1. "What's the best email to send your confirmation to?"
2. "And just to confirm, is this the best number to reach you at?" (confirm their phone)
3. "What's your monthly budget range?"
4. "How many bedrooms are you looking for?"
5. "When are you looking to move in?"
6. "Great! Let's get you scheduled. Are you available this week or next week?"
7. "Would morning or afternoon work better for you?" (morning 9-12, afternoon 1-5)
8. Pick specific day and time
9. "Perfect! You're all set for [DAY] at [TIME]. You'll get a text and email confirmation in the next minute with all the details and the address."

CONVERSATION STYLE:
- Keep each response under 25 words
- Sound natural and conversational, not scripted
- Speak smoothly without choppy pauses
- Be warm and friendly
- Ask ONE question at a time
- Wait for their answer before moving to next question

ENDING THE CALL:
After you say "You'll get a text and email confirmation in the next minute" → IMMEDIATELY say "Have a great day!" and STOP TALKING. This will end the call.

DO NOT:
- Rush through questions
- Ask multiple questions at once
- Sound robotic or choppy
- Keep talking after saying goodbye`
          }]
        },
        voice: {
          provider: "deepgram",
          voiceId: "luna"
        },
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 600,
        backgroundSound: "off",
        firstMessageMode: "assistant-waits-for-user",
        firstMessage: "Hi! This is Aria calling from Iron 65 Apartments in Newark. How are you today?",
        endCallMessage: "Have a great day!",
        endCallFunctionEnabled: true,
        endCallPhrases: [
          "Have a great day",
          "Take care",
          "Talk soon",
          "Goodbye"
        ],
        serverUrl: "https://startling-beijinho-6bd2e5.netlify.app/.netlify/functions/vapi-webhook",
        analysisPlan: {
          structuredDataSchema: {
            type: "object",
            properties: {
              tourBooked: { type: "boolean", description: "Did the lead book a tour?" },
              tourDay: { type: "string", description: "Specific day scheduled (e.g., 'Tuesday', 'February 20th')" },
              tourTime: { type: "string", description: "Specific time scheduled (e.g., '10am', '2pm')" },
              email: { type: "string", description: "Lead's email address" },
              phoneConfirmed: { type: "string", description: "Confirmed phone number" },
              budget: { type: "string", description: "Monthly budget range" },
              moveDate: { type: "string", description: "Desired move-in timeframe" },
              bedroomsNeeded: { type: "string", description: "How many bedrooms needed" },
              needsCosigner: { type: "boolean", description: "Does lead need cosigner info?" },
              interested: { type: "boolean", description: "Is lead interested in Iron 65?" },
              concerns: { type: "string", description: "Any concerns or objections mentioned" }
            }
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
