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
    const { email, subject, body } = data;

    if (!email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email is required' }) };
    }
    if (!subject) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Subject is required' }) };
    }
    if (!body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message body is required' }) };
    }

    console.log('=== SENDING EMAIL ===');
    console.log('To:', email);
    console.log('Subject:', subject);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Convert plain text body to simple HTML (preserve line breaks)
    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto;">
    ${body.replace(/\n/g, '<br>')}
    <br><br>
    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px;">
      <span style="font-size: 12px; color: #9ca3af;">Sent via EmporionPros</span>
    </div>
  </div>
</body>
</html>`;

    const mailOptions = {
      from: `"EmporionPros" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: subject,
      text: body,
      html: htmlBody
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ EMAIL SENT:', result.messageId);

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
