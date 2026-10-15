// Temps de lecture : la page de lecture envoie un battement toutes les 15 s
// tant que l'onglet est visible. La somme par fichier donne le temps passé.
import { one, logEvent } from '@/lib/dataroom/db'
import { getMember } from '@/lib/dataroom/auth'

export async function POST(req) {
  const member = await getMember()
  if (!member) return new Response(null, { status: 401 })
  const { fileId } = await req.json().catch(() => ({}))
  if (!/^[0-9a-f-]{36}$/.test(String(fileId))) return new Response(null, { status: 400 })
  if (!(await one('select 1 from dataroom.files where id=$1', [fileId]))) return new Response(null, { status: 404 })
  await logEvent(member.email, 'heartbeat', { fileId, seconds: 15, req })
  return new Response(null, { status: 204 })
}
