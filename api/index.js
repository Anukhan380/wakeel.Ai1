const https = require('https');

const GROQ_KEY = process.env.GROQ_API_KEY;
const SUPA_HOST = (process.env.SUPABASE_URL || '').replace('https://', '');
const SUPA_KEY = process.env.SUPABASE_ANON_KEY;
const ADMIN_PASS = (process.env.ADMIN_PASSWORD || 'wakeel2024admin').trim();
const WHATSAPP = process.env.WHATSAPP || '3129299666';

function body(req) {
  return new Promise(resolve => {
    if (req.body && typeof req.body === 'object') { resolve(req.body); return; }
    let d = '';
    req.on('data', c => d += c);
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch(e) { resolve({}); } });
  });
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function supa(method, path, data) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const headers = {
      'apikey': SUPA_KEY,
      'Authorization': 'Bearer ' + SUPA_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    const req = https.request({ hostname: SUPA_HOST, path, method, headers }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve([]); } });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function groq(system, messages) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'system', content: system }].concat(messages),
      max_tokens: 1500, temperature: 0.3
    });
    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_KEY,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const p = JSON.parse(d);
          if (p.error) { reject(new Error(p.error.message)); return; }
          resolve(p.choices?.[0]?.message?.content || '');
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function isAdmin(pass) {
  return (pass || '').trim() === ADMIN_PASS;
}

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const route = req.query.route || '';
  const b = req.method === 'POST' ? await body(req) : {};

  try {
    // TEST
    if (route === 'test') {
      res.json({
        status: '✅ WakeelAI working!',
        groq: GROQ_KEY ? '✅ Set' : '❌ Missing',
        supabase: SUPA_HOST ? '✅ Set' : '❌ Missing',
        admin: ADMIN_PASS ? '✅ Set' : '❌ Missing'
      });
      return;
    }

    // CHAT
    if (route === 'chat') {
      const text = await groq(b.system, b.messages);
      res.json({ content: [{ type: 'text', text }] });
      return;
    }

    // LAWYERS
    if (route === 'lawyers') {
      const cat = req.query.cat;
      let path = '/rest/v1/lawyers?active=eq.true&select=name,city,phone,specialty,experience,plan';
      if (cat) path += `&specialty=cs.{${cat}}`;
      const data = await supa('GET', path, null);
      res.json(Array.isArray(data) ? data : []);
      return;
    }

    // LAWYER LOGIN
    if (route === 'lawyer-login') {
      const code = (b.code || '').trim();
      const rows = await supa('GET', `/rest/v1/lawyers?access_code=eq.${encodeURIComponent(code)}&active=eq.true&select=id,name,city,specialty,plan`, null);
      if (rows && rows.length > 0) res.json({ success: true, lawyer: rows[0] });
      else res.json({ success: false, error: 'Invalid or inactive access code.' });
      return;
    }

    // LAWYER RESEARCH
    if (route === 'lawyer-research') {
      const code = (b.code || '').trim();
      const rows = await supa('GET', `/rest/v1/lawyers?access_code=eq.${encodeURIComponent(code)}&active=eq.true&plan=eq.premium&select=id`, null);
      if (!rows || rows.length === 0) { res.json({ error: 'Premium access required.' }); return; }
      const sys = 'You are an expert Pakistani legal research assistant. Provide: Case Analysis, Relevant Laws, Legal Arguments, Counter-Arguments, Practical Advice. Be precise.';
      const text = await groq(sys, [{ role: 'user', content: b.caseDetails }]);
      res.json({ content: [{ type: 'text', text }] });
      return;
    }

    // REQUEST DOCUMENT
    if (route === 'request-document') {
      const id = 'DOC' + Date.now();
      await supa('POST', '/rest/v1/documents', {
        id, type: b.type, description: b.description,
        name: b.name, phone: b.phone, email: b.email || '',
        price: b.price, status: 'pending'
      });
      res.json({ success: true, id, message: `WhatsApp: ${WHATSAPP} | Ref: ${id}` });
      return;
    }

    // CHECK DOCUMENT
    if (route === 'check-document') {
      const rows = await supa('GET', `/rest/v1/documents?id=eq.${encodeURIComponent((b.id||'').trim())}&phone=eq.${encodeURIComponent((b.phone||'').trim())}&select=*`, null);
      if (!rows || rows.length === 0) { res.json({ error: 'Not found. Check your document ID and phone number.' }); return; }
      const doc = rows[0];
      if (doc.status === 'completed') res.json({ status: 'completed', document: doc.document, type: doc.type });
      else res.json({ status: doc.status, message: 'Your document is being prepared.' });
      return;
    }

    // ADMIN DATA
    if (route === 'admin-data') {
      if (!isAdmin(b.password)) { res.json({ error: 'Wrong password' }); return; }
      const [lawyers, documents] = await Promise.all([
        supa('GET', '/rest/v1/lawyers?select=*&order=created_at.desc', null),
        supa('GET', '/rest/v1/documents?select=*&order=created_at.desc', null)
      ]);
      res.json({
        lawyers: Array.isArray(lawyers) ? lawyers : [],
        documents: Array.isArray(documents) ? documents : [],
        admin: { whatsapp: WHATSAPP }
      });
      return;
    }

    // ADMIN SAVE LAWYER
    if (route === 'admin-save-lawyer') {
      if (!isAdmin(b.password)) { res.json({ error: 'Wrong password' }); return; }
      await supa('POST', '/rest/v1/lawyers', b.lawyer);
      res.json({ success: true });
      return;
    }

    // ADMIN DELETE LAWYER
    if (route === 'admin-delete-lawyer') {
      if (!isAdmin(b.password)) { res.json({ error: 'Wrong password' }); return; }
      await supa('DELETE', `/rest/v1/lawyers?id=eq.${encodeURIComponent(b.id)}`, null);
      res.json({ success: true });
      return;
    }

    // ADMIN UPDATE DOC
    if (route === 'admin-update-doc') {
      if (!isAdmin(b.password)) { res.json({ error: 'Wrong password' }); return; }
      await supa('PATCH', `/rest/v1/documents?id=eq.${encodeURIComponent(b.id)}`, { status: b.status });
      res.json({ success: true });
      return;
    }

    // GENERATE DOCUMENT
    if (route === 'generate-document') {
      if (!isAdmin(b.password)) { res.json({ error: 'Wrong password' }); return; }
      const rows = await supa('GET', `/rest/v1/documents?id=eq.${encodeURIComponent(b.id)}&select=*`, null);
      if (!rows || rows.length === 0) { res.json({ error: 'Document not found' }); return; }
      const doc = rows[0];
      const sys = 'You are an expert Pakistani legal document drafter. Write professional, complete, legally sound documents ready for use in Pakistan.';
      const text = await groq(sys, [{ role: 'user', content: `Draft a ${doc.type} for:\n\n${doc.description}\n\nClient: ${doc.name}\n\nMake it complete and professional.` }]);
      await supa('PATCH', `/rest/v1/documents?id=eq.${encodeURIComponent(b.id)}`, {
        document: text, status: 'completed', completed_at: new Date().toISOString()
      });
      res.json({ success: true, document: text, id: b.id });
      return;
    }

    res.status(404).json({ error: 'Unknown route' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
