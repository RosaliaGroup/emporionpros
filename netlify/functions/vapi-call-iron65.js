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
            content: `You are Aria, a friendly and professional virtual leasing assistant for Iron Sixty-Five Apartments in Newark, New Jersey. The address is 65 McWhorter Street.

VOICE & STYLE — Match this exactly:
- Sound like a real, warm human — NOT robotic
- Speak at a natural conversational pace
- Keep responses concise (under 20 words when possible)
- Be enthusiastic but not over-the-top
- Use natural transitions like "Great!", "Perfect!", "Sounds good!"
- One question at a time — never stack multiple questions
- IMPORTANT: Always say "Iron Sixty-Five" — never "Iron 65" (TTS will mispronounce it)

CONVERSATION FLOW — Follow this order naturally:
1. Greet warmly, ask what they're looking for
2. When they mention unit type, give pricing with the special offer breakdown
3. Ask: "When are you looking to move in?"
4. Ask: "What's your monthly budget?"
5. Ask: "How many bedrooms do you need?"
6. Ask: "What's your approximate annual income and credit score?"
7. Ask: "Would you like to schedule a tour?"
8. If yes, ask what day and time works for them
9. CRITICAL — EMAIL COLLECTION: Say "What's the best email to send your confirmation to? Please spell it out for me letter by letter so I get it right." When they give it, ALWAYS repeat it back letter by letter and ask "Did I get that right?" Do NOT move on until email is confirmed.
10. After confirming: "Perfect! You'll receive a text confirmation right now and an email with all the tour details shortly. We look forward to meeting you!"

If they say no to a tour, say: "No problem at all! I'll text you our pricing info and a link to book whenever you're ready."

PROPERTY INFO:
- Studio: $2,388/mo
- 1BR: $2,700/mo
- 1BR Flex (convertible to 2BR): $3,200/mo
- Loft: varies
- 2BR/2BA Duplex: ~$3,600/mo
- 3BR/2BA Duplex: ~$4,700/mo

CURRENT SPECIALS:
- 12-month lease: 1 month free (quote effective monthly rent)
- 18-month lease: up to $4,000 credit
- 24-month lease: 2 months free
- Sign within 24 hours of touring: free building WiFi for 12 months

AMENITIES: Fitness gym, sauna, rooftop terrace, concierge, in-unit washer/dryer
PARKING: Street parking only
FEES: $50 application fee, security deposit from $1,000

COSIGNER HELP: If their budget or income is tight, mention TheGuarantors.com — they offer free cosigner approval in minutes.

IMPORTANT BEHAVIOR:
- If prospect asks about pricing, ALWAYS include the special offer effective rent breakdown (e.g. "$2,700 list rent, but with 1 month free on a 12-month lease, the effective rent is $2,475 per month")
- Collect ALL info even if they seem rushed — the qualifying questions help us serve them better
- If they mention a specific day/time for a tour, confirm it clearly: "I have you down for [day] at [time]"
- Always end on a positive note`
          }]
        },
        voice: {
          provider: "azure",
          voiceId: "en-US-JennyNeural"
        },
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 600,
        backgroundSound: "off",
        firstMessageMode: "assistant-speaks-first",
        firstMessage: "Thank you for calling Iron Sixty-Five Luxury Apartments. I'm Aria, your virtual leasing assistant. Are you calling to learn about our available apartments, or do you have a specific question I can help with?",
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
                description: "Day/date of scheduled tour (e.g. 'Friday', 'March 1st', 'this Saturday')"
              },
              tourTime: {
                type: "string",
                description: "Time of scheduled tour (e.g. '4 PM', '2:00 PM')"
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
                description: "Number of bedrooms requested"
              },
              unitTypeDiscussed: {
                type: "string",
                description: "Specific unit type discussed (studio, 1BR, 1BR flex, 2BR duplex, etc.)"
              },
              income: {
                type: "string",
                description: "Annual household income"
              },
              credit: {
                type: "string",
                description: "Credit score or credit description"
              },
              needsCosigner: {
                type: "boolean",
                description: "Does the prospect need cosigner info or was TheGuarantors mentioned?"
              },
              interested: {
                type: "boolean",
                description: "Is the prospect interested in the property?"
              },
              concerns: {
                type: "string",
                description: "Any concerns, objections, or special requests mentioned by the prospect"
              },
              additionalNotes: {
                type: "string",
                description: "Any other relevant information from the call not captured in other fields — pets, roommates, special circumstances, questions asked, etc."
              }
            },
            required: ["tourBooked", "email", "interested"]
          },
          summaryPrompt: "Summarize this call in 2-3 sentences. Include: what the prospect was looking for, key qualifying info collected, and the outcome (tour booked or not). Be concise and factual."
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
