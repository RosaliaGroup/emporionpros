// EMPORIONPROS — Lead Capture + Analytics Engine
// Handles all form submissions via Netlify Forms
// Drop-in: add <script src="ep-leads.js"></script> to any page
(function(){
'use strict';

// ═══════════════════════════════════════
// NETLIFY FORM SUBMISSION
// ═══════════════════════════════════════
// Netlify Forms: add data-netlify="true" to <form> tags
// or submit via AJAX to Netlify's form handler

function submitToNetlify(formName, data) {
  var body = new URLSearchParams();
  body.append('form-name', formName);
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      body.append(key, data[key]);
    }
  }
  
  return fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
}

// ═══════════════════════════════════════
// HANDLE SIMPLE EMAIL SIGNUPS
// (for-agents, for-managers, for-owners)
// ═══════════════════════════════════════
window.handleSignup = function(e, form, source, role) {
  e.preventDefault();
  var email = form.querySelector('input[type="email"]').value.trim();
  if (!email) return;
  
  var btn = form.querySelector('button');
  var origText = btn.textContent;
  btn.textContent = 'Sending...';
  btn.disabled = true;
  
  submitToNetlify('ep-signup', {
    email: email,
    source: source || 'Unknown',
    role: role || 'Unknown',
    page: location.pathname,
    timestamp: new Date().toISOString()
  }).then(function(res) {
    if (res.ok) {
      form.innerHTML = '<div style="text-align:center;padding:8px"><div style="font-size:28px;margin-bottom:6px">✅</div><div style="font-size:15px;font-weight:700">You\'re in!</div><div style="font-size:12px;opacity:.6;margin-top:4px">Check your email for next steps.</div></div>';
      trackEvent('signup', role, source);
    } else {
      btn.textContent = 'Try Again';
      btn.disabled = false;
    }
  }).catch(function() {
    btn.textContent = 'Try Again';
    btn.disabled = false;
  });
};

// ═══════════════════════════════════════
// HANDLE VENDOR SIGNUP (for-vendors.html)
// ═══════════════════════════════════════
window.submitVF = function() {
  var biz = document.getElementById('vfBiz');
  var name = document.getElementById('vfName');
  var email = document.getElementById('vfEmail');
  var phone = document.getElementById('vfPhone');
  var city = document.getElementById('vfCity');
  var zip = document.getElementById('vfZip');
  var cat = document.getElementById('vfCat');
  
  if (!biz || !name || !email || !cat) return;
  if (!biz.value.trim() || !name.value.trim() || !email.value.trim() || !cat.value) {
    alert('Please fill in all required fields.');
    return;
  }
  
  submitToNetlify('ep-vendor', {
    business_name: biz.value.trim(),
    contact_name: name.value.trim(),
    email: email.value.trim(),
    phone: phone ? phone.value.trim() : '',
    city: city ? city.value.trim() : '',
    zip: zip ? zip.value.trim() : '',
    category: cat.value,
    source: 'Vendor Signup (Quick)',
    page: location.pathname,
    timestamp: new Date().toISOString()
  }).then(function(res) {
    if (res.ok) {
      document.getElementById('vf-form').style.display = 'none';
      document.getElementById('vf-success').style.display = 'block';
      trackEvent('vendor_signup', cat.value, 'Quick Form');
    }
  }).catch(function() {
    document.getElementById('vf-form').style.display = 'none';
    document.getElementById('vf-success').style.display = 'block';
  });
};

// ═══════════════════════════════════════
// HANDLE FULL VENDOR SIGNUP (vendor-signup.html)
// ═══════════════════════════════════════
window.submitFullVendor = function(data) {
  submitToNetlify('ep-vendor-full', data).then(function() {
    trackEvent('vendor_signup_full', data.category || '', 'Full Form');
  }).catch(function(){});
};

// ═══════════════════════════════════════
// HANDLE PROPERTY LISTING (list-property.html)
// ═══════════════════════════════════════
window.submitPropertyListing = function(data) {
  submitToNetlify('ep-property', data).then(function() {
    trackEvent('property_listing', data.type || '', 'List Property');
  }).catch(function(){});
};

// ═══════════════════════════════════════
// GOOGLE ANALYTICS 4
// ═══════════════════════════════════════
// Replace GA_MEASUREMENT_ID with your actual GA4 ID
var GA_ID = window.EP_GA_ID || '';

if (GA_ID) {
  var gs = document.createElement('script');
  gs.async = true;
  gs.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(gs);
  
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', GA_ID);
  window.gtag = gtag;
}

function trackEvent(action, category, label) {
  // GA4
  if (window.gtag) {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      page_path: location.pathname
    });
  }
  // Console log for debugging
  console.log('[EP Lead]', action, category, label, new Date().toISOString());
}

// ═══════════════════════════════════════
// TRACK PAGE VIEWS & ENGAGEMENT
// ═══════════════════════════════════════
// Track time on page
var startTime = Date.now();
window.addEventListener('beforeunload', function() {
  var duration = Math.round((Date.now() - startTime) / 1000);
  if (window.gtag && duration > 5) {
    gtag('event', 'engagement_time', {
      value: duration,
      page_path: location.pathname
    });
  }
});

// Track outbound clicks (to grant sites, vendor sites, etc.)
document.addEventListener('click', function(e) {
  var a = e.target.closest('a[href]');
  if (a && a.hostname && a.hostname !== location.hostname) {
    trackEvent('outbound_click', a.hostname, a.href);
  }
});

// Track CTA button clicks
document.addEventListener('click', function(e) {
  var btn = e.target.closest('.btn-primary, .nav-btn, .cta-btn, [class*="btn"]');
  if (btn) {
    var text = btn.textContent.trim().substring(0, 50);
    trackEvent('cta_click', text, location.pathname);
  }
});

})();
