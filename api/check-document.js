const { body, cors, supa } = require('./_utils');
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  try {
    const { id, phone } = await body(req);
    const rows = await supa('GET', `/rest/v1/documents?id=eq.${encodeURIComponent((id||'').trim())}&phone=eq.${encodeURIComponent((phone||'').trim())}&select=*`, null);
    if (!rows || rows.length === 0) { res.json({ error: 'Not found. Check your document ID and phone number.' }); return; }
    const doc = rows[0];
    if (doc.status === 'completed') res.json({ status: 'completed', document: doc.document, type: doc.type });
    else res.json({ status: doc.status, message: 'Your document is being prepared. You will be notified on WhatsApp.' });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
