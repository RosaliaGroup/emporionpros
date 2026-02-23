exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  const FUB_API_KEY = process.env.FUB_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nfwxruzhgzkhklvzmfsw.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  
  try {
    // === DEBUG: Log raw event details ===
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('HTTP Method:', event.httpMethod);
    console.log('Content-Type:', event.headers?.['content-type'] || event.headers?.['Content-Type'] || 'none');
    console.log('Raw body length:', (event.body || '').length);
    
    // === Parse body — handle base64, string, or already-parsed ===
    let webhook = {};
    let rawBody = event.body || '';
    
    if (event.isBase64Encoded && rawBody) {
      rawBody = Buffer.from(rawBody, 'base64').toString('utf-8');
      console.log('Decoded base64 body preview:', rawBody.substring(0, 500));
    }
    
    if (typeof rawBody === 'string' && rawBody.length > 0) {
      try {
        webhook = JSON.parse(rawBody);
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr.message);
        console.log('Body that failed to parse:', rawBody.substring(0, 1000));
      }
    } else if (typeof rawBody === 'object') {
      webhook = rawBody;
    }
    
    console.log('Parsed webhook keys:', Object.keys(webhook));
    
    // RESPOND IMMEDIATELY
    const response = {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };
    
    // === Detect call ended ===
    // Only process end-of-call-report (has analysis data)
    // Skip status-update/ended to avoid double processing
    const message = webhook.message || webhook;
    const isEndOfCallReport = message.type === 'end-of-call-report' || webhook.type === 'end-of-call-report';
    
    console.log('Message type:', message.type || webhook.type);
    console.log('Message status:', message.status || webhook.status);
    console.log('Is end-of-call-report?', isEndOfCallReport);
    
    // Process BEFORE returning — Netlify kills the function after response
    if (isEndOfCallReport) {
      console.log('Processing end-of-call report...');
      try {
        await processCallReport(webhook, FUB_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY);
      } catch (err) {
        console.error('Process error:', err);
      }
    } else {
      console.log('Skipping - not an ended call event');
    }
    
    return response;
    
  } catch (err) {
    console.error('Webhook error:', err);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true, error: err.message })
    };
  }
};

