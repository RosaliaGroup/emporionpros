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
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('HTTP Method:', event.httpMethod);

    let webhook = {};
    let rawBody = event.body || '';

    if (event.isBase64Encoded && rawBody) {
      rawBody = Buffer.from(rawBody, 'base64').toString('utf-8');
    }

    if (typeof rawBody === 'string' && rawBody.length > 0) {
      try {
        webhook = JSON.parse(rawBody);
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr.message);
      }
    } else if (typeof rawBody === 'object') {
      webhook = rawBody;
    }

    const response = {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };

    const message = webhook.message || webhook;
    const isEndOfCallReport = message.type === 'end-of-call-report' || webhook.type === 'end-of-call-report';

    console.log('Message type:', message.type || webhook.type);
    console.log('Is end-of-call-report?', isEndOfCallReport);

    if (isEndOfCallReport) {
      console.log('Processing end-of-call report...');
      try {
        await processCallReport(webhook, FUB_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY);
      } catch (err) {
        console.error('Process error:', err);
      }
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

// ========================================
// FORMAT CALL NOTES AS BULLET POINTS
// ========================================
function formatCallNotes(structuredData, customer, cleanEmail, summary) {
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  
  // Build bullet points — only include fields that have data
  const bullets = [];
  
  if (cleanEmail) bullets.push('Email: ' + cleanEmail);
  if (structuredData.budget) bullets.push('Budget: ' + structuredData.budget);
  if (structuredData.moveDate) bullets.push('Move Date: ' + structuredData.moveDate);
  if (structuredData.bedroomsNeeded) bullets.push('Bedrooms: ' + structuredData.bedroomsNeeded);
  if (structuredData.unitTypeDiscussed) bullets.push('Unit Type: ' + structuredData.unitTypeDiscussed);
  if (structuredData.income) bullets.push('Income: ' + structuredData.income);
  if (structuredData.credit) bullets.push('Credit: ' + structuredData.credit);
  
  // Tour info
  if (structuredData.tourBooked) {
    bullets.push('Tour Booked: Yes — ' + (structuredData.tourDay || '') + ' ' + (structuredData.tourTime || ''));
  } else {
    bullets.push('Tour Booked: No');
  }
  
  if (structuredData.needsCosigner) bullets.push('Needs Cosigner: Yes');
  
  if (structuredData.interested === true) {
    bullets.push('Interested: Yes');
  } else if (structuredData.interested === false) {
    bullets.push('Interested: No');
  }
  
  if (structuredData.concerns) bullets.push('Concerns: ' + structuredData.concerns);

  // Build the formatted message
  let notes = '🤖 AI Call (Aria) — ' + timestamp + '\n';
  notes += '---\n';
  notes += bullets.map(b => '• ' + b).join('\n');
  
  // Side notes section — additional info that doesn't fit the main fields
  const sideNotes = [];
  if (structuredData.additionalNotes) sideNotes.push(structuredData.additionalNotes);
  if (customer.number) sideNotes.push('Phone: ' + customer.number);
  
  if (sideNotes.length > 0) {
    notes += '\n\n📌 Side Notes:\n' + sideNotes.map(n => '  — ' + n).join('\n');
  }
  
  // Summary
  if (summary) {
    notes += '\n\n📝 Summary: ' + summary;
  }
  
  return notes;
}

// ========================================
// MAIN PROCESSING
// ========================================
async function processCallReport(webhook, FUB_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY) {
  console.log('=== PROCESS CALL REPORT START ===');

  const message = webhook.message || webhook;
  const analysis = message.analysis || {};
  const structuredData = analysis.structuredData || {};
  const summary = analysis.summary || '';

  const call = message.call || webhook.call || {};
  const customer = call.customer || message.customer || {};

  if (!customer.number && message.phoneNumber) customer.number = message.phoneNumber;
  if (!customer.number && call.phoneNumber) customer.number = call.phoneNumber;

  console.log('Customer:', JSON.stringify(customer));
  console.log('Structured data:', JSON.stringify(structuredData));

  const cleanEmail = cleanupTranscribedEmail(structuredData.email);
  console.log('Raw email:', structuredData.email, '→ Cleaned:', cleanEmail);

  // Format notes as bullet points
  const callNotes = formatCallNotes(structuredData, customer, cleanEmail, summary);
  console.log('Formatted notes:\n', callNotes);

  // ========================================
  // SEND SMS — ALWAYS send if we have a phone (even if no email)
  // ========================================
  if (customer.number) {
    console.log('=== SENDING SMS ===');
    try {
      const smsPayload = {
        phone: customer.number,
        email: cleanEmail || '',
        name: customer.name || 'there',
        tourDay: structuredData.tourDay || 'your scheduled date',
        tourTime: structuredData.tourTime || 'your scheduled time',
        needsCosigner: structuredData.needsCosigner || false,
        tourBooked: structuredData.tourBooked || false,
        budget: structuredData.budget || '',
        bedroomsNeeded: structuredData.bedroomsNeeded || '',
        concerns: structuredData.concerns || '',
        summary: summary || ''
      };

      const smsResponse = await fetch('https://emporionpros.com/.netlify/functions/send-tour-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsPayload)
      });

      console.log('SMS Response:', smsResponse.status);
      if (smsResponse.ok) {
        console.log('✅ SMS SENT');
      } else {
        console.error('❌ SMS FAILED:', await smsResponse.text());
      }
    } catch (smsError) {
      console.error('❌ SMS ERROR:', smsError);
    }
  }

  // ========================================
  // SEND EMAIL — only if tour booked AND valid email
  // (SMS is the primary confirmation, email is bonus)
  // ========================================
  if (structuredData.tourBooked && cleanEmail) {
    console.log('=== SENDING TOUR EMAIL ===');
    try {
      const emailPayload = {
        email: cleanEmail,
        name: customer.name || 'there',
        tourDay: structuredData.tourDay || 'your scheduled date',
        tourTime: structuredData.tourTime || 'your scheduled time',
        needsCosigner: structuredData.needsCosigner || false,
        phone: customer.number || ''
      };

      const emailResponse = await fetch('https://emporionpros.com/.netlify/functions/send-tour-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      console.log('Email Response:', emailResponse.status);
      if (emailResponse.ok) {
        console.log('✅ EMAIL SENT');
      } else {
        console.error('❌ EMAIL FAILED:', await emailResponse.text());
      }
    } catch (emailError) {
      console.error('❌ EMAIL ERROR:', emailError);
    }
  }

  // ========================================
  // PUSH TO SUPABASE (leads table) — do this BEFORE appointment so we have lead_id
  // ========================================
  let leadId = null;
  if (SUPABASE_SERVICE_KEY && customer.number) {
    console.log('=== PUSHING TO SUPABASE ===');

    try {
      const rawPhone = customer.number;
      const phoneDigits = rawPhone.replace(/[^0-9]/g, '');
      const phone10 = phoneDigits.length === 11 && phoneDigits[0] === '1' ? phoneDigits.slice(1) : phoneDigits;

      const searchUrl = SUPABASE_URL + '/rest/v1/leads?or=(phone.ilike.*' + phone10 + '*,phone.ilike.*' + phoneDigits + '*)&limit=1';

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
        leadId = lead.id;
        const existingMessage = lead.message || '';
        const updatedMessage = existingMessage
          ? existingMessage + '\n\n' + callNotes
          : callNotes;

        const updateUrl = SUPABASE_URL + '/rest/v1/leads?id=eq.' + lead.id;

        const updatePayload = {
          message: updatedMessage,
          status: structuredData.tourBooked ? 'tour_booked' : 'contacted'
        };

        // Update email if we got one and lead doesn't have one
        if (cleanEmail && !lead.email) {
          updatePayload.email = cleanEmail;
        }

        const updateResponse = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(updatePayload)
        });

        console.log('Supabase UPDATE:', updateResponse.status);
        if (updateResponse.ok) {
          console.log('✅ SUPABASE UPDATED — Lead:', lead.name, '(ID:', lead.id, ')');
        } else {
          console.error('❌ SUPABASE UPDATE ERROR:', await updateResponse.text());
        }
      } else {
        console.log('No existing lead, creating new...');

        const newLead = {
          name: customer.name || cleanEmail || 'Unknown (AI Call)',
          email: cleanEmail || '',
          phone: rawPhone,
          source: 'AI Call (Aria)',
          status: structuredData.tourBooked ? 'tour_booked' : 'new',
          message: callNotes
        };

        const insertResponse = await fetch(SUPABASE_URL + '/rest/v1/leads', {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(newLead)
        });

        if (insertResponse.ok) {
          const inserted = await insertResponse.json();
          if (inserted && inserted.length > 0) leadId = inserted[0].id;
          console.log('✅ SUPABASE INSERT — New lead created, ID:', leadId);
        } else {
          console.error('❌ SUPABASE INSERT ERROR:', await insertResponse.text());
        }
      }
    } catch (supaErr) {
      console.error('❌ SUPABASE ERROR:', supaErr);
    }
  }

  // ========================================
  // CREATE APPOINTMENT IN SUPABASE (if tour booked)
  // ========================================
  if (structuredData.tourBooked && SUPABASE_SERVICE_KEY) {
    console.log('=== CREATING APPOINTMENT ===');
    try {
      const appointmentDate = parseTourDay(structuredData.tourDay);
      const appointmentTime = parseTourTime(structuredData.tourTime);
      
      const appointment = {
        client_name: customer.name || cleanEmail || 'AI Call Lead',
        client_email: cleanEmail || null,
        client_phone: customer.number || null,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        type: 'tour',
        status: 'confirmed',
        notes: 'Booked via AI call (Aria). ' + (structuredData.bedroomsNeeded ? structuredData.bedroomsNeeded + ' BR, ' : '') + (structuredData.budget ? 'Budget: ' + structuredData.budget : '')
      };

      console.log('Appointment payload:', JSON.stringify(appointment));

      const apptResponse = await fetch(SUPABASE_URL + '/rest/v1/appointments', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(appointment)
      });

      if (apptResponse.ok) {
        console.log('✅ APPOINTMENT CREATED:', appointmentDate, appointmentTime);
      } else {
        const errText = await apptResponse.text();
        console.error('❌ APPOINTMENT ERROR:', apptResponse.status, errText);
      }
    } catch (apptErr) {
      console.error('❌ APPOINTMENT ERROR:', apptErr);
    }
  }

  // ========================================
  // PUSH TO FUB
  // ========================================
  if (FUB_API_KEY && (cleanEmail || customer.number)) {
    console.log('=== PUSHING TO FUB ===');

    try {
      const person = {
        phones: customer.number ? [{ value: customer.number }] : [],
        name: customer.name || 'Unknown'
      };

      if (cleanEmail) {
        person.emails = [{ value: cleanEmail }];
      }

      const fubPayload = {
        source: 'Iron 65 AI Call',
        type: 'Note',
        message: 'AI Call Completed:\n' + callNotes,
        person
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
      console.log('FUB Response:', fubResponse.status);

      if (fubResponse.ok) {
        console.log('✅ FUB PUSH SUCCESSFUL');
      } else {
        // Retry without email if it caused the error
        if (fubResult.includes('email') && cleanEmail) {
          console.log('FUB rejected email, retrying phone only...');
          delete fubPayload.person.emails;

          const retryResponse = await fetch('https://api.followupboss.com/v1/events', {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
              'Content-Type': 'application/json',
              'X-System': 'EmporionPros',
              'X-System-Key': 'emporionpros2026'
            },
            body: JSON.stringify(fubPayload)
          });

          if (retryResponse.ok) {
            console.log('✅ FUB PUSH (phone only)');
          } else {
            console.error('❌ FUB RETRY ERROR:', await retryResponse.text());
          }
        } else {
          console.error('❌ FUB ERROR:', fubResult);
        }
      }
    } catch (fubErr) {
      console.error('❌ FUB ERROR:', fubErr);
    }
  }

  console.log('=== PROCESS CALL REPORT END ===');
}

