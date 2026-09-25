const { body, cors, supa } = require('./_utils');
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  try {
    const { code } = await body(req);
    const rows = await supa('GET', `/rest/v1/lawyers?access_code=eq.${encodeURIComponent((code||'').trim())}&active=eq.true&select=id,name,city,specialty,plan`, null);
    if (rows && rows.length > 0) res.json({ success: true, lawyer: rows[0] });
    else res.json({ success: false, error: 'Invalid or inactive access code.' });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
};
