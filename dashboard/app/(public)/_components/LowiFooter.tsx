'use client'
import Link from 'next/link'
import { useLang } from './LangContext'

const T = {
  fr: { legal: 'Mentions légales', privacy: 'Politique de confidentialité', contact: 'Contact', copy: '© 2026 LOWI. Tous droits réservés.' },
  en: { legal: 'Legal notice', privacy: 'Privacy policy', contact: 'Contact', copy: '© 2026 LOWI. All rights reserved.' },
  th: { legal: 'ข้อมูลทางกฎหมาย', privacy: 'นโยบายความเป็นส่วนตัว', contact: 'ติดต่อ', copy: '© 2026 LOWI. สงวนลิขสิทธิ์.' },
}

export default function LowiFooter() {
  const { lang } = useLang()
  const t = T[lang]
  return (
    <footer className="lowi-footer">
      <Link href="/" className="logo">lowi</Link>
      <span>{t.copy}</span>
      <div className="footer-links">
        <a href="#">{t.legal}</a>
        <a href="#">{t.privacy}</a>
        <a href="#">{t.contact}</a>
      </div>
    </footer>
  )
}
