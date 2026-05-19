'use client'
import './landing.css'
import { useLang, Lang } from './_components/LangContext'
import { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

/* ── Translations ──────────────────────────────────────────────────────────── */

const T = {
  fr: {
    heroH1: `L'immobilier fractionné thaïlandais,<br>dès <span class="price-ticker-wrap"><span id="price-ticker" class="price-ticker">15 000 €</span></span>`,
    heroP: 'Co-investissez en Thaïlande et profitez de loyers réguliers sans les tracas de la gestion.',
    heroTagline: 'Investissement légal au pays du sourire — vos droits sont inscrits directement sur le titre de propriété.',
    heroBtn1: 'En savoir plus →', heroBtn2: 'Voir les projets',
    heroCardLoc: '📍 Ko Phangan · Bail 28 ans',
    pill1Label: 'Souscription ouverte', pill2Label: 'Bail enregistré · Due diligence OK',
    t1desc: 'Distribution annuelle cible', t2desc: 'Durée de bail',
    t3desc: 'Ticket minimum (~15 000 USD)', t4desc: 'Transparence des frais et distributions',
    carLabel: 'Projets en cours', carTitle: 'Leaseholds en souscription',
    lblYield: 'TRI', lblDist: 'Distribution', lblMin: 'Ticket min.', lblFund: 'Financement',
    btnInvest: 'Voir la fiche →', btnFull: 'Complet — liste d\'attente',
    seeAll: 'Voir tous les projets →',
  },
  en: {
    heroH1: `Thai fractional<br>real estate,<br>from <span class="price-ticker-wrap"><span id="price-ticker" class="price-ticker">€15,000</span></span>`,
    heroP: 'Co-invest in Thailand and secure regular rental income without the hassle of property management.',
    heroTagline: 'Legal investment in the Land of Smiles — your rights are registered directly on the title deed.',
    heroBtn1: 'Learn more →', heroBtn2: 'View projects',
    heroCardLoc: '📍 Ko Phangan · 28-year lease',
    pill1Label: 'Subscription open', pill2Label: 'Registered lease · Due diligence OK',
    t1desc: 'Target annual distribution', t2desc: 'Lease duration',
    t3desc: 'Minimum commitment (~$15,000)', t4desc: 'Transparent fees & distributions',
    carLabel: 'Active projects', carTitle: 'Leaseholds open for subscription',
    lblYield: 'IRR', lblDist: 'Distribution', lblMin: 'Min. ticket', lblFund: 'Funding',
    btnInvest: 'View details →', btnFull: 'Full — join waitlist',
    seeAll: 'View all projects →',
  },
  th: {
    heroH1: `อสังหาริมทรัพย์ไทย<br>แบ่งส่วน<br>เริ่มต้นที่ <span class="price-ticker-wrap"><span id="price-ticker" class="price-ticker">฿500,000</span></span>`,
    heroP: 'ร่วมลงทุนในประเทศไทยและรับรายได้ค่าเช่าสม่ำเสมอ',
    heroTagline: 'การลงทุนที่ถูกกฎหมายในแดนสยาม — สิทธิ์ของคุณจดทะเบียนตรงในโฉนดที่ดิน',
    heroBtn1: 'เรียนรู้เพิ่มเติม →', heroBtn2: 'ดูโครงการ',
    heroCardLoc: '📍 เกาะพะงัน · สัญญาเช่า 28 ปี',
    pill1Label: 'เปิดรับการสมัคร', pill2Label: 'สัญญาเช่าจดทะเบียน · ตรวจสอบแล้ว',
    t1desc: 'เป้าหมายการจ่ายรายปี', t2desc: 'ระยะเวลาสัญญาเช่า',
    t3desc: 'ขั้นต่ำการลงทุน (~15,000 USD)', t4desc: 'โปร่งใสทุกรายการ',
    carLabel: 'โครงการปัจจุบัน', carTitle: 'สัญญาเช่าที่เปิดรับการสมัคร',
    lblYield: 'IRR', lblDist: 'การจ่าย', lblMin: 'ขั้นต่ำ', lblFund: 'เงินทุน',
    btnInvest: 'ดูรายละเอียด →', btnFull: 'เต็ม — เข้าคิวรอ',
    seeAll: 'ดูโครงการทั้งหมด →',
  },
}

const TICKER_VALS: Record<Lang, string[]> = {
  fr: ['15 000 €', '$15 000', '฿500 000'],
  en: ['€15,000', '$15,000', '฿500,000'],
  th: ['฿500,000', '$15,000', '€15,000'],
}

/* ── Price ticker ──────────────────────────────────────────────────────────── */
function PriceTicker({ lang }: { lang: Lang }) {
  const [idx, setIdx]         = useState(0)
  const [phase, setPhase]     = useState<'idle' | 'out' | 'in'>('idle')
  const vals = TICKER_VALS[lang]

  useEffect(() => { setIdx(0); setPhase('idle') }, [lang])

  useEffect(() => {
    const id = setInterval(() => {
      setPhase('out')
      setTimeout(() => {
        setIdx(i => (i + 1) % vals.length)
        setPhase('in')
        requestAnimationFrame(() => requestAnimationFrame(() => setPhase('idle')))
      }, 350)
    }, 5000)
    return () => clearInterval(id)
  }, [vals.length])

  return (
    <span className="price-ticker-wrap">
      <span className={`price-ticker${phase === 'out' ? ' roll-out' : phase === 'in' ? ' roll-in' : ''}`}>
        {vals[idx]}
      </span>
    </span>
  )
}

/* ── Property data ─────────────────────────────────────────────────────────── */
const PROPS = [
  { tag: 'Villa · Ko Phangan', img: 'https://images.unsplash.com/photo-1582610116397-edb72278f033?w=600&q=80', alt: 'Ko Phangan Villa', name: 'Nai Wok Jungle Villa', city: '📍 Nai Wok, Ko Phangan', irr: '12.1%', dist: '8.0%/an', min: '500k THB', pct: 87, full: false },
  { tag: 'Bungalows · Ko Phangan', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80', alt: 'Ko Phangan Pool', name: 'Haad Yao Beach Bungalows', city: '📍 Haad Yao, Ko Phangan', irr: '11.5%', dist: '7.5%/an', min: '750k THB', pct: 62, full: false },
  { tag: 'Villa · Koh Samui', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80', alt: 'Koh Samui', name: 'Lamai Seaview Villa', city: '📍 Lamai, Koh Samui', irr: '9.8%', dist: '6.5%/an', min: '1M THB', pct: 100, full: true },
  { tag: 'Eco-Resort · Ko Phangan', img: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80', alt: 'Ko Phangan Resort', name: 'Thong Sala Eco-Resort', city: '📍 Thong Sala, Ko Phangan', irr: '11.8%', dist: '7.8%/an', min: '500k THB', pct: 38, full: false },
  { tag: 'Co-living · Ko Phangan', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80', alt: 'Co-living', name: 'Srithanu Digital Nest', city: '📍 Srithanu, Ko Phangan', irr: '13.2%', dist: '8.5%/an', min: '500k THB', pct: 55, full: false },
  { tag: 'Villa · Phuket', img: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&q=80', alt: 'Phuket', name: 'Rawai Pool Villa', city: '📍 Rawai, Phuket', irr: '10.2%', dist: '6.8%/an', min: '750k THB', pct: 22, full: false },
]

const CARD_W = 340 + 24 // width + gap

/* ── Carousel ──────────────────────────────────────────────────────────────── */
function PropertyCarousel({ t }: { t: typeof T.fr }) {
  const [current, setCurrent] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const autoRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const max = PROPS.length - 1

  const goTo = useCallback((idx: number) => {
    let clamped = idx
    if (clamped < 0) clamped = 0
    if (clamped > max - 2) clamped = max - 2
    setCurrent(clamped)
    if (trackRef.current) trackRef.current.style.transform = `translateX(-${clamped * CARD_W}px)`
  }, [max])

  useEffect(() => {
    autoRef.current = setInterval(() => goTo((current + 1) % (max - 1)), 4500)
    return () => { if (autoRef.current) clearInterval(autoRef.current) }
  }, [current, goTo, max])

  function pauseAuto() { if (autoRef.current) clearInterval(autoRef.current) }
  function resumeAuto() {
    pauseAuto()
    autoRef.current = setInterval(() => goTo((current + 1) % (max - 1)), 4500)
  }

  // Touch support
  const touchStartX = useRef(0)

  return (
    <section className="carousel-section" id="properties">
      <div className="carousel-header">
        <div>
          <div className="section-label">{t.carLabel}</div>
          <h2 className="section-title" style={{ marginBottom: 0 }}>{t.carTitle}</h2>
        </div>
        <div className="carousel-nav">
          <button className="carousel-btn" onClick={() => goTo(current - 1)}>←</button>
          <button className="carousel-btn" onClick={() => goTo(current + 1)}>→</button>
        </div>
      </div>

      <div className="carousel-track-wrap">
        <div
          className="carousel-track"
          ref={trackRef}
          onMouseEnter={pauseAuto}
          onMouseLeave={resumeAuto}
          onTouchStart={e => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={e => {
            const dx = e.changedTouches[0].clientX - touchStartX.current
            if (Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1))
          }}
        >
          {PROPS.map((p, i) => (
            <div key={i} className="prop-card">
              <div className="prop-img">
                <Image src={p.img} alt={p.alt} fill sizes="(max-width: 768px) 100vw, 400px" style={{ objectFit: 'cover' }} />
                <div className="prop-tag">{p.tag}</div>
                <div className="prop-funded-bar">
                  <div className="prop-funded-bar-fill" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
              <div className="prop-body">
                <h3>{p.name}</h3>
                <div className="prop-city">{p.city}</div>
                <div className="prop-metrics">
                  <div className="prop-metric"><div className="val">{p.irr}</div><div className="lbl">{t.lblYield}</div></div>
                  <div className="prop-metric"><div className="val">{p.dist}</div><div className="lbl">{t.lblDist}</div></div>
                  <div className="prop-metric"><div className="val">{p.min}</div><div className="lbl">{t.lblMin}</div></div>
                </div>
                <div className="prop-progress-label">
                  <span>{t.lblFund}</span>
                  <span className="pct" style={p.full ? { color: '#6B7280' } : {}}>{p.pct}%</span>
                </div>
                <div className="prop-progress">
                  <div className="prop-progress-fill" style={{ width: `${p.pct}%`, ...(p.full ? { background: 'var(--muted)' } : {}) }} />
                </div>
                {p.full
                  ? <button className="prop-invest-btn full">{t.btnFull}</button>
                  : <Link href="/projets/chalok-villa" className="prop-invest-btn">{t.btnInvest}</Link>
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="carousel-dots">
        {PROPS.map((_, i) => (
          <button
            key={i}
            className={`carousel-dot${i === current ? ' active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2.5rem', paddingBottom: '.5rem' }}>
        <Link href="/projets" className="btn-gold" style={{ fontSize: '1rem', padding: '1rem 2.5rem' }}>
          {t.seeAll}
        </Link>
      </div>
    </section>
  )
}

/* ── Landing page ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { lang } = useLang()
  const t = T[lang]

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            {lang === 'fr' && <>L&apos;immobilier fractionné thaïlandais,<br />dès <PriceTicker lang={lang} /></>}
            {lang === 'en' && <>Thai fractional<br />real estate,<br />from <PriceTicker lang={lang} /></>}
            {lang === 'th' && <>อสังหาริมทรัพย์ไทย<br />แบ่งส่วน<br />เริ่มต้นที่ <PriceTicker lang={lang} /></>}
          </h1>
          <p>{t.heroP}</p>
          <div className="hero-actions">
            <Link href="/comment-ca-marche" className="btn-primary">{t.heroBtn1}</Link>
            <a href="#properties" className="btn-secondary">{t.heroBtn2}</a>
          </div>
          <p className="hero-tagline">{t.heroTagline}</p>
        </div>

        <div className="hero-visual">
          <div className="hero-card main">
            <div className="hero-card-badge">
              <div>
                <div className="prop-name">Nai Wok Jungle Villa</div>
                <div className="prop-loc">{t.heroCardLoc}</div>
              </div>
              <div className="prop-yield">9.8% net</div>
            </div>
          </div>
          <div className="hero-pill" style={{ top: '-1rem', right: '-1.5rem' }}>
            <span className="dot dot-green" /> {t.pill1Label}
          </div>
          <div className="hero-pill" style={{ top: '42%', left: '-2.5rem' }}>
            <span className="dot dot-gold" /> {t.pill2Label}
          </div>
        </div>
      </section>

      {/* Trust band */}
      <div className="trust-section">
        <div className="trust-item">
          <div className="num">7<span className="unit">%</span></div>
          <div className="desc">{t.t1desc}</div>
        </div>
        <div className="trust-item">
          <div className="num" style={{ fontSize: '1.5rem' }}>7–30<span className="unit"> ans</span></div>
          <div className="desc">{t.t2desc}</div>
        </div>
        <div className="trust-item">
          <div className="num" style={{ fontSize: '1.8rem' }}>500k<span className="unit"> THB</span></div>
          <div className="desc">{t.t3desc}</div>
        </div>
        <div className="trust-item">
          <div className="num">100<span className="unit">%</span></div>
          <div className="desc">{t.t4desc}</div>
        </div>
      </div>

      {/* Carousel */}
      <PropertyCarousel t={t} />
    </>
  )
}