async function processCallReport(webhook, FUB_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY) {
  console.log('=== PROCESS CALL REPORT START ===');
  
  const message = webhook.message || webhook;
  
  // The end-of-call-report already has analysis data
  const analysis = message.analysis || {};
  const structuredData = analysis.structuredData || {};
  const summary = analysis.summary || '';
  
  // Get customer info - try multiple locations in the payload
  const call = message.call || webhook.call || {};
  const customer = call.customer || message.customer || {};
  
  // If no customer number found in expected places, check phoneNumber field
  if (!customer.number && message.phoneNumber) {
    customer.number = message.phoneNumber;
  }
  if (!customer.number && call.phoneNumber) {
    customer.number = call.phoneNumber;
  }
  
  console.log('Customer:', JSON.stringify(customer));
  console.log('Structured data:', JSON.stringify(structuredData));
  console.log('Summary:', summary);
  console.log('Tour booked:', structuredData.tourBooked);
  
  // Build the call notes string (reused for both FUB and Supabase)
  const callNotes = `🤖 AI Call (Aria) - ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}
Email: ${structuredData.email || 'Not provided'}
Budget: ${structuredData.budget || 'Not provided'}
Move Date: ${structuredData.moveDate || 'Not provided'}
Bedrooms: ${structuredData.bedroomsNeeded || 'Not provided'}
Income: ${structuredData.income || 'Not provided'}
Credit: ${structuredData.credit || 'Not provided'}
Tour Booked: ${structuredData.tourBooked ? 'Yes - ' + structuredData.tourDay + ' ' + structuredData.tourTime : 'No'}
Needs Cosigner: ${structuredData.needsCosigner ? 'Yes' : 'No'}
Summary: ${summary}`;

  // Send SMS if tour was booked
  if (structuredData.tourBooked && customer.number) {
    console.log('=== SENDING SMS ===');
    try {
      const smsPayload = {
        phone: customer.number,
        email: structuredData.email || '',
        name: customer.name || 'there',
        tourDay: structuredData.tourDay || 'your scheduled date',
        tourTime: structuredData.tourTime || 'your scheduled time',
        needsCosigner: structuredData.needsCosigner || false
      };
      
      const smsResponse = await fetch('https://emporionpros.com/.netlify/functions/send-tour-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsPayload)
      });
      
      const smsResult = await smsResponse.text();
      console.log('SMS Response:', smsResponse.status, smsResult);
      
      if (smsResponse.ok) {
        console.log('✅ SMS SENT SUCCESSFULLY');
      } else {
        console.error('❌ SMS FAILED:', smsResult);
      }
    } catch (smsError) {
      console.error('❌ SMS ERROR:', smsError);
    }
  } else {
    console.log('Skipping SMS - tourBooked:', structuredData.tourBooked, 'phone:', customer.number);
  }
  
  // ========================================
  // PUSH TO SUPABASE (EmporionPros leads)
  // ========================================
  if (SUPABASE_SERVICE_KEY && customer.number) {
    console.log('=== PUSHING TO SUPABASE ===');
    
    try {
      const rawPhone = customer.number;
      const phoneDigits = rawPhone.replace(/[^0-9]/g, '');
      const phone10 = phoneDigits.length === 11 && phoneDigits[0] === '1' ? phoneDigits.slice(1) : phoneDigits;
      
      const searchUrl = `${SUPABASE_URL}/rest/v1/leads?or=(phone.ilike.*${phone10}*,phone.ilike.*${phoneDigits}*)&limit=1`;
      console.log('Searching Supabase for phone:', phone10);
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const existingLeads = await searchResponse.json();
      console.log('Found existing leads:', existingLeads.length);
      
      if (existingLeads && existingLeads.length > 0) {
        const lead = existingLeads[0];
        const existingMessage = lead.message || '';
        const updatedMessage = existingMessage 
          ? existingMessage + '\n\n' + callNotes 
          : callNotes;
        
        const updateUrl = `${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}`;
        
        const updateResponse = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            message: updatedMessage,
            status: 'contacted'
          })
        });
        
        console.log('Supabase UPDATE status:', updateResponse.status);
        if (updateResponse.ok) {
          console.log('✅ SUPABASE UPDATE SUCCESSFUL — Lead:', lead.name, '(ID:', lead.id, ')');
        } else {
          console.error('❌ SUPABASE UPDATE ERROR:', await updateResponse.text());
        }
      } else {
        console.log('No existing lead found, creating new one...');
        
        const insertUrl = `${SUPABASE_URL}/rest/v1/leads`;
        const newLead = {
          name: customer.name || structuredData.email || 'Unknown (AI Call)',
          email: structuredData.email || '',
          phone: rawPhone,
          source: 'AI Call (Aria)',
          status: 'contacted',
          message: callNotes
        };
        
        const insertResponse = await fetch(insertUrl, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(newLead)
        });
        
        console.log('Supabase INSERT status:', insertResponse.status);
        if (insertResponse.ok) {
          console.log('✅ SUPABASE INSERT SUCCESSFUL — New lead created');
        } else {
          console.error('❌ SUPABASE INSERT ERROR:', await insertResponse.text());
        }
      }
    } catch (supaErr) {
      console.error('❌ SUPABASE PUSH ERROR:', supaErr);
    }
  } else {
    console.log('Skipping Supabase - Service Key:', !!SUPABASE_SERVICE_KEY, 'Phone:', customer.number);
  }
  
  // ========================================
  // PUSH TO FUB
  // ========================================
  if (FUB_API_KEY && structuredData.email) {
    console.log('=== PUSHING TO FUB ===');
    
    try {
      const fubPayload = {
        source: 'Iron 65 AI Call',
        type: 'Note',
        message: `AI Call Completed:\n${callNotes}`,
        person: {
          emails: [{ value: structuredData.email }],
          phones: customer.number ? [{ value: customer.number }] : [],
          name: customer.name || 'Unknown'
        }
      };
      
      const fubResponse = await fetch('https://api.followupboss.com/v1/events', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
          'Content-Type': 'application/json',
          'X-System': 'EmporionPros',
          'X-System-Key': 'emporionpros2026'
        },
        body: JSON.stringify(fubPayload)
      });
      
      const fubResult = await fubResponse.text();
      console.log('FUB Response:', fubResponse.status, fubResult);
      
      if (fubResponse.ok) {
        console.log('✅ FUB PUSH SUCCESSFUL');
      } else {
        console.error('❌ FUB ERROR:', fubResult);
      }
    } catch (fubErr) {
      console.error('❌ FUB PUSH ERROR:', fubErr);
    }
  } else {
    console.log('Skipping FUB - API Key:', !!FUB_API_KEY, 'Email:', structuredData.email);
  }
  
  console.log('=== PROCESS CALL REPORT END ===');
}
