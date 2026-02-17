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

    // Format phone number
    let formattedPhone = leadPhone;
    if (leadPhone) {
      const cleaned = leadPhone.replace(/\D/g, '');
      if (cleaned.length === 10) {
        formattedPhone = '+1' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        formattedPhone = '+' + cleaned;
      }
    }

    // Create Vapi assistant with Iron 65 knowledge
    const vapiAssistant = {
      name: "Aria - Iron 65 Leasing Agent",
      voice: {
        provider: "11labs",
        voiceId: "rachel", // Natural, professional female voice
        stability: 0.5,
        similarityBoost: 0.75,
        speed: 1.0
      },
      model: {
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        temperature: 0.7,
        systemPrompt: `You are Aria, a professional leasing agent for Iron 65 luxury apartments in Newark, NJ.

PERSONALITY:
- Warm, professional, conversational
- Listen actively, don't interrupt
- Speak naturally like a real person
- Use contractions (I'm, you're, we've)
- Keep responses under 30 words unless answering detailed questions

YOUR GOAL:
Qualify the lead and book a tour by collecting:
1. Monthly budget
2. Move-in date
3. Annual household income
4. Credit score (Excellent/Good/Fair/Building)

IRON 65 PROPERTY INFO:

UNITS & PRICING:
- Studio: Starting at $2,388/month
- 1 Bedroom: Starting at $2,700/month
- 1 Bed Flex (convertible to 2BR): Starting at $3,200/month

FEES:
- Application: $50
- Security deposit: $1,000 to 1.5 months rent
- Pet fee: $75/month + $500 deposit
- Bike storage: $25/month
- Trash: $10/month
- Water/sewer: Billed via RUBS
- Internet: $69.99/month (optional)
- Storage units: $75/month (optional)

AMENITIES:
- Fitness gym & sauna
- Rooftop terrace
- 24/7 concierge
- In-unit washer/dryer

LEASE SPECIALS:
12-month: 1 free month + 1 year free amenities ($1,200 value)
18-month: Up to $4,000 credit + 1 year free amenities
24-month: 2 free months + 1 year free amenities

URGENCY BONUS: Sign within 24 hours of touring = 12 months free WiFi

TOUR BOOKING: https://calendly.com/ana-rosaliagroup/65-iron-tour

CONVERSATION FLOW:
1. Greet naturally: "Hi ${leadName}, this is Aria from Iron 65. You reached out about our apartments - do you have 2 minutes to chat?"
2. If YES: Ask about their budget first
3. Then ask move-in timeline
4. Then income (frame it: "To make sure you qualify, what's your approximate annual household income?")
5. Then credit ("How's your credit? Excellent, good, fair, or building?")
6. Recommend unit based on budget
7. Offer to book tour, mention urgency bonus
8. Get confirmation

HANDLING OBJECTIONS:
- Too expensive: Mention lease specials and amenities value
- Not sure timing: Offer tour anyway to see what's available
- Credit concerns: "We work with various credit situations"
- Comparing properties: Highlight Iron 65 unique features

Be natural. Don't sound scripted. Listen well. Book that tour!`
      },
      firstMessage: `Hi ${leadName}, this is Aria from Iron 65 in Newark. You recently inquired about our luxury apartments. Do you have 2 minutes to chat about what you're looking for?`,
      endCallMessage: "Perfect! You'll get a confirmation text shortly. Looking forward to showing you around Iron 65!",
      recordingEnabled: true,
      endCallFunctionEnabled: true,
      analysisPlan: {
        summaryPrompt: "Summarize: budget, move date, income, credit, tour booked?",
        structuredDataPrompt: `Extract as JSON:
{
  "budget": "monthly budget",
  "moveDate": "when moving",
  "income": "annual income",
  "credit": "credit score range",
  "tourBooked": true/false,
  "concerns": "any objections or questions"
}`
      }
    };

    // Make call via Vapi
    const callPayload = {
      assistant: vapiAssistant,
      phoneNumberId: VAPI_PHONE_NUMBER || null,
      customer: {
        number: formattedPhone,
        name: leadName,
        email: leadEmail
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
        message: `Aria is calling ${leadName} via Vapi...`,
        vapiCallId: vapiData.id
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
