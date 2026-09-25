const { cors, supa } = require('./_utils');
module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  try {
    const cat = req.query && req.query.cat;
    let path = '/rest/v1/lawyers?active=eq.true&select=name,city,phone,specialty,experience,plan';
    if (cat) path += `&specialty=cs.{${cat}}`;
    const data = await supa('GET', path, null);
    res.json(Array.isArray(data) ? data : []);
  } catch(e) { res.json([]); }
};
