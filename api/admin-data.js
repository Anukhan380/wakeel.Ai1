const { body, cors, supa, isAdmin } = require('./_utils');
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const b = await body(req);
  if (!isAdmin(b.password)) { res.json({ error: 'Wrong password' }); return; }
  try {
    const [lawyers, documents] = await Promise.all([
      supa('GET', '/rest/v1/lawyers?select=*&order=created_at.desc', null),
      supa('GET', '/rest/v1/documents?select=*&order=created_at.desc', null)
    ]);
    res.json({
      lawyers: Array.isArray(lawyers) ? lawyers : [],
      documents: Array.isArray(documents) ? documents : [],
      admin: { whatsapp: process.env.WHATSAPP || '3129299666' }
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