// ========================================
// PARSE TOUR DAY INTO DATE STRING
// ========================================
function parseTourDay(tourDay) {
  if (!tourDay) return new Date().toISOString().split('T')[0];
  
  const lower = tourDay.toLowerCase().trim();
  const today = new Date();
  
  // Day names
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  if (lower === 'today') {
    return today.toISOString().split('T')[0];
  }
  
  if (lower === 'tomorrow') {
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  }
  
  // "this friday", "friday", "next friday"
  for (let i = 0; i < dayNames.length; i++) {
    if (lower.includes(dayNames[i])) {
      const targetDay = i;
      const currentDay = today.getDay();
      let daysAhead = targetDay - currentDay;
      if (daysAhead <= 0) daysAhead += 7;
      if (lower.includes('next')) daysAhead += 7;
      today.setDate(today.getDate() + daysAhead);
      return today.toISOString().split('T')[0];
    }
  }
  
  // Try parsing as a date string
  const parsed = new Date(tourDay);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  
  // Fallback — return the raw string (dashboard will display it)
  return tourDay;
}

// ========================================
// PARSE TOUR TIME INTO HH:MM:SS FORMAT
// ========================================
function parseTourTime(tourTime) {
  if (!tourTime) return '12:00:00';
  
  const lower = tourTime.toLowerCase().trim();
  
  // Already in HH:MM format
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(lower)) {
    return lower.length <= 5 ? lower + ':00' : lower;
  }
  
  // Match patterns like "3 PM", "3PM", "3:00 PM", "10 AM", "10:30am"
  const match = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/);
  if (match) {
    let hour = parseInt(match[1]);
    const minutes = match[2] || '00';
    const ampm = match[3] || '';
    
    if (ampm.startsWith('p') && hour < 12) hour += 12;
    if (ampm.startsWith('a') && hour === 12) hour = 0;
    
    return String(hour).padStart(2, '0') + ':' + minutes + ':00';
  }
  
  // Fallback
  return '12:00:00';
}

// ========================================
// CLEAN TRANSCRIBED EMAIL
// ========================================
function cleanupTranscribedEmail(raw) {
  if (!raw) return null;

  let email = raw.trim().toLowerCase();

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return email;
  }

  email = email
    .replace(/\s+at\s+/g, '@')
    .replace(/\s+dot\s+/g, '.')
    .replace(/\s+period\s+/g, '.')
    .replace(/g\s*mail/gi, 'gmail')
    .replace(/hot\s*mail/gi, 'hotmail')
    .replace(/out\s*look/gi, 'outlook')
    .replace(/ya\s*hoo/gi, 'yahoo')
    .replace(/i\s*cloud/gi, 'icloud')
    .replace(/\s+/g, '')
    .replace(/@+/g, '@');

  if (email.includes('@') && !email.includes('.')) {
    email = email + '.com';
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return email;
  }

  console.log('Could not parse email from:', raw);
  return null;
}
