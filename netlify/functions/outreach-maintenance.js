// Outreach call maintenance (Emporion Pros Business Outreach assistant).
// POST with header x-internal-secret: BUSINESS_SYNC_SECRET.
//   {"action":"inspect"}                  assistant analysis settings + latest call's analysis
//   {"action":"enable-summary"}           turn on AI call summaries for the assistant
//   {"action":"backfill-summaries"}       copy VAPI summaries onto calls saved without one
//   {"action":"reclassify","dryRun":true} re-sort saved calls with lib/callOutcome
// Every change is pushed to the Business CRM in Abrevo.
const crypto = require('crypto');
const { classifyCall } = require('./lib/callOutcome');
const crm = require('./lib/businessCrm');

const ASSISTANT_ID = 'f9707c25-f508-4836-ba56-adb7ff1dcd04';
const SUMMARY_PROMPT = 'You are summarizing a short sales call from Aria (Emporion Pros, a free vendor directory for North and Central New Jersey) to a local business. '
  + 'In 1-2 plain sentences say who answered (person, receptionist, AI receptionist, voicemail or phone menu), what they said about joining the directory or a follow-up, '
  + 'and any email, contact name or better time they gave. If no person was reached, say so.';

const MENU_RULES = `PHONE MENUS (IVR) — any recording that lists options to press
- Stay completely silent while a menu or recording plays. Never introduce yourself to a recording.
- Let the menu finish listing its options before you press anything. Then use the dtmf tool to press ONE key, choosing in this order: an option for vendors / partnerships / marketing; else sales / new customers / new clients / property owners; else operator / front desk / receptionist / "all other inquiries"; else 0.
- Never use a dial-by-name or extension directory, and never enter a name or letters. If a recording asks for a name or extension, press 0.
- After you press, stay silent until a live person speaks. Only then introduce yourself, in one sentence.
- If the same menu repeats twice after you pressed, or you reach someone's voicemail box, use endCall.
`;

