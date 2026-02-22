# EmporionPros — FUB 2-Way Sync Setup Guide

## What This Does

Two new Netlify functions that create a real-time 2-way sync:

| Direction | Function | Trigger |
|-----------|----------|---------|
| **Website → FUB** | `sync-lead-to-fub.js` | New lead signs up on website |
| **FUB → Supabase** | `fub-webhook.js` | Lead created/updated in FUB |

### Loop Prevention
- Leads with `source: "fub"` are NOT pushed back to FUB
- Leads from website get `source: "website"` or `"signup"` — these DO push to FUB

### Deduplication
- Matches on **email address**
- Existing leads are UPDATED (not duplicated)
- New leads are INSERTED

---

## Files to Deploy

Copy these into your `netlify/functions/` folder:

```
netlify/functions/
├── fub-leads.js              ← EXISTING (don't touch)
├── sync-lead-to-fub.js       ← NEW — website → FUB
├── fub-webhook.js             ← NEW — FUB → Supabase
├── vapi-call-iron65.js        ← EXISTING
├── ... (other existing functions)
```

---

## Environment Variables (Netlify)

Add these in **Netlify → Site Settings → Environment Variables**:

| Variable | Description | Example |
|----------|------------|---------|
| `FUB_API_KEY` | Already set | `fka_xxxxx` |
| `SUPABASE_URL` | Your Supabase project URL | `https://nfwxruzhgzkhklvzmfsw.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (NOT anon key) | `eyJhbGci...` |

**IMPORTANT:** Use the **service role key** (not anon key) for `SUPABASE_SERVICE_KEY`. This bypasses RLS so the webhook can write to the leads table. Find it in Supabase → Settings → API → service_role key.

---

## Step-by-Step Setup

### 1. Deploy the functions
```bash
# In your emporionpros repo
cp sync-lead-to-fub.js netlify/functions/
cp fub-webhook.js netlify/functions/
git add .
git commit -m "Add FUB 2-way sync functions"
git push
```
Netlify auto-deploys from GitHub.

### 2. Set environment variables
In Netlify dashboard:
- `SUPABASE_URL` = `https://nfwxruzhgzkhklvzmfsw.supabase.co`
- `SUPABASE_SERVICE_KEY` = (get from Supabase → Settings → API)

### 3. Register FUB webhooks
Run once from your machine:
```bash
FUB_API_KEY=your_fub_api_key \
SITE_URL=https://emporionpros.com \
node register-fub-webhooks.js
```
This tells FUB to POST to your Netlify function whenever a lead is created/updated.

### 4. Wire website forms to push to FUB
In your signup form handler (ep-supabase.js or wherever forms submit),
add a call to the sync function after inserting into Supabase:

```javascript
// After Supabase insert succeeds, push to FUB
fetch('/.netlify/functions/sync-lead-to-fub', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: leadName,
    email: leadEmail,
    phone: leadPhone,
    source: 'signup',
    page: window.location.pathname,
    role: leadRole,
    message: leadMessage
  })
}).catch(err => console.error('FUB sync error:', err));
```

### 5. Test the sync

**Test Website → FUB:**
1. Submit a test lead on signup.html
2. Check FUB — new person should appear with "EmporionPros" source
3. Check Supabase — lead should exist with source "signup"

**Test FUB → Supabase:**
1. Create a new person in FUB manually
2. Wait 5-10 seconds for webhook
3. Check Supabase leads table — new row with source "fub"

**Test deduplication:**
1. Create lead with email test@example.com on website
2. Update that same person in FUB
3. Check Supabase — should be ONE row (updated, not duplicated)

---

## Endpoints

| Function | URL | Method |
|----------|-----|--------|
| Existing FUB pull | `/.netlify/functions/fub-leads` | GET |
| Website → FUB | `/.netlify/functions/sync-lead-to-fub` | POST |
| FUB → Supabase | `/.netlify/functions/fub-webhook` | POST |

---

## Troubleshooting

- **FUB returns 401:** API key is wrong or expired. Regenerate in FUB → Admin → API.
- **Webhook not firing:** Run `register-fub-webhooks.js` again. Check FUB has the webhook listed.
- **Supabase 403:** You're using the anon key instead of service_role key.
- **Duplicate leads:** The dedup matches on email. If a lead has no email, it can't be deduped.
- **Leads not syncing:** Check Netlify function logs at netlify.com → Functions tab.
