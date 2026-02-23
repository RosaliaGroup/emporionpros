const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    const { email, name, tourDay, tourTime, needsCosigner, phone } = data;

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    console.log('=== SENDING TOUR EMAIL ===');
    console.log('To:', email);
    console.log('Name:', name);
    console.log('Tour:', tourDay, 'at', tourTime);

    // Create Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const displayName = name && name !== 'there' ? name : 'there';
    const tourDateTime = tourTime ? `${tourDay} at ${tourTime}` : tourDay;

    // Build HTML email
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family: Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding: 30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px 40px; text-align:center;">
              <h1 style="color:#e94560; margin:0; font-size:28px; font-weight:700;">EmporionPros</h1>
              <p style="color:#a0a0b0; margin:5px 0 0; font-size:14px;">Your Home, Our Priority</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color:#1a1a2e; margin:0 0 20px; font-size:22px;">Your Tour is Confirmed! 🎉</h2>
              
              <p style="color:#333; font-size:16px; line-height:1.6; margin:0 0 20px;">
                Hi ${displayName},
              </p>
              
              <p style="color:#333; font-size:16px; line-height:1.6; margin:0 0 25px;">
                Thank you for speaking with Aria! We're excited to confirm your apartment tour.
              </p>

              <!-- Tour Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa; border-radius:8px; border-left: 4px solid #e94560; margin-bottom:25px;">
                <tr>
                  <td style="padding: 20px 25px;">
                    <p style="color:#666; font-size:13px; text-transform:uppercase; letter-spacing:1px; margin:0 0 10px; font-weight:600;">Tour Details</p>
                    <p style="color:#1a1a2e; font-size:18px; font-weight:600; margin:0 0 5px;">📅 ${tourDateTime}</p>
                    <p style="color:#666; font-size:14px; margin:0;">Please arrive 5 minutes early</p>
                  </td>
                </tr>
              </table>

              ${needsCosigner ? `
              <!-- Cosigner Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff3cd; border-radius:8px; border-left: 4px solid #ffc107; margin-bottom:25px;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="color:#856404; font-size:14px; margin:0;">
                      <strong>📋 Cosigner Info:</strong> We'll have our cosigner assistance service available to discuss your options during the tour.
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- What to Bring -->
              <p style="color:#333; font-size:16px; font-weight:600; margin:0 0 10px;">What to bring:</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:25px;">
                <tr><td style="color:#555; font-size:14px; line-height:2; padding-left:10px;">✅ Valid photo ID</td></tr>
                <tr><td style="color:#555; font-size:14px; line-height:2; padding-left:10px;">✅ Proof of income (recent pay stubs or offer letter)</td></tr>
                <tr><td style="color:#555; font-size:14px; line-height:2; padding-left:10px;">✅ Any questions you have about the apartment</td></tr>
              </table>

              <p style="color:#333; font-size:16px; line-height:1.6; margin:0 0 25px;">
                If you need to reschedule or have any questions, simply reply to this email or give us a call.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://emporionpros.com" style="display:inline-block; background-color:#e94560; color:#ffffff; text-decoration:none; padding:14px 35px; border-radius:6px; font-size:16px; font-weight:600;">
                      Visit Our Website
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#1a1a2e; padding: 25px 40px; text-align:center;">
              <p style="color:#a0a0b0; font-size:13px; margin:0 0 5px;">EmporionPros — Rosalia Group</p>
              <p style="color:#666; font-size:12px; margin:0;">This email was sent because you scheduled a tour with our AI assistant, Aria.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Plain text fallback
    const textBody = `Hi ${displayName},

Thank you for speaking with Aria! We're excited to confirm your apartment tour.

TOUR DETAILS:
📅 ${tourDateTime}
Please arrive 5 minutes early.

${needsCosigner ? 'COSIGNER INFO: We\'ll have our cosigner assistance service available to discuss your options during the tour.\n\n' : ''}WHAT TO BRING:
✅ Valid photo ID
✅ Proof of income (recent pay stubs or offer letter)
✅ Any questions you have about the apartment

If you need to reschedule or have any questions, simply reply to this email or give us a call.

EmporionPros — Rosalia Group
https://emporionpros.com`;

    // Send the email
    const mailOptions = {
      from: `"EmporionPros" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `🏠 Your Apartment Tour is Confirmed — ${tourDateTime}`,
      text: textBody,
      html: htmlBody
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ EMAIL SENT SUCCESSFULLY:', result.messageId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email sent',
        to: email,
        messageId: result.messageId
      })
    };

  } catch (err) {
    console.error('❌ EMAIL ERROR:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
