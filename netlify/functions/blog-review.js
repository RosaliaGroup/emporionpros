// Private review page for a client's blog: /blog-review?t=<review_token>
// GET  -> HTML page (noindex) with drafts + published posts.
// POST -> JSON actions: save | publish | reject | mode | wp_connect | wp_disconnect | settings
const { sb, esc, sanitize, page, seoChecklist, publishPost, SITE } = require('../lib/blog');

const json = (c, o) => ({ statusCode: c, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(o) });

async function clientFor(token) {
  if (!/^[a-f0-9]{24,64}$/.test(String(token || ''))) return null;
  const r = await sb('blog_clients?select=*&active=is.true&review_token=eq.' + token);
  return (r.ok && r.data && r.data[0]) || null;
}

exports.handler = async function (event) {
  const isPost = event.httpMethod === 'POST';
  let body = {};
  if (isPost) { try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'bad request' }); } }
  const token = isPost ? body.t : (event.queryStringParameters || {}).t;
  const client = await clientFor(token);
  if (!client) {
    if (isPost) return json(403, { error: 'This review link is not valid.' });
    return { statusCode: 403, headers: { 'Content-Type': 'text/html' }, body: page({ title: 'Link not valid', noindex: true, body: '<main><h1>This review link is not valid</h1><p>Please contact <a href="mailto:info@emporionpros.com">info@emporionpros.com</a>.</p></main>' }) };
  }

  if (isPost) {
    const id = Number(body.post_id);
    const getPost = async () => { const r = await sb(`blog_posts?select=*&client_id=eq.${client.id}&id=eq.${id}`); return r.data && r.data[0]; };
    const now = new Date().toISOString();
    switch (body.action) {
      case 'save': {
        const p = await getPost(); if (!p) return json(404, { error: 'Post not found' });
        const patch = {
          title: String(body.title || p.title).slice(0, 120),
          meta_description: String(body.meta_description ?? p.meta_description ?? '').slice(0, 170),
          body_html: sanitize(body.body_html ?? p.body_html),
          faq: Array.isArray(body.faq) ? body.faq.filter((f) => f && f.q && f.a).slice(0, 8).map((f) => ({ q: String(f.q).slice(0, 200), a: String(f.a).slice(0, 800) })) : p.faq,
          updated_at: now
        };
        patch.checklist = seoChecklist({ ...p, ...patch });
        await sb(`blog_posts?id=eq.${id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(patch) });
        if (p.status === 'published') { const out = await publishPost(client, { ...p, ...patch }); return json(200, { ok: true, saved: true, url: out.url }); }
        return json(200, { ok: true, saved: true, checklist: patch.checklist });
      }
      case 'publish': {
        const p = await getPost(); if (!p) return json(404, { error: 'Post not found' });
        const out = await publishPost(client, p);
        return json(200, { ok: true, url: out.url, wp_post_url: out.wp_post_url || null, wp_error: out.wp_error || null });
      }
      case 'reject': {
        await sb(`blog_posts?id=eq.${id}&client_id=eq.${client.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'rejected', updated_at: now }) });
        return json(200, { ok: true });
      }
      case 'mode': {
        const mode = body.mode === 'auto' ? 'auto' : 'approve';
        await sb(`blog_clients?id=eq.${client.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ mode, updated_at: now }) });
        return json(200, { ok: true, mode });
      }
      case 'settings': {
        await sb(`blog_clients?id=eq.${client.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ topics_hint: String(body.topics_hint || '').slice(0, 1000), updated_at: now }) });
        return json(200, { ok: true });
      }
      case 'wp_connect': {
        const url = String(body.wp_url || '').trim().replace(/\/+$/, '');
        const user = String(body.wp_user || '').trim();
        const pass = String(body.wp_app_password || '').trim();
        if (!/^https:\/\/[^\s/]+\.[^\s]+$/i.test(url) || !user || pass.length < 16) return json(400, { error: 'Enter your site address (https://…), WordPress username, and an Application Password.' });
        const test = await fetch(url + '/wp-json/wp/v2/users/me?context=edit', { headers: { Authorization: 'Basic ' + Buffer.from(user + ':' + pass).toString('base64') } }).catch(() => null);
        const tj = test ? await test.json().catch(() => ({})) : {};
        if (!test || !test.ok) return json(400, { error: 'WordPress did not accept these details' + (tj && tj.message ? ': ' + tj.message : '.') });
        const caps = tj.capabilities || {};
        if (caps && Object.keys(caps).length && !caps.publish_posts) return json(400, { error: 'This WordPress user is not allowed to publish posts. Use an Editor or Administrator account.' });
        await sb(`blog_clients?id=eq.${client.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ wp_url: url, wp_user: user, wp_app_password: pass, wp_status: 'connected', updated_at: now }) });
        return json(200, { ok: true, connected_as: tj.name || user });
      }
      case 'wp_disconnect': {
        await sb(`blog_clients?id=eq.${client.id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ wp_url: null, wp_user: null, wp_app_password: null, wp_status: null, updated_at: now }) });
        return json(200, { ok: true });
      }
      default: return json(400, { error: 'Unknown action' });
    }
  }

  // ---- GET: render the review page
  const r = await sb(`blog_posts?select=id,slug,title,meta_description,focus_keyword,body_html,faq,sources,checklist,status,published_at,created_at,wp_post_url,wp_error&client_id=eq.${client.id}&status=neq.rejected&order=created_at.desc&limit=40`);
  const posts = (r.data || []).map((p) => ({ ...p, body_html: sanitize(p.body_html), checklist: p.checklist || seoChecklist(p) }));
  const state = {
    t: token, slug: client.slug, name: client.business_name, mode: client.mode, plan: client.plan,
    wp: client.wp_status === 'connected' ? { url: client.wp_url, user: client.wp_user } : null,
    topics_hint: client.topics_hint || '', posts, blogUrl: `${SITE}/blog/${client.slug}/`
  };
  const ui = `
<header class="bh"><div class="in"><span><strong>${esc(client.business_name)}</strong> <span class="by">· Blog review</span></span><a class="by" href="${SITE}/blog/${esc(client.slug)}/" target="_blank" rel="noopener">View your blog →</a></div></header>
<main style="max-width:900px">
<div class="card" id="settings"></div>
<h1 style="font-size:28px">Your posts</h1><div id="posts"></div>
<p class="src">Questions? <a href="mailto:info@emporionpros.com">info@emporionpros.com</a> · (862) 369-0005. Keep this link private — anyone with it can publish to your blog.</p>
</main>
<style>
.btn{border:0;border-radius:9px;padding:9px 14px;font:600 14px 'Outfit',sans-serif;cursor:pointer;margin:4px 6px 0 0}.b1{background:#c8622a;color:#fff}.b2{background:#0a0f1a;color:#fff}.b3{background:#eef0f3;color:#0a0f1a}
.pill{display:inline-block;font-size:12px;font-weight:700;padding:2px 9px;border-radius:99px;margin-right:6px}.draft{background:#fef3c7;color:#92400e}.published{background:#d1fae5;color:#065f46}.approved{background:#e0e7ff;color:#3730a3}
.ed{border:1px solid rgba(10,15,26,.15);border-radius:10px;padding:12px 14px;background:#fff;min-height:160px;max-height:520px;overflow:auto}
input.f,textarea.f{width:100%;border:1px solid rgba(10,15,26,.15);border-radius:9px;padding:9px 11px;font:15px 'Outfit',sans-serif;margin:4px 0 10px}
.chk{font-size:13px;color:#5b6576;margin-top:8px}.chk span{display:inline-block;margin:2px 10px 2px 0}.ok{color:#047857}.no{color:#b45309}
.msg{font-size:14px;margin-top:8px}label.l{font-size:13px;font-weight:600}
</style>
<script>
const S=${JSON.stringify(state).replace(/</g, '\\u003c')};
const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function act(a,data){const r=await fetch(location.pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({t:S.t,action:a},data||{}))});const j=await r.json().catch(()=>({error:'Network error'}));if(!r.ok)throw new Error(j.error||'Something went wrong');return j;}
function settings(){const el=document.getElementById('settings');
 el.innerHTML='<strong>Publishing mode</strong><br><label><input type="radio" name="m" value="approve" '+(S.mode==='approve'?'checked':'')+'> Review each post before it goes live</label><br><label><input type="radio" name="m" value="auto" '+(S.mode==='auto'?'checked':'')+'> Auto-publish new posts</label>'+
 '<div style="margin-top:14px"><strong>WordPress</strong><br>'+(S.wp?'Connected to '+e(S.wp.url)+' as '+e(S.wp.user)+'. Published posts also go to your WordPress site. <button class="btn b3" id="wpd">Disconnect</button>':
 'Not connected — posts appear on your Emporion Pros blog. <details style="margin-top:6px"><summary style="cursor:pointer;color:#c8622a">Connect your WordPress site</summary><p class="src">In WordPress go to <em>Users → Profile → Application Passwords</em>, create one named "Emporion Pros", and paste it here. Use an Editor or Administrator account.</p><label class="l">Site address</label><input class="f" id="wpu" placeholder="https://www.yoursite.com"><label class="l">WordPress username</label><input class="f" id="wpn" autocomplete="off"><label class="l">Application Password</label><input class="f" id="wpp" type="password" autocomplete="new-password"><button class="btn b2" id="wpc">Connect</button><div class="msg" id="wpm"></div></details>')+'</div>'+
 '<div style="margin-top:14px"><strong>Topics you want covered</strong> <span class="src">(services to promote, towns, questions customers ask)</span><textarea class="f" id="th" rows="2">'+e(S.topics_hint)+'</textarea><button class="btn b3" id="ths">Save topics</button> <span class="msg" id="thm"></span></div>';
 el.querySelectorAll('input[name=m]').forEach(r=>r.onchange=async()=>{try{await act('mode',{mode:r.value});S.mode=r.value;}catch(x){alert(x.message)}});
 const wpc=document.getElementById('wpc');if(wpc)wpc.onclick=async()=>{const m=document.getElementById('wpm');m.textContent='Checking…';try{const j=await act('wp_connect',{wp_url:wpu.value,wp_user:wpn.value,wp_app_password:wpp.value});S.wp={url:wpu.value,user:j.connected_as};settings();}catch(x){m.style.color='#b91c1c';m.textContent=x.message}};
 const wpd=document.getElementById('wpd');if(wpd)wpd.onclick=async()=>{if(!confirm('Disconnect WordPress?'))return;await act('wp_disconnect');S.wp=null;settings();};
 document.getElementById('ths').onclick=async()=>{await act('settings',{topics_hint:th.value});thm.textContent='Saved';};}
function chk(c){if(!c)return'';const it=[['Title length',c.title_length_ok],['Meta description',c.meta_length_ok],['Keyword in title',c.keyword_in_title],['Keyword early in post',c.keyword_in_intro],[c.word_count+' words',c.word_count_ok],[c.subheadings+' sections',c.subheadings_ok],[c.faq_count+' FAQs',c.faq_ok]];return '<div class="chk">On-page checks: '+it.map(([n,ok])=>'<span class="'+(ok?'ok':'no')+'">'+(ok?'✓':'•')+' '+e(n)+'</span>').join('')+'</div>';}
function posts(){const el=document.getElementById('posts');if(!S.posts.length){el.innerHTML='<p>No posts yet — your first draft will appear here.</p>';return;}
 el.innerHTML=S.posts.map((p,i)=>'<div class="card" id="p'+p.id+'"><span class="pill '+p.status+'">'+(p.status==='draft'?'Waiting for your review':p.status==='published'?'Published':'Approved')+'</span><span class="src">'+new Date(p.published_at||p.created_at).toLocaleDateString()+'</span>'+
 '<label class="l" style="display:block;margin-top:10px">Title</label><input class="f" data-k="title" value="'+e(p.title)+'"><label class="l">Search description</label><textarea class="f" data-k="meta" rows="2">'+e(p.meta_description)+'</textarea>'+
 '<details '+(p.status==='draft'&&i===0?'open':'')+'><summary style="cursor:pointer;font-weight:600">Read / edit post</summary><div class="ed" contenteditable="true" data-k="body">'+p.body_html+'</div>'+
 ((p.faq||[]).length?'<p class="l" style="margin-top:10px">FAQs</p>'+p.faq.map((f,j)=>'<input class="f" data-q="'+j+'" value="'+e(f.q)+'"><textarea class="f" data-a="'+j+'" rows="2">'+e(f.a)+'</textarea>').join(''):'')+
 ((p.sources||[]).length?'<div class="src">Sources: '+p.sources.map(s=>'<a href="'+e(s.url)+'" target="_blank" rel="noopener">'+e(s.title||s.url)+'</a>').join(' · ')+'</div>':'')+'</details>'+chk(p.checklist)+
 '<div style="margin-top:10px">'+(p.status==='published'?'<a class="btn b3" style="text-decoration:none" target="_blank" href="'+S.blogUrl+e(p.slug)+'">View post</a><button class="btn b2" data-a="save">Save changes</button>':'<button class="btn b1" data-a="publish">Approve & publish</button><button class="btn b3" data-a="save">Save edits</button><button class="btn b3" data-a="reject">Skip this one</button>')+
 (p.wp_post_url?' <a class="src" target="_blank" href="'+e(p.wp_post_url)+'">On WordPress →</a>':'')+(p.wp_error?' <span class="msg" style="color:#b91c1c">WordPress: '+e(p.wp_error)+'</span>':'')+'<div class="msg"></div></div></div>').join('');
 S.posts.forEach(p=>{const c=document.getElementById('p'+p.id);c.querySelectorAll('button[data-a]').forEach(b=>b.onclick=async()=>{const m=c.querySelector('.msg:last-child');const a=b.dataset.a;
  const faq=(p.faq||[]).map((f,j)=>({q:(c.querySelector('[data-q="'+j+'"]')||{}).value||f.q,a:(c.querySelector('[data-a="'+j+'"]')||{}).value||f.a}));
  const data={post_id:p.id,title:c.querySelector('[data-k=title]').value,meta_description:c.querySelector('[data-k=meta]').value,body_html:c.querySelector('[data-k=body]').innerHTML,faq};
  b.disabled=true;m.style.color='';m.textContent='Working…';
  try{if(a==='reject'){if(!confirm('Skip this post? It will not be published.'))return;await act('reject',data);c.remove();return;}
   await act('save',data);if(a==='publish'){const j=await act('publish',data);p.status='published';p.wp_post_url=j.wp_post_url;p.wp_error=j.wp_error;posts();return;}
   m.style.color='#047857';m.textContent='Saved.';}catch(x){m.style.color='#b91c1c';m.textContent=x.message}finally{b.disabled=false}});});}
settings();posts();
</script>`;
  return { statusCode: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'no-referrer' }, body: page({ title: client.business_name + ' — Blog review', noindex: true, body: ui }) };
};
