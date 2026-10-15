// Demande d'accès : enregistre la demande et prévient le propriétaire par e-mail,
// avec un lien signé pour accorder ou refuser en un clic.
import { NextResponse } from 'next/server'
import { q, one, logEvent } from '@/lib/dataroom/db'
import { normEmail, isEmail, ownerEmail, baseUrl, decideSig, createLoginToken } from '@/lib/dataroom/auth'
import { sendMail, layout, button, esc } from '@/lib/dataroom/mail'
import { loginMail } from '@/lib/dataroom/mails'

export async function POST(req) {
  const f = await req.formData()
  const lang = f.get('lang') === 'fr' ? 'fr' : 'en'
  const back = (s) => NextResponse.redirect(new URL(`/data-room?lang=${lang}&s=${s}`, req.url), 303)

  // Pot de miel : un champ invisible que seuls les robots remplissent.
  if (f.get('website')) return back('sent')

  const email = normEmail(f.get('email'))
  const name = String(f.get('name') || '').trim().slice(0, 120)
  const company = String(f.get('company') || '').trim().slice(0, 160) || null
  const message = String(f.get('message') || '').trim().slice(0, 2000) || null
  if (!name || !isEmail(email)) return back('invalid')

  try {
    // Déjà membre : on renvoie simplement un lien de connexion.
    const member = await one("select * from dataroom.members where email=$1 and status='active'", [email])
    if (member) {
      const token = await createLoginToken(email, 1)
      await sendMail(loginMail(member, token, lang))
      return back('sent')
    }
    // Une demande en attente depuis moins de 24 h : pas de doublon, pas de spam.
    const recent = await one(
      "select id from dataroom.requests where email=$1 and status='pending' and created_at > now() - interval '24 hours'",
      [email],
    )
    if (recent) return back('sent')

    const r = await one(
      'insert into dataroom.requests (email, name, company, message, lang) values ($1,$2,$3,$4,$5) returning id',
      [email, name, company, message, lang],
    )
    await logEvent(email, 'request', { req })
    const link = `${baseUrl()}/data-room/decide?id=${r.id}&sig=${decideSig(r.id)}`
    const body = `<p><strong>${esc(name)}</strong> &lt;${esc(email)}&gt;${company ? ` — ${esc(company)}` : ''} asks for access to the data room.</p>
${message ? `<p style="padding:12px 16px;background:#1A1C22;border-radius:6px;white-space:pre-wrap">${esc(message)}</p>` : ''}
<p style="color:#A0A6B1">Language: ${lang.toUpperCase()}</p>
${button(link, 'Review the request')}`
    await sendMail({
      to: ownerEmail(),
      subject: `Data room access request — ${name}${company ? ` (${company})` : ''}`,
      html: layout('New access request', body),
      text: `${name} <${email}>${company ? ' — ' + company : ''} asks for access.\n${message || ''}\nReview: ${link}`,
      replyTo: email,
    })
    return back('sent')
  } catch (e) {
    console.error('[dataroom request]', e)
    return back('error')
  }
}
