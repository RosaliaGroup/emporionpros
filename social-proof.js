// EMPORION PROS — Social Proof + Cost Analysis v5
(function(){
'use strict';
var s=document.createElement('style');
s.textContent='#ep-sp{position:fixed;bottom:24px;left:24px;z-index:9999;max-width:380px}@media(max-width:600px){#ep-sp{left:10px;right:10px;bottom:10px;max-width:100%}}.ep-t{background:#fff;border-radius:14px;padding:16px 44px 16px 18px;box-shadow:0 8px 30px rgba(0,0,0,.13);display:flex;align-items:center;gap:12px;border-left:4px solid #c8622a;margin-bottom:8px;transform:translateY(20px);opacity:0;transition:all .4s ease;position:relative;min-height:56px}.ep-t.in{transform:translateY(0);opacity:1}.ep-t.out{transform:translateX(-110%);opacity:0}.ep-t-i{font-size:22px;flex-shrink:0}.ep-t-b{flex:1}.ep-t-h{font-size:13px;font-weight:700;color:#0a0f1a;line-height:1.3}.ep-t-s{font-size:11px;color:#64748b;margin-top:2px}.ep-t-m{font-size:10px;color:#94a3b8;margin-top:3px}.ep-t-x{position:absolute;top:8px;right:10px;background:none;border:none;font-size:16px;color:#cbd5e1;cursor:pointer;line-height:1}.ep-t-x:hover{color:#64748b}'+
'#ep-ca-btn{position:fixed;bottom:24px;right:24px;z-index:9998;background:#c8622a;color:#fff;border:none;padding:12px 18px;border-radius:12px;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 4px 16px rgba(200,98,42,.3);display:flex;align-items:center;gap:8px;font-family:inherit;transition:.2s}#ep-ca-btn:hover{background:#e8813f;transform:translateY(-2px)}.ep-ca-dot{width:8px;height:8px;background:#0e9f6e;border-radius:50%;animation:epp 2s infinite}@keyframes epp{0%,100%{opacity:1}50%{opacity:.4}}'+
'#ep-ca{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10000;align-items:center;justify-content:center}#ep-ca.open{display:flex}.ep-ca-b{background:#fff;border-radius:16px;width:min(540px,94vw);max-height:88vh;overflow-y:auto;box-shadow:0 20px 50px rgba(0,0,0,.2)}.ep-ca-hd{background:linear-gradient(135deg,#0a0f1a,#1e3a5f);color:#fff;padding:22px 24px;border-radius:16px 16px 0 0;position:relative}.ep-ca-hd h3{font-size:18px;font-weight:800}.ep-ca-hd p{font-size:11px;opacity:.65;margin-top:3px}.ep-ca-cls{position:absolute;top:14px;right:16px;background:none;border:none;color:#fff;font-size:20px;cursor:pointer}.ep-ca-bd{padding:22px}.ep-ca-r{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px}.ep-ca-l{color:#64748b}.ep-ca-v{font-weight:700}.g{color:#059669}.r{color:#dc2626}'+
'.ep-ca-tot{background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:14px;margin-top:14px;text-align:center}.ep-ca-tot h4{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#059669;font-weight:700}.ep-ca-tot .big{font-size:26px;font-weight:900;color:#059669;margin:3px 0}.ep-ca-tot p{font-size:10px;color:#64748b}.ep-ca-cta{display:flex;gap:8px;margin-top:14px}.ep-ca-cta a,.ep-ca-cta button{flex:1;padding:11px;border-radius:8px;font-weight:700;font-size:13px;border:none;cursor:pointer;text-align:center;font-family:inherit;text-decoration:none;display:block}.ep-ca-fill{background:#c8622a;color:#fff}.ep-ca-out{background:transparent;border:1.5px solid #e5e7eb;color:#0a0f1a}';
document.head.appendChild(s);

var box=document.createElement('div');box.id='ep-sp';document.body.appendChild(box);

var firstNames=['Sarah','James','Maria','David','Jennifer','Carlos','Michael','Ana','Robert','Lisa','Tom','Priya','Alex','Nicole','Kevin','Amanda','Ryan','Elena','Chris','Jessica','Daniel','Sofia','Marcus','Emily','Brandon','Ashley','Tyler','Valentina','Derek','Samantha','Ricardo','Fatima','Liam','Aisha','Jordan','Natalie','Andre','Victoria','Patrick','Isabel','Sean','Brianna','Omar','Rachel','Darius','Melissa','Kai','Gabriela','Trevor','Jasmine','Diego','Mia','Ethan','Sophia','Nathan','Olivia','Leo','Camila','Adrian','Nina'];
var lastI='ABCDEFGHIJKLMNOPRSTUVWXYZ';
var ct=['Newark','Jersey City','Hoboken','Montclair','Maplewood','South Orange','Bloomfield','West Orange','East Orange','Nutley','Union','Livingston','Cranford','Summit','Belleville','Kearny','Harrison','Bayonne','North Bergen','Weehawken'];
var tm=['just now','1 min ago','2 min ago','3 min ago','5 min ago'];
var shuffled=firstNames.slice().sort(function(){return Math.random()-.5});
var nameIdx=0;
function N(){var fn=shuffled[nameIdx%shuffled.length];nameIdx++;return fn+' '+lastI[Math.floor(Math.random()*lastI.length)]+'.';}
function R(a){return a[Math.floor(Math.random()*a.length)]}
function RI(n){return Math.floor(Math.random()*n)}

var pg=(location.pathname+' '+document.title).toLowerCase();
var isAgent=pg.indexOf('agent')>-1;
var isManager=pg.indexOf('manager')>-1;
var isOwner=pg.indexOf('owner')>-1;
var isVendor=pg.indexOf('vendor')>-1||pg.indexOf('marketplace')>-1||pg.indexOf('inspection')>-1||pg.indexOf('title')>-1;
var isDev=pg.indexOf('developer')>-1;
var isGrants=pg.indexOf('grant')>-1;
var isProp=pg.indexOf('iron')>-1||pg.indexOf('property')>-1||pg.indexOf('listing')>-1||pg.indexOf('sale')>-1||pg.indexOf('colonial')>-1||pg.indexOf('condo')>-1||pg.indexOf('merchant')>-1;
var isPlatform=pg.indexOf('platform')>-1||pg.indexOf('index')>-1||location.pathname==='/';
var isNeighborhood=pg.indexOf('neighborhood')>-1;

function getN(){
var a=[];
if(isProp){
var pr=pg.indexOf('iron-65')>-1?'Iron 65':pg.indexOf('iron-pointe')>-1?'Iron Pointe':pg.indexOf('3br')>-1||pg.indexOf('colonial')>-1?'Ironbound 3BR':'this property';
a.push(
{i:'👀',h:N()+' is viewing '+pr,s:'From '+R(ct)},{i:'👀',h:(RI(10)+4)+' people viewing right now',s:pr+' · High demand'},
{i:'📅',h:N()+' just booked a tour!',s:pr+' · '+R(['Tomorrow','Today','Saturday','Monday'])+' at '+R(['10am','11am','1pm','2pm','3pm'])},
{i:'✅',h:N()+' submitted application',s:pr},{i:'❤️',h:N()+' saved '+pr,s:'Added to favorites'},
{i:'🔥',h:(RI(15)+8)+' inquiries today',s:pr+' · Trending'},{i:'📞',h:'Aria qualified '+N(),s:'Tour booked for '+pr},
{i:'📱',h:N()+' shared '+pr,s:'Via '+R(['Instagram','Facebook','text','email'])}
);}
if(isVendor){
a.push(
{i:'🔎',h:N()+' searching for '+R(['plumber','inspector','title company','electrician','mover','cleaner','photographer','locksmith','attorney','lender']),s:R(['Emergency','Closing soon','This week','ASAP'])+' · '+R(ct)},
{i:'✅',h:N()+' booked '+R(['home inspection','title search','plumber','electrician','photographer','movers','cleaner','pest control']),s:R(ct)+' · confirmed'},
{i:'⭐',h:N()+' left 5-star review',s:'For their '+R(['inspector','title company','plumber','photographer','attorney'])}
);}
if(isAgent){
a.push(
{i:'📈',h:N()+' got '+(RI(10)+3)+' leads today',s:'EmporionPros campaign'},
{i:'📅',h:'Tour booked on '+N()+'\'s listing',s:'Via Aria AI · '+R(ct)},
{i:'💰',h:N()+' closed $'+(RI(400)+250)+'K sale',s:'Campaign lead'},
{i:'🤖',h:'Aria qualified buyer for '+N(),s:'$'+(RI(3)+1)+','+(RI(900)+100)+'/mo budget'},
{i:'📞',h:'Aria booked showing for '+N(),s:R(['Iron 65','Iron Pointe','listing in '+R(ct)])}
);}
if(isManager){
a.push(
{i:'🏢',h:N()+' filled vacancy',s:R(['1BR','2BR','Studio'])+' · '+R(ct)},
{i:'📅',h:'Aria booked '+(RI(5)+2)+' tours today',s:'For '+N()+'\'s buildings'},
{i:'🔔',h:'Auto-campaign launched',s:'Vacancy → campaign live in 30s'},
{i:'✅',h:N()+' signed new tenant',s:'EP lead · '+R(ct)},
{i:'📞',h:'After-hours call handled',s:'Aria at '+R(['11pm','midnight','6am'])+' for '+N()}
);}
if(isOwner){
a.push(
{i:'🏠',h:N()+' listed home — $0 commission',s:'$'+(RI(400)+200)+'K · '+R(ct)},
{i:'📞',h:'Aria handled '+(RI(6)+2)+' calls for '+N(),s:'While they were at work'},
{i:'💰',h:N()+' saved $'+(RI(20)+8)+'K in commissions',s:'Sold via EmporionPros'},
{i:'📅',h:N()+' got showing booked',s:'Buyer from '+R(ct)},
{i:'✅',h:N()+' accepted an offer!',s:'$'+(RI(300)+250)+'K · no agent fees'},
{i:'🔑',h:N()+' closed in '+(RI(20)+10)+' days',s:'No agent. No commission.'}
);}
if(isDev){
a.push(
{i:'📊',h:N()+' ran market report',s:R(['Ironbound','Downtown Newark','Harrison','Jersey City','Montclair'])},
{i:'🤖',h:'Aria flagged opportunity',s:'Zoning change in '+R(ct)+' · '+R(['Mixed-use approved','Variance granted','Tax incentive'])},
{i:'📈',h:'Market shift detected',s:R(ct)+' rents up '+R(['3.2','4.1','5.6','2.8'])+'% in 90 days'},
{i:'🏗️',h:N()+' subscribed to Pro Monitor',s:'Watching '+R(['3','5','7','10'])+' areas'},
{i:'📋',h:'New permit filed',s:R(['120-unit','80-unit','45-unit','200-unit'])+' project in '+R(ct)},
{i:'💰',h:N()+' identified $'+(RI(5)+2)+'M opportunity',s:'Via Aria AI market alert'}
);}
if(isPlatform){
a.push(
{i:'🚀',h:N()+' launched first campaign',s:R(['Agent','Manager','Owner','Vendor','Developer'])+' · '+R(ct)},
{i:'📈',h:(RI(50)+30)+' campaigns live now',s:'Across '+(RI(8)+5)+' NJ cities'},
{i:'🤖',h:'Aria handled '+(RI(30)+15)+' calls today',s:'24/7 AI assistant'},
{i:'🎉',h:N()+' just signed up',s:R(['Agent','Manager','Owner','Vendor','Developer'])+' from '+R(ct)}
);}
if(isGrants){
var grantTypes=[
{i:'💰',h:'{n} received $15K NJEDA Small Business Grant',s:'{cat} · {city}'},
{i:'🏆',h:'{n} got MBE Certified',s:'Opens Fortune 500 contracts · {city}'},
{i:'☀️',h:'{n} saved $8,400 with Solar Tax Credit',s:'30% ITC · Residential · {city}'},
{i:'🏛',h:'{n} approved for SBA 8(a) Program',s:'Sole-source contracts up to $4M · {city}'},
{i:'⚡',h:'{n} got $2,800 NJ Clean Energy Rebate',s:'Heat pump installation · {city}'},
{i:'💵',h:'{n} received $12K down payment assistance',s:'NJ HMFA First-Time Buyer · {city}'},
{i:'📋',h:'{n} registered on NJSTART',s:'Now bidding on state contracts · {city}'},
{i:'🔨',h:'{n} got $18K facade improvement grant',s:'Downtown revitalization · {city}'},
{i:'🏠',h:'{n} claimed $1,500 ANCHOR benefit',s:'NJ Property Tax Relief · {city}'},
{i:'🔬',h:'{n} awarded $50K SBIR Phase I Grant',s:'Tech innovation · {city}'},
{i:'👩‍💼',h:'{n} certified as WBE',s:'Women Business Enterprise · {city}'},
{i:'🎖️',h:'{n} approved VOSB Certification',s:'Veteran-owned business · {city}'},
{i:'📍',h:'{n} invested in Opportunity Zone',s:'Capital gains tax elimination · {city}'},
{i:'🏢',h:'{n} received LIHTC allocation',s:'Affordable housing tax credits · {city}'},
{i:'💡',h:'{n} got 70% covered via Direct Install',s:'NJ Clean Energy · Lighting + HVAC · {city}'},
{i:'🏙️',h:'{n} activated UEZ benefits',s:'3.5% sales tax (vs 6.625%) · {city}'},
{i:'👥',h:'{n} claimed $9,600 WOTC credit',s:'Hiring tax credit · {city}'},
{i:'🌡️',h:'{n} received free weatherization',s:'DOE program · Low-income household · {city}'},
{i:'🔑',h:'{n} got VA Home Loan approved',s:'Zero down payment · {city}'},
{i:'🏦',h:'{n} received SBA Microloan — $35K',s:'Startup funding · {city}'},
{i:'📊',h:'{n} earned $4,200 in SRECs',s:'Solar renewable energy credits · {city}'},
{i:'🏛',h:'{n} got NJ Public Works Registration',s:'Now eligible for public construction · {city}'},
{i:'⚡',h:'{n} received $40K EV charger grant',s:'NEVI infrastructure program · {city}'},
{i:'🏠',h:'{n} approved for FHA 203(k) loan',s:'Purchase + renovation combined · {city}'},
{i:'💰',h:'{n} saved $22K with Historic Tax Credits',s:'20% federal + 25% NJ · {city}'},
{i:'👴',h:'{n} claimed Senior Freeze benefit',s:'Property tax reimbursement · {city}'},
{i:'🔄',h:'{n} completed 1031 Exchange',s:'$180K capital gains deferred · {city}'},
{i:'🏗️',h:'{n} approved for NJ Aspire incentive',s:'Development tax credit · {city}'},
{i:'📋',h:'{n} registered on SAM.gov',s:'Federal contracting access · {city}'},
{i:'⚡',h:'{n} became NJ Trade Ally certified',s:'Utility rebate contractor · {city}'}
];
var gCats=['Plumber','Electrician','Contractor','HVAC Tech','Solar Installer','Restaurant Owner','Salon Owner','IT Consultant','Trucking Co.','Landscaper','Cleaning Svc.','Attorney','Accountant','Photographer','Homeowner','First-Time Buyer','Property Manager','Developer','Small Business','Startup'];
var usedGrantIdx=[];
grantTypes.sort(function(){return Math.random()-.5});
a=[];
for(var gi=0;gi<grantTypes.length;gi++){
var gt=grantTypes[gi];
a.push({i:gt.i,h:gt.h.replace('{n}',N()).replace('{cat}',R(gCats)).replace('{city}',R(ct)),s:gt.s.replace('{n}',N()).replace('{cat}',R(gCats)).replace('{city}',R(ct))});
}
}
if(isNeighborhood){
a.push(
{i:'🗺️',h:N()+' exploring the Ironbound',s:'Checking restaurants & transit'},
{i:'📅',h:N()+' booked Ironbound tour',s:R(['Iron 65','Iron Pointe'])},
{i:'❤️',h:N()+' saved Ironbound guide',s:'Moving from '+R(['Manhattan','Brooklyn','Hoboken','JC'])}
);}
if(a.length===0){
a.push(
{i:'🎉',h:N()+' joined EmporionPros',s:R(['Agent','Manager','Owner','Vendor','Developer'])+' · '+R(ct)},
{i:'🚀',h:N()+' launched a campaign',s:R(['Rental','Sale','Multi-Family'])+' in '+R(ct)}
);}
return a;
}

var showing=false;
var shownIdx=[];
function getNext(){
var pool=getN();
if(shownIdx.length>=pool.length)shownIdx=[];
var avail=[];
for(var si=0;si<pool.length;si++){if(shownIdx.indexOf(si)===-1)avail.push(si);}
var pick=avail[Math.floor(Math.random()*avail.length)];
shownIdx.push(pick);
return pool[pick];
}
function show(){
if(showing)return;showing=true;
var n=getNext();
var el=document.createElement('div');el.className='ep-t';
el.innerHTML='<div class="ep-t-i">'+n.i+'</div><div class="ep-t-b"><div class="ep-t-h">'+n.h+'</div><div class="ep-t-s">'+n.s+'</div><div class="ep-t-m">'+R(tm)+'</div></div><button class="ep-t-x" onclick="this.parentElement.classList.replace(\'in\',\'out\');var e=this.parentElement;setTimeout(function(){e.remove()},400)">✕</button>';
box.appendChild(el);
requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('in')})});
setTimeout(function(){el.classList.replace('in','out');setTimeout(function(){el.remove();showing=false},400)},5500);
}
setTimeout(show,2500);
setInterval(function(){if(!showing)show()},Math.floor(Math.random()*6000)+8000);

