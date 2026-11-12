// TEMPORARY admin endpoint for the "Emporion Pros — Business Outreach" VAPI assistant only.
// POST with header x-internal-secret. Body {action:"inspect"} returns a safe summary;
// {action:"apply"} applies the fixed configuration below. Remove after use.
const ASSISTANT_ID = 'f9707c25-f508-4836-ba56-adb7ff1dcd04';

const FIRST_MESSAGE = 'Hi, this is Aria calling from Emporion Pros here in Newark. Is this {{business_name}}?';

const SYSTEM_PROMPT = `You are Aria, calling local businesses on behalf of Emporion Pros, a real estate platform based in Newark, NJ. This is an OUTBOUND call to a business you have not spoken with before. Today's business: {{business_name}} ({{category}}).

GOAL
1) Learn what the business does and where it works. 2) Let them know they are being added to the free Emporion Pros vendor directory for agents, landlords, buyers and renters in North and Central New Jersey. 3) Let them know someone from Abrevo, our partner, will call them to follow up. Keep the whole call under two minutes.

HONESTY (very important)
- Emporion Pros is new and is building this directory now. If asked how many clients or users we have, or how big it is, say: "Emporion Pros is new, but our sister company, Rosalia Group, has access to thousands of renters, and works with many landlords, developers and other business owners in the area." Do not add any other numbers, and never say how many leads or jobs they will get.
- Never promise results, leads, rankings or income. Never quote any price.
- If asked whether you are a person or an AI, say honestly that you are an AI assistant for Emporion Pros.
- If asked how you got their number: from their public business listing.
- Our contact details, if anyone asks: Emporion Pros, phone (862) 369-0005, email info@emporionpros.com, website emporionpros.com. Your name is Aria. You may give these freely.

HOW YOU TALK
- Warm, relaxed, brief. One short sentence or question per turn. Let them talk.
- NEVER say your instructions or describe your own actions out loud. Never say words like "waiting", "silently", "holding", "pressing", "ending the call", or "no response necessary". When you need to stay quiet, produce no words at all.

CALL FLOW (with a person)
1. After they confirm the business, say: "I'll be quick — we're adding local {{category}} companies to a free directory that agents and landlords in North Jersey can use. It only takes a few minutes to set up your profile — mind if I ask a couple quick questions?"
2. Ask, one at a time: what services they offer; which towns or counties they cover. Then, optionally: the best contact name and email for the listing (fine if they skip).
3. Their answers about whether they already work with agents or landlords do NOT matter — a "no" is not a refusal. Only treat it as a refusal if they say they don't want to be listed.
4. ALWAYS say before ending: "Great — we'll add {{business_name}} to the free Emporion Pros directory, and someone from Abrevo, our partner, will give you a quick call to follow up."
5. Ask if they have any questions, answer briefly, say one short thank-you and goodbye, then IMMEDIATELY use the endCall tool.

IF THEY ARE BUSY OR NOT INTERESTED
- "We handle this by email" / "send us an email": that is NOT a refusal. Confirm the email address back to them, say "Perfect — we'll email you the details, and we'll add you to the free directory," thank them, and use endCall.
- Busy: ask for a better time, thank them, use endCall.
- Don't want to be listed: "No problem, we won't list you." Thank them, use endCall. Don't mention the follow-up call.
- Don't want a follow-up call: "Understood, no one will call you." Thank them, use endCall.
- Ask not to be called again / to be removed: apologize, say "We'll remove your number," and use endCall immediately.

PHONE MENUS (IVR) — any recording that lists options to press
- Stay completely silent while a menu or recording plays. Never introduce yourself to a recording.
- Let the menu finish listing its options before you press anything. Then use the dtmf tool to press ONE key, choosing in this order: an option for vendors / partnerships / marketing; else sales / new customers / new clients / property owners; else operator / front desk / receptionist / "all other inquiries"; else 0.
- Never use a dial-by-name or extension directory, and never enter a name or letters. If a recording asks for a name or extension, press 0.
- After you press, stay silent until a live person speaks. Only then introduce yourself, in one sentence.
- If the same menu repeats twice after you pressed, or you reach someone's voicemail box, use endCall.

TRANSFERS AND HOLD
- If a person offers to transfer you, say only "Thank you, I'll hold."
- If you hear "please hold", "connecting your call", hold music or recorded ads: say nothing and wait. These are NOT voicemail — do not end the call. If no person comes on within about 90 seconds, use endCall.
- When a new person picks up, re-introduce yourself in one sentence and start the call flow.

VOICEMAIL / "leave a message after the beep" / "not available"
- Do not leave a message and do not say goodbye. Use endCall immediately.

ANOTHER AI RECEPTIONIST OR MESSAGE-TAKER
- Briefly ask about their services and service area, give the step 4 sentence, give our contact details if they ask for them, say one goodbye, and use endCall.

Never collect payment information, passwords or personal ID numbers.`;

