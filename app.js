// ============================================================
// EMPORION PROS — Core App Engine
// Shared data, AI assistant, auth, lead capture, notifications
// ============================================================

const EP = {

  // ── Brand ──────────────────────────────────────────────────
  brand: { name: "Emporion Pros", tagline: "Real Estate. Reimagined.", color: "#1a56db" },

  // ── Shared Storage Helpers ────────────────────────────────
  store: {
    get: k => { try { return JSON.parse(localStorage.getItem(k)) } catch { return null } },
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
    push: (k, v) => { const a = EP.store.get(k) || []; a.unshift(v); EP.store.set(k, a); return a; }
  },

  // ── Current User ─────────────────────────────────────────
  auth: {
    user: () => EP.store.get('ep_user'),
    login: (userData) => { EP.store.set('ep_user', userData); },
    logout: () => { localStorage.removeItem('ep_user'); window.location.href = 'index.html'; },
    isLoggedIn: () => !!EP.store.get('ep_user'),
  },

  // ── Lead Engine ───────────────────────────────────────────
  leads: {
    capture: (lead) => {
      const full = { ...lead, id: Date.now(), date: new Date().toISOString(), status: 'new' };
      EP.store.push('ep_leads', full);
      EP.notify(`📥 New lead: ${lead.name}`, 'success');
      return full;
    },
    getAll: () => EP.store.get('ep_leads') || [],
    getForAgent: (agentId) => (EP.store.get('ep_leads') || []).filter(l => l.agentId === agentId),
    getForVendor: (vendorId) => (EP.store.get('ep_leads') || []).filter(l => l.vendorId === vendorId),
    updateStatus: (id, status) => {
      const leads = EP.store.get('ep_leads') || [];
      const updated = leads.map(l => l.id === id ? { ...l, status } : l);
      EP.store.set('ep_leads', updated);
    }
  },

  // ── Appointments ─────────────────────────────────────────
  appointments: {
    book: (appt) => {
      const full = { ...appt, id: Date.now(), createdAt: new Date().toISOString(), status: 'scheduled' };
      EP.store.push('ep_appointments', full);
      EP.notify(`📅 Appointment booked for ${appt.date} at ${appt.time}`, 'success');
      return full;
    },
    getAll: () => EP.store.get('ep_appointments') || [],
    cancel: (id) => {
      const all = EP.appointments.getAll().map(a => a.id === id ? { ...a, status: 'cancelled' } : a);
      EP.store.set('ep_appointments', all);
    }
  },

  // ── Notification Toast ───────────────────────────────────
  notify: (msg, type = 'info') => {
    const t = document.createElement('div');
    t.className = `ep-toast ep-toast-${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3500);
  },

  // ── Saved Properties ─────────────────────────────────────
  saved: {
    toggle: (id) => {
      let s = EP.store.get('ep_saved') || [];
      if (s.includes(id)) { s = s.filter(x => x !== id); EP.notify('Removed from saved', 'info'); }
      else { s.push(id); EP.notify('❤️ Saved!', 'success'); }
      EP.store.set('ep_saved', s);
      return s.includes(id);
    },
    isSaved: (id) => (EP.store.get('ep_saved') || []).includes(id),
    getAll: () => EP.store.get('ep_saved') || []
  },

  // ── Property Data (Public Records Simulation) ────────────
  properties: [
    { id:1, title:"Colonial Revival Home", price:485000, type:"sale", propType:"Single Family", beds:4, baths:2.5, sqft:2400, address:"127 Roseville Ave", city:"Newark", state:"NJ", zip:"07107", lat:40.7437, lng:-74.1945, img:"https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?w=600&h=400&fit=crop", imgs:["https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?w=900","https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=900","https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900"], desc:"Solid colonial revival home fully renovated. Open concept kitchen, hardwood floors throughout, updated bathrooms. Large fenced yard. Walk to parks and schools.", features:["Driveway","Hardwood Floors","Updated Kitchen","Central AC","Fenced Yard","New Roof 2023"], agentId:1, source:"Public Record", daysListed:5, yearBuilt:1965 },
    { id:2, title:"Modern Downtown Condo", price:3200, type:"rent", propType:"Condo", beds:2, baths:2, sqft:1100, address:"15 Washington St #8B", city:"Newark", state:"NJ", zip:"07102", lat:40.7357, lng:-74.1724, img:"https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop", imgs:["https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900"], desc:"Updated condo with city views, modern finishes, in-unit laundry. Building features gym and 24hr concierge. Pet friendly. Close to Penn Station.", features:["Gym","Doorman","In-Unit Laundry","Parking","City Views","Pet Friendly"], agentId:2, source:"Public Record", daysListed:3, yearBuilt:2005 },
    { id:3, title:"Classic Brick Row House", price:389000, type:"sale", propType:"Single Family", beds:3, baths:2, sqft:1800, address:"44 Clifton Ave", city:"Newark", state:"NJ", zip:"07104", lat:40.7489, lng:-74.1621, img:"https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&h=400&fit=crop", imgs:["https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=900","https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=900"], desc:"Classic Newark brick row house on a quiet tree-lined block. Original hardwood floors, updated eat-in kitchen, full basement. Parking in rear. Move-in ready.", features:["Rear Parking","Hardwood Floors","Full Basement","Front Stoop","Updated Kitchen","Fenced Yard"], agentId:1, source:"Public Record", daysListed:12, yearBuilt:1938 },
    { id:4, title:"Investor Special — Duplex", price:395000, type:"sale", propType:"Multi-Family", beds:6, baths:4, sqft:3000, address:"298 S 10th St", city:"Newark", state:"NJ", zip:"07103", lat:40.7241, lng:-74.2041, img:"https://images.unsplash.com/photo-1555636222-cae831e670b3?w=600&h=400&fit=crop", imgs:["https://images.unsplash.com/photo-1555636222-cae831e670b3?w=900"], desc:"Cash-flowing duplex, both units occupied. Unit A: 3bed/2bath $1,600/mo. Unit B: 3bed/2bath $1,550/mo. New electrical, plumbing updated 2022.", features:["Tenants in Place","New Electrical","Updated Plumbing","Separate Utilities","Parking","Laundry"], agentId:3, source:"Public Record", daysListed:8, yearBuilt:1952 },
    { id:5, title:"Updated Townhouse — Near Transit", price:2800, type:"rent", propType:"Townhouse", beds:3, baths:2.5, sqft:1800, address:"72 Jefferson St", city:"Newark", state:"NJ", zip:"07105", lat:40.7320, lng:-74.1580, img:"https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=600&h=400&fit=crop", imgs:["https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=900"], desc:"Renovated townhouse with private backyard and attached garage. New kitchen, updated baths, fresh paint throughout. Walking distance to Penn Station — 20 min to NYC.", features:["Private Backyard","Attached Garage","Updated Kitchen","New Baths","Near Transit","Central AC"], agentId:2, source:"Public Record", daysListed:2, yearBuilt:1988 },
    { id:6, title:"Charming Victorian — Starter Home", price:299000, type:"sale", propType:"Single Family", beds:3, baths:1.5, sqft:1650, address:"55 Avon Ave", city:"Newark", state:"NJ", zip:"07108", lat:40.7189, lng:-74.2138, img:"https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=600&h=400&fit=crop", imgs:["https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=900"], desc:"Solid Victorian on a good block. Original woodwork, covered front porch, updated kitchen and bath. Deep lot with room to add a garage. Great starter home.", features:["Front Porch","Original Woodwork","Updated Kitchen","Deep Lot","Hardwood Floors","Full Attic"], agentId:3, source:"Public Record", daysListed:19, yearBuilt:1904 },
    { id:7, title:"Studio — Prime Location", price:1650, type:"rent", propType:"Studio", beds:1, baths:1, sqft:550, address:"9 Market St #2A", city:"Newark", state:"NJ", zip:"07102", lat:40.7362, lng:-74.1699, img:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop", imgs:["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900"], desc:"Bright studio with exposed brick and updated finishes. Steps from Prudential Center, restaurants, and nightlife. Utilities included. No broker fee.", features:["Utilities Included","No Broker Fee","Exposed Brick","Near Transit","Laundry in Building","High Ceilings"], agentId:2, source:"Public Record", daysListed:1, yearBuilt:1920 },
    { id:8, title:"Commercial Retail Space", price:4500, type:"rent", propType:"Commercial", beds:0, baths:2, sqft:2200, address:"330 Broad St", city:"Newark", state:"NJ", zip:"07104", lat:40.7452, lng:-74.1712, img:"https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop", imgs:["https://images.unsplash.com/photo-1497366216548-37526070297c?w=900"], desc:"Prime ground-floor retail space on busy Broad St. 20ft ceilings, exposed brick, new HVAC. High foot traffic, great signage opportunity. NNN lease.", features:["Corner Location","20ft Ceilings","New HVAC","High Foot Traffic","NNN Lease","Loading Dock"], agentId:1, source:"Public Record", daysListed:14, yearBuilt:1985 },
    { id:9, title:"Renovated Cape Cod", price:359000, type:"sale", propType:"Single Family", beds:3, baths:2, sqft:1450, address:"88 Weequahic Ave", city:"Newark", state:"NJ", zip:"07112", lat:40.7044, lng:-74.1963, img:"https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d?w=600&h=400&fit=crop", imgs:["https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d?w=900"], desc:"Fully updated cape cod on a quiet residential street. New roof, new HVAC, updated electric and plumbing. White shaker kitchen, vinyl floors, new bathrooms.", features:["New Roof","New HVAC","Updated Electric","White Kitchen","New Bathrooms","Driveway"], agentId:3, source:"Public Record", daysListed:6, yearBuilt:1958 },
    { id:10, title:"4-Unit Apartment Building", price:875000, type:"sale", propType:"Multi-Family", beds:10, baths:8, sqft:5200, address:"115 Clinton Ave", city:"Newark", state:"NJ", zip:"07114", lat:40.7280, lng:-74.1891, img:"https://images.unsplash.com/photo-1460317442991-0ec209397118?w=600&h=400&fit=crop", imgs:["https://images.unsplash.com/photo-1460317442991-0ec209397118?w=900"], desc:"Fully occupied 4-unit brick building. 3 long-term tenants, one unit recently renovated. Cap rate 7.2%. Separate gas and electric. Strong rental history.", features:["Fully Occupied","Cap Rate 7.2%","Separate Utilities","Parking Lot","Laundry Room","Brick Construction"], agentId:1, source:"Public Record", daysListed:21, yearBuilt:1968 },
    { id:11, title:"Brick Rowhouse — Lincoln Park", price:449000, type:"sale", propType:"Single Family", beds:4, baths:2, sqft:2200, address:"22 Lincoln Park", city:"Newark", state:"NJ", zip:"07102", lat:40.7398, lng:-74.1740, img:"https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=600&h=400&fit=crop", imgs:["https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=900"], desc:"Well-maintained brick rowhouse steps from Lincoln Park. Original hardwood floors, updated kitchen, three bedrooms on second floor plus finished third floor. Private garden.", features:["Private Garden","Hardwood Floors","Updated Kitchen","Finished 3rd Floor","Front Porch","Near Park"], agentId:2, source:"Public Record", daysListed:4, yearBuilt:1910 },
    { id:12, title:"Furnished 2BR — Short-Term OK", price:2200, type:"rent", propType:"Condo", beds:2, baths:2, sqft:1050, address:"5 University Ave #12C", city:"Newark", state:"NJ", zip:"07102", lat:40.7341, lng:-74.1746, img:"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop", imgs:["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900"], desc:"Fully furnished condo ideal for travel nurses, executives, and short-term stays. All utilities included, high-speed internet, smart TV. Flexible lease terms.", features:["Fully Furnished","All Utilities","Smart TV","Flexible Lease","High-Speed WiFi","Gym Access"], agentId:3, source:"Public Record", daysListed:7, yearBuilt:2010 },

    // ═══════════════════════════════════════════════════════════
    // IRON 65 — 65 McWhorter St, Newark NJ 07105
    // Phone: (201) 449-6850 | Up to 1 month free
    // ═══════════════════════════════════════════════════════════
    { id:100, title:"Iron 65 — Studio", price:2388, type:"rent", propType:"Studio", beds:0, baths:1, sqft:545, address:"65 McWhorter St", city:"Newark", state:"NJ", zip:"07105", lat:40.7268, lng:-74.1562, img:"https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg", imgs:["https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/10_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/11_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/04_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/07_65_Newark107_mls.jpg"], desc:"Brand new luxury studio at Iron 65 in the Ironbound. Modern finishes, in-unit washer/dryer, oversized windows. Rooftop gym, yoga studio, outdoor kitchen. Steps to restaurants and PATH. Up to 1 month free. Call (862) 288-7972 to schedule a tour.", features:["In-Unit W/D","Rooftop Gym","Yoga Studio","Outdoor Kitchen","Game Room","Controlled Access","Package Lockers","Elevator"], agentId:0, source:"Iron 65", daysListed:1, yearBuilt:2025, special:"Up to 1 Month Free", link:"iron-65.html", phone:"(862) 288-7972", contact:{name:"Aria",title:"AI Leasing Assistant — Available 24/7",phone:"(862) 288-7972",email:"info@emporionpros.com"} },
    { id:101, title:"Iron 65 — Studio Flex", price:2508, type:"rent", propType:"Studio", beds:0, baths:1, sqft:623, address:"65 McWhorter St", city:"Newark", state:"NJ", zip:"07105", lat:40.7268, lng:-74.1562, img:"https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg", imgs:["https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/10_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/11_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/04_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/07_65_Newark107_mls.jpg"], desc:"Spacious studio flex layout at Iron 65 with flexible living/sleeping zones. Modern kitchen, quartz counters, in-unit W/D. Rooftop gym, yoga studio, game rooms. Up to 1 month free. Call (862) 288-7972 to schedule a tour.", features:["In-Unit W/D","Rooftop Gym","Yoga Studio","Outdoor Kitchen","Game Room","Controlled Access","Package Lockers","Elevator"], agentId:0, source:"Iron 65", daysListed:1, yearBuilt:2025, special:"Up to 1 Month Free", link:"iron-65.html", phone:"(862) 288-7972", contact:{name:"Aria",title:"AI Leasing Assistant — Available 24/7",phone:"(862) 288-7972",email:"info@emporionpros.com"} },
    { id:102, title:"Iron 65 — 1BR", price:2788, type:"rent", propType:"Condo", beds:1, baths:1, sqft:699, address:"65 McWhorter St", city:"Newark", state:"NJ", zip:"07105", lat:40.7268, lng:-74.1562, img:"https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg", imgs:["https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/10_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/11_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/04_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/07_65_Newark107_mls.jpg"], desc:"True 1-bedroom at Iron 65 with separate bedroom and living area. Floor-to-ceiling windows, modern kitchen, in-unit W/D. Rooftop amenities include gym, yoga studio, outdoor kitchen. Up to 1 month free. Call (862) 288-7972 to schedule a tour.", features:["In-Unit W/D","Rooftop Gym","Yoga Studio","Outdoor Kitchen","Game Room","Controlled Access","Package Lockers","Elevator"], agentId:0, source:"Iron 65", daysListed:1, yearBuilt:2025, special:"Up to 1 Month Free", link:"iron-65.html", phone:"(862) 288-7972", contact:{name:"Aria",title:"AI Leasing Assistant — Available 24/7",phone:"(862) 288-7972",email:"info@emporionpros.com"} },
    { id:103, title:"Iron 65 — 1BR Flex", price:2650, type:"rent", propType:"Condo", beds:1, baths:1, sqft:822, address:"65 McWhorter St", city:"Newark", state:"NJ", zip:"07105", lat:40.7268, lng:-74.1562, img:"https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg", imgs:["https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/10_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/11_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/04_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/07_65_Newark107_mls.jpg"], desc:"Oversized 1BR flex at Iron 65 with 822 sqft of open living space. Convertible layout perfect for home office setup. In-unit W/D, modern finishes. Full amenity package. Up to 1 month free. Call (862) 288-7972 to schedule a tour.", features:["In-Unit W/D","Rooftop Gym","Yoga Studio","Outdoor Kitchen","Game Room","Controlled Access","Package Lockers","Elevator"], agentId:0, source:"Iron 65", daysListed:1, yearBuilt:2025, special:"Up to 1 Month Free", link:"iron-65.html", phone:"(862) 288-7972", contact:{name:"Aria",title:"AI Leasing Assistant — Available 24/7",phone:"(862) 288-7972",email:"info@emporionpros.com"} },
    { id:104, title:"Iron 65 — 1BR Flex Premium", price:3488, type:"rent", propType:"Condo", beds:1, baths:1, sqft:890, address:"65 McWhorter St", city:"Newark", state:"NJ", zip:"07105", lat:40.7268, lng:-74.1562, img:"https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg", imgs:["https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/10_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/11_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/04_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/07_65_Newark107_mls.jpg"], desc:"Premium 1BR flex + dining at Iron 65. 890 sqft with dedicated dining area, spacious bedroom, modern kitchen with island. In-unit W/D. Full rooftop amenity suite. Up to 1 month free. Call (862) 288-7972 to schedule a tour.", features:["In-Unit W/D","Rooftop Gym","Yoga Studio","Outdoor Kitchen","Game Room","Controlled Access","Package Lockers","Elevator","Dining Area"], agentId:0, source:"Iron 65", daysListed:1, yearBuilt:2025, special:"Up to 1 Month Free", link:"iron-65.html", phone:"(862) 288-7972", contact:{name:"Aria",title:"AI Leasing Assistant — Available 24/7",phone:"(862) 288-7972",email:"info@emporionpros.com"} },
    { id:105, title:"Iron 65 — Loft", price:3788, type:"rent", propType:"Loft", beds:1, baths:2, sqft:1090, address:"65 McWhorter St", city:"Newark", state:"NJ", zip:"07105", lat:40.7268, lng:-74.1562, img:"https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg", imgs:["https://iron65.com/wp-content/uploads/2025/01/18_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/10_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/11_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/04_65_Newark107_mls.jpg","https://iron65.com/wp-content/uploads/2025/01/07_65_Newark107_mls.jpg"], desc:"Signature loft at Iron 65 — 1,090 sqft of dramatic open living with soaring ceilings and 2 full baths. Premium finishes throughout. The crown jewel of Iron 65. Up to 1 month free. Call (862) 288-7972 to schedule a tour.", features:["In-Unit W/D","Rooftop Gym","Yoga Studio","Outdoor Kitchen","Game Room","Controlled Access","Package Lockers","Elevator","Soaring Ceilings","2 Full Baths"], agentId:0, source:"Iron 65", daysListed:1, yearBuilt:2025, special:"Up to 1 Month Free", link:"iron-65.html", phone:"(862) 288-7972", contact:{name:"Aria",title:"AI Leasing Assistant — Available 24/7",phone:"(862) 288-7972",email:"info@emporionpros.com"} },

    // ═══════════════════════════════════════════════════════════
    // IRON POINTE — 39 Madison St, Newark NJ 07105
    // Phone: (201) 449-6850 | New 2024 Construction
    // Special: 2 Months FREE on 12-month lease
    // Only pay electricity — all other utilities included
    // ═══════════════════════════════════════════════════════════
    { id:200, title:"Iron Pointe — 1BR from $2,400", price:2400, type:"rent", propType:"Condo", beds:1, baths:1, sqft:705, address:"39 Madison St", city:"Newark", state:"NJ", zip:"07105", lat:40.7265, lng:-74.1548, img:"images/ironpointe/living-dining.jpg", imgs:["images/ironpointe/living-dining.jpg","images/ironpointe/lobby.jpg","images/ironpointe/building-exterior.jpg","images/ironpointe/living-views.jpg","images/ironpointe/entrance.jpg"], desc:"Brand new 1-bedroom at Iron Pointe — luxury 2024 construction in the Ironbound. 705 sqft, modern finishes, in-unit W/D. Only pay electric. 2 MONTHS FREE on 12-month lease — effective rent from $2,000/mo. 24/7 gym, rooftop terrace with NYC views, live security.", features:["In-Unit W/D","24/7 Gym","Rooftop Terrace","NYC Views","24hr Live Security","Controlled Access","EV Charging","Bike Storage","Business Center","Package Lockers","Elevator","Only Pay Electric"], agentId:0, source:"Iron Pointe", daysListed:1, yearBuilt:2024, special:"2 Months FREE", link:"iron-pointe.html", phone:"(862) 288-7972", contact:{name:"Aria",title:"AI Leasing Assistant — Available 24/7",phone:"(862) 288-7972",email:"info@emporionpros.com"} },
    { id:201, title:"Iron Pointe — 1BR w/ Terrace", price:2650, type:"rent", propType:"Condo", beds:1, baths:1, sqft:735, address:"39 Madison St", city:"Newark", state:"NJ", zip:"07105", lat:40.7265, lng:-74.1548, img:"images/ironpointe/living-dining.jpg", imgs:["images/ironpointe/living-dining.jpg","images/ironpointe/lobby.jpg","images/ironpointe/building-exterior.jpg","images/ironpointe/living-views.jpg","images/ironpointe/entrance.jpg"], desc:"1-bedroom with private terrace at Iron Pointe. 735 sqft, premium finishes, in-unit W/D. Enjoy your own outdoor space plus rooftop terrace with NYC skyline views. 2 MONTHS FREE — effective rent $2,208/mo. Only pay electric.", features:["Private Terrace","In-Unit W/D","24/7 Gym","Rooftop Terrace","NYC Views","24hr Live Security","Controlled Access","EV Charging","Package Lockers","Elevator","Only Pay Electric"], agentId:0, source:"Iron Pointe", daysListed:1, yearBuilt:2024, special:"2 Months FREE", link:"iron-pointe.html", phone:"(862) 288-7972", contact:{name:"Aria",title:"AI Leasing Assistant — Available 24/7",phone:"(862) 288-7972",email:"info@emporionpros.com"} },
    { id:202, title:"Iron Pointe — 1BR w/ Backyard", price:2750, type:"rent", propType:"Condo", beds:1, baths:1, sqft:725, address:"39 Madison St", city:"Newark", state:"NJ", zip:"07105", lat:40.7265, lng:-74.1548, img:"images/ironpointe/living-dining.jpg", imgs:["images/ironpointe/living-dining.jpg","images/ironpointe/lobby.jpg","images/ironpointe/building-exterior.jpg","images/ironpointe/living-views.jpg","images/ironpointe/entrance.jpg"], desc:"Ground-floor 1-bedroom with private backyard at Iron Pointe. 725 sqft, rare outdoor space in a luxury new construction. In-unit W/D. 2 MONTHS FREE — effective rent $2,292/mo. Only pay electric.", features:["Private Backyard","In-Unit W/D","24/7 Gym","Rooftop Terrace","NYC Views","24hr Live Security","Controlled Access","EV Charging","Package Lockers","Elevator","Only Pay Electric"], agentId:0, source:"Iron Pointe", daysListed:1, yearBuilt:2024, special:"2 Months FREE", link:"iron-pointe.html", phone:"(862) 288-7972", contact:{name:"Aria",title:"AI Leasing Assistant — Available 24/7",phone:"(862) 288-7972",email:"info@emporionpros.com"} },
    { id:203, title:"Iron Pointe — 2BR", price:3300, type:"rent", propType:"Condo", beds:2, baths:1, sqft:760, address:"39 Madison St", city:"Newark", state:"NJ", zip:"07105", lat:40.7265, lng:-74.1548, img:"images/ironpointe/living-dining.jpg", imgs:["images/ironpointe/living-dining.jpg","images/ironpointe/lobby.jpg","images/ironpointe/building-exterior.jpg","images/ironpointe/living-views.jpg","images/ironpointe/entrance.jpg"], desc:"2-bedroom at Iron Pointe starting at $3,300/mo. New 2024 construction, modern finishes, in-unit W/D. 2 MONTHS FREE on 12-month lease — effective rent $2,750/mo. Only pay electric. 24/7 gym, rooftop terrace, live security.", features:["In-Unit W/D","24/7 Gym","Rooftop Terrace","NYC Views","24hr Live Security","Controlled Access","EV Charging","Bike Storage","Business Center","Package Lockers","Elevator","Only Pay Electric"], agentId:0, source:"Iron Pointe", daysListed:1, yearBuilt:2024, special:"2 Months FREE", link:"iron-pointe.html", phone:"(862) 288-7972", contact:{name:"Aria",title:"AI Leasing Assistant — Available 24/7",phone:"(862) 288-7972",email:"info@emporionpros.com"} },
    { id:204, title:"Iron Pointe — 2BR Premium", price:3500, type:"rent", propType:"Condo", beds:2, baths:1, sqft:1005, address:"39 Madison St", city:"Newark", state:"NJ", zip:"07105", lat:40.7265, lng:-74.1548, img:"images/ironpointe/living-dining.jpg", imgs:["images/ironpointe/living-dining.jpg","images/ironpointe/lobby.jpg","images/ironpointe/building-exterior.jpg","images/ironpointe/living-views.jpg","images/ironpointe/entrance.jpg"], desc:"Spacious 2BR premium unit at Iron Pointe — 1,005 sqft of luxury living. Top floor with best views. In-unit W/D, modern finishes. 2 MONTHS FREE — effective rent $2,917/mo. Only pay electric. Full amenity suite.", features:["In-Unit W/D","24/7 Gym","Rooftop Terrace","NYC Views","24hr Live Security","Controlled Access","EV Charging","Bike Storage","Business Center","Package Lockers","Elevator","Only Pay Electric","Top Floor"], agentId:0, source:"Iron Pointe", daysListed:1, yearBuilt:2024, special:"2 Months FREE", link:"iron-pointe.html", phone:"(862) 288-7972", contact:{name:"Aria",title:"AI Leasing Assistant — Available 24/7",phone:"(862) 288-7972",email:"info@emporionpros.com"} }
  ],

  // ── Agents ────────────────────────────────────────────────
  agents: [
    { id:1, name:"Carlos Rivera", title:"Senior Listing Agent", phone:"(973) 555-0101", email:"carlos@emporionpros.com", areas:["Newark","Elizabeth","Harrison"], specialties:["Residential","Investment","Commercial"], license:"NJ-RE-001234", rating:4.9, reviews:87, deals:142, photo:"CR", bio:"12+ years helping buyers and sellers in Essex County. Specializes in investment properties and first-time buyers. Fluent in English and Spanish.", languages:["English","Spanish"] },
    { id:2, name:"Priya Nair", title:"Luxury Property Specialist", phone:"(973) 555-0202", email:"priya@emporionpros.com", areas:["Newark","Montclair","Bloomfield"], specialties:["Luxury","Condos","Rentals"], license:"NJ-RE-002345", rating:4.8, reviews:64, deals:98, photo:"PN", bio:"Boutique luxury specialist with a background in interior design. Brings a unique eye to property presentation and negotiation.", languages:["English","Hindi"] },
    { id:3, name:"Marcus Webb", title:"Investment & Commercial Agent", phone:"(973) 555-0303", email:"marcus@emporionpros.com", areas:["Newark","Irvington","East Orange"], specialties:["Multi-Family","Commercial","Fix & Flip"], license:"NJ-RE-003456", rating:4.7, reviews:52, deals:76, photo:"MW", bio:"Dedicated to helping investors build wealth through real estate. Expert in off-market deals, 1031 exchanges, and property analysis.", languages:["English"] }
  ],

  // ── Vendors ───────────────────────────────────────────────
  vendors: [
    { id:1, name:"ProPlumb NJ", category:"Plumbing", phone:"(973) 555-1001", email:"info@proplumbnj.com", rating:4.8, reviews:124, licensed:true, insured:true, areas:["Newark","Essex County"], description:"Full-service plumbing for residential and commercial. Emergency service 24/7. Free estimates.", services:["Emergency Repairs","Water Heaters","Drain Cleaning","Pipe Replacement","Bathroom Remodels"], price:"$$", tier:"premium" },
    { id:2, name:"CoolAir HVAC", category:"HVAC", phone:"(973) 555-1002", email:"service@coolair.com", rating:4.9, reviews:203, licensed:true, insured:true, areas:["Newark","Union County","Essex County"], description:"Complete HVAC solutions. Installs, repairs, and maintenance for all major brands. Financing available.", services:["AC Installation","Heating Systems","Duct Cleaning","Smart Thermostat","Annual Maintenance"], price:"$$$", tier:"premium" },
    { id:3, name:"Bright Spark Electric", category:"Electrical", phone:"(973) 555-1003", email:"hello@brightspark.com", rating:4.7, reviews:89, licensed:true, insured:true, areas:["Newark","Jersey City"], description:"Licensed master electricians. Panels, EV chargers, smart home installs, commercial wiring.", services:["Panel Upgrades","EV Chargers","Outlet Installation","Smart Home","Commercial Wiring"], price:"$$", tier:"standard" },
    { id:4, name:"Garden State Mortgage", category:"Mortgage", phone:"(973) 555-2001", email:"apply@gsm.com", rating:4.9, reviews:312, licensed:true, insured:true, areas:["Nationwide"], description:"Competitive rates on conventional, FHA, VA, and jumbo loans. Pre-approval in 24 hours. First-time buyer programs.", services:["Conventional Loans","FHA Loans","VA Loans","Jumbo Loans","Refinancing","Pre-Approval"], price:"Varies", tier:"premium" },
    { id:5, name:"Shield Insurance Group", category:"Insurance", phone:"(973) 555-2002", email:"quotes@shieldins.com", rating:4.6, reviews:178, licensed:true, insured:false, areas:["New Jersey","New York"], description:"Home, landlord, and commercial property insurance. Bundle discounts available. Online quotes in minutes.", services:["Homeowners","Landlord","Flood","Commercial Property","Liability","Bundle Discounts"], price:"Varies", tier:"standard" },
    { id:6, name:"Apex Title & Settlement", category:"Title", phone:"(973) 555-2003", email:"closings@apextitle.com", rating:4.8, reviews:95, licensed:true, insured:true, areas:["New Jersey"], description:"Full-service title and settlement company. Fast closings, title insurance, and 1031 exchange coordination.", services:["Title Search","Title Insurance","Closing Services","1031 Exchange","Escrow","Remote Closings"], price:"Varies", tier:"premium" },
    { id:7, name:"NJ Home Inspectors", category:"Inspection", phone:"(973) 555-1004", email:"book@njinspect.com", rating:4.7, reviews:156, licensed:true, insured:true, areas:["Essex County","Union County","Bergen County"], description:"Certified home inspectors. Full reports within 24 hours. Mold, radon, and sewer scope add-ons.", services:["Full Home Inspection","Mold Testing","Radon Testing","Sewer Scope","Thermal Imaging","Pre-Listing Inspection"], price:"$$", tier:"standard" },
    { id:8, name:"Reyes Law Group", category:"Real Estate Attorney", phone:"(973) 555-3001", email:"intake@reyeslaw.com", rating:4.9, reviews:67, licensed:true, insured:true, areas:["New Jersey"], description:"Real estate attorneys handling purchases, sales, leases, and disputes. Fixed-fee closings. Free 30-min consult.", services:["Residential Closings","Commercial Transactions","Lease Review","Evictions","Disputes","LLC Formation"], price:"$$$", tier:"premium" },
    { id:9, name:"Green Renovations Co.", category:"General Contractor", phone:"(973) 555-1005", email:"build@greenreno.com", rating:4.6, reviews:73, licensed:true, insured:true, areas:["Newark","Essex County"], description:"Full renovations, kitchens, baths, additions, and investment property turnovers. Free design consultations.", services:["Kitchen Remodel","Bathroom Remodel","Full Renovations","Additions","Investor Turnover","Design-Build"], price:"$$$", tier:"standard" }
  ],

  // ── AI Virtual Assistant Engine ───────────────────────────
  ai: {
    context: [],
    phoneSimActive: false,

    greetings: [
      "Hi! I'm Aria, your Emporion Pros AI assistant. I can help you find properties, connect with agents, book appointments, or find a service vendor. What can I do for you?",
      "Welcome to Emporion Pros! I'm Aria — your 24/7 real estate assistant. I can search listings, book showings, connect you with vendors, or answer any real estate questions. How can I help?"
    ],

    respond: async function(userMsg) {
      const msg = userMsg.toLowerCase();
      EP.ai.context.push({ role: 'user', content: userMsg });

      // ── Property Search ──────────────────────────────────
      if (msg.match(/find|search|look|show|list|propert|home|house|apartment|condo|rent|buy|iron|studio|loft/)) {
        const beds = msg.match(/(\d)\s*bed/) ? parseInt(msg.match(/(\d)\s*bed/)[1]) : null;
        const maxPrice = msg.match(/under\s*\$?([\d,]+)k?/) ? parseInt(msg.match(/under\s*\$?([\d,]+)k?/)[1].replace(/,/,'')) * (msg.includes('k') ? 1000 : 1) : null;
        const forRent = msg.includes('rent') || msg.includes('apartment') || msg.includes('iron');
        const wantIron65 = msg.includes('iron 65') || msg.includes('iron65') || msg.includes('mcwhorter');
        const wantIronPointe = msg.includes('iron pointe') || msg.includes('ironpointe') || msg.includes('madison');
        
        let filtered = EP.properties.filter(p => {
          if (wantIron65 && p.source !== 'Iron 65') return false;
          if (wantIronPointe && p.source !== 'Iron Pointe') return false;
          if (!wantIron65 && !wantIronPointe) {
            if (forRent && p.type !== 'rent') return false;
            if (!forRent && msg.includes('buy') && p.type !== 'sale') return false;
          }
          if (beds && p.beds < beds) return false;
          if (maxPrice && p.price > maxPrice) return false;
          return true;
        }).slice(0, 5);

        if (filtered.length) {
          const list = filtered.map(p => {
            let line = `• **${p.title}** — $${p.price.toLocaleString()}${p.type==='rent'?'/mo':''} | ${p.beds === 0 ? 'Studio' : p.beds + ' bed'} | ${p.sqft.toLocaleString()} sqft | ${p.address}`;
            if (p.special) line += ` | 🎉 ${p.special}`;
            return line;
          }).join('\n');
          return `I found ${filtered.length} matching properties:\n\n${list}\n\nWould you like to schedule a showing, get more details, or connect with an agent?`;
        }
        return "I couldn't find exact matches but our agents have access to off-market listings too. Want me to connect you with an agent right now?";
      }

      // ── Schedule Showing ─────────────────────────────────
      if (msg.match(/schedul|showing|tour|visit|appointment|see the|view the/)) {
        EP.ai.showAppointmentModal();
        return "I'm pulling up the appointment scheduler for you right now! Pick a date and time that works and I'll confirm it instantly with the agent. 📅";
      }

      // ── Vendor Request ───────────────────────────────────
      if (msg.match(/plumb|hvac|electric|inspect|mortgage|loan|insur|attorney|lawyer|contractor|repair|renovate/)) {
        const cat = msg.includes('plumb') ? 'Plumbing' : msg.includes('hvac') || msg.includes('heat') || msg.includes('ac') ? 'HVAC' : msg.includes('electric') ? 'Electrical' : msg.includes('mortgage') || msg.includes('loan') ? 'Mortgage' : msg.includes('insur') ? 'Insurance' : msg.includes('attorney') || msg.includes('lawyer') ? 'Real Estate Attorney' : msg.includes('inspect') ? 'Inspection' : 'General Contractor';
        const vendor = EP.vendors.find(v => v.category === cat);
        if (vendor) return `I found a top-rated **${cat}** provider:\n\n🏢 **${vendor.name}**\n⭐ ${vendor.rating}/5 (${vendor.reviews} reviews)\n📞 ${vendor.phone}\n\n${vendor.description}\n\nShould I connect you with them or get a quote?`;
        return `I'll connect you with a ${cat} professional. Want me to send your contact info to our vetted vendors in that category?`;
      }

      // ── Phone / Call ─────────────────────────────────────
      if (msg.match(/call|phone|dial|speak|talk to/)) {
        return EP.ai.simulatePhoneCall();
      }

      // ── Price / Market ───────────────────────────────────
      if (msg.match(/price|cost|market|worth|value|afford/)) {
        return "Newark median sale price is currently **$435,000** — up 8.2% year over year. Rentals average **$2,400/mo** for 2-beds.\n\n🏢 **Iron 65** studios from **$2,388/mo** (up to 1 month free)\n🏢 **Iron Pointe** 1BRs from **$2,400/mo** (2 months free — effective $2,000/mo)\n\nWould you like a free property valuation or details on either building?";
      }

      // ── Greeting ─────────────────────────────────────────
      if (msg.match(/hi|hello|hey|good morning|good afternoon/)) {
        return EP.ai.greetings[Math.floor(Math.random() * EP.ai.greetings.length)];
      }

      // ── Agent Request ────────────────────────────────────
      if (msg.match(/agent|realtor|broker/)) {
        return `Our top agents are available now:\n\n👤 **Carlos Rivera** — (973) 555-0101 | Residential & Investment\n👤 **Priya Nair** — (973) 555-0202 | Luxury & Condos\n👤 **Marcus Webb** — (973) 555-0303 | Multi-Family & Commercial\n\nWant me to schedule a free consultation with one of them?`;
      }

      // ── Default ──────────────────────────────────────────
      return "Great question! I can help you search properties, schedule showings, connect with agents or vendors, and answer real estate questions. What would you like to do?";
    },

    simulatePhoneCall: function() {
      EP.ai.phoneSimActive = true;
      setTimeout(() => {
        const overlay = document.createElement('div');
        overlay.id = 'phone-overlay';
        overlay.innerHTML = `
          <div class="phone-modal">
            <div class="phone-icon">📞</div>
            <div class="phone-title">Aria is calling the agent...</div>
            <div class="phone-sub">Emporion Pros AI is dialing on your behalf</div>
            <div class="phone-animation">
              <span></span><span></span><span></span>
            </div>
            <div class="phone-transcript" id="phone-transcript">Connecting...</div>
            <button onclick="this.closest('#phone-overlay').remove()" class="phone-end">End Call</button>
          </div>`;
        document.body.appendChild(overlay);
        
        const lines = [
          "Connected to agent Carlos Rivera...",
          'Aria: "Hello, I have a client interested in scheduling a showing."',
          'Agent: "Sure, what property and when works for them?"',
          'Aria: "They\'re flexible — earliest availability please."',
          'Agent: "Tomorrow at 2pm or Thursday at 10am?"',
          'Aria: "I\'ll confirm with the client and send a calendar invite."',
          '✅ Call complete! Appointment options sent to your email.'
        ];
        
        let i = 0;
        const interval = setInterval(() => {
          if (i < lines.length) {
            document.getElementById('phone-transcript').innerHTML += `<br>${lines[i]}`;
            i++;
          } else {
            clearInterval(interval);
          }
        }, 1500);
      }, 500);
      return "📞 I'm calling the agent now on your behalf! Watch the call simulation...";
    },

    showAppointmentModal: function(propTitle, propAddress) {
      setTimeout(() => {
        const title = propTitle || 'a property';
        const addr = propAddress || '';
        const m = document.createElement('div');
        m.id = 'appt-modal';
        m.innerHTML = `
          <div class="modal-box">
            <h3>📅 Book a Showing</h3>
            <p style="color:#6b7280;margin-bottom:12px">Pick a date and time — I'll confirm instantly</p>
            ${addr ? `<div style="background:#eff6ff;border:1px solid #c7d2fe;border-radius:8px;padding:12px;margin-bottom:16px">
              <div style="font-size:12px;color:#6b7280;margin-bottom:2px">Property</div>
              <div style="font-weight:700;font-size:14px;color:#1e3a8a">${title}</div>
              <div style="font-size:13px;color:#374151">📍 ${addr}</div>
            </div>` : ''}
            <input type="text" id="appt-name" placeholder="Your Name" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:10px;font-family:inherit">
            <input type="email" id="appt-email" placeholder="Your Email" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:10px;font-family:inherit">
            <input type="tel" id="appt-phone" placeholder="Your Phone" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:10px;font-family:inherit">
            <input type="date" id="appt-date" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:10px;font-family:inherit">
            <select id="appt-time" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:20px;font-family:inherit">
              <option>9:00 AM</option><option>10:00 AM</option><option>11:00 AM</option>
              <option>1:00 PM</option><option>2:00 PM</option><option>3:00 PM</option><option>4:00 PM</option>
            </select>
            <button onclick="EP.ai.confirmAppt('${title.replace(/'/g,"\\'")}','${addr.replace(/'/g,"\\'")}')" style="width:100%;padding:12px;background:#1a56db;color:white;border:none;border-radius:6px;font-weight:700;cursor:pointer;font-family:inherit">Confirm Appointment</button>
            <button onclick="document.getElementById('appt-modal').remove()" style="width:100%;padding:10px;background:transparent;border:none;color:#6b7280;cursor:pointer;margin-top:8px;font-family:inherit">Cancel</button>
          </div>`;
        document.body.appendChild(m);
      }, 300);
    },

    confirmAppt: function(propTitle, propAddress) {
      const name = document.getElementById('appt-name')?.value;
      const email = document.getElementById('appt-email')?.value;
      const phone = document.getElementById('appt-phone')?.value;
      const date = document.getElementById('appt-date')?.value;
      const time = document.getElementById('appt-time')?.value;
      if (!name || !date || !phone) { alert('Please fill in your name, phone, and date.'); return; }
      const appt = { name, email, phone, date, time, type: 'showing', property: propTitle || '', address: propAddress || '' };
      EP.appointments.book(appt);
      // Also capture as a lead
      EP.leads.capture({ name, email, phone, message: `Showing request for ${propTitle || 'property'} at ${propAddress || 'TBD'} on ${date} at ${time}`, source: 'Appointment Booking' });
      document.getElementById('appt-modal')?.remove();
      EP.ai.addMessage('assistant', `✅ Done! Showing booked for **${propTitle || 'property'}**${propAddress ? ' at **' + propAddress + '**' : ''} on **${date} at ${time}**. We'll contact you at ${phone} to confirm. See you then, ${name}!`);
    },

    addMessage: function(role, content) {
      const container = document.getElementById('ai-messages');
      if (!container) return;
      const div = document.createElement('div');
      div.className = `ai-msg ai-msg-${role}`;
      // Simple markdown bold
      div.innerHTML = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    }
  },

  // ── Render Header (shared) ────────────────────────────────
  renderHeader: function(activePage = '') {
    const user = EP.auth.user();
    return `
    <header class="ep-header">
      <div class="ep-container ep-header-inner">
        <a href="index.html" class="ep-logo">Emporion<span>Pros</span></a>
        <nav class="ep-nav">
          <a href="listings.html" class="${activePage==='listings'?'active':''}">Buy / Rent</a>
          <a href="agents.html" class="${activePage==='agents'?'active':''}">Agents</a>
          <a href="vendors.html" class="${activePage==='vendors'?'active':''}">Services</a>
          <a href="post-property.html" class="${activePage==='post'?'active':''}">List Property</a>
          <a href="learning.html" class="${activePage==='learning'?'active':''}">🎓 Learning</a>
        </nav>
        <div class="ep-header-actions">
          ${user ? `
            <a href="${user.role==='agent'?'agent-dashboard.html':user.role==='vendor'?'vendor-dashboard.html':'listings.html'}" class="ep-btn ep-btn-ghost">Dashboard</a>
            <button onclick="EP.auth.logout()" class="ep-btn ep-btn-outline">Sign Out</button>
          ` : `
            <a href="login.html" class="ep-btn ep-btn-ghost">Sign In</a>
            <a href="signup.html" class="ep-btn ep-btn-primary">Join Free</a>
          `}
        </div>
        <button class="ep-mobile-menu" onclick="document.querySelector('.ep-nav').classList.toggle('open')">☰</button>
      </div>
    </header>`;
  },

  // ── Render AI Chat Widget (shared) ────────────────────────
  renderAIWidget: function() {
    return `
    <div id="ai-widget" class="ai-widget-closed">
      <button id="ai-toggle" class="ai-fab" onclick="EP.toggleAI()">
        <span id="ai-fab-icon">💬</span>
        <span class="ai-badge" id="ai-badge" style="display:none">1</span>
      </button>
      <div class="ai-panel" id="ai-panel">
        <div class="ai-panel-header">
          <div class="ai-avatar-header">🤖</div>
          <div>
            <div class="ai-name">Aria — AI Assistant</div>
            <div class="ai-status">● Online 24/7</div>
          </div>
          <div style="margin-left:auto;display:flex;gap:8px">
            <button class="ai-action-btn" onclick="EP.ai.simulatePhoneCall()" title="Call agent">📞</button>
            <button class="ai-action-btn" onclick="EP.ai.showAppointmentModal()" title="Book showing">📅</button>
            <button class="ai-action-btn" onclick="EP.toggleAI()" title="Close">✕</button>
          </div>
        </div>
        <div class="ai-messages" id="ai-messages"></div>
        <div class="ai-quick-actions">
          <button onclick="EP.ai.quickMsg('Find me a 3-bedroom home to buy')">🏠 Buy</button>
          <button onclick="EP.ai.quickMsg('I need a rental apartment')">🔑 Rent</button>
          <button onclick="EP.ai.quickMsg('Show me Iron 65 apartments')">🏢 Iron 65</button>
          <button onclick="EP.ai.quickMsg('Show me Iron Pointe apartments')">🏢 Iron Pointe</button>
          <button onclick="EP.ai.quickMsg('Schedule a showing')">📅 Showing</button>
          <button onclick="EP.ai.quickMsg('I need a plumber')">🔧 Vendor</button>
          <button onclick="EP.ai.quickMsg('Call an agent for me')">📞 Call</button>
        </div>
        <div class="ai-input-row">
          <input type="text" id="ai-input" class="ai-input" placeholder="Ask Aria anything..." onkeydown="if(event.key==='Enter')EP.sendAI()">
          <button class="ai-send" onclick="EP.sendAI()">➤</button>
        </div>
      </div>
    </div>`;
  },

  toggleAI: function() {
    const w = document.getElementById('ai-widget');
    const isOpen = !w.classList.contains('ai-widget-closed');
    if (isOpen) { w.classList.add('ai-widget-closed'); }
    else {
      w.classList.remove('ai-widget-closed');
      document.getElementById('ai-badge').style.display = 'none';
      if (!document.getElementById('ai-messages').children.length) {
        EP.ai.addMessage('assistant', EP.ai.greetings[0]);
      }
    }
  },

  sendAI: async function() {
    const input = document.getElementById('ai-input');
    const msg = input?.value?.trim();
    if (!msg) return;
    input.value = '';
    EP.ai.addMessage('user', msg);
    const thinking = document.createElement('div');
    thinking.className = 'ai-msg ai-msg-assistant ai-thinking';
    thinking.innerHTML = '<span></span><span></span><span></span>';
    document.getElementById('ai-messages').appendChild(thinking);
    await new Promise(r => setTimeout(r, 800));
    thinking.remove();
    const reply = await EP.ai.respond(msg);
    EP.ai.addMessage('assistant', reply);
  },

  ai_quickMsg: null,

  // ── Shared CSS ────────────────────────────────────────────
  injectStyles: function() {
    if (document.getElementById('ep-styles')) return;
    const s = document.createElement('style');
    s.id = 'ep-styles';
    s.textContent = `
      *{box-sizing:border-box;margin:0;padding:0}
      :root{--primary:#1a56db;--primary-dark:#1e429f;--success:#0e9f6e;--danger:#e02424;--text:#111827;--text2:#6b7280;--border:#e5e7eb;--bg:#f9fafb;--white:#fff;--shadow:0 1px 3px rgba(0,0,0,.1),0 1px 2px rgba(0,0,0,.06)}
      body{font-family:'Inter',-apple-system,sans-serif;color:var(--text);background:var(--bg);line-height:1.5}
      .ep-container{max-width:1400px;margin:0 auto;padding:0 24px}
      
      /* Header */
      .ep-header{background:var(--white);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:900;box-shadow:var(--shadow)}
      .ep-header-inner{display:flex;align-items:center;height:68px;gap:32px}
      .ep-logo{font-size:22px;font-weight:800;color:var(--primary);text-decoration:none;white-space:nowrap}
      .ep-logo span{color:#f97316}
      .ep-nav{display:flex;gap:24px;list-style:none}
      .ep-nav a{color:var(--text);text-decoration:none;font-weight:500;font-size:14px;padding:4px 0;border-bottom:2px solid transparent;transition:.2s}
      .ep-nav a:hover,.ep-nav a.active{color:var(--primary);border-bottom-color:var(--primary)}
      .ep-header-actions{display:flex;gap:12px;align-items:center;margin-left:auto}
      .ep-mobile-menu{display:none;background:none;border:none;font-size:22px;cursor:pointer}
      @media(max-width:768px){.ep-nav{display:none;position:absolute;top:68px;left:0;right:0;background:white;flex-direction:column;padding:16px 24px;border-bottom:1px solid var(--border);gap:12px}.ep-nav.open{display:flex}.ep-mobile-menu{display:block}.ep-header-actions{gap:8px}}
      
      /* Buttons */
      .ep-btn{padding:9px 18px;border-radius:7px;font-weight:600;font-size:13px;cursor:pointer;transition:.2s;text-decoration:none;display:inline-block;border:none;font-family:inherit}
      .ep-btn-primary{background:var(--primary);color:white}.ep-btn-primary:hover{background:var(--primary-dark);transform:translateY(-1px)}
      .ep-btn-outline{background:transparent;color:var(--text);border:1px solid var(--border)}.ep-btn-outline:hover{border-color:var(--primary);color:var(--primary)}
      .ep-btn-ghost{background:transparent;color:var(--text)}.ep-btn-ghost:hover{background:var(--bg)}
      .ep-btn-success{background:var(--success);color:white}.ep-btn-danger{background:var(--danger);color:white}
      .ep-btn-lg{padding:13px 28px;font-size:15px}
      
      /* Cards */
      .ep-card{background:var(--white);border-radius:12px;overflow:hidden;box-shadow:var(--shadow);border:2px solid transparent;transition:.3s;cursor:pointer}
      .ep-card:hover{transform:translateY(-4px);box-shadow:0 12px 24px rgba(0,0,0,.12);border-color:var(--primary)}
      
      /* Property Card */
      .prop-img-wrap{position:relative;height:220px;overflow:hidden;background:var(--bg)}
      .prop-img{width:100%;height:100%;object-fit:cover}
      .prop-badge{position:absolute;top:12px;left:12px;padding:5px 10px;border-radius:5px;font-size:11px;font-weight:700;text-transform:uppercase;color:white;background:var(--primary)}
      .prop-badge.rent{background:var(--success)}
      .prop-badge.special{background:#f97316;top:12px;left:auto;right:12px}
      .prop-heart{position:absolute;top:10px;right:10px;background:white;border:none;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:17px;transition:.2s}
      .prop-heart:hover{background:#fee2e2;transform:scale(1.1)}
      .prop-body{padding:18px}
      .prop-price{font-size:26px;font-weight:800;color:var(--primary);margin-bottom:6px}
      .prop-price small{font-size:14px;font-weight:400;color:var(--text2)}
      .prop-addr{font-size:14px;color:var(--text);margin-bottom:10px;font-weight:500}
      .prop-stats{display:flex;gap:14px;padding:10px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:10px}
      .prop-stat{font-size:13px;color:var(--text2)}
      .prop-footer{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text2)}
      
      /* Grid */
      .ep-grid-3{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:24px}
      .ep-grid-4{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}
      .ep-grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:24px}
      
      /* Form */
      .ep-form-group{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
      .ep-label{font-size:13px;font-weight:600;color:var(--text)}
      .ep-input,.ep-select,.ep-textarea{padding:11px 14px;border:1px solid var(--border);border-radius:7px;font-size:14px;font-family:inherit;transition:.2s;background:white}
      .ep-input:focus,.ep-select:focus,.ep-textarea:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px rgba(26,86,219,.1)}
      .ep-textarea{min-height:100px;resize:vertical}
      
      /* Toast */
      .ep-toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%) translateY(20px);background:#1f2937;color:white;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;opacity:0;transition:.3s;z-index:9999;pointer-events:none;white-space:nowrap}
      .ep-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
      .ep-toast.ep-toast-success{background:#065f46}
      .ep-toast.ep-toast-info{background:#1e3a5f}
      
      /* AI Widget */
      .ai-widget-closed .ai-panel{display:none}
      .ai-fab{position:fixed;bottom:28px;right:28px;width:58px;height:58px;border-radius:50%;background:var(--primary);border:none;font-size:26px;cursor:pointer;box-shadow:0 4px 16px rgba(26,86,219,.4);z-index:800;transition:.3s;display:flex;align-items:center;justify-content:center}
      .ai-fab:hover{transform:scale(1.1);box-shadow:0 6px 24px rgba(26,86,219,.5)}
      .ai-badge{position:absolute;top:-4px;right:-4px;background:#e02424;color:white;border-radius:50%;width:18px;height:18px;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center}
      .ai-panel{position:fixed;bottom:100px;right:24px;width:360px;background:white;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.15);z-index:800;display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--border)}
      @media(max-width:480px){.ai-panel{width:calc(100vw - 32px);right:16px}}
      .ai-panel-header{background:var(--primary);color:white;padding:14px 16px;display:flex;align-items:center;gap:10px}
      .ai-avatar-header{font-size:28px}
      .ai-name{font-weight:700;font-size:15px}
      .ai-status{font-size:11px;opacity:.85}
      .ai-action-btn{background:rgba(255,255,255,.2);border:none;color:white;width:30px;height:30px;border-radius:6px;cursor:pointer;font-size:14px;transition:.2s}
      .ai-action-btn:hover{background:rgba(255,255,255,.35)}
      .ai-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;min-height:220px;max-height:320px}
      .ai-msg{max-width:85%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.5}
      .ai-msg-user{background:var(--primary);color:white;align-self:flex-end;border-radius:12px 12px 3px 12px}
      .ai-msg-assistant{background:var(--bg);color:var(--text);align-self:flex-start;border-radius:12px 12px 12px 3px}
      .ai-thinking span{display:inline-block;width:6px;height:6px;background:var(--text2);border-radius:50%;margin:0 2px;animation:bounce .8s infinite}
      .ai-thinking span:nth-child(2){animation-delay:.15s}.ai-thinking span:nth-child(3){animation-delay:.3s}
      @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
      .ai-quick-actions{display:flex;gap:6px;padding:8px 12px;flex-wrap:wrap;border-top:1px solid var(--border)}
      .ai-quick-actions button{padding:5px 10px;background:var(--bg);border:1px solid var(--border);border-radius:20px;font-size:12px;cursor:pointer;font-family:inherit;transition:.2s}
      .ai-quick-actions button:hover{background:var(--primary);color:white;border-color:var(--primary)}
      .ai-input-row{display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--border)}
      .ai-input{flex:1;padding:9px 12px;border:1px solid var(--border);border-radius:7px;font-size:13px;font-family:inherit}
      .ai-input:focus{outline:none;border-color:var(--primary)}
      .ai-send{padding:9px 14px;background:var(--primary);color:white;border:none;border-radius:7px;cursor:pointer;font-size:14px}
      
      /* Phone overlay */
      #phone-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;display:flex;align-items:center;justify-content:center}
      .phone-modal{background:white;border-radius:20px;padding:40px;text-align:center;max-width:400px;width:90%}
      .phone-icon{font-size:56px;margin-bottom:12px;animation:ring .6s infinite alternate}
      @keyframes ring{from{transform:rotate(-10deg)}to{transform:rotate(10deg)}}
      .phone-title{font-size:22px;font-weight:700;margin-bottom:8px}
      .phone-sub{color:var(--text2);margin-bottom:16px}
      .phone-animation{display:flex;justify-content:center;gap:8px;margin-bottom:16px}
      .phone-animation span{width:12px;height:12px;background:var(--primary);border-radius:50%;animation:bounce .8s infinite}
      .phone-animation span:nth-child(2){animation-delay:.15s}.phone-animation span:nth-child(3){animation-delay:.3s}
      .phone-transcript{text-align:left;background:var(--bg);padding:12px;border-radius:8px;font-size:13px;line-height:1.8;max-height:200px;overflow-y:auto;margin-bottom:16px}
      .phone-end{padding:12px 32px;background:#e02424;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:15px}
      
      /* Appointment modal */
      #appt-modal{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;display:flex;align-items:center;justify-content:center}
      .modal-box{background:white;border-radius:16px;padding:32px;max-width:420px;width:90%}
      .modal-box h3{font-size:22px;font-weight:700;margin-bottom:8px}
      
      /* Section */
      .ep-section{padding:80px 0}
      .ep-section-title{font-size:36px;font-weight:800;margin-bottom:12px}
      .ep-section-sub{font-size:18px;color:var(--text2);max-width:600px}
      
      /* Stars */
      .ep-stars{color:#f59e0b;font-size:14px}
      
      /* Badge */
      .ep-tag{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600}
      .ep-tag-blue{background:#eff6ff;color:var(--primary)}
      .ep-tag-green{background:#f0fdf4;color:#15803d}
      .ep-tag-orange{background:#fff7ed;color:#c2410c}
      
      /* Stat */
      .ep-stat-block{background:var(--white);padding:24px;border-radius:10px;box-shadow:var(--shadow);text-align:center}
      .ep-stat-num{font-size:36px;font-weight:800;color:var(--primary)}
      .ep-stat-label{font-size:13px;color:var(--text2);font-weight:500}
      
      /* Lead form card */
      .lead-card{background:var(--white);border-radius:12px;padding:28px;box-shadow:var(--shadow);position:sticky;top:88px}
      
      /* Dashboard layout */
      .dash-layout{display:grid;grid-template-columns:240px 1fr;min-height:calc(100vh - 68px)}
      .dash-sidebar{background:var(--white);border-right:1px solid var(--border);padding:24px 0}
      .dash-sidebar a{display:flex;align-items:center;gap:10px;padding:12px 24px;color:var(--text);text-decoration:none;font-size:14px;font-weight:500;transition:.2s}
      .dash-sidebar a:hover,.dash-sidebar a.active{background:var(--bg);color:var(--primary)}
      .dash-main{padding:32px}
      .dash-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:32px}
      .dash-stat{background:white;padding:24px;border-radius:10px;box-shadow:var(--shadow)}
      .dash-stat-label{font-size:13px;color:var(--text2);margin-bottom:6px}
      .dash-stat-val{font-size:30px;font-weight:800;color:var(--primary)}
      
      /* Table */
      .ep-table{width:100%;border-collapse:collapse;font-size:14px}
      .ep-table th{text-align:left;padding:10px 16px;background:var(--bg);color:var(--text2);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
      .ep-table td{padding:14px 16px;border-bottom:1px solid var(--border)}
      .ep-table tr:hover td{background:var(--bg)}
      
      /* Responsive */
      @media(max-width:900px){.dash-layout{grid-template-columns:1fr}.dash-sidebar{display:none}}
      @media(max-width:640px){.ep-grid-3,.ep-grid-4,.ep-grid-2{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }
};

// Quick message helper
EP.ai.quickMsg = function(msg) {
  document.getElementById('ai-input').value = msg;
  EP.sendAI();
};

// Auto-init styles on load
document.addEventListener('DOMContentLoaded', () => EP.injectStyles());
