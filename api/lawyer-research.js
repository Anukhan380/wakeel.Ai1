const { body, cors, supa, groq } = require('./_utils');
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  try {
    const { code, caseDetails } = await body(req);
    const rows = await supa('GET', `/rest/v1/lawyers?access_code=eq.${encodeURIComponent((code||'').trim())}&active=eq.true&plan=eq.premium&select=id`, null);
    if (!rows || rows.length === 0) { res.json({ error: 'Premium access required.' }); return; }
    const sys = 'You are an expert Pakistani legal research assistant. Provide: Case Analysis, Relevant Laws, Legal Arguments, Counter-Arguments, Practical Advice. Be precise.';
    const text = await groq(sys, [{ role: 'user', content: caseDetails }]);
    res.json({ content: [{ type: 'text', text }] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
