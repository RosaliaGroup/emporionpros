// EmporionPros — SMS opt-in checkbox (10DLC).
// Adds one optional, UNCHECKED consent checkbox under every phone field on the page
// and records an opt-in (phone + exact text shown + page + time) when the form is sent
// with the box checked. Never blocks a submission; unchecked = no texts.
(function () {
  var SUPABASE_URL = 'https://nfwxruzhgzkhklvzmfsw.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_jN2I8tqw1-RmXEdB6wsPCg_dP6ImgNG';
  var CONSENT_TEXT =
    'I agree to receive text messages from Emporion Pros about my inquiry, account, appointments and customer support. ' +
    'Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. ' +
    'Consent is not a condition of purchase. Mobile information will not be sold or shared with third parties ' +
    'for promotional or marketing purposes. See our Privacy Policy and SMS Terms.';

  var css = document.createElement('style');
  css.textContent =
    '.ep-sms{grid-column:1/-1;flex-basis:100%;width:100%;display:flex;gap:8px;align-items:flex-start;margin:8px 0 12px;font-size:11.5px;line-height:1.45;color:#64748b;text-align:left}' +
    '.ep-sms input{margin-top:2px;flex-shrink:0;width:15px;height:15px;accent-color:#c8622a}' +
    '.ep-sms a{color:#c8622a;text-decoration:underline}';
  document.head.appendChild(css);

  function record(phone, label) {
    var digits = String(phone || '').replace(/\D/g, '');
    if (digits.length < 7) return;
    fetch(SUPABASE_URL + '/rest/v1/sms_consents', {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        phone: String(phone).trim().slice(0, 20),
        consent_text: CONSENT_TEXT,
        page_url: location.href.split('?')[0],
        form_label: label || '',
        user_agent: navigator.userAgent.slice(0, 250)
      })
    }).catch(function () {});
  }

  function attach(input, i) {
    if (input.dataset.epSms) return;
    input.dataset.epSms = '1';
    var id = 'ep-sms-' + i;
    var box = document.createElement('label');
    box.className = 'ep-sms';
    box.setAttribute('for', id);
    box.innerHTML =
      '<input type="checkbox" id="' + id + '" name="sms_consent" value="yes">' +
      '<span>' + CONSENT_TEXT.replace('Privacy Policy',
        '<a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>').replace('SMS Terms',
        '<a href="/sms-terms" target="_blank" rel="noopener">SMS Terms</a>') + '</span>';
    // place after the field (or its wrapper if the field sits inside a small group)
    var anchor = input.parentElement && input.parentElement.children.length <= 2 &&
      input.parentElement !== input.form ? input.parentElement : input;
    anchor.insertAdjacentElement('afterend', box);

    var cb = box.querySelector('input');
    var sent = false;
    function maybeRecord() {
      if (sent || !cb.checked) return;
      sent = true;
      record(input.value, document.title);
    }
    if (input.form) {
      input.form.addEventListener('submit', maybeRecord, true);
    }
    // Forms built without <form>: record when a nearby submit-style button is clicked.
    var scope = input.form || input.closest('section,div[class*="modal"],div[class*="form"],div[class*="card"]') || document.body;
    scope.addEventListener('click', function (e) {
      var b = e.target.closest('button,input[type="submit"],a.btn,a[class*="btn"]');
      if (b && /submit|send|book|request|sign|join|start|contact|schedule|publish|list/i.test(b.textContent || b.value || '')) {
        maybeRecord();
      }
    }, true);
  }

  var counter = 0, pending = false;
  function scan() {
    pending = false;
    var fields = document.querySelectorAll('input[type="tel"], input[name="phone"], input[id$="phone"], input[id*="-phone"]');
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      if (f.type === 'hidden' || f.dataset.epSms) continue;
      attach(f, counter++);
    }
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(scan); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
  // Some forms render later (modals, steps)
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
})();
