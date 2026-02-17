const IRON65_DATA = require('./iron65-knowledge');

exports.handler = async function(event, context) {
  const headers = { 'Content-Type': 'text/xml' };

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const FUB_API_KEY = process.env.FUB_API_KEY;

  try {
    const params = new URLSearchParams(event.body || '');
    const speechResult = params.get('SpeechResult') || '';
    const leadId = new URLSearchParams(event.rawUrl.split('?')[1] || '').get('leadId');
    
    // Get conversation state from storage (in production, use a database)
    // For now, we'll generate context-aware responses
    
    const systemPrompt = `You are Aria, an AI leasing agent for Iron 65. You're having a phone conversation.

Property Info:
${JSON.stringify(IRON65_DATA, null, 2)}

Lead just said: "${speechResult}"

Rules:
- Keep response under 30 words
- Ask ONE qualifying question at a time if you haven't collected: budget, move date, income, credit
- If they ask about pricing/amenities, answer from property data
- If qualified, suggest booking a tour
- Be natural and conversational
- End with a clear question or call-to-action

Generate the next thing Aria should say in the conversation.`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: speechResult
          }
        ],
        system: systemPrompt
      })
    });

    const claudeData = await claudeResponse.json();
    const aiResponse = claudeData.content[0].text;

    // Check if conversation should end or continue
    const shouldContinue = !aiResponse.toLowerCase().includes('i\'ll send') && 
                          !aiResponse.toLowerCase().includes('talk soon') &&
                          !aiResponse.toLowerCase().includes('have a great day');

    if (shouldContinue) {
      // Continue conversation
      return {
        statusCode: 200,
        headers,
        body: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${aiResponse}</Say>
  <Gather input="speech" timeout="5" action="https://${event.headers.host}/.netlify/functions/call-response-iron65?leadId=${leadId}">
    <Say voice="Polly.Joanna">I'm listening...</Say>
  </Gather>
  <Say voice="Polly.Joanna">Thanks for your time! I'll send you a text with more details. Have a great day!</Say>
</Response>`
      };
    } else {
      // End conversation
      return {
        statusCode: 200,
        headers,
        body: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${aiResponse}</Say>
</Response>`
      };
    }

  } catch (err) {
    console.error('Call response error:', err);
    return {
      statusCode: 200,
      headers,
      body: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">I apologize, I'm having a technical issue. I'll have someone from our team reach out to you shortly. Thanks for your interest in Iron 65!</Say>
</Response>`
    };
  }
};
