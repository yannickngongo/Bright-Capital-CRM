import nodemailer from 'nodemailer';

export async function sendLeadEmail(lead) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const notify = process.env.NOTIFY_EMAIL || 'yannickngongo14@gmail.com';

  if (!user || !pass) {
    console.warn('[email] Skipped — set GMAIL_USER and GMAIL_APP_PASSWORD in env vars');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Bright Capital CRM" <${user}>`,
    to: notify,
    subject: `New Lead: ${lead.firstName} ${lead.lastName}${lead.company ? ` — ${lead.company}` : ''}`,
    html: buildEmailHtml(lead),
  });

  console.log(`[email] Sent for ${lead.firstName} ${lead.lastName}`);
}

function buildEmailHtml(lead) {
  const row = (label, value) => value ? `
    <tr>
      <td style="padding:10px 20px;background:#F4F6F7;font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#99A9B5;width:130px;vertical-align:top;border-bottom:1px solid #fff;">${label}</td>
      <td style="padding:10px 20px;font-family:Helvetica Neue,Arial,sans-serif;font-size:14px;color:#3C3950;border-bottom:1px solid #F0F3F2;vertical-align:top;">${value}</td>
    </tr>` : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F4F6F7;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #DFE5E8;">
  <tr><td style="background:#253B80;padding:32px 36px;">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="width:36px;height:36px;border:1px solid rgba(255,255,255,0.3);text-align:center;vertical-align:middle;">
        <span style="font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;font-weight:700;color:#fff;letter-spacing:2px;">BC</span>
      </td>
      <td style="padding-left:12px;font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;font-weight:700;color:#fff;letter-spacing:1px;text-transform:uppercase;">Bright Capital</td>
    </tr></table>
    <p style="font-family:Helvetica Neue,Arial,sans-serif;font-size:22px;font-weight:800;color:#fff;margin:20px 0 4px;letter-spacing:-0.5px;">New Strategy Call Request</p>
    <p style="font-family:Helvetica Neue,Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.6);margin:0;">Submitted via bright-capital.vercel.app</p>
  </td></tr>
  <tr><td style="padding:28px 36px 8px;">
    <span style="display:inline-block;background:#169BD7;color:#fff;font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:4px 12px;">New Lead</span>
  </td></tr>
  <tr><td style="padding:0 16px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${row('Full Name', `${lead.firstName} ${lead.lastName}`)}
      ${row('Email', `<a href="mailto:${lead.email}" style="color:#169BD7;">${lead.email}</a>`)}
      ${row('Company', lead.company)}
      ${row('Portfolio Size', lead.units)}
      ${row('Primary Markets', lead.markets)}
    </table>
  </td></tr>
  ${lead.message ? `<tr><td style="padding:0 36px 24px;">
    <div style="border-left:3px solid #169BD7;padding:14px 18px;background:#F4F6F7;">
      <p style="font-family:Helvetica Neue,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#99A9B5;margin:0 0 8px;">Their Message</p>
      <p style="font-family:Helvetica Neue,Arial,sans-serif;font-size:14px;color:#5F727F;line-height:1.6;margin:0;">${lead.message.replace(/\n/g, '<br>')}</p>
    </div>
  </td></tr>` : ''}
  <tr><td style="padding:16px 36px 28px;border-top:1px solid #DFE5E8;">
    <p style="font-family:Helvetica Neue,Arial,sans-serif;font-size:11px;color:#99A9B5;margin:0;">
      Received: ${new Date(lead.createdAt).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}
