// Hourly: push outreach businesses changed in the last 3 hours to the Business
// CRM in Abrevo. The overlap means a missed run or a failed push from the call
// webhook is picked up on the next one. Schedule is set in netlify.toml.
const crm = require('./lib/businessCrm');

exports.handler = async () => {
  try {
    const since = new Date(Date.now() - 3 * 3600e3).toISOString();
    const rows = await crm.readProspects('updated_at=gte.' + encodeURIComponent(since));
    const sent = rows.length ? await crm.push(rows) : 0;
    console.log(`[business-crm-sync] pushed ${sent} of ${rows.length}`);
    return { statusCode: 200, body: JSON.stringify({ ok: true, sent }) };
  } catch (e) {
    console.warn('[business-crm-sync] failed:', e.message);
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
