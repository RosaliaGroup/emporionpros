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
    const webhook = JSON.parse(event.body || '{}');
    
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Full webhook:', JSON.stringify(webhook, null, 2));
    
    // RESPOND IMMEDIATELY
    const response = {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };
    
    // Check for status-update with ended status OR end-of-call-report
    const message = webhook.message || {};
    const isCallEnded = (message.type === 'status-update' && message.status === 'ended') || 
                        message.type === 'end-of-call-report';
    
    console.log('Message type:', message.type);
    console.log('Message status:', message.status);
    console.log('Is call ended?', isCallEnded);
    
    // Process async AFTER responding
    if (isCallEnded) {
      console.log('Processing ended call...');
      processCallReport(webhook, FUB_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY).catch(err => {
        console.error('Process error:', err);
      });
    } else {
      console.log('Skipping - not an ended call event');
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

async function processCallReport(webhook, FUB_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY) {
  console.log('=== PROCESS CALL REPORT START ===');
  
  // The data is in webhook.call
  const call = webhook.call || {};
  const customer = call.customer || webhook.customer || {};
  
  console.log('Customer:', customer);
  
  // Wait for Vapi analysis to complete
  console.log('Waiting 3 seconds for Vapi analysis...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Fetch the call details to get the analysis
  const VAPI_API_KEY = process.env.VAPI_API_KEY;
  const callId = call.id || webhook.message?.call?.id;
  
  console.log('Call ID:', callId);
  
  if (!callId) {
    console.error('No call ID found');
    return;
  }
  
  try {
    // Fetch call details from Vapi to get analysis
    const callDetailsResponse = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: {
        'Authorization': 'Bearer ' + VAPI_API_KEY
      }
    });
    
    if (!callDetailsResponse.ok) {
      console.error('Failed to fetch call details:', await callDetailsResponse.text());
      return;
    }
    
    const callDetails = await callDetailsResponse.json();
    console.log('Call details fetched successfully');
    
    const analysis = callDetails.analysis || {};
    const structuredData = analysis.structuredData || {};
    const summary = analysis.summary || '';
    
    console.log('Structured data:', structuredData);
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
      console.log('To:', customer.number);
      console.log('Email:', structuredData.email);
      console.log('Tour:', structuredData.tourDay, 'at', structuredData.tourTime);
      
      try {
        const smsPayload = {
          phone: customer.number,
          email: structuredData.email || '',
          name: customer.name || 'there',
          tourDay: structuredData.tourDay || 'your scheduled date',
          tourTime: structuredData.tourTime || 'your scheduled time',
          needsCosigner: structuredData.needsCosigner || false
        };
        
        console.log('SMS Payload:', smsPayload);
        
        const smsResponse = await fetch('https://emporionpros.com/.netlify/functions/send-tour-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(smsPayload)
        });
        
        const smsResult = await smsResponse.text();
        console.log('SMS Response Status:', smsResponse.status);
        console.log('SMS Response:', smsResult);
        
        if (smsResponse.ok) {
          console.log('✅ SMS SENT SUCCESSFULLY');
        } else {
          console.error('❌ SMS FAILED:', smsResult);
        }
      } catch (smsError) {
        console.error('❌ SMS ERROR:', smsError);
      }
    } else {
      console.log('Skipping SMS - tourBooked:', structuredData.tourBooked, 'customer.number:', customer.number);
    }
    
    // ========================================
    // PUSH TO SUPABASE (EmporionPros leads)
    // ========================================
    if (SUPABASE_SERVICE_KEY && customer.number) {
      console.log('=== PUSHING TO SUPABASE ===');
      
      try {
        // Normalize phone: strip to digits for matching
        const rawPhone = customer.number;
        const phoneDigits = rawPhone.replace(/[^0-9]/g, '');
        // Try multiple phone formats for matching
        const phone10 = phoneDigits.length === 11 && phoneDigits[0] === '1' ? phoneDigits.slice(1) : phoneDigits;
        
        // Search for existing lead by phone (try multiple formats)
        // Use ilike with wildcards to match regardless of formatting
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
          // UPDATE existing lead — append call notes to message
          const lead = existingLeads[0];
          const existingMessage = lead.message || '';
          const updatedMessage = existingMessage 
            ? existingMessage + '\n\n' + callNotes 
            : callNotes;
          
          // Also update status to 'contacted'
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
            const errText = await updateResponse.text();
            console.error('❌ SUPABASE UPDATE ERROR:', errText);
          }
          
        } else {
          // INSERT new lead if no match found
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
            const errText = await insertResponse.text();
            console.error('❌ SUPABASE INSERT ERROR:', errText);
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
        
        console.log('FUB Payload:', JSON.stringify(fubPayload, null, 2));
        
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
        console.log('FUB Response Status:', fubResponse.status);
        console.log('FUB Response:', fubResult);
        
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
    
  } catch (fetchErr) {
    console.error('Error fetching call details:', fetchErr);
  }
}
