const { body, cors, supa, groq, isAdmin } = require('./_utils');
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  const b = await body(req);
  if (!isAdmin(b.password)) { res.json({ error: 'Wrong password' }); return; }
  try {
    const rows = await supa('GET', `/rest/v1/documents?id=eq.${encodeURIComponent(b.id)}&select=*`, null);
    if (!rows || rows.length === 0) { res.json({ error: 'Document not found' }); return; }
    const doc = rows[0];
    const sys = 'You are an expert Pakistani legal document drafter. Write professional, complete, legally sound documents ready for use in Pakistan. Use proper formal format.';
    const text = await groq(sys, [{ role: 'user', content: `Draft a ${doc.type} for:\n\n${doc.description}\n\nClient: ${doc.name}\n\nMake it complete and professional.` }]);
    await supa('PATCH', `/rest/v1/documents?id=eq.${encodeURIComponent(b.id)}`, { document: text, status: 'completed', completed_at: new Date().toISOString() });
    res.json({ success: true, document: text, id: b.id });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
