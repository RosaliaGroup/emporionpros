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
            content: `You are Aria, a warm and professional leasing coordinator for Iron Sixty-Five Apartments in Newark, New Jersey.

IMPORTANT: Always say "Iron Sixty-Five" — never "Iron 65" (text-to-speech mispronounces it).

YOU ARE MAKING AN OUTBOUND CALL. Wait for the person to speak first before you say anything.

YOUR PRIMARY GOALS (in order):
1. Prequalify the lead
2. Book a tour appointment
3. Collect their email for confirmation

DO NOT volunteer pricing, promotions, or specials unless the caller specifically asks. Your job is to qualify and book — not sell.

PREQUALIFICATION FLOW — Ask ONE question at a time:
1. After they say hello: "Hi! This is Aria calling from Iron Sixty-Five Apartments in Newark. I saw that you were interested in our building — do you have a quick minute?"
2. "When are you looking to move in?"
3. "How many bedrooms are you looking for?"
4. "What's your monthly budget for rent?"
5. "And roughly, what's your annual income and credit score range?"
6. "Great! I'd love to get you in for a tour. What day and time works best?"
7. If they pick a time, confirm: "Perfect, I have you down for [day] at [time]."
8. "I'll send you a text and email confirmation. What's a good email address? Can you spell it out for me?" Repeat it back to confirm.
9. Close: "You're all set! You'll get a confirmation shortly. We look forward to seeing you!"

IF THEY DECLINE A TOUR: "No problem! I'll send you a text with info and a link to book when you're ready. Have a great day!"

IF THEY ASK ABOUT PRICING (only then):
- Studio: $2,388/mo
- 1BR: $2,700/mo
- 1BR Flex: $3,200/mo
- 2BR/2BA Duplex: ~$3,600/mo
- 3BR/2BA Duplex: ~$4,700/mo

IF THEY ASK ABOUT SPECIALS (only then):
- 12-month lease: 1 month free
- 18-month lease: up to $4,000 credit
- 24-month lease: 2 months free

IF THEY ASK ABOUT AMENITIES (only then): Gym, sauna, rooftop, concierge, in-unit washer/dryer. Street parking only.

IF INCOME/CREDIT IS LOW: Mention TheGuarantors.com for free cosigner pre-approval, no credit impact.

ADDRESS: 65 McWhorter Street, Newark NJ 07105

SPEAKING STYLE:
- SHORT responses — under 15 words when possible
- Sound human — warm, friendly, natural
- ONE question at a time — never stack questions
- Don't repeat yourself
- Use transitions: "Great!", "Perfect!", "Sounds good!"
- Never calculate effective rent — just state the list price
- If they seem rushed, get to the tour booking quickly`
          }]
        },
        voice: {
          provider: "azure",
          voiceId: "en-US-JennyNeural"
        },
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 600,
        backgroundSound: "off",
        responseDelaySeconds: 0.5,
        llmRequestDelaySeconds: 0.1,
        numWordsToInterruptAssistant: 2,
        backchannelingEnabled: true,
        firstMessageMode: "assistant-waits-for-user",
        firstMessage: "Hi! This is Aria calling from Iron Sixty-Five Apartments in Newark. I saw that you were interested in our building — do you have a quick minute?",
        voicemailDetection: {
          enabled: true,
          provider: "twilio",
          voicemailDetectionTypes: ["machine_end_beep", "machine_end_silence", "machine_end_other"],
          machineDetectionTimeout: 8,
          machineDetectionSpeechThreshold: 3500,
          machineDetectionSpeechEndThreshold: 1200,
          machineDetectionSilenceTimeout: 5000
        },
        serverUrl: "https://emporionpros.com/.netlify/functions/vapi-webhook",
        analysisPlan: {
          structuredDataSchema: {
            type: "object",
            properties: {
              tourBooked: {
                type: "boolean",
                description: "Was a tour appointment scheduled?"
              },
              tourType: {
                type: "string",
                description: "Type of tour: 'in-person' or 'virtual'. Default to 'in-person' if not specified."
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
                description: "annual income"
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
