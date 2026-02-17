exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const params = new URLSearchParams(event.body || '');
    const recordingUrl = params.get('RecordingUrl');
    const callSid = params.get('CallSid');
    const duration = params.get('RecordingDuration');

    // Log the recording (in production, save to database)
    console.log('Call recording ready:', {
      callSid,
      recordingUrl,
      duration
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