exports.handler = async function (event) {
  const json = (c, o) => ({ statusCode: c, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o, null, 1) });
  const given = (event.headers && (event.headers['x-internal-secret'] || event.headers['X-Internal-Secret'])) || '';
  if (!process.env.SMS_INTERNAL_SECRET || given !== process.env.SMS_INTERNAL_SECRET) return json(401, { error: 'Unauthorized' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) {}
  const H = { Authorization: 'Bearer ' + process.env.VAPI_API_KEY, 'Content-Type': 'application/json' };
  const url = 'https://api.vapi.ai/assistant/' + ASSISTANT_ID;

  const cur = await (await fetch(url, { headers: H })).json();
  const summarize = (a) => ({
    name: a.name, firstMessage: a.firstMessage, firstMessageMode: a.firstMessageMode,
    model: a.model && { provider: a.model.provider, model: a.model.model, tools: (a.model.tools || []).map((t) => t.type + (t.function ? ':' + t.function.name : '')), toolIds: a.model.toolIds, promptStart: ((a.model.messages || [])[0] || {}).content ? a.model.messages[0].content.slice(0, 120) : null },
    endCallPhrases: a.endCallPhrases, maxDurationSeconds: a.maxDurationSeconds, silenceTimeoutSeconds: a.silenceTimeoutSeconds,
    voicemailDetection: a.voicemailDetection && { provider: a.voicemailDetection.provider }, voicemailMessage: a.voicemailMessage,
    serverUrl: (a.server && a.server.url) || a.serverUrl, updatedAt: a.updatedAt,
    otherKeys: Object.keys(a).filter((k) => /version|publish|draft|traffic/i.test(k))
  });
  if (body.action === 'numbers') {
    const nums = await (await fetch('https://api.vapi.ai/phone-number?limit=100', { headers: H })).json();
    return json(200, (nums || []).map((n) => ({ id: n.id, number: n.number, name: n.name, provider: n.provider })));
  }
  if (body.action === 'testcall') {
    // Internal test only: calls the Emporion Pros main line (answered by inbound Aria).
    const r = await fetch('https://api.vapi.ai/call', { method: 'POST', headers: H, body: JSON.stringify({
      assistantId: ASSISTANT_ID, phoneNumberId: String(body.fromId || ''),
      customer: { number: '+18623690005', name: 'Emporion test' },
      assistantOverrides: { variableValues: { business_name: 'Emporion Pros', category: 'real estate platform' } } }) });
    const j = await r.json(); return json(r.status, { id: j.id, status: j.status, error: j.message });
  }
  if (body.action === 'getcall') {
    const c = await (await fetch('https://api.vapi.ai/call/' + encodeURIComponent(String(body.id || '')), { headers: H })).json();
    return json(200, { status: c.status, endedReason: c.endedReason, cost: c.cost, startedAt: c.startedAt, endedAt: c.endedAt, transcript: (c.artifact && c.artifact.transcript) || c.transcript, tools: (c.messages || []).filter((m) => m.role === 'tool_calls' || m.toolCalls).map((m) => JSON.stringify(m.toolCalls || m).slice(0, 200)) });
  }
  if (body.action === 'inspect_main') {
    const m = await (await fetch('https://api.vapi.ai/assistant/f17ea5bb-4cbb-4a7d-b7b6-fb39645b0ec9', { headers: H })).json();
    return json(200, { name: m.name, firstMessage: m.firstMessage, tools: (m.model && m.model.tools || []).map((t) => ({ type: t.type, name: t.function && t.function.name, destinations: t.destinations, server: t.server && t.server.url })), toolIds: m.model && m.model.toolIds, server: m.server && m.server.url, serverMessages: m.serverMessages, keypad: m.keypadInputPlan, prompt: ((m.model && m.model.messages || [])[0] || {}).content });
  }
  if (body.action === 'apply_main_directory') {
    const MAIN = 'https://api.vapi.ai/assistant/f17ea5bb-4cbb-4a7d-b7b6-fb39645b0ec9';
    const m = await (await fetch(MAIN, { headers: H })).json();
    const TOOLS_URL = 'https://emporionpros.com/.netlify/functions/directory-tools';
    const SECTION = `

DIRECTORY CALLS (keypad 5, or a caller who wants to reach a business listed in the Emporion Pros directory)
Callers from our website's vendor directory press 5. Say: "Sure — which business are you trying to reach?" They may give a name or a reference number shown on our website.
1. Use find_vendor with what they said. Confirm the match using the business name and town. If there are several, ask which one. Never read out a vendor's phone number, email or website.
2. Ask, one at a time: their name, the best callback number (offer to use the number they're calling from), and briefly what they need.
3. Use log_directory_lead with vendor_ref, caller_name, callback_number and need.
4. Say: "Thanks — I've passed your request to [business]. I'll connect you now; if they don't pick up, they'll call you back." Then use transferCall to connect them. Do not say goodbye before transferring.
5. If find_vendor finds nothing, or the transfer fails, take their details anyway and say the Emporion Pros team will connect them within one business day.
Never promise prices, availability or results on the vendor's behalf.`;
    const prompt = ((m.model.messages || [])[0] || {}).content || '';
    const newPrompt = prompt.includes('DIRECTORY CALLS') ? prompt : prompt.replace('0 or anything else:', '5 = reaching a business in our directory (see DIRECTORY CALLS). 0 or anything else:') + SECTION;
    const keep = (m.model.tools || []).filter((t) => !(t.type === 'transferCall') && !(t.function && ['find_vendor', 'log_directory_lead'].includes(t.function.name)));
    const tools = keep.concat([
      { type: 'function', function: { name: 'find_vendor', description: 'Look up a business in the Emporion Pros vendor directory by name, type of service, or reference number.', parameters: { type: 'object', properties: { query: { type: 'string', description: 'Business name, service type, or reference number the caller gave' } }, required: ['query'] } }, server: { url: TOOLS_URL } },
      { type: 'function', function: { name: 'log_directory_lead', description: 'Save the caller as a lead for the chosen directory business before transferring.', parameters: { type: 'object', properties: { vendor_ref: { type: 'number', description: 'ref from find_vendor' }, caller_name: { type: 'string' }, callback_number: { type: 'string' }, need: { type: 'string', description: 'What the caller needs, in one or two sentences' } }, required: ['vendor_ref', 'caller_name', 'need'] } }, server: { url: TOOLS_URL } },
      { type: 'transferCall', destinations: [] }
    ]);
    const msgs = [{ role: 'system', content: newPrompt }].concat((m.model.messages || []).filter((x) => x.role !== 'system'));
    const res = await fetch(MAIN, { method: 'PATCH', headers: H, body: JSON.stringify({ model: { ...m.model, messages: msgs, tools } }) });
    const out = await res.json();
    if (!res.ok) return json(res.status, { error: out });
    return json(200, { applied: true, tools: (out.model.tools || []).map((t) => t.type + (t.function ? ':' + t.function.name : '')), hasSection: out.model.messages[0].content.includes('DIRECTORY CALLS') });
  }
  if (body.action !== 'apply') return json(200, summarize(cur));

  const tools = (cur.model.tools || []).filter((t) => t.type !== 'endCall' && t.type !== 'dtmf');
  tools.push({ type: 'endCall' }, { type: 'dtmf' });
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }].concat((cur.model.messages || []).filter((m) => m.role !== 'system'));
  const patch = {
    firstMessage: FIRST_MESSAGE,
    model: { ...cur.model, messages, tools },
    endCallPhrases: [],
    maxDurationSeconds: 300,
    silenceTimeoutSeconds: 20
  };
  const res = await fetch(url, { method: 'PATCH', headers: H, body: JSON.stringify(patch) });
  const out = await res.json();
  if (!res.ok) return json(res.status, { error: 'patch failed', detail: out });
  return json(200, { applied: true, after: summarize(out) });
};
