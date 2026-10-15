// Lecture d'un document : PDF filigrané dans le navigateur, ou markdown rendu.
import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { marked } from 'marked'
import { getMember } from '@/lib/dataroom/auth'
import { one, logEvent } from '@/lib/dataroom/db'
import { getLang, t, loc } from '@/lib/dataroom/i18n'
import { TopBar } from '../../parts'
import Heartbeat from './Heartbeat'

export const dynamic = 'force-dynamic'

export default async function View({ params, searchParams }) {
  const lang = await getLang(searchParams)
  const L = t(lang)
  const member = await getMember()
  if (!member) redirect(`/data-room?lang=${lang}`)
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound()
  const f = await one(
    'select id, name, kind, title_en, title_fr, desc_en, desc_fr, body_md_en, body_md_fr, (content is not null) as has_file from dataroom.files where id=$1',
    [id],
  )
  if (!f) notFound()

  // Le markdown n'a pas de requête de fichier séparée : on journalise ici.
  if (f.kind === 'markdown') {
    const h = await headers()
    await logEvent(member.email, 'view', { fileId: f.id, req: { headers: h } })
  }
  const md = loc(f, 'body_md', lang)

  return (
    <>
      <TopBar lang={lang} member={member} path={`/data-room/view/${f.id}`} />
      <div className="dr-view">
        <div className="dr-view__bar">
          <a className="dr-btn dr-btn--sm dr-btn--ghost" href={`/data-room?lang=${lang}`}>← {L.back}</a>
          <div>
            <h1>{loc(f, 'title', lang)}</h1>
            <p>
              {f.name}
              {f.kind === 'pdf' ? ` · ${L.watermarkNote} ${member.name || member.email}` : ''}
            </p>
          </div>
          {f.has_file && (
            <a className="dr-btn dr-btn--sm" style={{ marginLeft: 'auto' }} href={`/api/dataroom/file/${f.id}?dl=1`}>
              {L.download}
            </a>
          )}
        </div>
        {f.kind === 'pdf' && f.has_file ? (
          <iframe className="dr-view__frame" src={`/api/dataroom/file/${f.id}#view=FitH`} title={loc(f, 'title', lang)} />
        ) : (
          <div className="dr-view__doc">
            <article className="dr-md" style={{ margin: '0 auto', padding: '24px clamp(16px,4vw,40px) 64px' }}
              dangerouslySetInnerHTML={{ __html: marked.parse(md || '') }} />
          </div>
        )}
      </div>
      <Heartbeat fileId={f.id} />
    </>
  )
}
