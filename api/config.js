import crypto from 'crypto';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const pwd = process.env.CRM_PASSWORD || 'BrightCapital2025';
  const pwdHash = crypto.createHash('sha256').update(pwd).digest('hex');
  return res.json({ pwdHash });
}
