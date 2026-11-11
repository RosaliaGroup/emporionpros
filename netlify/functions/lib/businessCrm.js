// Push Emporion Pros outreach businesses (outreach_prospects) to the Business
// CRM in Abrevo (app.abrevo.co/business), where they sit next to Abrevo's own
// B2B contacts and apart from the Rosalia renter CRM.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY (this site's database),
//      BUSINESS_SYNC_SECRET (shared with Abrevo's business-sync function),
//      BUSINESS_SYNC_URL (optional; defaults to Abrevo's endpoint).
const DEFAULT_URL = 'https://app.abrevo.co/.netlify/functions/business-sync';
const COLS = 'id,business_name,contact_name,category,phone,email,website,address,city,county,status,'
  + 'vendor_profile_interest,vendor_id,call_summary,call_attempts,last_called_at';

function businessType(p) {
  const cat = String(p.category || '').toLowerCase();
  const name = String(p.business_name || '').toLowerCase();
  if (/property manag/.test(cat) || (!cat && /property manag|apartments|realty manag/.test(name))) return 'property_manager';
  if (/developer|development/.test(cat)) return 'developer';
  if (/real estate agent|broker|realtor/.test(cat)) return 'agent';
  if (cat) return 'vendor';
  return 'unknown';
}

function stage(p) {
  if (p.status === 'do_not_call') return 'do_not_contact';
  if (p.vendor_id) return 'profile_created';
  if (p.vendor_profile_interest) return 'interested';
  if (['called', 'completed', 'no_answer'].includes(p.status)) return 'contacted';
  return 'new';
}

// Keep the AI summary and the end reason; the raw transcript stays here.
function summaryOf(s) {
  const t = String(s || '');
  if (!t) return null;
  const m = t.match(/^SUMMARY:\s*([\s\S]*?)\n\nENDED:\s*([^\n]*)/);
  if (m) return (m[1].trim() + (m[2] ? `\n\nCall ended: ${m[2].trim()}` : '')).slice(0, 4000);
  return t.slice(0, 1500);
}

function toContact(p) {
  return {
    source_id: String(p.id),
    business_name: p.business_name,
    contact_name: p.contact_name,
    business_type: businessType(p),
    category: p.category,
    phone: p.phone,
    email: p.email,
    website: p.website,
    address: p.address,
    city: p.city,
    county: p.county,
    stage: stage(p),
    call_summary: summaryOf(p.call_summary),
    call_attempts: p.call_attempts || 0,
    last_called_at: p.last_called_at,
  };
}

async function readProspects(filter) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  const out = [];
  for (let from = 0; from < 20000; from += 500) {
    const res = await fetch(`${url}/rest/v1/outreach_prospects?select=${COLS}${filter ? '&' + filter : ''}&order=id.asc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 499}`, 'Range-Unit': 'items' },
    });
    if (!res.ok) throw new Error(`read_${res.status}`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < 500) break;
  }
  return out;
}

async function push(prospects) {
  const secret = process.env.BUSINESS_SYNC_SECRET;
  if (!secret) throw new Error('BUSINESS_SYNC_SECRET not set');
  const url = process.env.BUSINESS_SYNC_URL || DEFAULT_URL;
  let sent = 0;
  for (let i = 0; i < prospects.length; i += 300) {
    const batch = prospects.slice(i, i + 300).map(toContact);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
      body: JSON.stringify({ contacts: batch }),
    });
    if (!res.ok) throw new Error(`push_${res.status} ${(await res.text()).slice(0, 120)}`);
    sent += batch.length;
  }
  return sent;
}

module.exports = { readProspects, push, toContact, businessType, stage, summaryOf };
