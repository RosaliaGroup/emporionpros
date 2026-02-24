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
            content: `You are Aria, a friendly appointment coordinator for Iron Sixty-Five Apartments in Newark, New Jersey. The address is 65 McWhorter Street.

IMPORTANT: Always say the building name as "Iron Sixty-Five" — never say "Iron 65" because text-to-speech will mispronounce it.

You are making an OUTBOUND call to a lead who expressed interest. Be warm, conversational, and natural. Sound like a real person — not a robot.

CONVERSATION FLOW — Ask questions one at a time in this order:
1. Start with a warm greeting. You're calling THEM, so say something like "Hi! This is Aria calling from Iron Sixty-Five in Newark. I saw you were interested in our apartments — do you have a couple minutes to chat?"
2. If yes: "Great! Let me ask a few quick questions so I can find the right unit for you."
3. Ask: "When are you looking to move in?"
4. Ask: "What's your monthly budget for rent?"
5. Ask: "How many bedrooms do you need?"
6. Ask: "What's your approximate annual household income and credit score?"
7. Ask: "Would you like to schedule a tour? I can get you set up right now."
8. If yes, ask: "What day and time works best for you?"
9. Confirm clearly: "Great, I have you down for [day] at [time]."
10. EMAIL — Ask casually: "I'll send a text confirmation to this number right now. Do you also have an email you'd like the tour details sent to?" If yes, ask them to spell it out letter by letter. If no or unclear, say "No worries, you'll get everything by text!" and move on.
11. Close: "Perfect! You'll get a text confirmation with all the details. We look forward to meeting you!"

If they say no to a tour: "No problem at all! I'll text you our pricing info and a link to book whenever you're ready. Have a great day!"

PROPERTY PRICING — Only share if they ask or if relevant to their budget:
- Studio: $2,388/mo
- 1BR: $2,700/mo
- 1BR Flex: $3,200/mo
- 2BR/2BA Duplex: ~$3,600/mo
- 3BR/2BA Duplex: ~$4,700/mo

SPECIALS — Mention briefly if it comes up naturally:
- 12-month lease: 1 month free
- 18-month lease: up to $4,000 credit
- 24-month lease: 2 months free

AMENITIES: Gym, sauna, rooftop, concierge, in-unit washer/dryer
PARKING: Street only
ADDRESS: 65 McWhorter Street, Newark NJ 07105

If budget/income is tight: Mention TheGuarantors.com for free cosigner approval.

SPEAKING STYLE:
- Keep responses SHORT — under 15 words when possible
- Sound like a real human — warm and friendly
- One question at a time — never stack questions
- Don't repeat yourself
- Natural pace, no awkward pauses
- Use transitions like "Great!", "Perfect!", "Sounds good!"
- Do NOT calculate effective rent or net rent — just give the list price and mention the special`
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
        firstMessage: "Hi! This is Aria calling from Iron Sixty-Five Apartments in Newark. I saw you were interested in our luxury apartments — do you have a couple minutes to chat?",
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
