// ============================================
// EMPORIONPROS — Lead Form Module (ep-lead-form.js)
// Shared by agent-dashboard.html & fub-aria-dashboard.html
// Dynamic form based on lead type with edit support
// ============================================

const LeadForm = (function() {

  // ─── OPTIONS ───
  const LEAD_TYPES = ['Renter', 'Buyer', 'Seller', 'Commercial', 'Investor', 'Vendor'];

  const RENTER_BUDGETS = ['Under $2,000', '$2,000–$2,400', '$2,400–$2,700', '$2,700–$3,000', '$3,000–$3,500', '$3,500+'];
  const RENTER_SIZES = ['Studio', '1 Bedroom', '1BR Flex / Convertible', '2 Bedroom', '2BR Duplex', '3 Bedroom', '3BR Duplex', '4+ Bedroom'];

  const BUYER_PROPERTY_TYPES = ['House', 'Condo', 'Townhouse', 'Multi-Family', 'Co-op', 'New Construction', 'Land'];
  const BUYER_PRICE_POINTS = ['Under $100K', '$100K–$200K', '$200K–$300K', '$300K–$400K', '$400K–$500K', '$500K–$750K', '$750K–$1M', '$1M–$2M', '$2M+'];

  const COMMERCIAL_TYPES = ['Office', 'Retail', 'Industrial', 'Mixed-Use', 'Warehouse', 'Restaurant/Bar', 'Medical', 'Other'];
  const INVESTOR_TYPES = ['Multi-Family', 'Fix & Flip', 'Buy & Hold', 'Commercial', 'New Development', 'Mixed-Use', 'Land'];

  const TIMEFRAMES = ['ASAP', '1 Month', '2 Months', '3 Months', '4–6 Months', '6–12 Months', '12+ Months', 'Just Browsing'];
  const INCOMES = ['Under $4,000', '$4,000–$6,000', '$6,000–$8,000', '$8,000–$10,000', '$10,000+', 'Prefer not to say'];
  const CREDITS = ['750+', '700–749', '650–699', '600–649', 'Below 600', 'No Credit', 'Prefer not to say'];
  const SOURCES = ['Website', 'Zillow', 'Apartments.com', 'Realtor.com', 'Referral', 'Walk-in', 'Follow Up Boss', 'Social Media', 'Google', 'Other'];

  // ─── HELPERS ───
  function opt(val, selected) {
    return `<option value="${val}" ${selected === val ? 'selected' : ''}>${val}</option>`;
  }
  function selectHtml(id, label, options, selected) {
    return `<div><label class="lf-label">${label}</label><select id="${id}" class="lf-input">${options.map(o => opt(o, selected)).join('')}</select></div>`;
  }
  function selectHtmlEmpty(id, label, options, selected) {
    return `<div><label class="lf-label">${label}</label><select id="${id}" class="lf-input"><option value="">Select...</option>${options.map(o => opt(o, selected)).join('')}</select></div>`;
  }
  function inputHtml(id, label, type, placeholder, value) {
    return `<div><label class="lf-label">${label}</label><input type="${type}" id="${id}" class="lf-input" placeholder="${placeholder}" value="${value || ''}"></div>`;
  }
  function textareaHtml(id, label, placeholder, value) {
    return `<div style="grid-column:1/-1"><label class="lf-label">${label}</label><textarea id="${id}" class="lf-input" rows="2" placeholder="${placeholder}" style="resize:vertical">${value || ''}</textarea></div>`;
  }

  // ─── DYNAMIC FIELDS BASED ON LEAD TYPE ───
  function getDynamicFields(type, data) {
    data = data || {};
    switch(type) {
      case 'Renter':
        return `
          <div class="lf-grid2">
            ${selectHtmlEmpty('lf-budget', 'Budget *', RENTER_BUDGETS, data.budget)}
            ${selectHtmlEmpty('lf-aptSize', 'Apartment Size', RENTER_SIZES, data.aptSize)}
          </div>
          <div class="lf-grid2">
            ${selectHtmlEmpty('lf-timeframe', 'Move-in Timeline', TIMEFRAMES, data.timeframe)}
            ${selectHtmlEmpty('lf-income', 'Monthly Income', INCOMES, data.income)}
          </div>
          <div class="lf-grid2">
            ${selectHtmlEmpty('lf-credit', 'Credit Score', CREDITS, data.credit)}
            ${inputHtml('lf-zip', 'Preferred Zip / Location', 'text', '07102, Downtown Newark...', data.zip)}
          </div>`;

      case 'Buyer':
        return `
          <div class="lf-grid2">
            ${selectHtmlEmpty('lf-propType', 'Property Type *', BUYER_PROPERTY_TYPES, data.propType)}
            ${selectHtmlEmpty('lf-priceRange', 'Price Range *', BUYER_PRICE_POINTS, data.priceRange)}
          </div>
          <div class="lf-grid2">
            ${selectHtmlEmpty('lf-timeframe', 'Timeframe', TIMEFRAMES, data.timeframe)}
            ${inputHtml('lf-beds', 'Bedrooms', 'text', '3+', data.beds)}
          </div>
          <div class="lf-grid2">
            ${selectHtmlEmpty('lf-income', 'Income', INCOMES, data.income)}
            ${selectHtmlEmpty('lf-credit', 'Credit Score', CREDITS, data.credit)}
          </div>
          <div class="lf-grid2">
            ${inputHtml('lf-zip', 'Preferred Zip / Location', 'text', '07102, South Ward...', data.zip)}
            ${inputHtml('lf-preapproved', 'Pre-Approved?', 'text', 'Yes / No / Amount', data.preapproved)}
          </div>`;

      case 'Seller':
        return `
          <div class="lf-grid2">
            ${selectHtmlEmpty('lf-propType', 'Property Type', BUYER_PROPERTY_TYPES, data.propType)}
            ${inputHtml('lf-address', 'Property Address', 'text', '123 Main St, Newark NJ', data.address)}
          </div>
          <div class="lf-grid2">
            ${selectHtmlEmpty('lf-priceRange', 'Asking Price Range', BUYER_PRICE_POINTS, data.priceRange)}
            ${selectHtmlEmpty('lf-timeframe', 'Selling Timeline', TIMEFRAMES, data.timeframe)}
          </div>
          <div class="lf-grid2">
            ${inputHtml('lf-zip', 'Property Zip', 'text', '07102', data.zip)}
            ${inputHtml('lf-beds', 'Beds / Baths', 'text', '3BR / 2BA', data.beds)}
          </div>`;

      case 'Commercial':
        return `
          <div class="lf-grid2">
            ${selectHtmlEmpty('lf-commType', 'Commercial Type *', COMMERCIAL_TYPES, data.commType)}
            ${selectHtmlEmpty('lf-priceRange', 'Budget / Price Range', BUYER_PRICE_POINTS, data.priceRange)}
          </div>
          <div class="lf-grid2">
            ${inputHtml('lf-sqft', 'Square Footage Needed', 'text', '1,000–5,000 sq ft', data.sqft)}
            ${selectHtmlEmpty('lf-timeframe', 'Timeframe', TIMEFRAMES, data.timeframe)}
          </div>
          <div class="lf-grid2">
            ${inputHtml('lf-zip', 'Preferred Zip / Location', 'text', '07102, Downtown...', data.zip)}
            ${inputHtml('lf-criteria', 'Search Criteria / Notes', 'text', 'Parking, loading dock...', data.criteria)}
          </div>`;

      case 'Investor':
        return `
          <div class="lf-grid2">
            ${selectHtmlEmpty('lf-invType', 'Investment Type *', INVESTOR_TYPES, data.invType)}
            ${selectHtmlEmpty('lf-priceRange', 'Investment Budget', BUYER_PRICE_POINTS, data.priceRange)}
          </div>
          <div class="lf-grid2">
            ${selectHtmlEmpty('lf-timeframe', 'Timeframe', TIMEFRAMES, data.timeframe)}
            ${inputHtml('lf-zip', 'Target Zip / Location', 'text', '07102, Newark...', data.zip)}
          </div>
          <div class="lf-grid2">
            ${inputHtml('lf-units', 'Min Units / Size', 'text', '4+ units, 10,000 sq ft...', data.units)}
            ${inputHtml('lf-criteria', 'Search Criteria', 'text', 'Cap rate 8%+, value-add...', data.criteria)}
          </div>`;

      case 'Vendor':
        return `
          <div class="lf-grid2">
            ${inputHtml('lf-business', 'Business Name', 'text', 'ABC Plumbing', data.business)}
            ${inputHtml('lf-service', 'Service Type', 'text', 'Plumbing, HVAC, Cleaning...', data.service)}
          </div>
          <div class="lf-grid2">
            ${inputHtml('lf-zip', 'Service Area / Zip', 'text', '07102, Essex County...', data.zip)}
            ${inputHtml('lf-license', 'License #', 'text', 'Optional', data.license)}
          </div>`;

      default:
        return '';
    }
  }

  // ─── PARSE DATA FROM MESSAGE FIELD ───
  function parseMessage(message) {
    if (!message) return {};
    const data = {};
    const match = message.match(/---\s*(.+)/);
    if (match) {
      match[1].split(' | ').forEach(pair => {
        const [key, val] = pair.split(': ');
        if (key && val) {
          const k = key.trim().toLowerCase();
          if (k === 'type') data.leadType = val.trim();
          else if (k === 'budget' || k === 'price range' || k === 'investment budget') data.budget = val.trim();
          else if (k === 'size' || k === 'apartment size') data.aptSize = val.trim();
          else if (k === 'move' || k === 'timeline' || k === 'timeframe') data.timeframe = val.trim();
          else if (k === 'income') data.income = val.trim();
          else if (k === 'credit') data.credit = val.trim();
          else if (k === 'zip' || k === 'location') data.zip = val.trim();
          else if (k === 'property type') data.propType = val.trim();
          else if (k === 'beds') data.beds = val.trim();
          else if (k === 'commercial type') data.commType = val.trim();
          else if (k === 'investment type') data.invType = val.trim();
          else if (k === 'criteria') data.criteria = val.trim();
          else if (k === 'sqft') data.sqft = val.trim();
          else if (k === 'pre-approved') data.preapproved = val.trim();
          else if (k === 'address') data.address = val.trim();
          else if (k === 'business') data.business = val.trim();
          else if (k === 'service') data.service = val.trim();
          else if (k === 'license') data.license = val.trim();
          else if (k === 'units') data.units = val.trim();
          else if (k === 'price') data.priceRange = val.trim();
        }
      });
    }
    // Get the message part before ---
    data.notes = message.split('---')[0].trim();
    return data;
  }

  // ─── BUILD MESSAGE FROM FORM FIELDS ───
  function buildMessage(type, notes) {
    const fields = [];
    if (type) fields.push('Type: ' + type);

    const tryAdd = (id, label) => {
      const el = document.getElementById(id);
      if (el && el.value && el.value !== 'Select...') fields.push(label + ': ' + el.value);
    };

    tryAdd('lf-budget', 'Budget');
    tryAdd('lf-aptSize', 'Size');
    tryAdd('lf-timeframe', 'Timeline');
    tryAdd('lf-income', 'Income');
    tryAdd('lf-credit', 'Credit');
    tryAdd('lf-zip', 'Location');
    tryAdd('lf-propType', 'Property Type');
    tryAdd('lf-priceRange', 'Price');
    tryAdd('lf-beds', 'Beds');
    tryAdd('lf-preapproved', 'Pre-Approved');
    tryAdd('lf-address', 'Address');
    tryAdd('lf-commType', 'Commercial Type');
    tryAdd('lf-invType', 'Investment Type');
    tryAdd('lf-sqft', 'SqFt');
    tryAdd('lf-criteria', 'Criteria');
    tryAdd('lf-units', 'Units');
    tryAdd('lf-business', 'Business');
    tryAdd('lf-service', 'Service');
    tryAdd('lf-license', 'License');

    return [notes, fields.length ? '--- ' + fields.join(' | ') : ''].filter(Boolean).join('\n');
  }

  // ─── RENDER MODAL ───
  function renderModal(lead) {
    const isEdit = !!lead;
    const title = isEdit ? '✏️ Edit Lead' : '➕ Add New Lead';
    const btnText = isEdit ? 'Save Changes' : 'Add Lead';
    const parsed = isEdit ? parseMessage(lead.message) : {};
    const currentType = parsed.leadType || 'Renter';

    return `
    <div id="leadFormModal" style="display:flex;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:1000;align-items:center;justify-content:center;backdrop-filter:blur(3px)">
      <div style="background:white;border-radius:12px;padding:28px;width:92%;max-width:580px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2)">
        <style>
          .lf-label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px}
          .lf-input{width:100%;padding:9px 12px;border:1px solid #e5e7eb;border-radius:7px;font-size:13px;font-family:inherit;box-sizing:border-box}
          .lf-input:focus{outline:none;border-color:#1a56db;box-shadow:0 0 0 3px rgba(26,86,219,.1)}
          .lf-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
          .lf-types{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
          .lf-type-btn{padding:7px 14px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid #e5e7eb;background:white;color:#374151;cursor:pointer;transition:.2s}
          .lf-type-btn:hover{border-color:#1a56db;color:#1a56db}
          .lf-type-btn.active{background:#1a56db;color:white;border-color:#1a56db}
        </style>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h2 style="font-size:18px;font-weight:700;margin:0">${title}</h2>
          <button onclick="LeadForm.close()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#6b7280">✕</button>
        </div>

        <div style="margin-bottom:14px">
          <label class="lf-label">Lead Type</label>
          <div class="lf-types" id="lf-types">
            ${LEAD_TYPES.map(t => `<button class="lf-type-btn ${t === currentType ? 'active' : ''}" onclick="LeadForm.switchType('${t}')">${t}</button>`).join('')}
          </div>
        </div>

        <div class="lf-grid2">
          ${inputHtml('lf-name', 'Full Name *', 'text', 'John Smith', isEdit ? lead.name : '')}
          ${inputHtml('lf-email', 'Email *', 'email', 'john@email.com', isEdit ? lead.email : '')}
        </div>
        <div class="lf-grid2">
          ${inputHtml('lf-phone', 'Phone', 'tel', '(555) 123-4567', isEdit ? lead.phone : '')}
          ${selectHtml('lf-source', 'Source', SOURCES, isEdit ? lead.source : 'Website')}
        </div>

        <div id="lf-dynamic">${getDynamicFields(currentType, parsed)}</div>

        ${textareaHtml('lf-notes', 'Notes', 'Any notes about this lead...', parsed.notes || '')}

        ${isEdit ? `<input type="hidden" id="lf-edit-id" value="${lead.id}"><input type="hidden" id="lf-edit-email-orig" value="${lead.email}">` : ''}
        <input type="hidden" id="lf-lead-type" value="${currentType}">

        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
          <button onclick="LeadForm.close()" style="padding:9px 18px;border-radius:7px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid #e5e7eb;background:white;color:#374151;font-family:inherit">Cancel</button>
          <label style="font-size:12px;display:flex;align-items:center;gap:4px;color:#374151;margin-right:8px"><input type="checkbox" id="lf-pushFUB" checked> Push to FUB</label>
          <button id="lf-submit-btn" onclick="LeadForm.submit()" style="padding:9px 18px;border-radius:7px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:#1a56db;color:white;font-family:inherit">${btnText}</button>
        </div>
      </div>
    </div>`;
  }

  // ─── PUBLIC API ───
  return {
    open: function(lead) {
      const existing = document.getElementById('leadFormModal');
      if (existing) existing.remove();
      document.body.insertAdjacentHTML('beforeend', renderModal(lead));
    },

    close: function() {
      const modal = document.getElementById('leadFormModal');
      if (modal) modal.remove();
    },

    switchType: function(type) {
      document.getElementById('lf-lead-type').value = type;
      document.querySelectorAll('.lf-type-btn').forEach(b => b.classList.toggle('active', b.textContent === type));
      document.getElementById('lf-dynamic').innerHTML = getDynamicFields(type, {});
    },

    submit: async function() {
      const name = document.getElementById('lf-name').value.trim();
      const email = document.getElementById('lf-email').value.trim();
      const phone = document.getElementById('lf-phone').value.trim();
      const source = document.getElementById('lf-source').value;
      const leadType = document.getElementById('lf-lead-type').value;
      const notes = document.getElementById('lf-notes').value.trim();
      const pushToFUB = document.getElementById('lf-pushFUB').checked;

      if (!name || !email) { alert('Name and email are required'); return; }

      const message = buildMessage(leadType, notes);
      const editId = document.getElementById('lf-edit-id');
      const isEdit = !!editId;

      const btn = document.getElementById('lf-submit-btn');
      btn.disabled = true;
      btn.textContent = isEdit ? 'Saving...' : 'Adding...';

      try {
        if (isEdit) {
          // Update existing lead via upload-leads (upserts on email)
          const res = await fetch('/.netlify/functions/upload-leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leads: [{ name, email, phone, source, message, role: 'user' }], pushToFUB })
          });
          const data = await res.json();
          if (data.success) {
            LeadForm.close();
            LeadForm._refresh();
            alert('✅ Lead updated!');
          } else {
            alert('Error: ' + (data.error || 'Unknown'));
          }
        } else {
          // Add new lead
          const res = await fetch('/.netlify/functions/upload-leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leads: [{ name, email, phone, source, message, role: 'user' }], pushToFUB })
          });
          const data = await res.json();
          if (data.success) {
            LeadForm.close();
            LeadForm._refresh();
            alert('✅ Lead added!' + (data.fubPushed ? ' Pushed to FUB.' : ''));
          } else {
            alert('Error: ' + (data.error || 'Unknown'));
          }
        }
      } catch(err) {
        alert('Error: ' + err.message);
      }
      btn.disabled = false;
      btn.textContent = isEdit ? 'Save Changes' : 'Add Lead';
    },

    // Override this in each dashboard
    _refresh: function() {
      if (typeof loadOverview === 'function') loadOverview();
      if (typeof loadLeads === 'function') loadLeads();
      if (typeof renderLeads === 'function') renderLeads();
      if (typeof renderHotLeads === 'function') renderHotLeads();
      if (typeof syncFUBLeads === 'function') syncFUBLeads();
    }
  };
})();

// Shortcut functions for onclick handlers
function openAddLeadModal() { LeadForm.open(); }
function closeAddLeadModal() { LeadForm.close(); }
function editLead(leadJson) { LeadForm.open(JSON.parse(decodeURIComponent(leadJson))); }
