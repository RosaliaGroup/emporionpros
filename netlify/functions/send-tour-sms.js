// Send one SMS through Telnyx. Env: TELNYX_API_KEY, TELNYX_FROM_NUMBER (E.164, e.g. +18625551234),
// optional TELNYX_MESSAGING_PROFILE_ID, SMS_DRY_RUN=true to log without sending.
// Sender: brand 'emporion' uses TELNYX_FROM_EMPORION, otherwise TELNYX_FROM_NUMBER (Rosalia).
async function sendTelnyxSms(to, text, brand) {
  const apiKey = process.env.TELNYX_API_KEY;
  const from = brand === 'emporion' ? process.env.TELNYX_FROM_EMPORION : process.env.TELNYX_FROM_NUMBER;
  if (!apiKey || !from) return { ok: false, status: 500, error: 'Telnyx not configured (TELNYX_API_KEY / TELNYX_FROM_NUMBER)' };
  let digits = String(to).replace(/\D/g, '');
  if (digits.length === 10) digits = '1' + digits;
  const toE164 = '+' + digits;
  if (String(process.env.SMS_DRY_RUN).toLowerCase() === 'true') {
    console.log('[SMS_DRY_RUN] would send to', toE164, '| length', text.length);
    return { ok: true, status: 200, id: 'dry-run', to: toE164 };
  }
  const body = { from, to: toE164, text };
  if (process.env.TELNYX_MESSAGING_PROFILE_ID) body.messaging_profile_id = process.env.TELNYX_MESSAGING_PROFILE_ID;
  const res = await fetch('https://api.telnyx.com/v2/messages', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const raw = await res.text();
  let json = {}; try { json = JSON.parse(raw); } catch (e) {}
  if (!res.ok) return { ok: false, status: res.status, error: raw };
  return { ok: true, status: 200, id: (json.data && json.data.id) || null, to: toE164 };
}

exports.handler = async function(event, context) {
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only Emporion Pros' own systems may send texts (shared secret in x-internal-secret).
  const secret = process.env.SMS_INTERNAL_SECRET;
  const given = (event.headers && (event.headers['x-internal-secret'] || event.headers['X-Internal-Secret'])) || '';
  if (!secret || given !== secret) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
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
    
    // Send SMS via Telnyx
    const result = await sendTelnyxSms(phone, message);
    if (!result.ok) {
      console.error('Telnyx error:', result.error);
      return { statusCode: result.status || 500, headers, body: JSON.stringify({ error: 'SMS error: ' + result.error }) };
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
