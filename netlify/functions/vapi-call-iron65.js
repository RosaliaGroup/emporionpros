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

GOAL: Qualify the lead, collect contact info, and book a tour appointment.

INFORMATION TO COLLECT:
1. Email address (required for confirmation)
2. Monthly budget range
3. Desired move-in date
4. Number of bedrooms needed
5. Annual household income (optional - if they volunteer it)
6. Best day/time for tour

PROPERTY INFO:
- Studio: $2,388/mo
- 1BR: $2,700/mo  
- 1BR Flex: $3,200/mo
- Loft: Available (price varies)
- 2BR/2BA Duplex: ~$3,600/mo
- 3BR/2BA Duplex: ~$4,700/mo

FEES: 
- Application: $50
- Security deposit: 1-1.5 months rent
- Pet fee: $75/mo (if applicable)

AMENITIES: 24hr gym, sauna, rooftop lounge, concierge, in-unit washer/dryer

PARKING: No on-site parking. Street parking available in the area.

CURRENT SPECIALS:
- 12-month lease: 1 month free
- 18-month lease: $4,000 credit
- 24-month lease: 2 months free
- Sign within 24 hours: Free WiFi for 1 year

COSIGNER OPTION (Important!):
If lead doesn't qualify based on budget or income, mention:
"We work with TheGuarantors.com who can act as your cosigner. They offer a free pre-approval - no cost to check if you qualify. Would you like me to text you their link?"

When lead is interested and wants to schedule:
1. Ask: "What's the best email to send your confirmation to?"
2. Ask: "What day works best for you this week?"
3. Ask: "Morning or afternoon?"
4. Confirm their phone number
5. Say: "Perfect! I'm scheduling your tour for [DAY] at [TIME]. Our leasing agent will be able to answer all your detailed questions about the units. You'll receive a text and email confirmation in the next minute with the appointment details."

IMPORTANT:
- Keep responses under 30 words
- Position yourself as scheduling coordinator, NOT the leasing expert
- Say things like: "The leasing agent can give you all the specifics during your tour"
- Be warm and conversational
- Don't sound scripted
- Always get their email before booking
- If they need cosigner info, mention you'll text them the TheGuarantors link

END CALL PHRASES (triggers end):
- "I'll send you that confirmation right now"
- "You'll get the confirmation text and email in a moment"
- "Watch for my text and email with the details"
- "I'll text you those links right now"`
          }]
        },
        voice: {
          provider: "deepgram",
          voiceId: "asteria"
        },
        firstMessage: "Hello? ... Hi there! This is Aria calling from Iron 65 Apartments in Newark. How are you doing today?",
        firstMessageMode: "assistant-speaks-first-with-model-generated-message",
        endCallMessage: "Great! Your confirmation is on the way. Looking forward to having you visit!",
        endCallPhrases: [
          "I'll send you that confirmation right now",
          "You'll get the confirmation text and email in a moment", 
          "Watch for my text and email with the details",
          "I'll text you those links right now",
          "I'll send you that text right now"
        ],
        serverUrl: "https://startling-beijinho-6bd2e5.netlify.app/.netlify/functions/vapi-webhook",
        analysisPlan: {
          structuredDataSchema: {
            type: "object",
            properties: {
              tourBooked: { type: "boolean", description: "Did the lead book a tour?" },
              tourDate: { type: "string", description: "Scheduled tour date/time" },
              tourTime: { type: "string", description: "Morning or afternoon preference" },
              email: { type: "string", description: "Lead's email address" },
              budget: { type: "string", description: "Monthly budget range" },
              moveDate: { type: "string", description: "Desired move-in date" },
              bedroomsNeeded: { type: "string", description: "How many bedrooms needed" },
              income: { type: "string", description: "Annual household income if mentioned" },
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
