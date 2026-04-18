// Local development server — mirrors the Vercel Functions API
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { readLeads, writeLeads } from './lib/storage.js';
import { sendLeadEmail } from './lib/email.js';
import crypto from 'crypto';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// POST /api/contact
app.post('/api/contact', async (req, res) => {
  const { firstName, lastName, email, company, units, markets, message } = req.body;
  if (!firstName || !lastName || !email)
    return res.status(400).json({ error: 'Missing required fields' });

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

  sendLeadEmail(lead).catch(err => console.error('[email]', err.message));

  res.json({ success: true, id: lead.id });
});

// GET /api/leads
app.get('/api/leads', async (_req, res) => {
  res.json(await readLeads());
});

// PATCH /api/leads/:id
app.patch('/api/leads/:id', async (req, res) => {
  const leads = await readLeads();
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  leads[idx] = { ...leads[idx], ...req.body, updatedAt: new Date().toISOString() };
  await writeLeads(leads);
  res.json(leads[idx]);
});

// DELETE /api/leads/:id
app.delete('/api/leads/:id', async (req, res) => {
  let leads = await readLeads();
  if (!leads.some(l => l.id === req.params.id))
    return res.status(404).json({ error: 'Not found' });
  await writeLeads(leads.filter(l => l.id !== req.params.id));
  res.json({ success: true });
});

// GET /api/config
app.get('/api/config', (_req, res) => {
  const pwd = process.env.CRM_PASSWORD || 'BrightCapital2025';
  res.json({ pwdHash: crypto.createHash('sha256').update(pwd).digest('hex') });
});

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log('\n  ┌─────────────────────────────────────────┐');
  console.log('  │        Bright Capital CRM (Local)       │');
  console.log('  └─────────────────────────────────────────┘');
  console.log(`\n  Dashboard  → http://localhost:${PORT}`);
  console.log(`  API        → http://localhost:${PORT}/api/leads`);
  const emailOk = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  console.log(`  Email      → ${emailOk ? '✓ Configured' : '⚠ Set GMAIL_USER + GMAIL_APP_PASSWORD in .env'}`);
  console.log('');
});
