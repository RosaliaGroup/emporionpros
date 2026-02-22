# EmporionPros — Project Manifest
**Last updated:** February 22, 2026
**Company:** Rosalia Group → Brand: EmporionPros

---

## 1. Project Overview
EmporionPros is a real estate SaaS platform with AI-powered tools, lead management, vendor marketplace, and 2-way CRM sync with Follow Up Boss (FUB).

---

## 2. Tech Stack
| Component | Technology |
|-----------|-----------|
| Database | Supabase (PostgreSQL) |
| CRM | Follow Up Boss (FUB) |
| Backend | Netlify Functions (Node.js) — 12 functions |
| Frontend | HTML/JS static site |
| Hosting | Netlify (auto-deploy from GitHub: RosaliaGroup/emporionpros) |
| AI | Aria (VAPI + Claude Sonnet 4 + Deepgram Luna) |
| SMS/Voice | Twilio (pending verification) |

---

## 3. Database Schema (Supabase)

**Supabase URL:** https://nfwxruzhgzkhklvzmfsw.supabase.co

### Tables
1. **profiles** — extends auth.users (id UUID PK, email, full_name, phone, role, company, license_number, avatar_url, bio, service_area)
2. **leads** — id, name, email, phone, source, page, role, message, status, assigned_to, created_at, updated_at
3. **listings** — id, agent_id, title, description, address, city, state, zip, type, property_type, price, beds, baths, sqft, year_built, images[], features[], status, source, special, days_listed, views_count, saves_count
4. **appointments** — id, listing_id, agent_id, client_name, client_email, client_phone, appointment_date, appointment_time, type, status, notes
5. **campaigns** — id, listing_id, agent_id, name, type, status, content (JSONB), channels[], scheduled_at, sent_at, stats (JSONB)
6. **vendors** — id, profile_id, business_name, contact_name, email, phone, category, subtypes[], city, zip, service_area, description, rating, reviews_count, verified, status
7. **saved_properties** — id, user_id, listing_id (unique pair)
8. **ai_chats** — id, user_id, session_id, role, message, metadata (JSONB)
9. **notifications** — id, user_id, title, message, type, read, link

### RLS: Enabled on all tables with appropriate policies
### Triggers: auto-create profile on signup, auto-update updated_at
### Schema file: supabase-schema.sql

**Leads table current data:** 6 rows (2 real Ana Haynes, 4 test). No unique constraint on email yet.

---

## 4. Netlify Serverless Functions (12 total)

### Existing (10)
| Function | Purpose |
|----------|---------|
| fub-leads.js | Pull leads FROM FUB (GET) |
| vapi-call-iron65.js | AI calling via VAPI + Claude |
| ai-call-iron65.js | Twilio TwiML calling (backup) |
| send-tour-sms.js | Tour confirmation SMS via Twilio |
| call-response-iron65.js | Twilio speech input handler |
| call-response.js | Generic call response handler |
| call-recording.js | Twilio recording callback |
| vapi-webhook.js | VAPI call event handler |
| make-call.js | General Twilio call initiator |
| iron65-knowledge.js | Shared knowledge module |

### NEW — 2-Way Sync (2)
| Function | Purpose |
|----------|---------|
| **sync-lead-to-fub.js** | Website → FUB. Push new leads via POST /v1/events |
| **fub-webhook.js** | FUB → Supabase. Receive FUB webhooks, upsert leads |

---

## 5. Architecture — 2-Way FUB Sync

### Website → FUB (sync-lead-to-fub.js)
- Trigger: New lead via website form or dashboard
- Method: POST to FUB /v1/events (triggers FUB automations)
- Loop prevention: Leads with source "fub" are NOT pushed back
- Tags leads with "EmporionPros" + property name
- **Status:** ✅ Code written, needs deployment

### FUB → Supabase (fub-webhook.js)
- Trigger: FUB webhook on peopleCreated/peopleUpdated/peopleStageUpdated
- Method: Receives webhook, fetches full lead data, upserts to Supabase
- Dedup: Matches on email, updates existing or inserts new
- Maps FUB stages to Supabase statuses (new/contacted/qualified/converted/lost)
- Also supports direct data pass-through from dashboard manual sync
- **Status:** ✅ Code written, needs deployment

