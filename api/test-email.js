import { sendLeadEmail } from '../lib/email.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    await sendLeadEmail({
      id: 'test',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      company: 'Test Co',
      units: '100–300 units',
      markets: 'Texas',
      message: 'Email test.',
      createdAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message, code: err.code });
  }
}
