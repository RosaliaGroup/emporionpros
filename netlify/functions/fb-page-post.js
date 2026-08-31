// ============================================================
// FB-PAGE-POST — auto-post an EmporionPros listing to the connected
// agent's Facebook Page via Meta's official Graph API.
//
// This is NOT browser automation and does not touch Facebook Marketplace.
// It uses the same server-to-server Graph API pattern already proven in
// production for Rosalia Group's own Page (see the `rosalia-lister` /
// Abrevo repo's fb-page-post.js), generalized so any EmporionPros agent who
// connects a Page (a row in agent_integrations) can use it. Marketplace has
// no API — Meta caps and bans DOM-automated posting there — so it stays a
// copy/paste flow in list-property.html on purpose. Do not add Marketplace
// automation here.
// ============================================================

const SUPABASE_URL = 'https://nfwxruzhgzkhklvzmfsw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GRAPH_VERSION = process.env.FB_GRAPH_VERSION || 'v23.0';
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

const sbHeaders = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
};

async function getListing(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/listings?id=eq.${id}&limit=1`, { headers: sbHeaders });
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : null;
}

// Looks up the connected Page for the agent who owns the listing. Returns
// null if the agent has never connected a Page or disabled it — the caller
// treats that as "nothing to post to", not an error.
async function getConnection(agentId) {
  if (!agentId) return null;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/agent_integrations?agent_id=eq.${agentId}&platform=eq.facebook_page&is_active=eq.true&limit=1`,
    { headers: sbHeaders }
  );
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function recordPost(listingId, status, extra = {}) {
  await fetch(`${SUPABASE_URL}/rest/v1/listing_posts`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({
      listing_id: listingId,
      platform: 'facebook_page',
      status,
      posted_at: status === 'posted' ? new Date().toISOString() : null,
      ...extra,
    }),
  });
}

async function graph(path, params, pageToken) {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, access_token: pageToken }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Graph ${data.error.code}: ${data.error.message}`);
  return data;
}

// Facebook fetches photos by URL itself — the Supabase Storage URLs just
// need to be publicly readable. published:false stages a photo without
// putting it on the timeline; the feed post then attaches them as an album.
async function stagePhotos(urls, pageId, pageToken) {
  const ids = [];
  for (const url of urls.slice(0, 10)) {
    try {
      const { id } = await graph(`${pageId}/photos`, { url, published: false }, pageToken);
      ids.push({ media_fbid: id });
    } catch (err) {
      console.error('Photo staging failed for', url, '—', err.message);
    }
  }
  return ids;
}

function money(n) {
  return `$${Number(n).toLocaleString('en-US')}`;
}

// An agent cannot advertise a listing with no accountable contact — that is
// what "who is the agent" collapses to on this platform (EmporionPros has
// no courtesy/co-broke import, unlike Abrevo, so there is no separate
// listing_agent_name/agency to fall back on). Throw rather than post with
// no attribution.
function requireAttribution(listing) {
  if (!listing.contact_name || !listing.contact_name.trim()) {
    throw new Error('Listing has no contact_name set — add an agent/contact name before posting to Facebook.');
  }
}

function buildMessage(l) {
  const size = [
    l.beds != null && l.beds !== '' ? `${l.beds} bed` : null,
    l.baths != null && l.baths !== '' ? `${l.baths} bath` : null,
    l.sqft ? `${Number(l.sqft).toLocaleString('en-US')} sq ft` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const isRental = l.type === 'rent';
  const addr = [l.address, l.unit, l.city, l.state, l.zip].filter(Boolean).join(', ');

  return [
    `${l.title} — ${money(l.price)}${isRental ? '/mo' : ''}`,
    addr || null,
    size || null,
    '',
    l.description ? l.description.trim() : null,
    '',
    l.laundry ? `Laundry: ${l.laundry}` : null,
    l.parking ? `Parking: ${l.parking}` : null,
    l.utilities ? `Utilities: ${l.utilities}` : null,
    l.pets && l.pets !== 'No Pets' ? `Pets: ${l.pets}` : null,
    l.available_date ? `Available ${l.available_date}` : null,
    l.special ? `Special: ${l.special}` : null,
    '',
    isRental ? 'All lawful sources of income welcome, including housing vouchers.' : null,
    l.contact_phone ? `Message us or call/text ${l.contact_phone}` : 'Message us to schedule a tour',
    l.calendar_link ? `Book a tour: ${l.calendar_link}` : null,
    '',
    `Listed by ${l.contact_name}`,
  ]
    .filter((line) => line !== null)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  if (!SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'SUPABASE_SERVICE_KEY is not set in Netlify env vars' }) };
  }

  let listingId;
  try {
    ({ listing_id: listingId } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }
  if (!listingId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'listing_id required' }) };
  }

  try {
    const listing = await getListing(listingId);
    if (!listing) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Listing not found' }) };
    }
    if (listing.status !== 'active') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Listing is "${listing.status}" — set it to active before posting` }),
      };
    }

    const connection = await getConnection(listing.agent_id);
    if (!connection) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'No Facebook Page is connected for this agent yet. Connect a Page in Agent Settings, then try again.',
          code: 'NOT_CONNECTED',
        }),
      };
    }

    requireAttribution(listing);

    const message = buildMessage(listing);
    const photos = Array.isArray(listing.images) ? listing.images : [];
    const { page_id: pageId, page_token: pageToken } = connection;

    console.log(`Posting listing ${listing.id} to Page ${pageId} with ${photos.length} photo(s)`);

    let post;
    if (photos.length > 1) {
      const attached = await stagePhotos(photos, pageId, pageToken);
      post = attached.length
        ? await graph(`${pageId}/feed`, { message, attached_media: attached }, pageToken)
        : await graph(`${pageId}/feed`, { message }, pageToken);
    } else if (photos.length === 1) {
      post = await graph(`${pageId}/photos`, { url: photos[0], caption: message }, pageToken);
    } else {
      post = await graph(`${pageId}/feed`, { message }, pageToken);
    }

    const postId = post.post_id || post.id;
    const url = `https://www.facebook.com/${postId}`;
    await recordPost(listing.id, 'posted', { external_post_id: postId, external_url: url });

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, post_id: postId, url }) };
  } catch (err) {
    console.error('fb-page-post failed:', err.message);
    await recordPost(listingId, 'failed', { error_message: err.message }).catch(() => {});
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
