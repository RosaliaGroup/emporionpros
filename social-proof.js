// EMPORION PROS — Social Proof + Cost Analysis v2
(function(){
'use strict';
var s=document.createElement('style');
s.textContent='#ep-sp{position:fixed;bottom:24px;left:24px;z-index:9999;max-width:360px}@media(max-width:600px){#ep-sp{left:10px;right:10px;bottom:10px;max-width:100%}}.ep-t{background:#fff;border-radius:12px;padding:14px 40px 14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.13);display:flex;align-items:center;gap:10px;border-left:3px solid #c8622a;margin-bottom:8px;transform:translateY(20px);opacity:0;transition:all .4s ease;position:relative}.ep-t.in{transform:translateY(0);opacity:1}.ep-t.out{transform:translateX(-110%);opacity:0}.ep-t-i{font-size:20px;flex-shrink:0}.ep-t-b{flex:1}.ep-t-h{font-size:12px;font-weight:700;color:#0a0f1a;line-height:1.3}.ep-t-s{font-size:10px;color:#64748b;margin-top:1px}.ep-t-m{font-size:9px;color:#94a3b8;margin-top:2px}.ep-t-x{position:absolute;top:6px;right:8px;background:none;border:none;font-size:14px;color:#cbd5e1;cursor:pointer;line-height:1}.ep-t-x:hover{color:#64748b}#ep-ca-btn{position:fixed;bottom:24px;right:24px;z-index:9998;background:#c8622a;color:#fff;border:none;padding:11px 16px;border-radius:11px;font-weight:700;font-size:12px;cursor:pointer;box-shadow:0 4px 16px rgba(200,98,42,.3);display:flex;align-items:center;gap:6px;font-family:inherit;transition:.2s}#ep-ca-btn:hover{background:#e8813f;transform:translateY(-2px)}.ep-ca-dot{width:7px;height:7px;background:#0e9f6e;border-radius:50%;animation:epp 2s infinite}@keyframes epp{0%,100%{opacity:1}50%{opacity:.4}}#ep-ca{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10000;align-items:center;justify-content:center}#ep-ca.open{display:flex}.ep-ca-b{background:#fff;border-radius:16px;width:min(520px,94vw);max-height:88vh;overflow-y:auto;box-shadow:0 20px 50px rgba(0,0,0,.2)}.ep-ca-hd{background:linear-gradient(135deg,#0a0f1a,#1e3a5f);color:#fff;padding:22px 24px;border-radius:16px 16px 0 0;position:relative}.ep-ca-hd h3{font-size:18px;font-weight:800}.ep-ca-hd p{font-size:11px;opacity:.65;margin-top:3px}.ep-ca-cls{position:absolute;top:14px;right:16px;background:none;border:none;color:#fff;font-size:20px;cursor:pointer}.ep-ca-bd{padding:22px}.ep-ca-r{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px}.ep-ca-l{color:#64748b}.ep-ca-v{font-weight:700}.g{color:#059669}.r{color:#dc2626}.ep-ca-tot{background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:14px;margin-top:14px;text-align:center}.ep-ca-tot h4{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#059669;font-weight:700}.ep-ca-tot .big{font-size:26px;font-weight:900;color:#059669;margin:3px 0}.ep-ca-tot p{font-size:10px;color:#64748b}.ep-ca-cta{display:flex;gap:8px;margin-top:14px}.ep-ca-cta a,.ep-ca-cta button{flex:1;padding:11px;border-radius:8px;font-weight:700;font-size:13px;border:none;cursor:pointer;text-align:center;font-family:inherit;text-decoration:none;display:block}.ep-ca-fill{background:#c8622a;color:#fff}.ep-ca-out{background:transparent;border:1.5px solid #e5e7eb;color:#0a0f1a}';
document.head.appendChild(s);

var box=document.createElement('div');box.id='ep-sp';document.body.appendChild(box);

var nm=['Sarah','James','Maria','David','Jennifer','Carlos','Michael','Ana','Robert','Lisa','Tom','Priya','Alex','Nicole','Kevin','Amanda','Ryan','Elena','Chris','Jessica','Daniel','Sofia','Marcus','Emily','Brandon','Ashley','Tyler','Valentina','Derek','Samantha'];
var lt='ABCDEFGHIJKLMNOPRSTUVW';
var ct=['Newark','Jersey City','Hoboken','Montclair','Maplewood','South Orange','Bloomfield','West Orange','East Orange','Nutley','Union','Livingston','Cranford','Summit','Belleville'];
var tm=['just now','1 min ago','2 min ago','3 min ago','5 min ago','8 min ago'];
function R(a){return a[Math.floor(Math.random()*a.length)]}
function N(){return R(nm)+' '+R(lt.split(''))+'.';}
function RI(n){return Math.floor(Math.random()*n)}

function getN(){
var p=(location.pathname+' '+document.title).toLowerCase();
var a=[];

// Universal
a.push({i:'📞',h:'Aria AI answered a call',s:'Lead from '+R(ct)});
a.push({i:'💬',h:N()+' chatted with Aria',s:'About '+R(['pricing','availability','move-in','pet policy','parking','schools'])});
a.push({i:'📱',h:N()+' shared a listing',s:'Via '+R(['Instagram','Facebook','text','email','WhatsApp'])});
a.push({i:'🎉',h:N()+' just signed up',s:R(['Agent','Manager','Owner','Vendor'])+' · '+R(ct)});
a.push({i:'🚀',h:N()+' launched a campaign',s:R(['3BR Colonial','2BR Condo','Studio','1BR','Multi-Family'])+' in '+R(ct)});

// Property pages
if(p.indexOf('iron')>-1||p.indexOf('property')>-1||p.indexOf('listing')>-1||p.indexOf('sale')>-1||p.indexOf('colonial')>-1||p.indexOf('condo')>-1||p.indexOf('merchant')>-1){
var pr=p.indexOf('iron-65')>-1?'Iron 65':p.indexOf('iron-pointe')>-1?'Iron Pointe':p.indexOf('colonial')>-1?'Maplewood Colonial':p.indexOf('condo')>-1?'JC Waterfront Condo':p.indexOf('merchant')>-1?'Ironbound Multi-Family':'this listing';
a.push({i:'👀',h:N()+' is viewing '+pr,s:R(ct)});
a.push({i:'👀',h:(RI(10)+4)+' people viewing now',s:pr+' · High demand'});
a.push({i:'📅',h:N()+' booked a tour!',s:pr+' · '+R(['Tomorrow','Today','Saturday','Monday'])+' '+R(['10am','11am','1pm','2pm','3pm'])});
a.push({i:'📅',h:N()+' scheduled showing',s:pr+' via Calendly'});
a.push({i:'✅',h:N()+' submitted application',s:pr});
a.push({i:'❤️',h:N()+' saved '+pr,s:'Added to favorites'});
a.push({i:'🔥',h:(RI(15)+8)+' inquiries today',s:pr+' · Trending'});
}

// Vendor pages
if(p.indexOf('vendor')>-1||p.indexOf('marketplace')>-1||p.indexOf('inspection')>-1||p.indexOf('title')>-1){
a.push({i:'🔧',h:N()+' requested plumber',s:'Emergency · '+R(ct)});
a.push({i:'🔍',h:N()+' booked inspection',s:'Garden State Inspections · '+R(ct)});
a.push({i:'📜',h:N()+' requested title search',s:'Liberty Title · closing '+R(['next week','Friday','in 10 days'])});
a.push({i:'⚡',h:N()+' hired electrician',s:'Panel upgrade · '+R(ct)});
a.push({i:'📦',h:N()+' booked movers',s:R(ct)+' → '+R(ct)});
a.push({i:'🧹',h:N()+' requested cleaning',s:'Move-out deep clean · '+R(['3BR','2BR','1BR'])});
a.push({i:'📸',h:N()+' booked listing photos',s:'Lens & Light · '+R(ct)});
a.push({i:'🔑',h:N()+' called locksmith',s:'Rekey '+R(['4','6','8','12'])+' units'});
a.push({i:'🌿',h:N()+' hired landscaper',s:'Spring cleanup · '+R(ct)});
a.push({i:'🐜',h:N()+' booked pest inspection',s:'Termite clearance · closing req'});
a.push({i:'⚖️',h:N()+' consulted attorney',s:'Lease review · Torres Law'});
a.push({i:'🛡️',h:N()+' got insurance quote',s:'Landlord policy · SafeGuard'});
a.push({i:'🏦',h:N()+' applied for mortgage',s:'Pre-approval · First National'});
a.push({i:'🪴',h:N()+' booked home staging',s:'Stage & Sell · listing prep'});
}

// Agent pages
if(p.indexOf('agent')>-1){
a.push({i:'📈',h:N()+' got '+(RI(10)+3)+' leads today',s:'From EmporionPros campaign'});
a.push({i:'📅',h:N()+'\'s listing got tour booked',s:'Via Aria AI · buyer from '+R(ct)});
a.push({i:'💰',h:N()+' closed $'+(RI(400)+250)+'K sale',s:'Lead from campaign page'});
a.push({i:'🎯',h:N()+'\'s campaign: '+(RI(500)+100)+' views',s:R(['This week','Today','3 days'])});
a.push({i:'🤖',h:'Aria qualified lead for '+N(),s:'$'+(RI(3)+1)+','+(RI(900)+100)+'/mo budget'});
a.push({i:'📞',h:'Aria booked tour for '+N(),s:R(['Iron 65','Iron Pointe','Maplewood listing'])+' · auto-confirmed'});
}

// Manager pages
if(p.indexOf('manager')>-1){
a.push({i:'🏢',h:N()+' filled vacancy',s:R(['1BR','2BR','Studio'])+' · '+R(ct)+' · via campaign'});
a.push({i:'📊',h:N()+'\'s portfolio: '+(RI(8)+2)+' leads today',s:(RI(60)+20)+' units managed'});
a.push({i:'📅',h:'Aria booked '+(RI(5)+2)+' tours today',s:'For '+N()+'\'s buildings'});
a.push({i:'🔔',h:N()+' auto-launched vacancy campaign',s:'Unit vacant → campaign live in 30s'});
a.push({i:'✅',h:N()+' signed new tenant',s:'EmporionPros lead · '+R(ct)});
a.push({i:'📞',h:'After-hours call handled by Aria',s:N()+' · '+R(['11pm','midnight','6am','2am'])+' inquiry'});
}

// Owner pages
if(p.indexOf('owner')>-1){
a.push({i:'🏠',h:N()+' listed home — no agent',s:'$'+(RI(400)+200)+'K · '+R(ct)});
a.push({i:'📞',h:'Aria handled '+(RI(6)+2)+' calls for '+N(),s:'While they were at work'});
a.push({i:'💰',h:N()+' saved $'+(RI(20)+8)+'K in commissions',s:'Sold via EmporionPros'});
a.push({i:'📅',h:N()+' got showing booked',s:'Buyer from '+R(ct)+' · '+R(['Tomorrow','Saturday','Monday'])});
a.push({i:'👀',h:N()+'\'s listing: '+(RI(30)+10)+' views today',s:'Campaign shared on social media'});
a.push({i:'✅',h:N()+' accepted an offer!',s:'$'+(RI(300)+250)+'K · '+R(ct)+' · no agent fees'});
}

// Platform / homepage
if(p.indexOf('platform')>-1||p.indexOf('index')>-1||location.pathname==='/'){
a.push({i:'🚀',h:N()+' launched first campaign',s:R(['Agent','Manager','Owner'])+' · '+R(ct)});
a.push({i:'📈',h:(RI(50)+20)+' campaigns live now',s:'Across '+(RI(8)+4)+' NJ cities'});
a.push({i:'🤖',h:'Aria handled '+(RI(30)+15)+' calls today',s:'24/7 AI leasing assistant'});
}

// Neighborhood
if(p.indexOf('neighborhood')>-1){
a.push({i:'🗺️',h:N()+' exploring the Ironbound',s:'Checking restaurants & transit'});
a.push({i:'📅',h:N()+' booked Ironbound tour',s:R(['Iron 65','Iron Pointe'])+' · '+R(['Tomorrow','Saturday'])});
a.push({i:'❤️',h:N()+' saved Ironbound guide',s:'Moving from '+R(['Manhattan','Brooklyn','Hoboken','JC'])});
}

return a;
}

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
setTimeout(function(){el.classList.replace('in','out');setTimeout(function(){el.remove();showing=false},400)},5000);
}

setTimeout(show,3000);
setInterval(function(){if(!showing)show()},Math.floor(Math.random()*7000)+9000);

// Cost Analysis
var ca=document.createElement('div');ca.id='ep-ca';
ca.innerHTML='<div class="ep-ca-b"><div class="ep-ca-hd"><button class="ep-ca-cls" onclick="document.getElementById(\'ep-ca\').classList.remove(\'open\')">✕</button><h3>💰 Agent Lead Cost Analysis</h3><p>How much are you paying per lead? See the EmporionPros difference.</p></div><div class="ep-ca-bd"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#dc2626;margin-bottom:10px">Traditional Lead Sources</div><div class="ep-ca-r"><span class="ep-ca-l">🏢 Zillow Premier Agent</span><span class="ep-ca-v r">$20-60/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">📱 Realtor.com</span><span class="ep-ca-v r">$25-50/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">📘 Facebook/IG Ads</span><span class="ep-ca-v r">$15-40/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">🔍 Google Ads</span><span class="ep-ca-v r">$30-80/lead</span></div><div class="ep-ca-r"><span class="ep-ca-l">🤝 Referral Network</span><span class="ep-ca-v r">25-35% split</span></div><div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;margin:10px 0;display:flex;justify-content:space-between;font-size:13px"><span style="color:#dc2626;font-weight:700">Avg Cost Per Lead</span><span style="color:#dc2626;font-weight:800;font-size:15px">$35-60</span></div><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#059669;margin:16px 0 10px">EmporionPros Direct Leads</div><div class="ep-ca-r"><span class="ep-ca-l">💰 Pro Plan</span><span class="ep-ca-v">$99/mo</span></div><div class="ep-ca-r"><span class="ep-ca-l">📊 Avg Leads/Mo</span><span class="ep-ca-v">15-40</span></div><div class="ep-ca-r"><span class="ep-ca-l">🤖 Aria AI 24/7</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">📅 Tour Booking</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">📱 Social Kit</span><span class="ep-ca-v g">Included</span></div><div class="ep-ca-r"><span class="ep-ca-l">🤝 Commission Split</span><span class="ep-ca-v g">0% — keep 100%</span></div><div class="ep-ca-tot"><h4>Your Cost Per Lead</h4><div class="big">$2.48 – $6.60</div><p>Up to <b>95% less</b> than traditional sources</p></div><div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px;margin-top:10px;font-size:10px;color:#92400e;text-align:center"><b>Rentals:</b> 1 lease at $2,400/mo = 24 months of EP paid.<br><b>Sales:</b> 3% on $450K = $13,500. Your $99/mo = <b>136x ROI</b>.</div><div class="ep-ca-cta"><a href="for-agents.html#signup" class="ep-ca-fill">Start Free 14-Day Trial</a><button class="ep-ca-out" onclick="document.getElementById(\'ep-ca\').classList.remove(\'open\')">Close</button></div></div></div>';
document.body.appendChild(ca);
ca.addEventListener('click',function(e){if(e.target===ca)ca.classList.remove('open')});
var btn=document.createElement('button');btn.id='ep-ca-btn';
btn.innerHTML='<span class="ep-ca-dot"></span> 💰 Cost Per Lead';
btn.onclick=function(){ca.classList.add('open')};
document.body.appendChild(btn);
if(location.pathname.toLowerCase().indexOf('agent')>-1){setTimeout(function(){ca.classList.add('open')},20000)}
})();
