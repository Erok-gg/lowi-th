// Sert un fichier au membre connecté : PDF filigrané à son nom à chaque
// ouverture, consultation journalisée (view ou download).
import { one, logEvent } from '@/lib/dataroom/db'
import { getMember } from '@/lib/dataroom/auth'
import { watermarkPdf } from '@/lib/dataroom/watermark'

export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  const member = await getMember()
  if (!member) return new Response('Unauthorized', { status: 401 })
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response('Not found', { status: 404 })
  const f = await one('select id, name, kind, mime, content from dataroom.files where id=$1', [id])
  if (!f || !f.content) return new Response('Not found', { status: 404 })

  const dl = new URL(req.url).searchParams.get('dl') === '1'
  let body = f.content
  if (f.kind === 'pdf') body = await watermarkPdf(f.content, { name: member.name, email: member.email })
  await logEvent(member.email, dl ? 'download' : 'view', { fileId: f.id, req })

  const name = encodeURIComponent(f.name)
  return new Response(body, {
    headers: {
      'Content-Type': f.mime,
      'Content-Disposition': `${dl ? 'attachment' : 'inline'}; filename*=UTF-8''${name}`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  })
}
