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

    console.log('Top-level keys:', Object.keys(webhook).join(', '));
    console.log('Message keys:', Object.keys(message).join(', '));
    if (message.type) console.log('message.type:', message.type);
    if (message.status) console.log('message.status:', message.status);
    if (webhook.type) console.log('webhook.type:', webhook.type);
    if (webhook.status) console.log('webhook.status:', webhook.status);

    var isEndOfCallReport = message.type === 'end-of-call-report' || webhook.type === 'end-of-call-report';
    var isStatusEnded = (message.type === 'status-update' && message.status === 'ended') ||
                        (webhook.type === 'status-update' && (webhook.status === 'ended' || (message && message.status === 'ended')));
    var isCallCompleted = message.type === 'call.completed' || webhook.type === 'call.completed' ||
                          message.type === 'call-ended' || webhook.type === 'call-ended';

    console.log('Is end-of-call-report?', isEndOfCallReport);
    console.log('Is status-update ended?', isStatusEnded);
    console.log('Is call completed?', isCallCompleted);

    if (isEndOfCallReport) {
      console.log('Processing end-of-call report...');
      try {
        await processCallReport(webhook, FUB_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY);
      } catch (err) {
        console.error('Process error:', err);
      }
    } else if (isStatusEnded || isCallCompleted) {
      console.log('Processing status-update/completed - fetching call details from VAPI...');
      try {
        var VAPI_API_KEY = process.env.VAPI_API_KEY;
        var call = message.call || webhook.call || {};
        var callId = call.id || message.callId || webhook.callId || message.call_id || webhook.call_id;

        console.log('Call ID found:', callId);
        console.log('VAPI_API_KEY set:', !!VAPI_API_KEY);

        if (callId && VAPI_API_KEY) {
          console.log('Waiting 5 seconds for VAPI analysis...');
          await new Promise(function(resolve) { setTimeout(resolve, 5000); });

          var callDetailsResponse = await fetch('https://api.vapi.ai/call/' + callId, {
            headers: { 'Authorization': 'Bearer ' + VAPI_API_KEY }
          });

          console.log('VAPI call details response:', callDetailsResponse.status);

          if (callDetailsResponse.ok) {
            var callDetails = await callDetailsResponse.json();
            console.log('Got call details. Has analysis?', !!callDetails.analysis);
            console.log('Analysis keys:', callDetails.analysis ? Object.keys(callDetails.analysis).join(', ') : 'none');

            var reconstructed = {
              message: {
                type: 'end-of-call-report',
                analysis: callDetails.analysis || {},
                call: callDetails,
                customer: callDetails.customer || call.customer || {}
              }
            };

            await processCallReport(reconstructed, FUB_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY);
          } else {
            var errText = await callDetailsResponse.text();
            console.error('Failed to fetch VAPI call details:', callDetailsResponse.status, errText);
          }
        } else {
          console.log('Cannot fetch call details. callId:', callId, 'VAPI key set:', !!VAPI_API_KEY);
        }
      } catch (err) {
        console.error('Status-update process error:', err);
      }
    } else {
      console.log('Skipping - not a call-end event. Type:', message.type || webhook.type);
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
  var timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

  var bullets = [];

  if (cleanEmail) bullets.push('Email: ' + cleanEmail);
  if (structuredData.budget) bullets.push('Budget: ' + structuredData.budget);
  if (structuredData.moveDate) bullets.push('Move Date: ' + structuredData.moveDate);
  if (structuredData.bedroomsNeeded) bullets.push('Bedrooms: ' + structuredData.bedroomsNeeded);
  if (structuredData.unitTypeDiscussed) bullets.push('Unit Type: ' + structuredData.unitTypeDiscussed);
  if (structuredData.income) bullets.push('Income: ' + structuredData.income);
  if (structuredData.credit) bullets.push('Credit: ' + structuredData.credit);

  if (structuredData.tourBooked) {
    var tourInfo = 'Tour Booked: Yes';
    if (structuredData.tourType) tourInfo += ' (' + structuredData.tourType + ')';
    if (structuredData.tourDay) tourInfo += ' - ' + structuredData.tourDay;
    if (structuredData.tourTime) tourInfo += ' at ' + structuredData.tourTime;
    bullets.push(tourInfo);
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

  var notes = '[AI Call - Aria] ' + timestamp + '\n';
  notes += '---\n';
  notes += bullets.map(function(b) { return '- ' + b; }).join('\n');

  var sideNotes = [];
  if (structuredData.additionalNotes) sideNotes.push(structuredData.additionalNotes);
  if (customer.number) sideNotes.push('Phone: ' + customer.number);

  if (sideNotes.length > 0) {
    notes += '\n\nSide Notes:\n' + sideNotes.map(function(n) { return '  - ' + n; }).join('\n');
  }

  if (summary) {
    notes += '\n\nSummary: ' + summary;
  }

  return notes;
}

// ========================================
// MAIN PROCESSING
// ========================================
async function processCallReport(webhook, FUB_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY) {
  console.log('=== PROCESS CALL REPORT START ===');

  var message = webhook.message || webhook;
  var analysis = message.analysis || {};
  var structuredData = analysis.structuredData || {};
  var summary = analysis.summary || '';

  var call = message.call || webhook.call || {};
  var customer = call.customer || message.customer || {};

  if (!customer.number && message.phoneNumber) customer.number = message.phoneNumber;
  if (!customer.number && call.phoneNumber) customer.number = call.phoneNumber;

  console.log('Customer:', JSON.stringify(customer));
  console.log('Structured data:', JSON.stringify(structuredData));

  var cleanEmail = cleanupTranscribedEmail(structuredData.email);
  console.log('Raw email:', structuredData.email, '-> Cleaned:', cleanEmail);

  var callNotes = formatCallNotes(structuredData, customer, cleanEmail, summary);
  console.log('Formatted notes:\n', callNotes);

  // ========================================
  // SEND SMS
  // ========================================
  if (customer.number) {
    console.log('=== SENDING SMS ===');
    try {
      var smsPayload = {
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

      var smsResponse = await fetch('https://emporionpros.com/.netlify/functions/send-tour-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smsPayload)
      });

      console.log('SMS Response:', smsResponse.status);
      if (smsResponse.ok) {
        console.log('[OK] SMS SENT');
      } else {
        console.error('[ERR] SMS FAILED:', await smsResponse.text());
      }
    } catch (smsError) {
      console.error('[ERR] SMS ERROR:', smsError);
    }
  }

  // ========================================
  // SEND EMAIL
  // ========================================
  if (structuredData.tourBooked && cleanEmail) {
    console.log('=== SENDING TOUR EMAIL ===');
    try {
      var displayName = customer.name || 'there';
      var tourDay = structuredData.tourDay || 'your scheduled date';
      var tourTime = structuredData.tourTime || 'your scheduled time';
      var tourDateTime = tourTime ? tourDay + ' at ' + tourTime : tourDay;
      var isVirtual = (structuredData.tourType || '').toLowerCase().includes('virtual');
      var subjectPrefix = isVirtual ? 'Virtual Tour' : 'In Person Tour';

      var emailBody = 'Hi ' + displayName + ',\n\n' +
        'Thank you for speaking with Aria! We are excited to confirm your ' +
        (isVirtual ? 'virtual' : 'in-person') + ' apartment tour.\n\n' +
        'TOUR DETAILS:\n' +
        tourDateTime;

      if (isVirtual) {
        emailBody += '\nVirtual Tour - we will send you a video call link before your appointment.';
      } else {
        emailBody += '\n65 McWhorter Street, Newark, NJ 07105\nPlease arrive 5 minutes early.';
      }

      if (structuredData.needsCosigner) {
        emailBody += '\n\nCOSIGNER INFO: We will have our cosigner assistance service available to discuss your options during the tour.';
      }

      emailBody += '\n\nIf you need to reschedule or have any questions, simply reply to this email or give us a call.\n\n' +
        'EmporionPros - Rosalia Group\nhttps://emporionpros.com';

      var emailPayload = {
        email: cleanEmail,
        subject: subjectPrefix + ' Iron 65 - ' + tourDateTime,
        body: emailBody
      };

      var emailResponse = await fetch('https://emporionpros.com/.netlify/functions/send-tour-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      console.log('Email Response:', emailResponse.status);
      if (emailResponse.ok) {
        console.log('[OK] EMAIL SENT');
      } else {
        console.error('[ERR] EMAIL FAILED:', await emailResponse.text());
      }
    } catch (emailError) {
      console.error('[ERR] EMAIL ERROR:', emailError);
    }
  }

  // ========================================
  // PUSH TO SUPABASE
  // ========================================
  var leadId = null;
  if (SUPABASE_SERVICE_KEY && customer.number) {
    console.log('=== PUSHING TO SUPABASE ===');

    try {
      var rawPhone = customer.number;
      var phoneDigits = rawPhone.replace(/[^0-9]/g, '');
      var phone10 = phoneDigits.length === 11 && phoneDigits[0] === '1' ? phoneDigits.slice(1) : phoneDigits;

      var searchUrl = SUPABASE_URL + '/rest/v1/leads?or=(phone.ilike.*' + phone10 + '*,phone.ilike.*' + phoneDigits + '*)&limit=1';

      var searchResponse = await fetch(searchUrl, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json'
        }
      });

      var existingLeads = await searchResponse.json();
      console.log('Found existing leads:', existingLeads.length);

      if (existingLeads && existingLeads.length > 0) {
        var lead = existingLeads[0];
        leadId = lead.id;
        var existingMessage = lead.message || '';
        var updatedMessage = existingMessage
          ? existingMessage + '\n\n' + callNotes
          : callNotes;

        var updateUrl = SUPABASE_URL + '/rest/v1/leads?id=eq.' + lead.id;

        var updatePayload = {
          message: updatedMessage,
          status: 'contacted'
        };

        if (cleanEmail && !lead.email) {
          updatePayload.email = cleanEmail;
        }

        var updateResponse = await fetch(updateUrl, {
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
          console.log('[OK] SUPABASE UPDATED - Lead:', lead.name, '(ID:', lead.id, ')');
        } else {
          console.error('[ERR] SUPABASE UPDATE ERROR:', await updateResponse.text());
        }
      } else {
        console.log('No existing lead, creating new...');

        var newLead = {
          name: customer.name || cleanEmail || 'Unknown (AI Call)',
          email: cleanEmail || '',
          phone: rawPhone,
          source: 'AI Call (Aria)',
          status: 'new',
          message: callNotes
        };

        var insertResponse = await fetch(SUPABASE_URL + '/rest/v1/leads', {
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
          var inserted = await insertResponse.json();
          if (inserted && inserted.length > 0) leadId = inserted[0].id;
          console.log('[OK] SUPABASE INSERT - New lead created, ID:', leadId);
        } else {
          console.error('[ERR] SUPABASE INSERT ERROR:', await insertResponse.text());
        }
      }
    } catch (supaErr) {
      console.error('[ERR] SUPABASE ERROR:', supaErr);
    }
  }

  // ========================================
  // CREATE APPOINTMENT IN SUPABASE (if tour booked)
  // ========================================
  if (structuredData.tourBooked && SUPABASE_SERVICE_KEY) {
    console.log('=== CREATING APPOINTMENT ===');
    try {
      var appointmentDate = parseTourDay(structuredData.tourDay);
      var appointmentTime = parseTourTime(structuredData.tourTime);

      var appointment = {
        lead_id: leadId || null,
        client_name: customer.name || cleanEmail || 'AI Call Lead',
        client_email: cleanEmail || null,
        client_phone: customer.number || null,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        type: 'tour',
        status: 'confirmed',
        notes: 'Booked via AI call (Aria). ' + ((structuredData.tourType || '').toLowerCase().includes('virtual') ? 'VIRTUAL TOUR. ' : '') + (structuredData.bedroomsNeeded ? structuredData.bedroomsNeeded + ' BR, ' : '') + (structuredData.budget ? 'Budget: ' + structuredData.budget : '')
      };

      console.log('Appointment payload:', JSON.stringify(appointment));

      var apptResponse = await fetch(SUPABASE_URL + '/rest/v1/appointments', {
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
        console.log('[OK] APPOINTMENT CREATED:', appointmentDate, appointmentTime);
      } else {
        var errText = await apptResponse.text();
        console.error('[ERR] APPOINTMENT ERROR:', apptResponse.status, errText);
      }
    } catch (apptErr) {
      console.error('[ERR] APPOINTMENT ERROR:', apptErr);
    }
  }

  // ========================================
  // PUSH TO FUB
  // ========================================
  if (FUB_API_KEY && (cleanEmail || customer.number)) {
    console.log('=== PUSHING TO FUB ===');

    try {
      var person = {
        phones: customer.number ? [{ value: customer.number }] : [],
        name: customer.name || 'Unknown'
      };

      if (cleanEmail) {
        person.emails = [{ value: cleanEmail }];
      }

      var fubPayload = {
        source: 'Iron 65 AI Call',
        type: 'Note',
        message: 'AI Call Completed:\n' + callNotes,
        person: person
      };

      var fubResponse = await fetch('https://api.followupboss.com/v1/events', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
          'Content-Type': 'application/json',
          'X-System': 'EmporionPros',
          'X-System-Key': 'emporionpros2026'
        },
        body: JSON.stringify(fubPayload)
      });

      var fubResult = await fubResponse.text();
      console.log('FUB Response:', fubResponse.status);

      if (fubResponse.ok) {
        console.log('[OK] FUB PUSH SUCCESSFUL');
      } else {
        if (fubResult.includes('email') && cleanEmail) {
          console.log('FUB rejected email, retrying phone only...');
          delete fubPayload.person.emails;

          var retryResponse = await fetch('https://api.followupboss.com/v1/events', {
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
            console.log('[OK] FUB PUSH (phone only)');
          } else {
            console.error('[ERR] FUB RETRY ERROR:', await retryResponse.text());
          }
        } else {
          console.error('[ERR] FUB ERROR:', fubResult);
        }
      }
    } catch (fubErr) {
      console.error('[ERR] FUB ERROR:', fubErr);
    }
  }

  console.log('=== PROCESS CALL REPORT END ===');
}

// ========================================
// PARSE TOUR DAY INTO DATE STRING
// ========================================
function parseTourDay(tourDay) {
  if (!tourDay) return new Date().toISOString().split('T')[0];

  var lower = tourDay.toLowerCase().trim();
  var today = new Date();

  var dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  if (lower === 'today') {
    return today.toISOString().split('T')[0];
  }

  if (lower === 'tomorrow') {
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  }

  for (var i = 0; i < dayNames.length; i++) {
    if (lower.includes(dayNames[i])) {
      var targetDay = i;
      var currentDay = today.getDay();
      var daysAhead = targetDay - currentDay;
      if (daysAhead <= 0) daysAhead += 7;
      if (lower.includes('next')) daysAhead += 7;
      today.setDate(today.getDate() + daysAhead);
      return today.toISOString().split('T')[0];
    }
  }

  var parsed = new Date(tourDay);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return tourDay;
}

// ========================================
// PARSE TOUR TIME INTO HH:MM:SS FORMAT
// ========================================
function parseTourTime(tourTime) {
  if (!tourTime) return '12:00:00';

  var lower = tourTime.toLowerCase().trim();

  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(lower)) {
    return lower.length <= 5 ? lower + ':00' : lower;
  }

  var match = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/);
  if (match) {
    var hour = parseInt(match[1]);
    var minutes = match[2] || '00';
    var ampm = match[3] || '';

    if (ampm.startsWith('p') && hour < 12) hour += 12;
    if (ampm.startsWith('a') && hour === 12) hour = 0;

    return String(hour).padStart(2, '0') + ':' + minutes + ':00';
  }

  return '12:00:00';
}

// ========================================
// CLEAN TRANSCRIBED EMAIL
// ========================================
function cleanupTranscribedEmail(raw) {
  if (!raw) return null;

  var email = raw.trim().toLowerCase();

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
