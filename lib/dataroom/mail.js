// Envoi d'e-mails par l'API Resend (domaine lowi.asia).
// Sans RESEND_API_KEY (dev local, ou avant vérification du domaine), l'e-mail
// est écrit dans la console du serveur au lieu d'être envoyé : le parcours
// reste testable de bout en bout sans compte.
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
export { esc }

export async function sendMail({ to, subject, html, text, replyTo }) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.log(`\n[dataroom mail — non envoyé, RESEND_API_KEY absent]\nTo: ${to}\nSubject: ${subject}\n${text}\n`)
    return { skipped: true }
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.DATAROOM_FROM || 'LOWI Data Room <dataroom@lowi.asia>',
      to: [to],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  })
  if (!r.ok) {
    const body = await r.text()
    console.error('[dataroom mail] échec Resend', r.status, body.slice(0, 300))
    throw new Error('mail_failed')
  }
  return r.json()
}

// Gabarit commun : sobre, sombre, lisible dans les clients qui bloquent le CSS.
export function layout(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#0B0C0F;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;color:#EEF0F3">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#121318;border:1px solid #22252C;border-radius:12px">
<tr><td style="padding:28px 32px 8px;font-size:13px;letter-spacing:.08em;color:#A0A6B1">LOWI · DATA ROOM</td></tr>
<tr><td style="padding:8px 32px 0;font-size:22px;font-weight:600;color:#EEF0F3">${esc(title)}</td></tr>
<tr><td style="padding:16px 32px 32px;font-size:15px;line-height:1.6;color:#C9CDD4">${bodyHtml}</td></tr>
</table>
<p style="font-size:12px;color:#7C828D;margin-top:16px">LOWI — Central, Hong Kong SAR. Not an offer, not investment advice.</p>
</td></tr></table></body></html>`
}

export const button = (href, label, primary = true) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:8px 8px 0 0;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;${
    primary ? 'background:#A99DFF;color:#0B0C0F' : 'background:#1A1C22;color:#EEF0F3;border:1px solid #30343C'
  }">${esc(label)}</a>`