// ── COST ANALYSIS ──
if(isDev){return;} // No cost analysis on developer page

var realLeadBadge='<div style="margin-top:14px;padding:12px;border-radius:10px;background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border:1.5px solid #86efac;text-align:center"><div style="font-size:11px;font-weight:800;color:#059669;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">✅ 100% REAL, VERIFIED LEADS</div><div style="font-size:10px;color:#064e3b;line-height:1.5">Every lead is a <b>real person</b> who found your listing organically. No recycled leads. No shared leads. No bots. <b>You never pay per lead</b> — unlimited leads in your flat monthly plan.</div></div>';
var caTitle,caDesc,caRows,caBottom,caLink;

if(isOwner){
caTitle='🏠 Commission Savings Calculator';caDesc='See how much you keep selling without an agent.';
caRows='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#dc2626;margin-bottom:10px">Traditional Agent Costs ($400K home)</div><div class="ep-ca-r"><span class="ep-ca-l">💸 Listing Agent (3%)</span><span class="ep-ca-v r">$12,000</span></div><div class="ep-ca-r"><span class="ep-ca-l">💸 Buyer\'s Agent (3%)</span><span class="ep-ca-v r">$12,000</span></div><div class="ep-ca-r"><span class="ep-ca-l">📋 Staging & Photos</span><span class="ep-ca-v r">$2,000-5,000</span></div><div class="ep-ca-r"><span class="ep-ca-l">📱 Marketing</span><span class="ep-ca-v r">$500-2,000</span></div><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;margin:10px 0;display:flex;justify-content:space-between;font-size:13px"><span style="color:#dc2626;font-weight:700">Total You Lose</span><span style="color:#dc2626;font-weight:800;font-size:15px">$26,500+</span></div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#059669;margin:16px 0 10px">EmporionPros — Sell It Yourself</div><div class="ep-ca-r"><span class="ep-ca-l">💰 Flat Monthly</span><span class="ep-ca-v">$29/mo</span></div><div class="ep-ca-r"><span class="ep-ca-l">📸 Campaign Page</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">🤖 Aria AI 24/7</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">🗺️ Neighborhood Guide</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">💸 Per-Lead Charge</span><span class="ep-ca-v g">$0 — NEVER</span></div><div class="ep-ca-r"><span class="ep-ca-l">💸 Commission</span><span class="ep-ca-v g">$0 — 0%</span></div>';
caBottom='<div class="ep-ca-tot"><h4>You Keep</h4><div class="big">$24,000+ more</div><p><b>$29/mo flat</b> instead of $24K in commissions</p></div>'+realLeadBadge;
caLink='for-owners.html#signup';
} else if(isManager){
caTitle='🏢 Vacancy Cost Calculator';caDesc='What does every empty unit really cost you?';
caRows='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#dc2626;margin-bottom:10px">Cost of Vacancy (1BR @ $2,400/mo)</div><div class="ep-ca-r"><span class="ep-ca-l">📅 1 Month Empty</span><span class="ep-ca-v r">−$2,400</span></div><div class="ep-ca-r"><span class="ep-ca-l">📅 2 Months Empty</span><span class="ep-ca-v r">−$4,800</span></div><div class="ep-ca-r"><span class="ep-ca-l">📅 3 Months (avg traditional)</span><span class="ep-ca-v r">−$7,200</span></div><div class="ep-ca-r"><span class="ep-ca-l">🏢 Broker Fee (1 mo rent)</span><span class="ep-ca-v r">−$2,400</span></div><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;margin:10px 0;display:flex;justify-content:space-between;font-size:13px"><span style="color:#dc2626;font-weight:700">Total Lost per Vacancy</span><span style="color:#dc2626;font-weight:800;font-size:15px">$4,800-9,600</span></div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#059669;margin:16px 0 10px">EmporionPros Manager Plan</div><div class="ep-ca-r"><span class="ep-ca-l">💰 Flat Monthly</span><span class="ep-ca-v">$99/mo</span></div><div class="ep-ca-r"><span class="ep-ca-l">🤖 Aria AI After-Hours</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">🔔 Auto Vacancy Campaigns</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">📅 Avg Days to Fill</span><span class="ep-ca-v g">14 days (vs 45+)</span></div><div class="ep-ca-r"><span class="ep-ca-l">💸 Per-Lead Charge</span><span class="ep-ca-v g">$0 — NEVER</span></div>';
caBottom='<div class="ep-ca-tot"><h4>Savings per Vacancy</h4><div class="big">$2,300+</div><p>Fill 3x faster. <b>$99/mo flat</b>.</p></div>'+realLeadBadge;
caLink='for-managers.html#signup';
} else if(isVendor){
caTitle='🔧 Lead Cost Comparison';caDesc='What are you really paying per lead on other platforms?';
caRows='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#dc2626;margin-bottom:10px">Industry Pay-Per-Lead Costs</div><div class="ep-ca-r"><span class="ep-ca-l">🔴 Lead aggregator platforms</span><span class="ep-ca-v r">$80-140/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">🔴 Home service marketplaces</span><span class="ep-ca-v r">$15-80/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">🔴 Google Ads (PPC)</span><span class="ep-ca-v r">$15-45/click</span></div><div class="ep-ca-r"><span class="ep-ca-l">🔴 Social media ads</span><span class="ep-ca-v r">$10-30/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">🔴 Referral kickbacks</span><span class="ep-ca-v r">10-20% of job</span></div><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:#dc2626;font-weight:700">Avg Pay-Per-Lead Cost</span><span style="color:#dc2626;font-weight:800;font-size:15px">$50-140</span></div><div style="font-size:9px;color:#92400e;margin-top:4px">⚠️ Many leads are shared with 3-5 other vendors, recycled from old databases, or bot-generated.</div></div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#059669;margin:16px 0 10px">EmporionPros — Flat Rate, Real Leads</div><div class="ep-ca-r"><span class="ep-ca-l">💰 Featured Listing</span><span class="ep-ca-v">$49/mo flat</span></div><div class="ep-ca-r"><span class="ep-ca-l">🎯 Matched Leads</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">💬 In-App Chat</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">🤖 AI Referrals</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">💸 Per-Lead Charge</span><span class="ep-ca-v g" style="font-size:14px">$0 — NEVER</span></div><div class="ep-ca-r"><span class="ep-ca-l">👤 Leads Shared?</span><span class="ep-ca-v g">NEVER — Yours Only</span></div>';
caBottom='<div class="ep-ca-tot"><h4>Your Cost Per Lead</h4><div class="big">$0 per lead</div><p><b>$49/mo flat</b> · Unlimited real leads · Never shared</p></div>'+realLeadBadge;
caLink='for-vendors.html#signup';
} else {
caTitle='💰 Lead Cost Comparison';caDesc='How much are you really paying per lead?';
caRows='<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#dc2626;margin-bottom:10px">Industry Pay-Per-Lead Costs</div><div class="ep-ca-r"><span class="ep-ca-l">🔴 Premium listing portals</span><span class="ep-ca-v r">$20-60/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">🔴 Real estate ad platforms</span><span class="ep-ca-v r">$25-50/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">🔴 Social media ads</span><span class="ep-ca-v r">$15-40/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">🔴 Search engine PPC</span><span class="ep-ca-v r">$30-80/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">🔴 Referral networks</span><span class="ep-ca-v r">25-35% split</span></div><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:#dc2626;font-weight:700">Avg Cost Per Lead</span><span style="color:#dc2626;font-weight:800;font-size:15px">$35-60</span></div><div style="font-size:9px;color:#92400e;margin-top:4px">⚠️ Many pay-per-lead services sell the same lead to multiple agents and include unverified inquiries.</div></div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#059669;margin:16px 0 10px">EmporionPros — Flat Rate, Real Leads</div><div class="ep-ca-r"><span class="ep-ca-l">💰 Pro Plan</span><span class="ep-ca-v">$99/mo flat</span></div><div class="ep-ca-r"><span class="ep-ca-l">📊 Avg Leads/Month</span><span class="ep-ca-v">15-40 real leads</span></div><div class="ep-ca-r"><span class="ep-ca-l">🤖 Aria AI 24/7</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">📅 Auto Tour Booking</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">💸 Per-Lead Charge</span><span class="ep-ca-v g" style="font-size:14px">$0 — NEVER</span></div><div class="ep-ca-r"><span class="ep-ca-l">🤝 Commission Split</span><span class="ep-ca-v g">0% — Keep 100%</span></div><div class="ep-ca-r"><span class="ep-ca-l">👤 Lead Exclusivity</span><span class="ep-ca-v g">100% Yours Only</span></div>';
caBottom='<div class="ep-ca-tot"><h4>Your Cost Per Lead</h4><div class="big">$2.48 – $6.60</div><p><b>$99/mo flat</b> · Up to <b>95% less</b> than pay-per-lead</p></div><div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px;margin-top:10px;font-size:10px;color:#92400e;text-align:center"><b>Rentals:</b> 1 lease covers 24 months of EP.<br><b>Sales:</b> 3% on $450K = $13,500 = <b>136x ROI</b>.</div>'+realLeadBadge;
caLink='for-agents.html#signup';
}

