# EmporionPros Listing Data — Iron 65 & Iron Pointe
## Copy-paste these into your app.js `EP.properties` array

---

## IRON 65 — 65 McWhorter St, Newark, NJ 07105
**Website:** iron65.com  |  **Phone:** (908) 699-6500  |  **Leasing:** Ana Haynes  
**Special:** Up to 1 month free during pre-leasing  
**Hours:** Tue–Fri 12-6 PM, Sat–Sun 12-4 PM  

### Unit Types & Pricing (from iron65.com/floor-plans)

| Model | Type | Sqft | Starting Price |
|-------|------|------|----------------|
| 00 | Studio | 545 | $2,388 |
| 12 | Studio | 543 | $2,474 |
| 06 | Studio Flex | 623 | $2,508 |
| 03 | Studio Flex | 605 | $2,549 |
| 09 | Studio Flex | 510 | $2,499 |
| 10 | 1BR | 699 | $2,788 |
| 04 | 1BR Flex | 822 | $2,650 |
| 08 | 1BR Flex | 725 | $2,699 |
| 07 | 1BR Flex | 817 | $2,749 |
| 05 | 1BR Flex | 834 | $2,799 |
| 02 | 1BR Flex | 776 | $3,164 |
| 11 | 1BR Flex + Dining | 886 | $3,274 |
| 01 | 1BR Flex + Dining | 890 | $3,488 |
| Loft 112 | Loft | 1,090 | $3,788 |

### Amenities
Rooftop gym, yoga studio, outdoor kitchen, game rooms, social areas, 
controlled access, elevator, package lockers, bike storage

---

## IRON POINTE — 39 Madison St, Newark, NJ 07105
**Website:** emporionpros.com/iron-pointe  |  **Phone:** (201) 449-6850  |  **Leasing:** Ana Haynes  
**Special:** 2 months free on 12-month lease, amenity fees waived if apply within 24hrs  
**Utilities:** Only pay electricity  

### Available Units & Pricing

**1 Bedrooms:**

| Unit | Sqft | Rent | Effective (w/2mo free) | Notes |
|------|------|------|------------------------|-------|
| 104, 107, 208, 209 | 705 | $2,400 | $2,000 | |
| 205 | 538 | $2,400 | $2,000 | |
| 418, 518 | 580 | $2,400-2,500 | $2,000-2,083 | |
| 517 | 560 | $2,500 | $2,083 | |
| 201 | 725 | $2,500 | $2,083 | |
| 301, 408, 411, 511 | 680-725 | $2,600 | $2,167 | |
| 512, 417 | 560-640 | $2,600 | $2,167 | |
| 213, 313, 413 | 680 | $2,650-2,750 | $2,208-2,292 | Terrace (213) |
| 214, 514 | 735 | $2,650-2,700 | $2,208-2,250 | Terrace |
| 513 | 605 | $2,700 | $2,250 | |
| 101, 102 | 670-725 | $2,750 | $2,292 | w/ Backyard |

**2 Bedrooms:**

| Unit | Sqft | Rent | Effective (w/2mo free) | Notes |
|------|------|------|------------------------|-------|
| 108 | 760 | $3,300 | $2,750 | w/ Backyard |
| 207 | 1,047 | $3,300 | $2,750 | |
| 503 | 1,005 | $3,500 | $2,917 | |

### Amenities
Rooftop terrace, 24/7 gym, 24-hour live security, controlled access,
EV charging, bike storage, business center, package lockers, elevator

---

## CODE TO ADD TO app.js

Find the `EP.properties` array in app.js and add these entries.
Match the existing property object structure:

