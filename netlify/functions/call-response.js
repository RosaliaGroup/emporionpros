exports.handler = async function(event, context) {
  const headers = { 'Content-Type': 'text/xml' };

  try {
    const params = new URLSearchParams(event.body || '');
    const speechResult = params.get('SpeechResult') || '';

    // Simple response logic (can be enhanced with Claude API for smarter conversation)
    const response = speechResult.toLowerCase();

    if (response.includes('yes') || response.includes('yeah') || response.includes('sure')) {
      return {
        statusCode: 200,
        headers,
        body: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Great! I have some wonderful properties that match what you're looking for. Would you be available for a showing this weekend? Saturday or Sunday?
  </Say>
  <Gather input="speech" timeout="5">
    <Say voice="Polly.Joanna">Please tell me which day works better for you.</Say>
  </Gather>
  <Say voice="Polly.Joanna">
    Perfect! I'll have our agent reach out to you shortly to confirm the exact time. Looking forward to showing you some great homes! Have a wonderful day.
  </Say>
</Response>`
      };
    } else {
      return {
        statusCode: 200,
        headers,
        body: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    No problem! I'll send you some property listings via text and email so you can browse at your convenience. Feel free to reach out anytime you're ready. Have a great day!
  </Say>
</Response>`
      };
    }

  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">I apologize, there was a technical issue. We'll follow up with you shortly. Goodbye!</Say>
</Response>`
    };
  }
};