var ca=document.createElement('div');ca.id='ep-ca';
ca.innerHTML='<div class="ep-ca-b"><div class="ep-ca-hd"><button class="ep-ca-cls" onclick="document.getElementById(\'ep-ca\').classList.remove(\'open\')">✕</button><h3>'+caTitle+'</h3><p>'+caDesc+'</p></div><div class="ep-ca-bd">'+caRows+caBottom+'<div class="ep-ca-cta"><a href="'+caLink+'" class="ep-ca-fill">Start Free 14-Day Trial</a><button class="ep-ca-out" onclick="document.getElementById(\'ep-ca\').classList.remove(\'open\')">Close</button></div></div></div>';
document.body.appendChild(ca);
ca.addEventListener('click',function(e){if(e.target===ca)ca.classList.remove('open')});

var btnLabel=isOwner?'🏠 Savings Calculator':isManager?'🏢 Vacancy Calculator':isVendor?'🔧 Lead Cost Comparison':'💰 Lead Cost Comparison';
var btn=document.createElement('button');btn.id='ep-ca-btn';
btn.innerHTML='<span class="ep-ca-dot"></span> '+btnLabel;
btn.onclick=function(){ca.classList.add('open')};
document.body.appendChild(btn);
if(isAgent)setTimeout(function(){ca.classList.add('open')},20000);
})();
