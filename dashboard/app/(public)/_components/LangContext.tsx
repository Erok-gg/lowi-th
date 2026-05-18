'use client'
import { createContext, useContext, useState } from 'react'

export type Lang = 'fr' | 'en' | 'th'

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
}

const LangContext = createContext<LangContextValue>({ lang: 'fr', setLang: () => {} })

// Lazy initial state : lit localStorage uniquement au montage côté client.
// Pattern recommandé React 19 — évite useEffect + setState (anti-pattern).
function readStoredLang(): Lang {
  if (typeof window === 'undefined') return 'fr'
  const stored = window.localStorage.getItem('lowi-lang')
  return stored === 'en' || stored === 'th' ? stored : 'fr'
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  function setLang(l: Lang) {
    setLangState(l)
    if (typeof window !== 'undefined') window.localStorage.setItem('lowi-lang', l)
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)
