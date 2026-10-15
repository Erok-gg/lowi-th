// Page d'atterrissage du lien e-mail : un bouton POST consomme le jeton.
// (Un GET le consommerait aussi quand l'antivirus de messagerie pré-ouvre le lien.)
import { getLang, t } from '@/lib/dataroom/i18n'
import { TopBar } from '../parts'

export default async function Enter({ searchParams }) {
  const sp = await searchParams
  const lang = await getLang(searchParams)
  const L = t(lang)
  const token = typeof sp?.t === 'string' ? sp.t.slice(0, 100) : ''
  return (
    <>
      <TopBar lang={lang} path="/data-room/enter" extra={token ? `t=${token}` : ''} />
      <main className="dr-gate" style={{ gridTemplateColumns: 'minmax(0,560px)', justifyContent: 'center' }}>
        <div className="dr-card">
          <h2>{L.enterTitle}</h2>
          <p>{L.enterIntro}</p>
          <form action="/api/dataroom/enter" method="post">
            <input type="hidden" name="t" value={token} />
            <input type="hidden" name="lang" value={lang} />
            <button className="dr-btn dr-btn--primary" type="submit">{L.enterBtn}</button>
          </form>
          <p style={{ marginTop: 20, fontSize: 13, color: 'var(--ink-3)' }}>{L.confidentiality}</p>
        </div>
      </main>
    </>
  )
}
