// EMPORION PROS — Social Proof + Cost Analysis v3
// Session-unique names, context-aware, vendor client+booking popups
(function(){
'use strict';

// ── STYLES ──
var s=document.createElement('style');
s.textContent='#ep-sp{position:fixed;bottom:24px;left:24px;z-index:9999;max-width:360px}@media(max-width:600px){#ep-sp{left:10px;right:10px;bottom:10px;max-width:100%}}.ep-t{background:#fff;border-radius:12px;padding:14px 40px 14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.13);display:flex;align-items:center;gap:10px;border-left:3px solid #c8622a;margin-bottom:8px;transform:translateY(20px);opacity:0;transition:all .4s ease;position:relative}.ep-t.in{transform:translateY(0);opacity:1}.ep-t.out{transform:translateX(-110%);opacity:0}.ep-t-i{font-size:20px;flex-shrink:0}.ep-t-b{flex:1}.ep-t-h{font-size:12px;font-weight:700;color:#0a0f1a;line-height:1.3}.ep-t-s{font-size:10px;color:#64748b;margin-top:1px}.ep-t-m{font-size:9px;color:#94a3b8;margin-top:2px}.ep-t-x{position:absolute;top:6px;right:8px;background:none;border:none;font-size:14px;color:#cbd5e1;cursor:pointer;line-height:1}.ep-t-x:hover{color:#64748b}#ep-ca-btn{position:fixed;bottom:24px;right:24px;z-index:9998;background:#c8622a;color:#fff;border:none;padding:11px 16px;border-radius:11px;font-weight:700;font-size:12px;cursor:pointer;box-shadow:0 4px 16px rgba(200,98,42,.3);display:flex;align-items:center;gap:6px;font-family:inherit;transition:.2s}#ep-ca-btn:hover{background:#e8813f;transform:translateY(-2px)}.ep-ca-dot{width:7px;height:7px;background:#0e9f6e;border-radius:50%;animation:epp 2s infinite}@keyframes epp{0%,100%{opacity:1}50%{opacity:.4}}#ep-ca{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10000;align-items:center;justify-content:center}#ep-ca.open{display:flex}.ep-ca-b{background:#fff;border-radius:16px;width:min(540px,94vw);max-height:88vh;overflow-y:auto;box-shadow:0 20px 50px rgba(0,0,0,.2)}.ep-ca-hd{background:linear-gradient(135deg,#0a0f1a,#1e3a5f);color:#fff;padding:22px 24px;border-radius:16px 16px 0 0;position:relative}.ep-ca-hd h3{font-size:18px;font-weight:800}.ep-ca-hd p{font-size:11px;opacity:.65;margin-top:3px}.ep-ca-cls{position:absolute;top:14px;right:16px;background:none;border:none;color:#fff;font-size:20px;cursor:pointer}.ep-ca-bd{padding:22px}.ep-ca-r{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px}.ep-ca-l{color:#64748b}.ep-ca-v{font-weight:700}.g{color:#059669}.r{color:#dc2626}.ep-ca-tot{background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:14px;margin-top:14px;text-align:center}.ep-ca-tot h4{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#059669;font-weight:700}.ep-ca-tot .big{font-size:26px;font-weight:900;color:#059669;margin:3px 0}.ep-ca-tot p{font-size:10px;color:#64748b}.ep-ca-cta{display:flex;gap:8px;margin-top:14px}.ep-ca-cta a,.ep-ca-cta button{flex:1;padding:11px;border-radius:8px;font-weight:700;font-size:13px;border:none;cursor:pointer;text-align:center;font-family:inherit;text-decoration:none;display:block}.ep-ca-fill{background:#c8622a;color:#fff}.ep-ca-out{background:transparent;border:1.5px solid #e5e7eb;color:#0a0f1a}';
document.head.appendChild(s);

var box=document.createElement('div');box.id='ep-sp';document.body.appendChild(box);

// ── SESSION-UNIQUE NAME SYSTEM ──
var firstNames=['Sarah','James','Maria','David','Jennifer','Carlos','Michael','Ana','Robert','Lisa','Tom','Priya','Alex','Nicole','Kevin','Amanda','Ryan','Elena','Chris','Jessica','Daniel','Sofia','Marcus','Emily','Brandon','Ashley','Tyler','Valentina','Derek','Samantha','Ricardo','Fatima','Liam','Aisha','Jordan','Natalie','Andre','Victoria','Patrick','Isabel','Sean','Brianna','Omar','Rachel','Darius','Melissa','Kai','Gabriela','Trevor','Jasmine','Diego','Mia','Ethan','Sophia','Nathan','Olivia','Leo','Camila','Adrian','Nina'];
var lastI='ABCDEFGHIJKLMNOPRSTUVWXYZ';
var ct=['Newark','Jersey City','Hoboken','Montclair','Maplewood','South Orange','Bloomfield','West Orange','East Orange','Nutley','Union','Livingston','Cranford','Summit','Belleville','Kearny','Harrison','Bayonne','North Bergen','Weehawken'];
var tm=['just now','1 min ago','2 min ago','3 min ago','5 min ago'];

// Shuffle and cycle names so no repeats per session
var shuffled=firstNames.slice().sort(function(){return Math.random()-.5});
var nameIdx=0;
function N(){
  var fn=shuffled[nameIdx%shuffled.length];
  nameIdx++;
  return fn+' '+lastI[Math.floor(Math.random()*lastI.length)]+'.';
}
function R(a){return a[Math.floor(Math.random()*a.length)]}
function RI(n){return Math.floor(Math.random()*n)}

// ── DETECT PAGE ──
var pg=(location.pathname+' '+document.title).toLowerCase();
var isAgent=pg.indexOf('agent')>-1;
var isManager=pg.indexOf('manager')>-1;
var isOwner=pg.indexOf('owner')>-1;
var isVendor=pg.indexOf('vendor')>-1||pg.indexOf('marketplace')>-1||pg.indexOf('inspection')>-1||pg.indexOf('title')>-1;
var isProp=pg.indexOf('iron')>-1||pg.indexOf('property')>-1||pg.indexOf('listing')>-1||pg.indexOf('sale')>-1||pg.indexOf('colonial')>-1||pg.indexOf('condo')>-1||pg.indexOf('merchant')>-1||pg.indexOf('multi-family')>-1;
var isPlatform=pg.indexOf('platform')>-1||pg.indexOf('index')>-1||location.pathname==='/';
var isNeighborhood=pg.indexOf('neighborhood')>-1;

function getN(){
var a=[];

// ── PROPERTY PAGES ──
if(isProp){
var pr=pg.indexOf('iron-65')>-1?'Iron 65':pg.indexOf('iron-pointe')>-1?'Iron Pointe':pg.indexOf('3br')>-1||pg.indexOf('colonial')>-1?'Ironbound 3BR':'this property';
a.push(
{i:'👀',h:N()+' is viewing '+pr,s:'From '+R(ct)},
{i:'👀',h:(RI(10)+4)+' people viewing right now',s:pr+' · High demand'},
{i:'📅',h:N()+' just booked a tour!',s:pr+' · '+R(['Tomorrow','Today','Saturday','Monday'])+' at '+R(['10am','11am','1pm','2pm','3pm'])},
{i:'📅',h:N()+' scheduled a showing',s:pr+' · via Calendly'},
{i:'✅',h:N()+' submitted application',s:pr+' · just now'},
{i:'❤️',h:N()+' saved '+pr,s:'Added to favorites from '+R(ct)},
{i:'🔥',h:(RI(15)+8)+' inquiries today',s:pr+' · Trending listing'},
{i:'📞',h:'Aria AI qualified '+N(),s:'Budget confirmed · tour booked for '+pr},
{i:'💬',h:N()+' asked Aria about '+R(['pricing','move-in date','pet policy','parking','utilities']),s:pr},
{i:'📱',h:N()+' shared '+pr,s:'Via '+R(['Instagram story','Facebook','text','email','WhatsApp'])},
{i:'👀',h:N()+' viewing from '+R(['Manhattan','Brooklyn','Hoboken','JC','Queens']),s:'Comparing to local options'}
);
}

// ── VENDOR PAGES — Clients seeking + vendors booking ──
if(isVendor){
// Clients looking for services
a.push(
{i:'🔎',h:N()+' searching for a plumber',s:'Emergency leak · '+R(ct)},
{i:'🔎',h:N()+' needs home inspection',s:'Closing in 2 weeks · '+R(ct)},
{i:'🔎',h:N()+' looking for title company',s:'Purchase closing · '+R(ct)},
{i:'🔎',h:N()+' searching for electrician',s:'Panel upgrade needed · '+R(ct)},
{i:'🔎',h:N()+' needs moving company',s:R(ct)+' → '+R(ct)+' · '+R(['this week','next Saturday','March 1'])},
{i:'🔎',h:N()+' looking for cleaning service',s:'Move-out clean · '+R(['1BR','2BR','3BR','4BR'])},
{i:'🔎',h:N()+' needs listing photographer',s:'Listing going live '+R(['tomorrow','this week','Monday'])},
{i:'🔎',h:N()+' searching for locksmith',s:'Rekey '+R(['2','4','6','8'])+' units · '+R(ct)},
{i:'🔎',h:N()+' looking for landscaper',s:R(['Spring cleanup','Weekly mowing','Snow removal'])+' · '+R(ct)},
{i:'🔎',h:N()+' needs pest inspection',s:'Termite clearance for closing'},
{i:'🔎',h:N()+' looking for real estate attorney',s:R(['Contract review','Closing','Eviction','Lease dispute'])},
{i:'🔎',h:N()+' needs insurance quote',s:R(['Homeowner','Landlord','Renter','Flood'])+' policy'},
{i:'🔎',h:N()+' searching for mortgage lender',s:'Pre-approval · $'+R(['300','350','400','450','500'])+'K budget'},
{i:'🔎',h:N()+' needs home stager',s:'Listing in '+R(ct)+' · showing next week'}
);
// Vendors getting booked
a.push(
{i:'✅',h:N()+' booked Garden State Inspections',s:'Pre-purchase inspection · '+R(ct)},
{i:'✅',h:N()+' hired Liberty Title Group',s:'Closing scheduled · '+R(['next week','Friday','March 3'])},
{i:'✅',h:N()+' booked Ironbound Plumbing',s:'Emergency repair · on the way'},
{i:'✅',h:N()+' hired PowerLine Electric',s:'EV charger install · '+R(ct)},
{i:'✅',h:N()+' booked EZ Move NJ',s:R(ct)+' → '+R(ct)+' · confirmed'},
{i:'✅',h:N()+' hired Sparkle Clean',s:'Move-out deep clean · '+R(['tomorrow','Saturday','Monday'])},
{i:'✅',h:N()+' booked Lens & Light Photos',s:'Listing shoot · '+R(ct)},
{i:'✅',h:N()+' hired Torres & Associates',s:'Closing representation · '+R(ct)},
{i:'✅',h:N()+' booked Shield Pest Control',s:'Termite inspection · same day'},
{i:'✅',h:N()+' hired Green Thumb Landscaping',s:'Commercial property · '+R(ct)},
{i:'💬',h:N()+' messaged QuickLock Locksmith',s:'Smart lock install · 3 units'},
{i:'💬',h:N()+' contacted SafeGuard Insurance',s:'Landlord policy quote · '+R(ct)},
{i:'⭐',h:N()+' left 5-star review',s:'For '+R(['Garden State Inspections','Liberty Title','Ironbound Plumbing','Sparkle Clean','Lens & Light'])}
);
}

// ── AGENT PAGES ──
if(isAgent){
a.push(
{i:'📈',h:N()+' got '+(RI(10)+3)+' new leads today',s:'From their EmporionPros campaign'},
{i:'📅',h:'Buyer booked tour on '+N()+'\'s listing',s:'Via Aria AI · from '+R(ct)},
{i:'💰',h:N()+' closed $'+(RI(400)+250)+'K sale',s:'Lead from campaign page'},
{i:'🎯',h:N()+'\'s campaign hit '+(RI(500)+100)+' views',s:R(['This week','Today','In 3 days'])},
{i:'🤖',h:'Aria qualified buyer for '+N(),s:'Budget: $'+(RI(3)+1)+','+(RI(900)+100)+'/mo'},
{i:'📞',h:'Aria booked showing for '+N(),s:R(['Iron 65','Iron Pointe','Ironbound listing'])},
{i:'✅',h:N()+'\'s buyer submitted application',s:'Via campaign page · '+R(ct)},
{i:'📅',h:N()+' got '+(RI(4)+2)+' tours booked today',s:'Aria handled scheduling'},
{i:'👀',h:N()+'\'s listing: '+(RI(40)+15)+' views today',s:'Campaign shared on '+R(['IG','Facebook','LinkedIn'])}
);
}

// ── MANAGER PAGES ──
if(isManager){
a.push(
{i:'🏢',h:N()+' filled vacancy via campaign',s:R(['1BR','2BR','Studio'])+' · '+R(ct)},
{i:'📊',h:N()+'\'s portfolio: '+(RI(8)+3)+' leads today',s:(RI(60)+20)+' units managed'},
{i:'📅',h:'Aria booked '+(RI(5)+2)+' tours today',s:'For '+N()+'\'s buildings'},
{i:'🔔',h:'Auto-campaign launched',s:N()+'\'s unit went vacant → live in 30s'},
{i:'✅',h:N()+' signed new tenant',s:'EmporionPros lead · '+R(ct)},
{i:'📞',h:'After-hours inquiry handled',s:'Aria answered at '+R(['11pm','midnight','6am','2am'])+' for '+N()},
{i:'📈',h:N()+' reduced vacancy by '+(RI(30)+20)+'%',s:'Since launching campaigns'},
{i:'👀',h:N()+'\'s building: '+(RI(50)+20)+' page views',s:R(['This week','Today','Last 3 days'])}
);
}

// ── OWNER PAGES ──
if(isOwner){
a.push(
{i:'🏠',h:N()+' listed home — $0 commission',s:'$'+(RI(400)+200)+'K · '+R(ct)},
{i:'📞',h:'Aria handled '+(RI(6)+2)+' calls for '+N(),s:'While they were at work'},
{i:'💰',h:N()+' saved $'+(RI(20)+8)+'K in commissions',s:'Sold via EmporionPros campaign'},
{i:'📅',h:N()+' got showing booked',s:'Buyer from '+R(ct)+' · '+R(['Tomorrow','Saturday','Monday'])},
{i:'👀',h:N()+'\'s listing: '+(RI(30)+10)+' views today',s:'Shared on social media'},
{i:'✅',h:N()+' accepted an offer!',s:'$'+(RI(300)+250)+'K · no agent fees'},
{i:'📱',h:N()+'\'s campaign went viral',s:(RI(200)+50)+' shares on '+R(['Facebook','Instagram','Nextdoor'])},
{i:'🔑',h:N()+' closed in '+(RI(20)+10)+' days',s:'No agent. No commission. EmporionPros'}
);
}

// ── PLATFORM / HOMEPAGE ──
if(isPlatform){
a.push(
{i:'🚀',h:N()+' launched first campaign',s:R(['Agent','Manager','Owner','Vendor'])+' · '+R(ct)},
{i:'📈',h:(RI(50)+30)+' campaigns live now',s:'Across '+(RI(8)+5)+' NJ cities'},
{i:'🤖',h:'Aria handled '+(RI(30)+15)+' calls today',s:'24/7 AI assistant'},
{i:'💰',h:N()+' earned commission from EP lead',s:'$'+(RI(15)+5)+'K · '+R(ct)},
{i:'🎉',h:N()+' just signed up',s:R(['Agent','Property Manager','Homeowner','Vendor'])+' from '+R(ct)}
);
}

// ── NEIGHBORHOOD ──
if(isNeighborhood){
a.push(
{i:'🗺️',h:N()+' exploring the Ironbound',s:'Checking restaurants & transit'},
{i:'📅',h:N()+' booked Ironbound tour',s:R(['Iron 65','Iron Pointe'])+' · '+R(['Tomorrow','Saturday'])},
{i:'❤️',h:N()+' saved Ironbound guide',s:'Moving from '+R(['Manhattan','Brooklyn','Hoboken','JC','Queens'])}
);
}

// If no context matched, add generic
if(a.length===0){
a.push(
{i:'🎉',h:N()+' joined EmporionPros',s:R(['Agent','Manager','Owner','Vendor'])+' · '+R(ct)},
{i:'🚀',h:N()+' launched a campaign',s:R(['Rental','Sale','Multi-Family'])+' in '+R(ct)},
{i:'📞',h:'Aria AI answered a call',s:'Lead qualified · '+R(ct)}
);
}
return a;
}

// ── SHOW TOAST ──
var showing=false;
function show(){
if(showing)return;
showing=true;
var n=R(getN());
var el=document.createElement('div');
el.className='ep-t';
el.innerHTML='<div class="ep-t-i">'+n.i+'</div><div class="ep-t-b"><div class="ep-t-h">'+n.h+'</div><div class="ep-t-s">'+n.s+'</div><div class="ep-t-m">'+R(tm)+'</div></div><button class="ep-t-x" onclick="this.parentElement.classList.replace(\'in\',\'out\');var e=this.parentElement;setTimeout(function(){e.remove()},400)">✕</button>';
box.appendChild(el);
requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('in')})});
setTimeout(function(){el.classList.replace('in','out');setTimeout(function(){el.remove();showing=false},400)},5500);
}

