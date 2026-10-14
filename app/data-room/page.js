// /data-room : formulaire de demande d'accès pour le public, explorateur de
// fichiers façon Drive pour un membre connecté.
import { marked } from 'marked'
import { getMember } from '@/lib/dataroom/auth'
import { q } from '@/lib/dataroom/db'
import { getLang, t, loc } from '@/lib/dataroom/i18n'
import { TopBar, fmtSize, fmtDate, KIND_LABEL, FolderIcon, StarIcon, GridIcon } from './parts'

export const dynamic = 'force-dynamic'

const FLASH = { sent: 'requestSent', link: 'linkSent', invalid: 'invalid', error: 'error', expired: 'enterInvalid' }

export default async function DataRoom({ searchParams }) {
  const sp = await searchParams
  const lang = await getLang(searchParams)
  const L = t(lang)
  const member = await getMember()
  const flash = FLASH[sp?.s]
  const bad = ['invalid', 'error', 'expired'].includes(sp?.s)

  if (!member) {
    return (
      <>
        <TopBar lang={lang} />
        <main className="dr-gate">
          <section>
            <h1>
              {L.title}.<br />
              <span>{lang === 'fr' ? 'Sur demande.' : 'By request.'}</span>
            </h1>
            <p className="dr-gate__lead">{L.tagline}</p>
            <p className="dr-gate__note">{L.confidentiality}</p>
          </section>
          <section>
            {flash && <div className={`dr-flash ${bad ? 'dr-flash--bad' : ''}`} role="status">{L[flash]}</div>}
            <div className="dr-card">
              <h2>{L.requestTitle}</h2>
              <p>{L.requestIntro}</p>
              <form className="dr-form" action="/api/dataroom/request" method="post">
                <input type="hidden" name="lang" value={lang} />
                <div className="dr-hp" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input id="website" name="website" tabIndex={-1} autoComplete="off" />
                </div>
                <div className="dr-field">
                  <label htmlFor="name">{L.name}</label>
                  <input id="name" name="name" required maxLength={120} autoComplete="name" />
                </div>
                <div className="dr-field">
                  <label htmlFor="email">{L.email}</label>
                  <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" />
                </div>
                <div className="dr-field">
                  <label htmlFor="company">{L.company}</label>
                  <input id="company" name="company" maxLength={160} autoComplete="organization" />
                </div>
                <div className="dr-field">
                  <label htmlFor="message">{L.message}</label>
                  <textarea id="message" name="message" maxLength={2000} />
                </div>
                <button className="dr-btn dr-btn--primary" type="submit">{L.submitRequest}</button>
              </form>
              <div className="dr-sep" />
              <h2 style={{ fontSize: 17 }}>{L.haveAccess}</h2>
              <p>{L.linkIntro}</p>
              <form className="dr-form" action="/api/dataroom/login-link" method="post">
                <input type="hidden" name="lang" value={lang} />
                <div className="dr-field">
                  <label htmlFor="email2">{L.email}</label>
                  <input id="email2" name="email" type="email" required autoComplete="email" />
                </div>
                <button className="dr-btn" type="submit">{L.sendLink}</button>
              </form>
            </div>
          </section>
        </main>
      </>
    )
  }

  // --- Membre connecté : explorateur ---
  const folders = await q('select slug, name_en, name_fr, sort from dataroom.folders order by sort')
  const files = await q(
    `select id, folder, name, title_en, title_fr, desc_en, desc_fr, kind, size_bytes, highlighted, pinned, updated_at,
            case when pinned then coalesce(case when $1 = 'fr' then body_md_fr end, body_md_en) end as readme
       from dataroom.files order by pinned desc, highlighted desc, sort, title_en`,
    [lang],
  )
  const view = sp?.f || 'all'
  const counts = Object.fromEntries(folders.map((f) => [f.slug, files.filter((x) => x.folder === f.slug).length]))
  const shown =
    view === 'all' ? files : view === 'key' ? files.filter((f) => f.highlighted) : files.filter((f) => f.folder === view)
  const folderName = (slug) => {
    const f = folders.find((x) => x.slug === slug)
    return f ? loc(f, 'name', lang) : slug
  }
  const title = view === 'all' ? L.allFiles : view === 'key' ? L.highlighted : folderName(view)
  const readme = files.find((f) => f.pinned && f.readme && (view === 'all' || f.folder === view))
  const keys = view === 'all' ? files.filter((f) => f.highlighted && !f.pinned) : []
  const href = (f) => `/data-room?lang=${lang}${f === 'all' ? '' : `&f=${f}`}`
  const open = (f) => `/data-room/view/${f.id}?lang=${lang}`

  return (
    <>
      <TopBar lang={lang} member={member} extra={view === 'all' ? '' : `f=${view}`} />
      <div className="dr-app">
        <nav className="dr-side" aria-label={L.folders}>
          <a className="dr-nav" href={href('all')} aria-current={view === 'all' ? 'page' : undefined}>
            <GridIcon /> {L.allFiles} <em>{files.length}</em>
          </a>
          <a className="dr-nav" href={href('key')} aria-current={view === 'key' ? 'page' : undefined}>
            <span className="dr-star"><StarIcon size={16} /></span> {L.highlighted}
            <em>{files.filter((f) => f.highlighted).length}</em>
          </a>
          <h3>{L.folders}</h3>
          {folders.map((f) => (
            <a key={f.slug} className="dr-nav" href={href(f.slug)} aria-current={view === f.slug ? 'page' : undefined}>
              <FolderIcon /> {loc(f, 'name', lang)} <em>{counts[f.slug] || ''}</em>
            </a>
          ))}
        </nav>

        <main className="dr-main">
          <div className="dr-crumb">LOWI / {L.title}{view !== 'all' ? ` / ${title}` : ''}</div>
          <h1>{title}</h1>

          {readme && (
            <section className="dr-readme dr-readme--clip">
              <div className="dr-readme__h">
                <span className="dr-ico dr-ico--markdown" style={{ width: 24, height: 24, flexBasis: 24 }}>MD</span>
                {readme.name} · {L.readme}
                <a className="dr-btn dr-btn--sm" href={open(readme)}>{L.open}</a>
              </div>
              <div className="dr-md" dangerouslySetInnerHTML={{ __html: marked.parse(readme.readme) }} />
            </section>
          )}

          {keys.length > 0 && (
            <div className="dr-keys">
              {keys.map((f) => (
                <a key={f.id} className="dr-key" href={open(f)}>
                  <span className="dr-key__k"><StarIcon size={12} /> {L.key}</span>
                  <span className="dr-key__t">{loc(f, 'title', lang)}</span>
                  {loc(f, 'desc', lang) && <span className="dr-key__d">{loc(f, 'desc', lang)}</span>}
                </a>
              ))}
            </div>
          )}

          {shown.length === 0 ? (
            <p className="dr-empty">{L.empty}</p>
          ) : (
            <div className="dr-tablewrap">
              <table className="dr-table">
                <thead>
                  <tr>
                    <th>{L.colName}</th>
                    <th className="dr-hide-sm">{L.colFolder}</th>
                    <th className="dr-hide-sm">{L.colUpdated}</th>
                    <th className="dr-hide-sm">{L.colSize}</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <a className="dr-fname" href={open(f)}>
                          <span className={`dr-ico dr-ico--${f.kind}`}>{KIND_LABEL[f.kind]}</span>
                          <span>
                            <b>{loc(f, 'title', lang)}</b>{' '}
                            {f.highlighted && <span className="dr-star" title={L.key}><StarIcon /></span>}
                            <small>{f.name}</small>
                          </span>
                        </a>
                      </td>
                      <td className="dr-hide-sm">{folderName(f.folder)}</td>
                      <td className="num dr-hide-sm">{fmtDate(f.updated_at, lang)}</td>
                      <td className="num dr-hide-sm">{fmtSize(f.size_bytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </>
  )
}
