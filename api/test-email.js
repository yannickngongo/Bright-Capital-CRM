import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const notify = process.env.NOTIFY_EMAIL || 'yannickngongo14@gmail.com';

  if (!user || !pass) {
    return res.json({ success: false, error: 'Missing GMAIL_USER or GMAIL_APP_PASSWORD', hasUser: !!user, hasPass: !!pass });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass: pass.replace(/\s/g, '') },
  });

  try {
    await transporter.verify();
  } catch (err) {
    return res.json({ success: false, stage: 'smtp-verify', error: err.message, sentFrom: user, sentTo: notify });
  }

  try {
    await transporter.sendMail({
      from: `"Bright Capital CRM" <${user}>`,
      to: notify,
      subject: 'Bright Capital CRM — Email Test',
      text: 'This is a test email from your Bright Capital CRM system.',
    });
    return res.json({ success: true, sentFrom: user, sentTo: notify });
  } catch (err) {
    return res.json({ success: false, stage: 'send', error: err.message, sentFrom: user, sentTo: notify });
  }
}
