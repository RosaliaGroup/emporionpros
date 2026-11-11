// EmporionPros — trial signup handler for landing-page email forms.
// Pages call: onsubmit="handleSignup(event,this,'<page label>','<role>')"
// Each submission is saved two ways so it cannot be lost:
//   1. Supabase `leads` table (public insert is allowed by RLS; reads are not)
//   2. Netlify form "ep-signup" (shows in Netlify with email notifications)
(function () {
  var SUPABASE_URL = 'https://nfwxruzhgzkhklvzmfsw.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_jN2I8tqw1-RmXEdB6wsPCg_dP6ImgNG';

  function saveToSupabase(lead) {
    return fetch(SUPABASE_URL + '/rest/v1/leads', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(lead)
    }).then(function (r) { return r.ok; }).catch(function () { return false; });
  }

  function saveToNetlify(lead) {
    var body = new URLSearchParams();
    body.append('form-name', 'ep-signup');
    body.append('email', lead.email);
    body.append('source', lead.source);
    body.append('role', lead.role);
    body.append('page', lead.page);
    body.append('timestamp', new Date().toISOString());
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    }).then(function (r) { return r.ok; }).catch(function () { return false; });
  }

  window.handleSignup = function (e, form, pageLabel, role) {
    if (e && e.preventDefault) e.preventDefault();
    var input = form.querySelector('input[type="email"]');
    var btn = form.querySelector('button');
    var email = input ? input.value.trim() : '';
    if (!email || email.indexOf('@') < 1) {
      if (input) input.focus();
      return false;
    }
    var original = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    var lead = {
      email: email,
      name: '',
      source: 'trial-signup',
      page: (pageLabel || '') + ' (' + window.location.pathname + ')',
      role: role || '',
      message: 'Requested free 14-day trial',
      status: 'new'
    };

    Promise.all([saveToSupabase(lead), saveToNetlify(lead)]).then(function (res) {
      var ok = res[0] || res[1];
      var note = document.createElement('p');
      note.setAttribute('role', 'status');
      note.style.cssText = 'margin-top:12px;font-size:14px;font-weight:600';
      if (ok) {
        note.textContent = 'Thanks! We received your request. We will email ' + email +
          ' within one business day to set up your trial.';
        form.replaceWith(note);
      } else {
        note.textContent = 'Something went wrong. Please email info@emporionpros.com.';
        form.insertAdjacentElement('afterend', note);
        if (btn) { btn.disabled = false; btn.textContent = original; }
      }
    });
    return false;
  };
})();
