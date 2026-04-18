import crypto from 'crypto';
import { readLeads, writeLeads } from '../lib/storage.js';
import { sendLeadEmail } from '../lib/email.js';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { firstName, lastName, email, company, units, markets, message } = req.body || {};
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const lead = {
      id: crypto.randomUUID(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      company: company?.trim() || '',
      units: units || '',
      markets: markets?.trim() || '',
      message: message?.trim() || '',
      status: 'new',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const leads = await readLeads();
    leads.unshift(lead);
    await writeLeads(leads);

    // Fire-and-forget — don't let email failure block the response
    sendLeadEmail(lead).catch(err => console.error('[email]', err.message));

    return res.status(200).json({ success: true, id: lead.id });
  } catch (err) {
    console.error('[contact] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
