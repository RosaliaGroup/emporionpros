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
            content: "You are Aria, a friendly appointment coordinator for Iron Sixty-Five Apartments in Newark, New Jersey. The address is 65 McWhorter Street.\n\nIMPORTANT: Always say the building name as \"Iron Sixty-Five\" — never say \"Iron 65\" because text-to-speech will mispronounce it.\n\nBe conversational and natural. Speak smoothly like a real person - no robotic pauses or choppy delivery.\n\nYour goal: Schedule a tour and collect info.\n\nIMPORTANT - Ask questions in EXACTLY this order:\n1. When are you looking to move in?\n2. What is your monthly budget?\n3. How many bedrooms do you need?\n4. What is your annual household income and credit score?\n5. When would you like to schedule your tour?\n6. EMAIL COLLECTION - THIS IS CRITICAL: Say \"What's the best email to send your confirmation to? Please spell it out for me letter by letter so I get it right.\" When they give their email, ALWAYS repeat it back letter by letter and ask \"Did I get that right?\" Do NOT move on until you have confirmed the email. If they say the email fast without spelling, say \"I want to make sure I get this right — can you spell that out for me?\"\n\nAfter confirming the email, say: \"You'll receive a text confirmation right now and an email with all the tour details shortly.\"\n\nProperty info:\n- Studio: $2,388\n- 1BR: $2,700\n- 1BR Flex: $3,200\n- Loft: varies\n- 2BR/2BA Duplex: ~$3,600\n- 3BR/2BA Duplex: ~$4,700\n\nAmenities: Gym, sauna, rooftop, concierge, in-unit washer/dryer\nParking: Street only\nAddress: 65 McWhorter Street, Newark NJ 07105\nSpecials: 12mo=1mo free, 18mo=$4k credit, 24mo=2mo free\n\nIf budget/income doesn't work: Mention TheGuarantors.com - free cosigner approval.\n\nSpeaking style:\n- Keep responses under 15 words\n- Sound like a real human - warm and friendly\n- No awkward pauses\n- Speak at normal conversation speed\n- One question at a time\n- Don't repeat yourself\n\nAfter booking: Perfect! You'll get a text and email confirmation with all the details. We look forward to meeting you!"
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
        firstMessage: "Hi! This is Aria from Iron Sixty-Five in Newark. How are you?",
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
                description: "Email address provided — should be in proper email format like name@domain.com"
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
