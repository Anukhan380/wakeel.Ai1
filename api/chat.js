const { body, cors, groq } = require('./_utils');
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  try {
    const b = await body(req);
    const text = await groq(b.system, b.messages);
    res.json({ content: [{ type: 'text', text }] });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
