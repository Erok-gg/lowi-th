'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useLang, Lang } from './LangContext'
import { createClient } from '@/lib/supabase/client'

const LINKS = {
  fr: [
    { href: '/comment-ca-marche', label: 'Comment ça marche' },
    { href: '/a-propos',          label: 'À propos' },
    { href: '/projets',           label: 'Voir les propriétés' },
    { href: '/proposer',          label: 'Proposer votre bien' },
  ],
  en: [
    { href: '/comment-ca-marche', label: 'How it works' },
    { href: '/a-propos',          label: 'About' },
    { href: '/projets',           label: 'Properties' },
    { href: '/proposer',          label: 'List your property' },
  ],
  th: [
    { href: '/comment-ca-marche', label: 'วิธีการทำงาน' },
    { href: '/a-propos',          label: 'เกี่ยวกับเรา' },
    { href: '/projets',           label: 'ดูโครงการ' },
    { href: '/proposer',          label: 'เสนออสังหาริมทรัพย์' },
  ],
}

const LANG_LABELS: Record<Lang, string> = { fr: 'FR', en: 'ENG', th: 'TH' }
const LANG_FLAGS:  Record<Lang, string> = { fr: 'fr', en: 'gb',  th: 'th'  }

const PersonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)

function FlagImg({ code }: { code: string }) {
  return <img src={`https://flagcdn.com/20x15/${code}.png`} width="20" height="15" style={{ borderRadius: 2, verticalAlign: 'middle' }} alt="" />
}

export default function LowiNav() {
  const { lang, setLang } = useLang()
  const pathname = usePathname()
  const [ddOpen, setDdOpen]       = useState(false)
  const [connected, setConnected] = useState(false)
  const ddRef = useRef<HTMLDivElement>(null)

  // Supabase session detection
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setConnected(!!data.session)
    })
  }, [])

  // Close lang dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setDdOpen(false)
    }
    document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [])

  const links = LINKS[lang]

  return (
    <nav className="lowi-nav">
      <Link href="/" className="nav-logo">
        lowi<span className="nav-logo-demo"> - demo</span>
      </Link>

      <ul className="nav-links">
        {links.map(l => (
          <li key={l.href}>
            <Link href={l.href} className={pathname === l.href ? 'active' : ''}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="nav-right">
        {/* Language dropdown */}
        <div className="nav-lang-dd" ref={ddRef}>
          <button
            className="nav-lang-dd-btn"
            onClick={e => { e.stopPropagation(); setDdOpen(v => !v) }}
          >
            <FlagImg code={LANG_FLAGS[lang]} />
            {' '}{LANG_LABELS[lang]}{' '}▾
          </button>
          <ul className={`nav-lang-dd-menu${ddOpen ? ' open' : ''}`}>
            {(['fr', 'en', 'th'] as Lang[]).map(l => (
              <li key={l} onClick={() => { setLang(l); setDdOpen(false) }}>
                <FlagImg code={LANG_FLAGS[l]} /> {LANG_LABELS[l]}
              </li>
            ))}
          </ul>
        </div>

        {/* Profile button */}
        <Link
          href={connected ? '/profile' : `/invest/login?redirect=${encodeURIComponent(pathname)}`}
          className={`nav-profile-btn${connected ? ' is-connected' : ''}`}
        >
          {connected
            ? <><span className="nav-profile-dot" /> Mon profil</>
            : <><PersonIcon /> Mon profil</>
          }
        </Link>
      </div>
    </nav>
  )
}
