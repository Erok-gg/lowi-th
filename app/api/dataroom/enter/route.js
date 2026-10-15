// Consomme le lien de connexion (POST depuis la page /data-room/enter : un GET
// suffirait, mais les antivirus de messagerie pré-ouvrent les liens et
// grilleraient le jeton à usage unique avant l'investisseur).
import { NextResponse } from 'next/server'
import { consumeLoginToken, sessionValue, sessionCookie } from '@/lib/dataroom/auth'
import { logEvent } from '@/lib/dataroom/db'

export async function POST(req) {
  const f = await req.formData()
  const lang = f.get('lang') === 'fr' ? 'fr' : 'en'
  const member = await consumeLoginToken(f.get('t'))
  if (!member) return NextResponse.redirect(new URL(`/data-room?lang=${lang}&s=expired`, req.url), 303)
  await logEvent(member.email, 'login', { req })
  const res = NextResponse.redirect(new URL(`/data-room?lang=${lang}`, req.url), 303)
  res.cookies.set(sessionCookie(sessionValue(member.email)))
  res.cookies.set({ name: 'dr_lang', value: lang, path: '/', maxAge: 31536000, sameSite: 'lax' })
  return res
}
