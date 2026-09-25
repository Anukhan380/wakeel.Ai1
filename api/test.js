module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    status: '✅ WakeelAI API working on Vercel!',
    groq: !!process.env.GROQ_API_KEY ? '✅ Set' : '❌ Missing',
    supabase_url: !!process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing',
    supabase_key: !!process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
    admin_pass: !!process.env.ADMIN_PASSWORD ? '✅ Set' : '❌ Missing'
  });
};
