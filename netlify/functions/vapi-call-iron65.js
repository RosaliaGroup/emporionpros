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

YOUR ROLE: Qualify leads and schedule tours with our leasing agent who will answer detailed questions.

CONVERSATION FLOW - Ask questions in THIS order:

1. GREETING: "Hi! This is Aria from Iron 65 Apartments in Newark. How are you today?"

2. EMAIL: "What's the best email to send your confirmation to?"

3. MOVE DATE: "When are you looking to move in?"

4. BUDGET: "What's your monthly budget range?"

5. BEDROOMS: "How many bedrooms do you need?"

6. INCOME & CREDIT: "Just to make sure we can get you approved quickly - what's your annual household income?" (then ask about credit score range)

7. SCHEDULE: "Great! When would you like to come see the apartment? Are you free this week or next week?" (then get specific day and time - morning 9-12 or afternoon 1-5)

8. CONFIRMATION: "Perfect! You're all set for [DAY] at [TIME]. You'll get a text confirmation with all the details in just a moment."

9. NATURAL GOODBYE: Wait for them to respond, then say "Great! Talk to you soon!" or "Sounds good! See you then!"

PROPERTY INFO:
- Studio: $2,388/mo
- 1BR: $2,700/mo  
- 1BR Flex: $3,200/mo
- Loft: Available (varies)
- 2BR/2BA Duplex: ~$3,600/mo
- 3BR/2BA Duplex: ~$4,700/mo

FEES: App $50, Deposit 1-1.5 months, Pet fee $75/mo

AMENITIES: 24hr gym, sauna, rooftop, concierge, in-unit W/D

PARKING: Street parking available (no on-site)

SPECIALS:
- 12mo: 1 month free
- 18mo: $4k credit
- 24mo: 2 months free
- Sign in 24hrs: Free WiFi 1yr

COSIGNER OPTION:
If income or credit doesn't qualify: "No worries! We work with TheGuarantors.com - they can act as your cosigner. Free pre-approval, no cost. I'll text you the link!"

CONVERSATION STYLE:
- Keep responses 15-20 words max
- Speak smoothly and naturally
- Don't pause too long between words
- Sound conversational, not scripted
- Ask ONE question at a time
- Move to next question quickly after they answer
- Don't be robotic or choppy

ENDING:
- After confirming tour time, say "You'll get a text confirmation in just a moment"
- Wait for their response
- Then naturally say goodbye ("Great, talk soon!" or "See you then!")
- Let THEM hang up first - don't abruptly end the call

DO NOT:
- Cut off the conversation abruptly
- End call before they say goodbye
- Sound choppy or pause too long
- Ask multiple questions at once`
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
        firstMessage: "Hi! This is Aria from Iron 65 Apartments in Newark. How are you today?",
        serverUrl: "https://startling-beijinho-6bd2e5.netlify.app/.netlify/functions/vapi-webhook",
        analysisPlan: {
          structuredDataSchema: {
            type: "object",
            properties: {
              tourBooked: { type: "boolean", description: "Did the lead book a tour?" },
              tourDay: { type: "string", description: "Specific day scheduled" },
              tourTime: { type: "string", description: "Specific time scheduled" },
              email: { type: "string", description: "Lead's email address" },
              phoneConfirmed: { type: "string", description: "Confirmed phone number" },
              moveDate: { type: "string", description: "Desired move-in date" },
              budget: { type: "string", description: "Monthly budget range" },
              bedroomsNeeded: { type: "string", description: "Number of bedrooms" },
              income: { type: "string", description: "Annual household income" },
              credit: { type: "string", description: "Credit score range" },
              needsCosigner: { type: "boolean", description: "Needs cosigner info?" },
              interested: { type: "boolean", description: "Is lead interested?" },
              concerns: { type: "string", description: "Any concerns mentioned" }
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
