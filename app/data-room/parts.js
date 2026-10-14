// Éléments partagés des pages de la data room (composants serveur).
import { t } from '@/lib/dataroom/i18n'

export function TopBar({ lang, member, path = '/data-room', extra = '' }) {
  const L = t(lang)
  const sep = extra ? '&' : '?'
  return (
    <header className="dr-top">
      <a className="dr-brand" href={`/data-room?lang=${lang}`}>
        <b>LOWI</b>
        <span>{L.title}</span>
      </a>
      <div className="dr-top__r">
        {member && (
          <span className="dr-who dr-hide-sm">
            {L.signedInAs} {member.email}
          </span>
        )}
        {member?.role === 'owner' && (
          <a className="dr-btn dr-btn--sm dr-btn--ghost" href={`/data-room/admin?lang=${lang}`}>
            {L.admin}
          </a>
        )}
        <nav className="dr-lang" aria-label="Language">
          <a href={`${path}${extra ? '?' + extra : ''}${sep}lang=en`} aria-current={lang === 'en'}>EN</a>
          <a href={`${path}${extra ? '?' + extra : ''}${sep}lang=fr`} aria-current={lang === 'fr'}>FR</a>
        </nav>
        {member && (
          <form action="/api/dataroom/logout" method="post" className="dr-inline">
            <button className="dr-btn dr-btn--sm dr-btn--ghost" type="submit">{L.signOut}</button>
          </form>
        )}
      </div>
    </header>
  )
}

export const fmtSize = (n) =>
  !n ? '—' : n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`

// Format réduit jj/mm/aa, identique en EN et FR (pas d'ambiguïté mois/jour
// pour un lecteur européen ou asiatique ; l'investisseur US est minoritaire).
export const fmtDate = (d) => {
  const x = new Date(d)
  return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}/${String(x.getFullYear()).slice(2)}`
}

export const KIND_LABEL = { pdf: 'PDF', markdown: 'MD', other: 'FILE' }

export function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}
export function StarIcon({ filled = true, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </svg>
  )
}
export function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  )
}
