// Sessions et jetons de la data room.
// - Liens de connexion : jeton aléatoire envoyé par e-mail, seul son SHA-256 est
//   stocké, usage unique, durée limitée.
// - Session : cookie httpOnly signé HMAC (email.expiration.signature). Le statut
//   du membre est relu en base à CHAQUE requête : une révocation est immédiate.
import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { one, q } from './db'

const SECRET = () => {
  const s = process.env.DATAROOM_SESSION_SECRET
  if (!s || s.length < 32) throw new Error('DATAROOM_SESSION_SECRET manquant ou trop court')
  return s
}
export const COOKIE = 'dr_session'
const SESSION_DAYS = 7

export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')
export const hmac = (s) => crypto.createHmac('sha256', SECRET()).update(s).digest('base64url')
const safeEq = (a, b) => {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

export const normEmail = (e) => String(e || '').trim().toLowerCase()
export const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 200
export const ownerEmail = () => normEmail(process.env.DATAROOM_OWNER_EMAIL)
export const baseUrl = () => (process.env.DATAROOM_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

// Lien d'approbation signé : seul le propriétaire le reçoit par e-mail.
export const decideSig = (id) => hmac('decide:' + id)
export const checkDecideSig = (id, sig) => !!sig && safeEq(decideSig(id), String(sig))

export async function createLoginToken(email, hours) {
  const token = crypto.randomBytes(32).toString('base64url')
  await q(
    "insert into dataroom.login_tokens (token_hash, email, expires_at) values ($1, $2, now() + make_interval(hours => $3))",
    [sha256(token), email, hours],
  )
  return token
}

// Consomme le jeton (usage unique) et renvoie le membre actif, sinon null.
export async function consumeLoginToken(token) {
  if (!token) return null
  const row = await one(
    `update dataroom.login_tokens set used_at = now()
       where token_hash = $1 and used_at is null and expires_at > now()
     returning email`,
    [sha256(String(token))],
  )
  if (!row) return null
  return one("select * from dataroom.members where email = $1 and status = 'active'", [row.email])
}

export function sessionValue(email) {
  const exp = Date.now() + SESSION_DAYS * 864e5
  const body = Buffer.from(email).toString('base64url') + '.' + exp
  return body + '.' + hmac(body)
}

export const sessionCookie = (value, maxAge = SESSION_DAYS * 86400) => ({
  name: COOKIE,
  value,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge,
})

// Membre connecté (statut relu en base), ou null.
export async function getMember() {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return null
  const [b64, exp, sig] = raw.split('.')
  if (!b64 || !exp || !sig || !safeEq(hmac(b64 + '.' + exp), sig) || Number(exp) < Date.now()) return null
  const email = Buffer.from(b64, 'base64url').toString()
  const m = await one("select * from dataroom.members where email = $1 and status = 'active'", [email])
  if (m) q('update dataroom.members set last_seen = now() where email = $1', [email]).catch(() => {})
  return m
}

export async function getOwner() {
  const m = await getMember()
  return m && m.role === 'owner' ? m : null
}