### Webhook Registration (register-fub-webhooks.js)
- Run once to register 3 webhooks in FUB
- **Status:** ✅ Script written, needs to be run

---

## 6. Environment Variables (Netlify)
| Variable | Status |
|----------|--------|
| FUB_API_KEY | ✅ Set |
| SUPABASE_URL | ⏳ Need to add |
| SUPABASE_SERVICE_KEY | ⏳ Need to add (use service_role key, NOT anon) |
| TWILIO_ACCOUNT_SID | ✅ Set |
| TWILIO_AUTH_TOKEN | ✅ Set |
| TWILIO_PHONE_NUMBER | ⏳ Pending verification |
| VAPI_API_KEY | ✅ Set |

---

## 7. Website Pages (Built)
- index.html, signup.html, vendor-signup.html, login.html
- platform.html, for-agents/developers/managers/owners/vendors.html
- property-details.html, list-property.html, listings.html
- neighborhood.html, grants.html, vendors.html
- iron-65.html, iron-pointe.html
- agent-dashboard.html, fub-aria-dashboard.html
- Demo pages: demo-sale-colonial/condo, demo-vendor-inspection/title

---

## 8. What's Built (Completed)
- [x] Full Supabase schema (9 tables, RLS, triggers)
- [x] Website with all pages deployed on Netlify
- [x] Signup forms submitting to Supabase
- [x] Aria AI chat + calling integration (VAPI + Claude)
- [x] Agent dashboard with auth
- [x] FUB + Aria dashboard with leads, calls, SMS, analytics, settings
- [x] 10 Netlify serverless functions
- [x] FUB lead pull (fub-leads.js)
- [x] **2-way sync code: sync-lead-to-fub.js + fub-webhook.js** (NEW)
- [x] **Dashboard updated with pushLeadToFUB() and syncFUBLeadsToSupabase()** (NEW)
- [x] **Webhook registration script** (NEW)

---

## 9. What's In Progress — DEPLOY THESE NEXT
- [ ] Deploy sync-lead-to-fub.js to netlify/functions/
- [ ] Deploy fub-webhook.js to netlify/functions/
- [ ] Add SUPABASE_URL and SUPABASE_SERVICE_KEY to Netlify env vars
- [ ] Run register-fub-webhooks.js to register webhooks in FUB
- [ ] Wire website signup forms to call sync-lead-to-fub after Supabase insert
- [ ] Test both directions of sync

---

## 10. What's Pending
- [ ] Email-based deduplication (unique constraint on leads.email)
- [ ] Lead status sync (status changes in FUB reflect in Supabase and vice versa)
- [ ] Agent assignment sync
- [ ] Error handling & retry logic
- [ ] Clean up test/duplicate data
- [ ] AI calling improvements (choppy voice fix)
- [ ] Twilio number verification
- [ ] Production hardening

---

## 11. Decisions Made
1. Match key: email address for FUB ↔ Supabase sync
2. Use POST /v1/events (not /v1/people) to push leads to FUB — triggers automations
3. Loop prevention: source="fub" leads don't get pushed back to FUB
4. All backend stays in Netlify Functions (Node.js) — consistent with existing stack
5. FUB webhook handler also supports direct data pass-through for manual dashboard syncs

---

## 12. Session Log
| Date | What was done | What's next |
|------|--------------|-------------|
| 2026-02-22 | Created project manifest, skill, 6 memory edits. Reviewed full schema, all files, FUB API docs. Built sync-lead-to-fub.js (website→FUB), fub-webhook.js (FUB→Supabase), register-fub-webhooks.js. Updated fub-aria-dashboard.html with 2-way sync functions. Created FUB-SYNC-SETUP-GUIDE.md. | Deploy 2 new functions, set env vars, run webhook registration, test both sync directions |

---

## INSTRUCTIONS FOR CLAUDE
**Start of session:**
1. Read this manifest
2. Search previous chats for recent work
3. Ask user to upload any changed code files
4. Confirm current status before making changes

**End of session:**
1. Update session log
2. Update status in sections 8-10
3. Save updated manifest for download