```javascript
// === ADD THESE TO EP.properties ARRAY ===

// Iron 65 — Studios
{ id: 101, title: 'Iron 65 - Studio', address: '65 McWhorter St, Newark, NJ', price: 2388, type: 'rent', beds: 0, baths: 1, sqft: 545, img: 'https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg', agentId: 1, daysListed: 1, special: 'Up to 1 month free', link: 'https://iron65.com' },
{ id: 102, title: 'Iron 65 - Studio Flex', address: '65 McWhorter St, Newark, NJ', price: 2508, type: 'rent', beds: 0, baths: 1, sqft: 623, img: 'https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg', agentId: 1, daysListed: 1, special: 'Up to 1 month free', link: 'https://iron65.com' },

// Iron 65 — 1 Bedrooms
{ id: 103, title: 'Iron 65 - 1BR Flex', address: '65 McWhorter St, Newark, NJ', price: 2650, type: 'rent', beds: 1, baths: 1, sqft: 822, img: 'https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg', agentId: 1, daysListed: 1, special: 'Up to 1 month free', link: 'https://iron65.com' },
{ id: 104, title: 'Iron 65 - 1BR Flex', address: '65 McWhorter St, Newark, NJ', price: 2749, type: 'rent', beds: 1, baths: 1, sqft: 817, img: 'https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg', agentId: 1, daysListed: 1, special: 'Up to 1 month free', link: 'https://iron65.com' },

// Iron 65 — Loft
{ id: 105, title: 'Iron 65 - Loft', address: '65 McWhorter St, Newark, NJ', price: 3788, type: 'rent', beds: 1, baths: 2, sqft: 1090, img: 'https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg', agentId: 1, daysListed: 1, special: 'Up to 1 month free', link: 'https://iron65.com' },

// Iron Pointe — 1 Bedrooms
{ id: 201, title: 'Iron Pointe - 1BR', address: '39 Madison St, Newark, NJ', price: 2400, type: 'rent', beds: 1, baths: 1, sqft: 705, img: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663360032476/zSQPUcVWFcrhfdcr.jpg', agentId: 1, daysListed: 1, special: '2 months free', link: 'iron-pointe.html' },
{ id: 202, title: 'Iron Pointe - 1BR w/ Terrace', address: '39 Madison St, Newark, NJ', price: 2650, type: 'rent', beds: 1, baths: 1, sqft: 735, img: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663360032476/zSQPUcVWFcrhfdcr.jpg', agentId: 1, daysListed: 1, special: '2 months free', link: 'iron-pointe.html' },
{ id: 203, title: 'Iron Pointe - 1BR w/ Backyard', address: '39 Madison St, Newark, NJ', price: 2750, type: 'rent', beds: 1, baths: 1, sqft: 725, img: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663360032476/zSQPUcVWFcrhfdcr.jpg', agentId: 1, daysListed: 1, special: '2 months free', link: 'iron-pointe.html' },

// Iron Pointe — 2 Bedrooms
{ id: 204, title: 'Iron Pointe - 2BR', address: '39 Madison St, Newark, NJ', price: 3300, type: 'rent', beds: 2, baths: 1, sqft: 760, img: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663360032476/zSQPUcVWFcrhfdcr.jpg', agentId: 1, daysListed: 1, special: '2 months free', link: 'iron-pointe.html' },
{ id: 205, title: 'Iron Pointe - 2BR Premium', address: '39 Madison St, Newark, NJ', price: 3500, type: 'rent', beds: 2, baths: 1, sqft: 1005, img: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663360032476/zSQPUcVWFcrhfdcr.jpg', agentId: 1, daysListed: 1, special: '2 months free', link: 'iron-pointe.html' },
```

**Note:** Make sure the `id` values don't conflict with existing properties in your array. Check the highest existing ID and adjust these if needed.

---

## FILES TO DEPLOY

Upload these to your GitHub repo (RosaliaGroup/emporionpros):

1. **agent-dashboard.html** — Fixed template rendering bugs (My Listings + Aria greeting)
2. **iron-pointe.html** — Dedicated landing page for Iron Pointe (root of repo)
3. **app.js** — Add the property entries above to the EP.properties array

After committing, Netlify will auto-deploy within ~1 minute.
