const https = require('https');
const { groq } = require('./_utils');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const text = await groq(
      'You are a helpful assistant.',
      [{ role: 'user', content: 'Say hello in one word.' }]
    );
    res.json({ success: true, response: text });
  } catch(e) {
    res.json({ success: false, error: e.message, groq_key_first5: (process.env.GROQ_API_KEY || '').substring(0, 5) });
  }
};
