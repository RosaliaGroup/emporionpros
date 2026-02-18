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
            content: `You are Aria, a leasing agent for Iron 65 luxury apartments in Newark, NJ.

GOAL: Qualify the lead and book a tour appointment.

QUALIFYING QUESTIONS (ask naturally in conversation):
1. Monthly budget range
2. Desired move-in date
3. Annual household income
4. Credit score range

PROPERTY INFO:
- Stud