const json = (code, obj) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj, null, 1) });
function secretOk(event) {
  const want = process.env.BUSINESS_SYNC_SECRET || '';
  const h = event.headers || {};
  const got = String(h['x-internal-secret'] || h['X-Internal-Secret'] || '');
  return want.length >= 24 && got.length === want.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

const SB = () => ({ url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_KEY });
async function sb(path, opts = {}) {
  const { url, key } = SB();
  const res = await fetch(`${url}/rest/v1/${path}`, { ...opts, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  if (!res.ok) throw new Error(`sb_${res.status} ${(await res.text()).slice(0, 120)}`);
  const t = await res.text();
  return t ? JSON.parse(t) : null;
}
const VAPI = () => ({ Authorization: 'Bearer ' + process.env.VAPI_API_KEY, 'Content-Type': 'application/json' });

// call_summary is "SUMMARY: ...\n\nENDED: <reason>\n\n<transcript>" (SUMMARY optional).
function parseSaved(s) {
  const t = String(s || '');
  const m = t.match(/^(?:SUMMARY:\s*([\s\S]*?)\n\n)?ENDED:\s*([^\n]*)\n\n?([\s\S]*)$/);
  return m ? { summary: m[1] || '', ended: m[2] || '', transcript: m[3] || '' } : null;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  if (!secretOk(event)) return json(401, { error: 'unauthorized' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'bad json' }); }
  try {
    if (body.action === 'inspect') {
      const a = await (await fetch('https://api.vapi.ai/assistant/' + ASSISTANT_ID, { headers: VAPI() })).json();
      const last = await sb('outreach_prospects?select=vapi_call_id&vapi_call_id=not.is.null&order=last_called_at.desc&limit=1');
      let call = null;
      if (last && last[0]) {
        const c = await (await fetch('https://api.vapi.ai/call/' + last[0].vapi_call_id, { headers: VAPI() })).json();
        call = { id: c.id, endedReason: c.endedReason, analysis: c.analysis, messages: (c.messages || []).length };
      }
      return json(200, { analysisPlan: a.analysisPlan || null, summaryPlan: (a.analysisPlan || {}).summaryPlan || null, serverMessages: a.serverMessages || (a.server && a.server.messages) || null, lastCall: call });
    }

    if (body.action === 'call') {
      // What happened on one prospect's last call: tool use (key presses), turns.
      const row = await sb(`outreach_prospects?select=vapi_call_id&id=eq.${Number(body.id) || 0}&limit=1`);
      if (!row || !row[0] || !row[0].vapi_call_id) return json(404, { error: 'no call' });
      const c = await (await fetch('https://api.vapi.ai/call/' + row[0].vapi_call_id, { headers: VAPI() })).json();
      const msgs = (c.messages || []).map((m) => ({ role: m.role, t: m.secondsFromStart,
        text: m.message ? String(m.message).slice(0, 160) : undefined,
        tools: m.toolCalls ? m.toolCalls.map((t) => (t.function && t.function.name) + ' ' + ((t.function && t.function.arguments) || '')) : undefined,
        result: m.role === 'tool_call_result' ? String(m.result || '').slice(0, 160) : undefined }));
      const a = await (await fetch('https://api.vapi.ai/assistant/' + ASSISTANT_ID, { headers: VAPI() })).json();
      return json(200, { endedReason: c.endedReason, model: a.model && { provider: a.model.provider, model: a.model.model, tools: a.model.tools, toolIds: a.model.toolIds },
        transcriber: a.transcriber, firstMessageMode: a.firstMessageMode, messages: msgs });
    }

    if (body.action === 'menu-rules') {
      // Replace the PHONE MENUS section of the live system prompt (same text as
      // outreach-assistant-admin's SYSTEM_PROMPT, so a later 'apply' keeps it).
      const a = await (await fetch('https://api.vapi.ai/assistant/' + ASSISTANT_ID, { headers: VAPI() })).json();
      const msgs = (a.model.messages || []).slice();
      const i = msgs.findIndex((m) => m.role === 'system');
      const cur = i >= 0 ? String(msgs[i].content) : '';
      const s0 = cur.indexOf('PHONE MENUS (IVR)'); const s1 = cur.indexOf('TRANSFERS AND HOLD');
      if (s0 < 0 || s1 < s0) return json(409, { error: 'menu section not found' });
      msgs[i] = { ...msgs[i], content: cur.slice(0, s0) + MENU_RULES + '\n' + cur.slice(s1) };
      // Wait a beat longer before answering, so a menu that pauses between
      // options is heard to the end instead of interrupted.
      const startSpeakingPlan = Object.assign({}, a.startSpeakingPlan || {}, { waitSeconds: 0.8 });
      const res = await fetch('https://api.vapi.ai/assistant/' + ASSISTANT_ID, { method: 'PATCH', headers: VAPI(),
        body: JSON.stringify({ model: { ...a.model, messages: msgs }, startSpeakingPlan }) });
      const out = await res.json();
      return json(res.ok ? 200 : res.status, res.ok ? { applied: true, startSpeakingPlan: out.startSpeakingPlan } : { error: out });
    }

    if (body.action === 'enable-summary') {
      const a = await (await fetch('https://api.vapi.ai/assistant/' + ASSISTANT_ID, { headers: VAPI() })).json();
      const plan = Object.assign({}, a.analysisPlan || {});
      plan.summaryPlan = Object.assign({}, plan.summaryPlan || {}, {
        enabled: true,
        messages: [
          { role: 'system', content: SUMMARY_PROMPT },
          { role: 'user', content: 'Here is the transcript:\n\n{{transcript}}\n\nHere is the ended reason of the call:\n\n{{endedReason}}\n\n' },
        ],
      });
      // Short calls (a hang-up, a voicemail) are exactly the ones we need a line for.
      plan.minMessagesThreshold = 1;
      delete plan.summaryPrompt;
      const res = await fetch('https://api.vapi.ai/assistant/' + ASSISTANT_ID, { method: 'PATCH', headers: VAPI(), body: JSON.stringify({ analysisPlan: plan }) });
      const out = await res.json();
      return json(res.ok ? 200 : res.status, res.ok ? { applied: true, analysisPlan: out.analysisPlan } : { error: out });
    }

    if (body.action === 'backfill-summaries') {
      const rows = await sb('outreach_prospects?select=id,phone,vapi_call_id,call_summary&vapi_call_id=not.is.null&call_summary=like.ENDED*&limit=500');
      let filled = 0; const changed = [];
      for (const r of rows || []) {
        const c = await (await fetch('https://api.vapi.ai/call/' + r.vapi_call_id, { headers: VAPI() })).json();
        const s = String((c.analysis && c.analysis.summary) || '').trim();
        if (!s) continue;
        await sb(`outreach_prospects?id=eq.${r.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ call_summary: ('SUMMARY: ' + s + '\n\n' + r.call_summary).slice(0, 20000), updated_at: new Date().toISOString() }) });
        filled++; changed.push(r.id);
      }
      if (changed.length) await crm.push(await crm.readProspects(`id=in.(${changed.join(',')})`));
      return json(200, { checked: (rows || []).length, filled });
    }

    if (body.action === 'reclassify') {
      // Only calls saved as a conversation; nothing a person or another
      // process has moved on (do_not_call, manual, handed_off, vendor created).
      const rows = await sb('outreach_prospects?select=id,business_name,status,call_attempts,call_summary,vendor_id'
        + '&status=in.(called,completed)&or=(vendor_profile_interest.is.null,vendor_profile_interest.is.false)&limit=1000');
      const moves = {}; const samples = {}; const changed = [];
      for (const r of rows || []) {
        const saved = parseSaved(r.call_summary);
        if (!saved) continue;
        const out = classifyCall({ transcript: saved.transcript, endedReason: saved.ended, callAttempts: r.call_attempts || 1, summary: saved.summary });
        if (out.status === 'called') continue;
        const k = `${r.status} -> ${out.status} (${out.reason})`;
        moves[k] = (moves[k] || 0) + 1;
        (samples[k] = samples[k] || []).length < 4 && samples[k].push(r.business_name);
        if (!body.dryRun) {
          await sb(`outreach_prospects?id=eq.${r.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({ status: out.status, updated_at: new Date().toISOString() }) });
          changed.push(r.id);
        }
      }
      if (changed.length) {
        for (let i = 0; i < changed.length; i += 150) {
          await crm.push(await crm.readProspects(`id=in.(${changed.slice(i, i + 150).join(',')})`));
        }
      }
      return json(200, { dryRun: Boolean(body.dryRun), checked: (rows || []).length, moves, samples, changed: changed.length });
    }

    return json(400, { error: 'unknown action' });
  } catch (e) {
    return json(502, { error: e.message });
  }
};
