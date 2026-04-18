import { readLeads, writeLeads } from '../../lib/storage.js';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  const leads = await readLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });

  if (req.method === 'PATCH') {
    leads[idx] = { ...leads[idx], ...req.body, updatedAt: new Date().toISOString() };
    await writeLeads(leads);
    return res.json(leads[idx]);
  }

  if (req.method === 'DELETE') {
    leads.splice(idx, 1);
    await writeLeads(leads);
    return res.json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
