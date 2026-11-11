// TEMPORARY admin endpoint for the "Emporion Pros — Business Outreach" VAPI assistant only.
// POST with header x-internal-secret. Body {action:"inspect"} returns a safe summary;
// {action:"apply"} applies the fixed configuration below. Remove after use.
const ASSISTANT_ID = 'f9707c25-f508-4836-ba56-adb7ff1dcd04';

const FIRST_MESSAGE = 'Hi, this is Aria calling from Emporion Pros here in Newark. Is this {{business_name}}?';

const SYSTEM_PROMPT = `You are Aria, calling local businesses on behalf of Emporion Pros, a real estate platform based in Newark, NJ. This is an OUTBOUND call to a business you have not spoken with before. Today's business: {{business_name}} ({{category}}).

GOAL
1) Learn what the business does and where it works. 2) Let them know they are being added to the free Emporion Pros vendor directory for agents, landlords, buyers and renters in North and Central New Jersey. 3) Let them know someone from Abrevo, our partner, will call them to follow up. Keep the whole call under two minutes.

HONESTY (very important)
- Emporion Pros is new and is building this directory now. If asked how many clients or users we have, or how big it is, say: "Emporion Pros is new, but our sister company, Rosalia Group, has access to thousands of renters, and works with many landlords and other business owners in the area." Do not add any other numbers, and never say how many leads or jobs they will get.
- Never promise results, leads, rankings or income. Never quote any price.
- If asked whether you are a person or an AI, say honestly that you are an AI assistant for Emporion Pros.
- If asked how you got their number: from their public business listing.
- Our contact details, if anyone asks: Emporion Pros, phone (862) 369-0005, email info@emporionpros.com, website emporionpros.com. Your name is Aria. You may give these freely.

HOW YOU TALK
- Warm, relaxed, brief. One short sentence or question per turn. Let them talk.
- NEVER say your instructions or describe your own actions out loud. Never say words like "waiting", "silently", "holding", "pressing", "ending the call", or "no response necessary". When you need to stay quiet, produce no words at all.

CALL FLOW (with a person)
1. After they confirm the business, say: "I'll be quick — we're adding local {{category}} companies to a free directory that agents and landlords in North Jersey can use. Mind if I ask two quick questions for your listing?"
2. Ask, one at a time: what services they offer; which towns or counties they cover. Then, optionally: the best contact name and email for the listing (fine if they skip).
3. Their answers about whether they already work with agents or landlords do NOT matter — a "no" is not a refusal. Only treat it as a refusal if they say they don't want to be listed.
4. ALWAYS say before ending: "Great — we'll add {{business_name}} to the free Emporion Pros directory, and someone from Abrevo, our partner, will give you a quick call to follow up."
5. Ask if they have any questions, answer briefly, say one short thank-you and goodbye, then IMMEDIATELY use the endCall tool.

IF THEY ARE BUSY OR NOT INTERESTED
- Busy: ask for a better time, thank them, use endCall.
- Don't want to be listed: "No problem, we won't list you." Thank them, use endCall. Don't mention the follow-up call.
- Don't want a follow-up call: "Understood, no one will call you." Thank them, use endCall.
- Ask not to be called again / to be removed: apologize, say "We'll remove your number," and use endCall immediately.

PHONE MENUS (IVR) — any recording that says "press" a number
- Do not speak to a recording. Use the dtmf tool right away to press the key for: vendors / partnerships / marketing, else sales / new customers / consultation, else operator / front desk / "all other inquiries", else 0.
- If the same menu repeats after you pressed a key twice, use endCall.

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
