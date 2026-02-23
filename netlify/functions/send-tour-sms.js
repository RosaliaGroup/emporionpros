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
    const data = JSON.parse(event.body);
    const { phone, email, name, tourDay, tourTime, needsCosigner, tourBooked, budget, bedroomsNeeded, concerns, summary } = data;
    
    if (!phone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Phone number required' })
      };
    }
    
    let message = '';
    
    if (tourBooked) {
      // ===== TOUR BOOKED — Confirmation SMS =====
      message = `Hi ${name || 'there'}! This is Aria from Iron Sixty-Five. 🏢

✅ Your tour is confirmed!
📅 ${tourDay || 'Your scheduled date'}${tourTime ? ' at ' + tourTime : ''}
📍 65 McWhorter St, Newark, NJ 07105

What to bring:
• Valid photo ID
• Proof of income`;

      if (needsCosigner) {
        message += `

💡 FREE Cosigner Pre-Approval:
https://app.theguarantors.com/referral/sign-up/ad295b820fb11b34ee2f5cc96f1acf659032ce4fd9280a9fa1f380582aeda1a2
Get approved at no cost!`;
      }

      message += `

Reschedule anytime:
https://calendly.com/ana-rosaliagroup/65-iron-tour

Questions? Reply to this text!
See you soon! 🏠`;

    } else {
      // ===== NO TOUR — Follow-up SMS =====
      message = `Hi ${name || 'there'}! This is Aria from Iron Sixty-Five. Thanks for chatting with me! 😊`;

      // Add personalized details based on what was discussed
      if (budget || bedroomsNeeded) {
        message += `\n\nBased on what you shared:`;
        if (bedroomsNeeded) message += `\n• Looking for: ${bedroomsNeeded}`;
        if (budget) message += `\n• Budget: $${budget}/mo`;
      }

      if (concerns) {
        message += `\n\nI noted your concern about ${concerns} — we can definitely discuss options when you're ready.`;
      }

      message += `

When you're ready to see the apartments, book a tour here:
📅 https://calendly.com/ana-rosaliagroup/65-iron-tour

📍 65 McWhorter St, Newark, NJ 07105

Reply anytime with questions! 🏢`;
    }
    
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
    
    console.log('SMS sent successfully to:', phone, '| Tour booked:', !!tourBooked);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'SMS sent',
        to: phone,
        type: tourBooked ? 'tour_confirmation' : 'follow_up'
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
