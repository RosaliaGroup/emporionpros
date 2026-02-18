exports.handler = async function(event, context) {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_PHONE = process.env.TWILIO_PHONE;
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  try {
    const { phone, email, name, tourDay, tourTime, needsCosigner } = JSON.parse(event.body);
    
    if (!phone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Phone number required' })
      };
    }
    
    // Build confirmation message
    let message = `Hi ${name || 'there'}! This is Aria from Iron 65.

Your tour is confirmed for ${tourDay || 'your scheduled date'} at ${tourTime || 'your scheduled time'}.

📍 Iron 65 Apartments
65 Lincoln Park, Newark, NJ 07102

Book or reschedule:
https://calendly.com/ana-rosaliagroup/65-iron-tour`;

    // Add cosigner link ONLY if needed
    if (needsCosigner) {
      message += `

💡 FREE Cosigner Pre-Approval:
https://app.theguarantors.com/referral/sign-up/ad295b820fb11b34ee2f5cc96f1acf659032ce4fd9280a9fa1f380582aeda1a2

Get approved at no cost!`;
    }

    message += `

Questions? Reply to this text!

See you soon! 🏢`;
    
    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: phone,
        From: TWILIO_PHONE,
        Body: message
      })
    });
    
    const responseData = await response.text();
    
    if (!response.ok) {
      console.error('Twilio error:', responseData);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Twilio error: ' + responseData })
      };
    }
    
    console.log('SMS sent successfully to:', phone);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'SMS sent',
        to: phone
      })
    };
    
  } catch (err) {
    console.error('SMS function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
```

---

## 🔑 Environment Variables Needed in Netlify:

Make sure these are all set in **Netlify → Site Settings → Environment Variables**:
```
VAPI_API_KEY=your_vapi_key
VAPI_PHONE_NUMBER=a0ce8f55-ad4a-4a3d-a90b-c25857d03313
TWILIO_ACCOUNT_SID=AC0d7be4edcbdc6cd8f91be8a830511753
TWILIO_AUTH_TOKEN=cd171986fe357d9bf19a3a0755bb8efb
TWILIO_PHONE=+18443574020
FUB_API_KEY=your_fub_key