// First at 2.5s, then every 8-14s
setTimeout(show,2500);
setInterval(function(){if(!showing)show()},Math.floor(Math.random()*6000)+8000);

// ── COST ANALYSIS (context per user type) ──
var caTitle,caDesc,caRows,caBottom,caLink;

if(isOwner){
caTitle='🏠 Homeowner Savings Calculator';
caDesc='See how much you save selling with EmporionPros vs. a traditional agent.';
caRows='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#dc2626;margin-bottom:10px">Traditional Agent Costs (on $400K home)</div><div class="ep-ca-r"><span class="ep-ca-l">💸 Agent Commission (6%)</span><span class="ep-ca-v r">$24,000</span></div><div class="ep-ca-r"><span class="ep-ca-l">📋 Staging & Photos</span><span class="ep-ca-v r">$2,000-5,000</span></div><div class="ep-ca-r"><span class="ep-ca-l">📱 Marketing Budget</span><span class="ep-ca-v r">$500-2,000</span></div><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;margin:10px 0;display:flex;justify-content:space-between;font-size:13px"><span style="color:#dc2626;font-weight:700">Total Agent Cost</span><span style="color:#dc2626;font-weight:800;font-size:15px">$26,500+</span></div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#059669;margin:16px 0 10px">EmporionPros DIY</div><div class="ep-ca-r"><span class="ep-ca-l">💰 Monthly Plan</span><span class="ep-ca-v">$29/mo</span></div><div class="ep-ca-r"><span class="ep-ca-l">📸 Campaign Page</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">🤖 Aria AI 24/7</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">🗺️ Neighborhood Guide</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">📱 Social Media Kit</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">💸 Commission</span><span class="ep-ca-v g">$0 — 0%</span></div>';
caBottom='<div class="ep-ca-tot"><h4>You Save</h4><div class="big">$26,000+</div><p>Sell for $29/mo instead of $24,000 in commissions</p></div>';
caLink='for-owners.html#signup';
} else if(isManager){
caTitle='🏢 Property Manager ROI';
caDesc='What does a vacancy cost you vs. filling it with EmporionPros?';
caRows='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#dc2626;margin-bottom:10px">Cost of Vacancy (1BR @ $2,400/mo)</div><div class="ep-ca-r"><span class="ep-ca-l">📅 1 Month Vacant</span><span class="ep-ca-v r">−$2,400</span></div><div class="ep-ca-r"><span class="ep-ca-l">📅 2 Months Vacant</span><span class="ep-ca-v r">−$4,800</span></div><div class="ep-ca-r"><span class="ep-ca-l">📅 3 Months Vacant</span><span class="ep-ca-v r">−$7,200</span></div><div class="ep-ca-r"><span class="ep-ca-l">🏢 Broker Fee (1 mo rent)</span><span class="ep-ca-v r">−$2,400</span></div><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;margin:10px 0;display:flex;justify-content:space-between;font-size:13px"><span style="color:#dc2626;font-weight:700">Total Lost Revenue</span><span style="color:#dc2626;font-weight:800;font-size:15px">$4,800-9,600</span></div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#059669;margin:16px 0 10px">EmporionPros Manager Plan</div><div class="ep-ca-r"><span class="ep-ca-l">💰 Monthly Plan</span><span class="ep-ca-v">$99/mo</span></div><div class="ep-ca-r"><span class="ep-ca-l">🤖 Aria AI After-Hours</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">🔔 Auto Vacancy Campaigns</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">📊 Portfolio Dashboard</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">📅 Avg Days to Fill</span><span class="ep-ca-v g">14 days (vs 45)</span></div>';
caBottom='<div class="ep-ca-tot"><h4>Monthly ROI</h4><div class="big">$2,300+ saved</div><p>Fill vacancies 3x faster. $99/mo pays for itself with 1 day less vacancy.</p></div>';
caLink='for-managers.html#signup';
} else if(isVendor){
caTitle='🔧 Vendor Lead Value';
caDesc='How much is each EmporionPros lead worth to your business?';
caRows='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#dc2626;margin-bottom:10px">Traditional Advertising</div><div class="ep-ca-r"><span class="ep-ca-l">🔍 Google Ads</span><span class="ep-ca-v r">$15-45/click</span></div><div class="ep-ca-r"><span class="ep-ca-l">📘 Facebook Ads</span><span class="ep-ca-v r">$10-30/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">📋 HomeAdvisor/Angi</span><span class="ep-ca-v r">$15-80/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">🤝 Referral Payment</span><span class="ep-ca-v r">10-20% of job</span></div><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;margin:10px 0;display:flex;justify-content:space-between;font-size:13px"><span style="color:#dc2626;font-weight:700">Avg Cost Per Lead</span><span style="color:#dc2626;font-weight:800;font-size:15px">$25-60</span></div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#059669;margin:16px 0 10px">EmporionPros Vendor Plan</div><div class="ep-ca-r"><span class="ep-ca-l">💰 Featured Listing</span><span class="ep-ca-v">$49/mo</span></div><div class="ep-ca-r"><span class="ep-ca-l">🎯 Matched Leads</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">💬 In-App Chat</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">🤖 AI Referrals</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">📊 Analytics</span><span class="ep-ca-v g">Included</span></div>';
caBottom='<div class="ep-ca-tot"><h4>Your Cost Per Lead</h4><div class="big">$3-8 vs $25-60</div><p>Up to <b>87% less</b> than HomeAdvisor/Angi. Free listing available.</p></div>';
caLink='for-vendors.html#signup';
} else {
// Default: Agent
caTitle='💰 Agent Lead Cost Analysis';
caDesc='How much are you paying per lead? See the EmporionPros difference.';
caRows='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#dc2626;margin-bottom:10px">Traditional Lead Sources</div><div class="ep-ca-r"><span class="ep-ca-l">🏢 Zillow Premier Agent</span><span class="ep-ca-v r">$20-60/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">📱 Realtor.com</span><span class="ep-ca-v r">$25-50/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">📘 Facebook/IG Ads</span><span class="ep-ca-v r">$15-40/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">🔍 Google Ads</span><span class="ep-ca-v r">$30-80/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">🤝 Referral Network</span><span class="ep-ca-v r">25-35% split</span></div><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;margin:10px 0;display:flex;justify-content:space-between;font-size:13px"><span style="color:#dc2626;font-weight:700">Avg Cost Per Lead</span><span style="color:#dc2626;font-weight:800;font-size:15px">$35-60</span></div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#059669;margin:16px 0 10px">EmporionPros Direct Leads</div><div class="ep-ca-r"><span class="ep-ca-l">💰 Pro Plan</span><span class="ep-ca-v">$99/mo</span></div><div class="ep-ca-r"><span class="ep-ca-l">📊 Avg Leads/Mo</span><span class="ep-ca-v">15-40</span></div><div class="ep-ca-r"><span class="ep-ca-l">🤖 Aria AI 24/7</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">📅 Tour Booking</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">🤝 Commission Split</span><span class="ep-ca-v g">0%</span></div>';
caBottom='<div class="ep-ca-tot"><h4>Your Cost Per Lead</h4><div class="big">$2.48 – $6.60</div><p>Up to <b>95% less</b> than Zillow/Realtor.com</p></div><div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px;margin-top:10px;font-size:10px;color:#92400e;text-align:center"><b>Rentals:</b> 1 lease = 24 months of EP paid.<br><b>Sales:</b> 3% on $450K = $13,500 = <b>136x ROI</b>.</div>';
caLink='for-agents.html#signup';
}

