# Facebook Page auto-posting for EmporionPros listings

`list-property.html` can post a listing straight to an agent's Facebook Page
via Meta's official Graph API — a real, ban-safe integration, not browser
automation. Facebook **Marketplace** has no equivalent API and stays a
copy/paste flow on purpose (see the "Facebook Marketplace" invariant below —
do not automate it).

## How it works

1. `list-property.html` saves the listing, then shows a "Facebook Page
   (auto-post)" card. If the signed-in agent has a connected Page, a
   **Post Now** button appears; otherwise it shows a "not connected" message.
2. Clicking **Post Now** calls `netlify/functions/fb-page-post.js`, which:
   - looks up the listing and the agent's Page connection
   - requires `contact_name` to be set (attribution — see below)
   - posts the listing (with photos) to the Page via the Graph API
   - records the result in `listing_posts`

## Connecting an agent's Page (manual for now)

There's no in-app "Connect Facebook" button yet — that's a follow-up. Until
then, connect a Page by inserting a row directly (Supabase SQL editor,
project `nfwxruzhgzkhklvzmfsw`):

```sql
insert into agent_integrations (agent_id, platform, page_id, page_token)
values ('<agent-uuid-from-profiles>', 'facebook_page', '<fb-page-id>', '<page-access-token>');
```

Getting a Page ID and a long-lived Page access token requires a Meta
developer app with the Page's admin approving `pages_manage_posts` and
`pages_read_engagement`. Rosalia Group already went through this setup for
its own Page — the same steps apply per-agent; see
`RosaliaGroup/rosalia-lister` `functions/FB_PAGE_SETUP.md` for the walkthrough.

The token in `agent_integrations` is only ever read by the Netlify function
using the Supabase service_role key — no client-side code can read it (see
the migration file for the RLS setup).

## Invariants — do not remove these to simplify code

- **Attribution.** The function throws rather than posting a listing with no
  `contact_name`. EmporionPros has no courtesy/co-broke import, so the
  contact name on the listing *is* the attribution.
- **Facebook Marketplace has no API.** Don't add DOM automation for it here
  or anywhere multi-tenant — Meta's Marketplace caps and bans are real, and a
  banned agent account can't be recovered. Keep Marketplace as generated
  text the agent pastes in themselves.
- **No automated login/browser automation for Zillow, Avail, or Realtor.com.**
  All three explicitly prohibit bot access in their terms regardless of whose
  account it is, and a prior attempt in this project hit Zillow's PerimeterX
  CAPTCHA twice. Keep those as copy/paste text + "open portal" links.
  Zillow does run a legitimate feed-integration program for property
  management platforms (XML/MITS, free, ~4-6 week approval) — see
  https://www.zillowgroup.com/developers/api/rentals/rentals-feed-integrations/
  if EmporionPros wants to pursue that later; it is a separate, larger
  undertaking from this change and needs Zillow's approval, not just code.
