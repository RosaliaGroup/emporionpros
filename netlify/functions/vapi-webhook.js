exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  const FUB_API_KEY = process.env.FUB_API_KEY;
  
  try {
    const webhook = JSON.parse(event.body || '{}');
    
    // RESPOND IMMEDIATELY
    const response = {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };
    
    // Process async AFTER responding
    if (webhook.type === 'end-of-call-report') {
      processCallReport(webhook, FUB_API_KEY).catch(console.error);
    }
    
    return response;
    
  } catch (err) {
    console.error('Webhook error:', err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };
  }
};

// This runs AFTER the response is sent
async function processCallReport(webhook, FUB_API_KEY) {
  const analysis = webhook.analysis || {};
  const structuredData = analysis.structuredData || {};
  const summary = analysis.summary || '';
  const customer = webhook.customer || {};
  const call = webhook.call || {};
  
  console.log('Call completed:', {
    customer: customer.name,
    phone: customer.number,
    email: structuredData.email,
    tourBooked: structuredData.tourBooked,
    duration: call.duration
  });
  
  // Send SMS confirmation if tour was booked
  if (structuredData.tourBooked && customer.number) {
    try {
      await fetch('https://startling-beijinho-6bd2e5.netlify.app/.netlify/functions/send-tour-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: customer.number,
          email: structuredData.email || customer.email || '',
          name: customer.name || 'there',
          tourDay: structuredData.tourDay || 'your scheduled date',
          tourTime: structuredData.tourTime || 'your scheduled time',
          needsCosigner: structuredData.needsCosigner || false
        })
      });
      console.log('Tour SMS sent to:', customer.number);
    } catch (smsError) {
      console.error('SMS send failed:', smsError);
    }
  }
  
  // Push ALL collected data to FUB
  if (FUB_API_KEY) {
    try {
      // Build comprehensive note with ALL information
      const noteLines = [
        '🤖 AI CALL COMPLETED',
        '═══════════════════════════',
        ''
      ];
      
      // Contact Information
      if (structuredData.email) {
        noteLines.push(`📧 Email: ${structuredData.email}`);
      }
      if (structuredData.phoneConfirmed) {
        noteLines.push(`📱 Phone: ${structuredData.phoneConfirmed}`);
      }
      noteLines.push('');
      
      // Move-in & Housing Needs
      noteLines.push('🏠 HOUSING NEEDS:');
      if (structuredData.moveDate) {
        noteLines.push(`   Move-in Date: ${structuredData.moveDate}`);
      }
      if (structuredData.bedroomsNeeded) {
        noteLines.push(`   Bedrooms: ${structuredData.bedroomsNeeded}`);
      }
      noteLines.push('');
      
      // Financial Qualification
      noteLines.push('💰 FINANCIAL INFO:');
      if (structuredData.budget) {
        noteLines.push(`   Budget: ${structuredData.budget}/month`);
      }
      if (structuredData.income) {
        noteLines.push(`   Annual Income: ${structuredData.income}`);
      }
      if (structuredData.credit) {
        noteLines.push(`   Credit Score: ${structuredData.credit}`);
      }
      if (structuredData.needsCosigner) {
        noteLines.push(`   ⚠️  Needs Cosigner: Yes - TheGuarantors link sent`);
      }
      noteLines.push('');
      
      // Tour Appointment
      if (structuredData.tourBooked) {
        noteLines.push('📅 TOUR SCHEDULED:');
        noteLines.push(`   Date: ${structuredData.tourDay || 'TBD'}`);
        noteLines.push(`   Time: ${structuredData.tourTime || 'TBD'}`);
        noteLines.push(`   ✅ Confirmation sent via SMS`);
      } else {
        noteLines.push('📅 TOUR: Not scheduled');
      }
      noteLines.push('');
      
      // Interest Level
      if (structuredData.interested !== undefined) {
        noteLines.push(`🎯 Interest Level: ${structuredData.interested ? 'Interested ✓' : 'Not Interested ✗'}`);
      }
      
      // Concerns/Objections
      if (structuredData.concerns) {
        noteLines.push('');
        noteLines.push('⚠️  CONCERNS/OBJECTIONS:');
        noteLines.push(`   ${structuredData.concerns}`);
      }
      
      // Call Details
      noteLines.push('');
      noteLines.push('📞 CALL DETAILS:');
      if (call.duration) {
        noteLines.push(`   Duration: ${Math.round(call.duration / 60)} minutes`);
      }
      if (call.cost) {
        noteLines.push(`   Cost: $${call.cost.toFixed(2)}`);
      }
      
      // AI Summary
      if (summary) {
        noteLines.push('');
        noteLines.push('📝 AI SUMMARY:');
        noteLines.push(`   ${summary}`);
      }
      
      // Transcript link (if available)
      if (call.recordingUrl) {
        noteLines.push('');
        noteLines.push(`🎧 Recording: ${call.recordingUrl}`);
      }
      
      const noteMessage = noteLines.join('\n');
      
      // Send to FUB
      const fubResponse = await fetch('https://api.followupboss.com/v1/events', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
          'Content-Type': 'application/json',
          'X-System': 'EmporionPros',
          'X-System-Key': 'emporionpros2026'
        },
        body: JSON.stringify({
          source: 'Iron 65 AI Call',
          type: 'Note',
          message: noteMessage,
          person: {
            emails: structuredData.email ? [{ value: structuredData.email }] : [],
            phones: customer.number ? [{ value: customer.number }] : [],
            name: customer.name || 'AI Call Lead'
          }
        })
      });
      
      if (fubResponse.ok) {
        console.log('Successfully pushed to FUB with all details');
      } else {
        const errorText = await fubResponse.text();
        console.error('FUB returned error:', errorText);
      }
    } catch (fubErr) {
      console.error('FUB push error:', fubErr);
    }
  }
}
```

---

## ✅ What Gets Sent to FUB Now:

The note in FUB will look like this:
```
🤖 AI CALL COMPLETED
═══════════════════════════

📧 Email: john@email.com
📱 Phone: +12015551234

🏠 HOUSING NEEDS:
   Move-in Date: March 1st
   Bedrooms: 1BR

💰 FINANCIAL INFO:
   Budget: $2,500-2,800/month
   Annual Income: $75,000
   Credit Score: 680-720

📅 TOUR SCHEDULED:
   Date: Tuesday, February 25th
   Time: 2pm
   ✅ Confirmation sent via SMS

🎯 Interest Level: Interested ✓

📞 CALL DETAILS:
   Duration: 4 minutes
   Cost: $0.32

📝 AI SUMMARY:
   Lead is interested in 1BR unit. Qualified based on income and credit. Tour scheduled for Tuesday afternoon.

🎧 Recording: https://vapi-recordings.s3.amazonaws.com/...
