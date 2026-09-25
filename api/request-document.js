const { body, cors, supa } = require('./_utils');
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  try {
    const b = await body(req);
    const id = 'DOC' + Date.now();
    await supa('POST', '/rest/v1/documents', { id, type: b.type, description: b.description, name: b.name, phone: b.phone, email: b.email || '', price: b.price, status: 'pending' });
    res.json({ success: true, id, message: `WhatsApp: ${process.env.WHATSAPP || '3129299666'} | Ref: ${id}` });
  } catch(e) { res.status(500).json({ error: e.message }); }
};
