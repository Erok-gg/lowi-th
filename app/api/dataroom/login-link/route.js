// Nouveau lien de connexion pour un membre déjà validé. Réponse identique que
// l'adresse ait un accès ou non : on ne révèle pas qui est membre.
import { NextResponse } from 'next/server'
import { one, q } from '@/lib/dataroom/db'
import { normEmail, isEmail, ownerEmail, createLoginToken } from '@/lib/dataroom/auth'
import { sendMail } from '@/lib/dataroom/mail'
import { loginMail } from '@/lib/dataroom/mails'

export async function POST(req) {
  const f = await req.formData()
  const lang = f.get('lang') === 'fr' ? 'fr' : 'en'
  const back = (s) => NextResponse.redirect(new URL(`/data-room?lang=${lang}&s=${s}`, req.url), 303)
  const email = normEmail(f.get('email'))
  if (!isEmail(email)) return back('invalid')
  try {
    // Le propriétaire est créé à sa première demande de lien.
    if (email === ownerEmail()) {
      await q(
        "insert into dataroom.members (email, name, role, status) values ($1, 'Owner', 'owner', 'active') on conflict (email) do update set role='owner', status='active'",
        [email],
      )
    }
    const member = await one("select * from dataroom.members where email=$1 and status='active'", [email])
    if (member) {
      // Au plus 5 liens par heure et par adresse.
      const n = await one(
        "select count(*)::int n from dataroom.login_tokens where email=$1 and created_at > now() - interval '1 hour'",
        [email],
      )
      if ((n?.n || 0) < 5) {
        const token = await createLoginToken(email, 1)
        await sendMail(loginMail(member, token, lang))
      }
    }
    return back('link')
  } catch (e) {
    console.error('[dataroom login-link]', e)
    return back('error')
  }
}
