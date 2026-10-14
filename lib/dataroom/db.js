// Connexion à la base de la data room (projet Supabase lowi-dataroom).
// Rôle dédié dataroom_app via le pooler en mode session : aucune clé Supabase
// à distribuer, et les fichiers vivent en bytea dans la même base.
import { Pool } from 'pg'

const g = globalThis
// Un seul pool par instance : en dev, le rechargement à chaud recréerait un
// pool à chaque édition et épuiserait les connexions du pooler.
export const pool =
  g.__dataroomPool ||
  (g.__dataroomPool = new Pool({
    connectionString: process.env.DATAROOM_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000,
  }))

export async function q(text, params) {
  const r = await pool.query(text, params)
  return r.rows
}

export async function one(text, params) {
  const rows = await q(text, params)
  return rows[0] || null
}

export async function logEvent(email, kind, { fileId = null, seconds = null, req = null } = {}) {
  const ip = req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const ua = req?.headers.get('user-agent')?.slice(0, 300) || null
  await q(
    'insert into dataroom.events (email, file_id, kind, seconds, ip, ua) values ($1,$2,$3,$4,$5,$6)',
    [email, fileId, kind, seconds, ip, ua],
  )
}
