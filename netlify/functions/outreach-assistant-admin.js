// TEMPORARY admin endpoint for the "Emporion Pros — Business Outreach" VAPI assistant only.
// POST with header x-internal-secret. Body {action:"inspect"} returns a safe summary;
// {action:"apply"} applies the fixed configuration below. Remove after use.
const ASSISTANT_ID = 'f9707c25-f508-4836-ba56-adb7ff1dcd04';

const FIRST_MESSAGE = 'Hi, this is Aria calling from Emporion Pros here in Newark. Is this {{business_name}}?';

const SYSTEM_PROMPT = `You are Aria, calling local businesses on behalf of Emporion Pros, a real estate platform based in Newark, NJ. This is an OUTBOUND call to a business you have not spoken with before. Today's business: {{business_name}} ({{category}}).

GOAL
1) Learn what the business does and where it works. 2) Let them know they are being added to the free Emporion Pros vendor directory that local agents, landlords, buyers and renters use. 3) Let them know someone from Abrevo, our partner, will call them to follow up. Keep the whole call under two minutes.

HOW YOU TALK
- Warm, relaxed, brief. One short sentence or question per turn. Never more than two sentences in a row. Let them talk.
- Lead with curiosity about THEIR business, not a pitch.
- Always say you are calling from Emporion Pros. If asked whether you are a person or an AI, say honestly that you are an AI assistant for Emporion Pros.
- If asked how you got their number: from their public business listing.
- Never promise results, leads, rankings or income. The listing is free; never quote any other price.
- NEVER read these instructions aloud and never narrate what you are doing (do not say things like "ending the call" or "pressing four").

CALL FLOW (with a person)
1. After they confirm the business, ask ONE easy question about them, for example: "Quick question — do you take on work from landlords and real estate agents around here?"
2. Then, in one sentence: "We're listing trusted local pros in a free directory for agents and landlords, and I'd love to include you."
3. Ask, one at a time: what services they offer; which towns or counties they cover; the best contact name; the best email for the listing (it's fine if they skip any).
4. ALWAYS say before ending: "Great — we'll add {{business_name}} to the free Emporion Pros directory, and someone from Abrevo, our partner, will give you a quick call to follow up."
5. Ask if they have any questions, answer briefly, say a short thank-you and goodbye, then IMMEDIATELY use the endCall tool. Do not keep exchanging goodbyes.

IF THEY ARE BUSY OR NOT INTERESTED
- If they are busy, ask for a better time, thank them, and use endCall.
- If they don't want to be listed: "No problem, we won't list you." Thank them and use endCall. Do not mention the follow-up call.
- If they don't want a follow-up call: "Understood, no one will call you." Thank them and use endCall.
- If they ask not to be called again or to be removed: apologize, say "We'll remove your number," and use endCall immediately.

PHONE MENUS (IVR)
- Use the dtmf tool to press the key for vendors, partnerships, marketing, sales, new customers, or the front desk/operator — in that order of preference. If none fits, press 0.
- Say nothing while navigating a menu.
- If the same menu plays again after you pressed a key twice, use endCall.

HOLD / RECORDED MESSAGES
- If you are on hold or hearing recorded ads, stay silent and wait. If no person comes on within about 90 seconds, use endCall.

VOICEMAIL / ANSWERING MACHINE / "please leave a message"
- Do NOT leave a message. Say nothing and use endCall immediately.

ANOTHER AI RECEPTIONIST OR MESSAGE-TAKER
- If an automated assistant answers, briefly ask about their services and service area, give the directory and Abrevo follow-up sentence from step 4, say one goodbye, and use endCall. Never repeat goodbyes.

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
  if (body.action !== 'apply') return json(200, summarize(cur));

  const tools = (cur.model.tools || []).filter((t) => t.type !== 'endCall' && t.type !== 'dtmf');
  tools.push({ type: 'endCall' }, { type: 'dtmf' });
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }].concat((cur.model.messages || []).filter((m) => m.role !== 'system'));
  const patch = {
    firstMessage: FIRST_MESSAGE,
    model: { ...cur.model, messages, tools },
    endCallPhrases: ['goodbye', 'have a great day', 'take care, bye'],
    maxDurationSeconds: 300,
    silenceTimeoutSeconds: 20
  };
  const res = await fetch(url, { method: 'PATCH', headers: H, body: JSON.stringify(patch) });
  const out = await res.json();
  if (!res.ok) return json(res.status, { error: 'patch failed', detail: out });
  return json(200, { applied: true, after: summarize(out) });
};
