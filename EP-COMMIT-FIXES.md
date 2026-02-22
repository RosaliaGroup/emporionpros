# EmporionPros — Commit Fix Guide

## Summary of Issues

This commit introduced `ep-leads.js`, SEO meta tags, `sitemap.xml`, and `robots.txt` across 21 files. Three categories of bugs were introduced:

1. **Broken `<script>` injections** — the script tag was appended mid-line, breaking existing HTML
2. **Duplicate `<meta name="description">` tags** — new SEO description added without removing the original
3. **Missing pages** — `listings.html` and `fub-integration.html` were not updated

---

## 1. Broken Script Injections (8 files)

In each of these files, `<script src="ep-leads.js"></script>` was inserted inside a truncated line instead of on its own line before `</body>` or at the end of the file.

### demo-sale-colonial.html (line ~117)

**Current (broken):**
```html
<footer class="ft"><p>Campaign by <a href="platform.html">EmporionPros</a> · No agent. No commission. <a href="for-owners.html"><script src="ep-leads.js"></script>
```

**Fix:** Close the `<a>` tag and footer properly, then add the script:
```html
<footer class="ft"><p>Campaign by <a href="platform.html">EmporionPros</a> · No agent. No commission. <a href="for-owners.html">Learn more →</a></p></footer>
<script src="ep-leads.js"></script>
</body></html>
```

---

### demo-sale-condo.html (line ~120)

**Current (broken):**
```html
<footer class="ft"><p>Campaign by <a href="platform.html">EmporionPros</a> · <a href<script src="ep-leads.js"></script>
```

**Fix:** Complete the truncated `<a href` and close the footer:
```html
<footer class="ft"><p>Campaign by <a href="platform.html">EmporionPros</a> · <a href="for-owners.html">Learn more →</a></p></footer>
<script src="ep-leads.js"></script>
</body></html>
```

---

### demo-vendor-inspection.html (line ~116)

**Current (broken):**
```html
<script dat<script src="ep-leads.js"></script>
```

**Fix:** Restore the original `<script data-cfasync="false" ...>` tag (whatever it was), then add leads script on next line:
```html
<script data-cfasync="false" src="social-proof.js"></script>
<script src="ep-leads.js"></script>
</body></html>
```
> **Note:** You need to check the original file to see what `<script dat` was — likely `<script data-cfasync="false" src="...">` or similar.

---

### demo-vendor-title.html (line ~117)

**Current (broken):**
```html
<script <script src="ep-leads.js"></script>
```

**Fix:** Same as above — restore the original `<script ...>` tag:
```html
<script data-cfasync="false" src="social-proof.js"></script>
<script src="ep-leads.js"></script>
</body></html>
```

---

### iron-65.html (line ~271)

**Current (broken):**
```html
      <div class="uc-det">${u.sqft} sqft${u.<script src="social-proof.js"></script>
<script src="ep-leads.js"></script>
```

**Fix:** The script tags were injected inside a JavaScript template literal. Restore the original JS, close the `<script>` tag, then add both scripts properly:
```html
      <div class="uc-det">${u.sqft} sqft${u.beds}bd/${u.baths}ba · $${u.price}/mo</div>
    </div>`;
  // ... rest of original JS ...
</script>
<script src="social-proof.js"></script>
<script src="ep-leads.js"></script>
</body></html>
```
> **Note:** You need the original file to see the complete template literal and closing tags.

---

### iron-pointe.html (line ~271)

**Current (broken):**
```html
      <div class="uc-de<script src="social-proof.js"></script>
<script src="ep-leads.js"></script>
```

**Fix:** Same issue — template literal was truncated. Restore original:
```html
      <div class="uc-det">${u.num}</div>
      <div class="uc-det">${u.sqft} sqft · ${u.beds}bd/${u.baths}ba · $${u.price}/mo</div>
    </div>`;
  // ... rest of original JS ...
</script>
<script src="social-proof.js"></script>
<script src="ep-leads.js"></script>
</body></html>
```

---

### neighborhood.html (line ~270)

**Current (broken):**
```html
</div><div class="ft-bot">© 202<script src="social-proof.js"></script>
<script src="ep-leads.js"></script>
```

**Fix:** Restore the footer text:
```html
</div><div class="ft-bot">© 2026 EmporionPros / Rosalia Group · All rights reserved</div></footer>
<script src="social-proof.js"></script>
<script src="ep-leads.js"></script>
</body></html>
```

---

### platform.html (line ~423)

**Current (broken):**
```html
<script data-cfasync="fals<script src="social-proof.js"></script>
<script src="ep-leads.js"></script>
```

