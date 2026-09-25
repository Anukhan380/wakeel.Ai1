const { body, cors, supa, isAdmin } = require('./_utils');
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const b = await body(req);
  if (!isAdmin(b.password)) { res.json({ error: 'Wrong password' }); return; }
  try {
    await supa('DELETE', `/rest/v1/lawyers?id=eq.${encodeURIComponent(b.id)}`, null);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
