const https = require('https');

// Parse request body
function body(req) {
  return new Promise(resolve => {
    if (req.body && typeof req.body === 'object') { resolve(req.body); return; }
    let d = '';
    req.on('data', c => d += c);
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch(e) { resolve({}); } });
  });
}

// CORS headers
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Supabase request
function supa(method, path, data) {
  return new Promise((resolve, reject) => {
    const host = process.env.SUPABASE_URL.replace('https://', '');
    const payload = data ? JSON.stringify(data) : null;
    const headers = {
      'apikey': process.env.SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + process.env.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    const req = https.request({ hostname: host, path, method, headers }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve([]); } });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Groq AI
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
        'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
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
  return (pass || '').trim() === (process.env.ADMIN_PASSWORD || 'wakeel2024admin').trim();
}

module.exports = { body, cors, supa, groq, isAdmin };
