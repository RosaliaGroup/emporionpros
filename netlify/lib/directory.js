// Directory call routing: callers reach vendors THROUGH Emporion Pros so every contact is a tracked lead.
const SB = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
const MAIN_ASSISTANT_ID = 'f17ea5bb-4cbb-4a7d-b7b6-fb39645b0ec9'; // "Emporion Pros — Aria" on (862) 369-0005

const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const sb = async (p, o = {}) => { const r = await fetch(SB + '/rest/v1/' + p, { ...o, headers: { ...H, ...(o.headers || {}) } }); const t = await r.text(); let d = null; try { d = t ? JSON.parse(t) : null; } catch (e) { d = t; } return { ok: r.ok, data: d }; };

function e164(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10) d = '1' + d;
  return d.length === 11 && d[0] === '1' ? '+' + d : null;
}

async function findVendors(query) {
  const q = String(query || '').trim();
  if (!q) return [];
  const ref = q.match(/\d+/);
  let rows = [];
  if (ref && q.replace(/[^a-z]/gi, '').length < 4) {
    rows = (await sb(`vendors?select=id,business_name,category,city&status=in.(active,test)&id=eq.${Number(ref[0])}`)).data || [];
  }
  if (!rows.length) {
    const words = q.toLowerCase().replace(/[^a-z0-9 &']/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !['the', 'and', 'llc', 'inc', 'company', 'services'].includes(w)).slice(0, 4);
    if (!words.length) return [];
    const or = words.map((w) => `business_name.ilike.*${w}*,category.ilike.*${w}*`).join(',');
    rows = (await sb(`vendors?select=id,business_name,category,city&status=in.(active,test)&or=(${encodeURIComponent(or)})&limit=8`)).data || [];
    const score = (r) => words.filter((w) => r.business_name.toLowerCase().includes(w)).length * 2 + words.filter((w) => String(r.category || '').toLowerCase().includes(w)).length;
    rows.sort((a, b) => score(b) - score(a));
  }
  return rows.slice(0, 3).map((r) => ({ ref: r.id, name: r.business_name, category: r.category, city: r.city }));
}

async function logLead(callId, args, callerNumber) {
  const vid = Number(args.vendor_ref);
  const v = (await sb(`vendors?select=id,business_name,category&status=in.(active,test)&id=eq.${vid}`)).data;
  const vendor = (v && v[0]) || null; // no match: still save the caller as a general directory lead
  const phone = e164(args.callback_number) || e164(callerNumber) || null;
  const lead = {
    name: String(args.caller_name || '').slice(0, 120) || 'Directory caller',
    phone, email: args.email ? String(args.email).slice(0, 160) : null,
    source: 'directory-call', page: 'Phone (862) 369-0005 · directory', role: 'customer', status: 'new', vendor_id: vendor ? vendor.id : null,
    message: (vendor ? `Call for ${vendor.business_name} (vendor #${vendor.id}, ${vendor.category || ''}): ` : `Directory call, business not found (asked for: ${String(args.business_asked || args.vendor_ref || '').slice(0, 120)}): `) + String(args.need || '').slice(0, 1500)
  };
  const ins = await sb('leads', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(lead) });
  const leadId = ins.ok && ins.data && ins.data[0] ? ins.data[0].id : null;
  if (callId && vendor) {
    await sb('directory_calls?on_conflict=call_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ call_id: callId, vendor_id: vendor.id, lead_id: leadId, caller_number: phone }) });
  }
  return { ok: true, lead_id: leadId, vendor: vendor ? vendor.business_name : null };
}

// Destination for a live transfer: the vendor chosen earlier in this call (never read out to the caller).
async function transferDestination(callId) {
  if (!callId) return null;
  const dc = (await sb(`directory_calls?select=vendor_id&call_id=eq.${encodeURIComponent(callId)}`)).data;
  if (!dc || !dc[0]) return null;
  const v = (await sb(`vendors?select=business_name,phone&status=in.(active,test)&id=eq.${Number(dc[0].vendor_id)}`)).data;
  const num = v && v[0] && e164(v[0].phone);
  if (!num) return null;
  await sb(`directory_calls?call_id=eq.${encodeURIComponent(callId)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ transfer_requested_at: new Date().toISOString() }) });
  return { type: 'number', number: num, message: `Connecting you to ${v[0].business_name} now. Please hold.` };
}

// Only accept requests for calls that really belong to the main Emporion line.
async function verifyCall(callId) {
  if (!callId) return null;
  const r = await fetch('https://api.vapi.ai/call/' + encodeURIComponent(callId), { headers: { Authorization: 'Bearer ' + process.env.VAPI_API_KEY } });
  if (!r.ok) return null;
  const c = await r.json();
  return c.assistantId === MAIN_ASSISTANT_ID ? c : null;
}

module.exports = { findVendors, logLead, transferDestination, verifyCall, MAIN_ASSISTANT_ID };
