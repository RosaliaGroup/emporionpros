// How an Emporion Pros outreach call ended, from its transcript.
//
// Before 2026-11-11 any call where something spoke on the line counted as
// "called" -- including voicemail greetings, phone menus and hold messages --
// and "called" is never retried, so ~75 businesses were left as "contacted"
// without anyone having talked to a person. Statuses:
//   no_answer    no person reached (voicemail, phone menu, hold, silence, busy)
//                -> the dialer retries it on another day
//   hung_up      a person answered and hung up within their first line or two
//                -> one retry at a different time of day, then a person calls
//   manual       hung up on the retry too -> a person follows up by hand
//   message_left a receptionist or answering service took a message
//                -> Aria calls back once, 2 days later
//   email_asked  they asked for the details by email -> a person emails them
//   do_not_call  asked not to be called
//   called       any other conversation -> a person reviews it
// Calls made after 2026-11-11 also carry VAPI's structured outcome, which
// outreach-webhook prefers over these transcript rules (see fromStructured).

const NO_CONTACT_ENDED = /voicemail|no-answer|did-not-answer|busy|failed|error|rejected|unanswered/i;
// A receptionist / answering service / AI receptionist taking a message.
const MESSAGE = /take (down )?(your|a) (information|info|message|name)|forward (it|this|your)|pass (it|this|that) (along|on)|leave (a|your) name and number|mention it to (them|him|her)|give you a call ?back|have (someone|them|him|her) call you|get back to you/i;
const EMAIL = /by email|email only|via email|send (us |your |the |over )?(an? )?(email|info|information|details)|email (us|it|me)/i;
const DNC = /\b(do not|don't|dont|stop) call|take (me|us) off|remove (me|us|our number)|not interested\b/i;
// What recordings say. Matched per caller line.
const MACHINE = new RegExp([
  'leave (a|your|us a) (brief |detailed )?(message|name)', 'after the (tone|beep)', 'at the tone',
  '\\bpress (\\d|one|two|three|four|five|six|seven|eight|nine|zero|pound|star)', '\\bpara espa', 'oprima', 'prima numero',
  'not (able|available) to (take|answer|come)', '(is|are) (currently )?unavailable', 'no one is available', 'nobody (is )?(in|available)',
  'mailbox', 'voice ?mail', 'please hold', 'next available', 'your call (is|may be) (important|recorded)',
  'recorded for quality', 'quality (and|&) training', 'office hours', 'our (office|hours)', '(is|are) (now )?closed',
  'you have reached', "you've reached", 'thank you for calling', 'thanks for calling', 'please stay on the line',
  'dial (nine one one|911)', 'if you know your party', 'extension', 'main menu', 'record your message',
  'get back to you as soon as', 'return your call', 'we will call you back', 'cation journey starts here',
  'do not currently service your area', 'invalid (entry|selection)', 'being recorded', 'call is being transferred',
  'enter (the |your )?(first|last) (name|one or more)', 'dial by name', 'please dial', 'dialed the wrong number',
  'connect you to a local provider', 'followed by the pound',
].join('|'), 'i');

function callerLines(transcript) {
  return String(transcript || '').split('\n')
    .filter((l) => /^(User|Customer)\s*:/i.test(l))
    .map((l) => l.replace(/^(User|Customer)\s*:\s*/i, '').trim())
    .filter(Boolean);
}

// A receptionist often opens like a recording ("Thank you for calling X...")
// and then gives themselves away ("...this is Jackson, how can I help?").
const PERSON = /\b[Tt]his is [A-Z][a-z]+|\b[A-Z][a-z]+ speaking\b|\b[Hh]ow (can|may) (I|we) (help|assist)|\b[Cc]an I help/;
const words = (l) => l.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;

// Lines a person (or a live AI receptionist) said, not a recording.
function humanLines(lines) {
  return lines.filter((l) => PERSON.test(l) || !MACHINE.test(l));
}
// ...and of those, more than a bare "Hello?" / "Yes.".
function substantive(lines) {
  return humanLines(lines).filter((l) => PERSON.test(l) || words(l) >= 2);
}

/**
 * @param {object} c { transcript, endedReason, callAttempts }
 * @returns {{ status: string, reason: string }}
 */
function classifyCall({ transcript, endedReason, callAttempts = 1 } = {}) {
  const lines = callerLines(transcript);
  const said = lines.join('\n');
  const ended = String(endedReason || '');
  if (DNC.test(said)) return { status: 'do_not_call', reason: 'asked not to be called' };
  if (!lines.length || NO_CONTACT_ENDED.test(ended)) return { status: 'no_answer', reason: ended || 'no one spoke' };
  const human = humanLines(lines);
  const real = substantive(lines);
  const hungUp = /customer-ended-call/.test(ended);
  if (!human.length || (!real.length && !hungUp)) {
    const machine = lines.some((l) => MACHINE.test(l));
    return { status: 'no_answer', reason: machine ? 'voicemail or phone menu' : 'no person reached' };
  }
  // Checked before the hang-up rule: a receptionist who takes a message and
  // then hangs up has still taken the message.
  const realSaid = real.join('\n');
  if (MESSAGE.test(realSaid)) return { status: 'message_left', reason: 'took a message' };
  if (EMAIL.test(realSaid)) return { status: 'email_asked', reason: 'asked for email' };
  if (hungUp && real.length <= 2) {
    return callAttempts >= 2
      ? { status: 'manual', reason: 'hung up on Aria twice' }
      : { status: 'hung_up', reason: 'hung up early' };
  }
  return { status: 'called', reason: 'conversation' };
}

// Structured outcome from VAPI's analysis (analysisPlan.structuredDataPlan),
// mapped onto the same statuses. Returns null when there is none.
function fromStructured(sd, callAttempts = 1) {
  const o = sd && String(sd.outcome || '');
  if (!o) return null;
  const map = {
    profile_info_given: 'called', interested: 'called', call_back_later: 'message_left',
    message_left: 'message_left', email_requested: 'email_asked', not_interested: 'not_interested',
    do_not_call: 'do_not_call', no_person_reached: 'no_answer', wrong_number: 'no_answer',
  };
  if (o === 'hung_up_early') return { status: callAttempts >= 2 ? 'manual' : 'hung_up', reason: 'hung up early' };
  return map[o] ? { status: map[o], reason: o } : null;
}

module.exports = { classifyCall, fromStructured, callerLines, humanLines, substantive, MACHINE, MESSAGE, EMAIL, DNC };