**Fix:** Restore the original script tag:
```html
<script data-cfasync="false" src="app.js"></script>
<script src="social-proof.js"></script>
<script src="ep-leads.js"></script>
</body></html>
```
> **Note:** Check original file for what `data-cfasync="false"` was attached to.

---

## 2. Duplicate Meta Descriptions (6 files)

These files now have TWO `<meta name="description">` tags. Remove the **old** one (keep the new SEO-optimized one).

### for-agents.html

**Remove this line (the old one, which comes AFTER the new OG/Twitter block):**
```html
<meta name="description" content="Turn every listing into a lead-generating campaign. AI assistant answers calls 24/7, books tours, qualifies leads. Social media tools included. Free 14-day trial.">
```

**Keep:**
```html
<meta name="description" content="Real estate agent lead generation in NJ. AI assistant Aria books tours 24/7. Campaign pages, lead dashboard, vendor marketplace.">
```

---

### grants.html

**Remove:**
```html
<meta name="description" content="Find grants, rebates, tax credits, certifications, and incentives for NJ businesses, homeowners, buyers, renters, and real estate developers. Federal, state, and local programs.">
```

**Keep:**
```html
<meta name="description" content="NJ grants, rebates, tax credits and certifications for businesses, homeowners, buyers, renters and developers. Federal, state, local.">
```

---

### neighborhood.html

**Remove:**
```html
<meta name="description" content="Discover the Ironbound — Newark's most vibrant neighborhood. Portuguese culture, world-class dining, riverside parks, and 20 minutes from Manhattan.">
```

**Keep:**
```html
<meta name="description" content="Ironbound Newark NJ neighborhood guide. Restaurants, transit, schools, walkability, real estate listings and local insights.">
```

---

### platform.html

**Remove:**
```html
<meta name="description" content="Transform every property listing into a marketing campaign. AI assistant, lead generation, social media tools, neighborhood guides. Free 14-day trial.">
```

**Keep:**
```html
<meta name="description" content="EmporionPros platform. AI-powered real estate marketing for agents, managers, owners, vendors and developers in New Jersey.">
```

---

### vendor-signup.html

**Remove:**
```html
<meta name="description" content="Register your business on EmporionPros. Get matched with real estate clients, discover grants, certifications, tax incentives, and contracting opportunities specific to your industry.">
```

**Keep:**
```html
<meta name="description" content="Register your business on EmporionPros. 12 categories with industry-specific grants, certifications and benefits. Free listing.">
```

---

### vendors.html

**Remove:**
```html
<meta name="description" content="Find plumbers, inspectors, title companies, electricians, movers, mortgage lenders and more. For agents, homeowners, property managers, landlords, buyers, and renters. Connect and chat directly.">
```

**Keep:**
```html
<meta name="description" content="Find trusted NJ vendors. Plumbers, inspectors, title companies, electricians, movers, mortgage lenders. Search, compare, chat.">
```

---

## 3. Missing Pages

### listings.html
- In `sitemap.xml` at priority 0.7 but **no SEO meta tags** and **no `ep-leads.js`** added
- Add the same pattern: OG tags, Twitter card, canonical URL, and `<script src="ep-leads.js"></script>` before `</body>`

### fub-integration.html
- Referenced in `robots.txt` (disallowed) but **no `ep-leads.js`** added
- Even though it's blocked from crawlers, users still visit it — add `<script src="ep-leads.js"></script>` for lead/analytics tracking
- No SEO meta tags needed since it's disallowed

### Dashboard / login / signup pages
- `agent-dashboard.html`, `vendor-dashboard.html`, `login.html`, `signup.html` — all disallowed in robots.txt
- Consider adding `ep-leads.js` for analytics tracking even on internal pages

---

## Quick Checklist

| File | Broken Script | Duplicate Meta | Missing Script | Missing SEO |
|------|:---:|:---:|:---:|:---:|
| demo-sale-colonial.html | ✅ fix | | | |
| demo-sale-condo.html | ✅ fix | | | |
| demo-vendor-inspection.html | ✅ fix | | | |
| demo-vendor-title.html | ✅ fix | | | |
| iron-65.html | ✅ fix | | | |
| iron-pointe.html | ✅ fix | | | |
| neighborhood.html | ✅ fix | ✅ fix | | |
| platform.html | ✅ fix | ✅ fix | | |
| for-agents.html | | ✅ fix | | |
| grants.html | | ✅ fix | | |
| vendor-signup.html | | ✅ fix | | |
| vendors.html | | ✅ fix | | |
| listings.html | | | ✅ add | ✅ add |
| fub-integration.html | | | ✅ add | |
