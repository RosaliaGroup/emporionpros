// ============================================
// EMPORIONPROS — Register FUB Webhooks
// Run this ONCE to register webhooks in FUB
//
// Usage: 
//   FUB_API_KEY=your_key SITE_URL=https://emporionpros.com node register-fub-webhooks.js
//
// This tells FUB: "When a lead is created/updated,
// POST to our Netlify function at /fub-webhook"
// ============================================

const FUB_API_KEY = process.env.FUB_API_KEY;
const SITE_URL = process.env.SITE_URL || 'https://emporionpros.com';

if (!FUB_API_KEY) {
  console.error('ERROR: Set FUB_API_KEY environment variable');
  process.exit(1);
}

const WEBHOOK_URL = `${SITE_URL}/.netlify/functions/fub-webhook`;

const webhooks = [
  { event: 'peopleCreated',      url: WEBHOOK_URL },
  { event: 'peopleUpdated',      url: WEBHOOK_URL },
  { event: 'peopleStageUpdated', url: WEBHOOK_URL }
];

async function registerWebhooks() {
  console.log('Registering FUB webhooks...');
  console.log('Webhook URL:', WEBHOOK_URL);
  console.log('');

  // First, list existing webhooks to avoid duplicates
  const listRes = await fetch('https://api.followupboss.com/v1/webhooks', {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
      'X-System': 'EmporionPros',
      'X-System-Key': 'emporionpros2026'
    }
  });

  if (listRes.ok) {
    const existing = await listRes.json();
    console.log('Existing webhooks:', JSON.stringify(existing, null, 2));
    console.log('');
  }

  // Register each webhook
  for (const wh of webhooks) {
    console.log(`Registering: ${wh.event} → ${wh.url}`);

    const res = await fetch('https://api.followupboss.com/v1/webhooks', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(FUB_API_KEY + ':').toString('base64'),
        'Content-Type': 'application/json',
        'X-System': 'EmporionPros',
        'X-System-Key': 'emporionpros2026'
      },
      body: JSON.stringify({
        event: wh.event,
        url: wh.url
      })
    });

    const data = await res.text();
    if (res.ok) {
      console.log(`  ✅ Registered: ${wh.event}`);
    } else {
      console.log(`  ❌ Failed (${res.status}): ${data}`);
    }
  }

  console.log('\nDone! Webhooks registered.');
  console.log('Test by creating a lead in FUB — it should appear in Supabase.');
}

registerWebhooks().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