var ca=document.createElement('div');ca.id='ep-ca';
ca.innerHTML='<div class="ep-ca-b"><div class="ep-ca-hd"><button class="ep-ca-cls" onclick="document.getElementById(\'ep-ca\').classList.remove(\'open\')">✕</button><h3>'+caTitle+'</h3><p>'+caDesc+'</p></div><div class="ep-ca-bd">'+caRows+caBottom+'<div class="ep-ca-cta"><a href="'+caLink+'" class="ep-ca-fill">Start Free 14-Day Trial</a><button class="ep-ca-out" onclick="document.getElementById(\'ep-ca\').classList.remove(\'open\')">Close</button></div></div></div>';
document.body.appendChild(ca);
ca.addEventListener('click',function(e){if(e.target===ca)ca.classList.remove('open')});

var btnLabel=isOwner?'🏠 Savings Calculator':isManager?'🏢 Vacancy ROI':isVendor?'🔧 Lead Value':'💰 Cost Per Lead';
var btn=document.createElement('button');btn.id='ep-ca-btn';
btn.innerHTML='<span class="ep-ca-dot"></span> '+btnLabel;
btn.onclick=function(){ca.classList.add('open')};
document.body.appendChild(btn);

// Auto-show on agent page
if(isAgent)setTimeout(function(){ca.classList.add('open')},20000);
})();
