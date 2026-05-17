'use client'
import '../../projet-detail.css'
import { useLang } from '../../_components/LangContext'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'

const GALLERY_IMGS = [
  'https://images.unsplash.com/photo-1582610116397-edb72278f033?w=900&q=80',
  'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=900&q=80',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80',
  'https://images.unsplash.com/photo-1613553507747-5f8d62ad5904?w=900&q=80',
]

const T = {
  fr: {
    bc: 'Projets',
    tagOpen: 'Ouvert', tagType: 'Villa', tagBail: 'Bail 20 ans',
    title: 'Chalok Baan Kao Pool Villa',
    loc: 'Chalok Baan Kao, Ko Phangan, Thaïlande',
    statTri: 'TRI estimé', statDistrib: 'Distribution', statTicket: 'Ticket min.', statBail: 'Durée du bail', statParts: 'Parts disponibles',
    bail: '20 ans', partsTotal: '100', partsAvail: '44', partsSold: '56',
    descTitle: 'À propos du projet',
    desc1: "La Chalok Baan Kao Pool Villa est une villa 3 chambres entièrement rénovée, dotée d'une piscine à débordement privée, nichée dans les hauteurs de Chalok Baan Kao sur l'île de Ko Phangan. Avec une vue dégagée sur le golfe de Thaïlande et un accès direct à la plage en 8 minutes à pied, ce bien présente un historique locatif solide auprès d'une clientèle internationale haut de gamme.",
    desc2: "Le bail emphytéotique de 20 ans, enregistré au Land Department thaïlandais, est détenu par une société trustee internationale pour le compte des investisseurs. Les revenus locatifs sont collectés trimestriellement et redistribués proportionnellement aux parts détenues.",
    sitTitle: 'Situation',
    sits: [
      { ico: '📍', lbl: 'Localisation', val: 'Chalok Baan Kao, Ko Phangan' },
      { ico: '🏖️', lbl: 'Accès plage', val: '8 min à pied' },
      { ico: '✈️', lbl: 'Aéroport', val: 'Koh Samui (USM) — 45 min ferry' },
      { ico: '🏥', lbl: 'Hôpital', val: 'Bangkok Hospital Samui — 55 min' },
    ],
    charTitle: 'Caractéristiques',
    chars: [
      { ico: '🛏️', val: '3', lbl: 'Chambres' },
      { ico: '🛁', val: '3', lbl: 'Salles de bain' },
      { ico: '📐', val: '320 m²', lbl: 'Surface' },
      { ico: '🏊', val: 'Privée', lbl: 'Piscine' },
    ],
    amenitiesTitle: 'Équipements',
    amenities: [
      'Piscine à débordement', 'Vue mer panoramique', 'Cuisine équipée',
      'Climatisation', 'WiFi fibre', 'Parking couvert',
      'Terrasse extérieure', 'Jardin tropical', 'Sécurité 24h/24',
    ],
    leaseTitle: 'Structure juridique',
    leases: [
      { lbl: 'Type de bail', val: 'Emphytéotique enregistré' },
      { lbl: 'Durée restante', val: '20 ans (exp. 2045)' },
      { lbl: 'Trustee', val: 'Société internationale' },
      { lbl: 'Arbitrage', val: 'Convention de New York' },
    ],
    leaseNote: '<strong>Protection juridique :</strong> Le bail est enregistré au Land Department thaïlandais. La clause d\'arbitrage international est exécutoire en Thaïlande sous la Convention de New York. Vos droits sont opposables.',
    priceLbl: 'Ticket minimum',
    priceThb: '500 000 THB',
    priceEur: '≈ 13 200 €',
    statusOpen: 'Ouvert',
    fundPct: '56%',
    fundLbl: 'financé',
    partsTotalLbl: 'Parts totales',
    partsAvailLbl: 'Disponibles',
    partsSoldLbl: 'Vendues',
    perPartLbl: 'Par part',
    perPartVal: '500 000 THB',
    perPartSub: '≈ 13 200 €',
    distribLbl: 'Distribution / an',
    distribVal: '37 500 THB',
    distribSub: '7,5 % · versé en THB/trimestre',
    ctaInvest: 'Réserver mes parts',
    ctaDl: '📄 Télécharger le mémo investisseur',
    disclaimer: 'Investissement à risque. Rendements passés non garantis. Documentation complète disponible avant souscription.',
  },
  en: {
    bc: 'Projects',
    tagOpen: 'Open', tagType: 'Villa', tagBail: '20-year lease',
    title: 'Chalok Baan Kao Pool Villa',
    loc: 'Chalok Baan Kao, Ko Phangan, Thailand',
    statTri: 'Est. IRR', statDistrib: 'Distribution', statTicket: 'Min. ticket', statBail: 'Lease term', statParts: 'Shares available',
    bail: '20 years', partsTotal: '100', partsAvail: '44', partsSold: '56',
    descTitle: 'About the project',
    desc1: 'The Chalok Baan Kao Pool Villa is a fully renovated 3-bedroom villa with a private infinity pool, nestled in the hills of Chalok Baan Kao on Ko Phangan island. With unobstructed views of the Gulf of Thailand and beach access 8 minutes on foot, this property has a strong rental history with an international high-end clientele.',
    desc2: 'The 20-year emphyteutic lease, registered at the Thai Land Department, is held by an international trustee company on behalf of investors. Rental income is collected quarterly and redistributed proportionally to shares held.',
    sitTitle: 'Location',
    sits: [
      { ico: '📍', lbl: 'Location', val: 'Chalok Baan Kao, Ko Phangan' },
      { ico: '🏖️', lbl: 'Beach access', val: '8 min walk' },
      { ico: '✈️', lbl: 'Airport', val: 'Koh Samui (USM) — 45 min ferry' },
      { ico: '🏥', lbl: 'Hospital', val: 'Bangkok Hospital Samui — 55 min' },
    ],
    charTitle: 'Characteristics',
    chars: [
      { ico: '🛏️', val: '3', lbl: 'Bedrooms' },
      { ico: '🛁', val: '3', lbl: 'Bathrooms' },
      { ico: '📐', val: '320 m²', lbl: 'Surface' },
      { ico: '🏊', val: 'Private', lbl: 'Pool' },
    ],
    amenitiesTitle: 'Amenities',
    amenities: [
      'Infinity pool', 'Panoramic sea view', 'Equipped kitchen',
      'Air conditioning', 'Fibre WiFi', 'Covered parking',
      'Outdoor terrace', 'Tropical garden', '24/7 security',
    ],
    leaseTitle: 'Legal structure',
    leases: [
      { lbl: 'Lease type', val: 'Registered emphyteutic lease' },
      { lbl: 'Remaining term', val: '20 years (exp. 2045)' },
      { lbl: 'Trustee', val: 'International company' },
      { lbl: 'Arbitration', val: 'New York Convention' },
    ],
    leaseNote: '<strong>Legal protection:</strong> The lease is registered at the Thai Land Department. The international arbitration clause is enforceable in Thailand under the New York Convention. Your rights are legally binding.',
    priceLbl: 'Minimum ticket',
    priceThb: '500,000 THB',
    priceEur: '≈ €13,200',
    statusOpen: 'Open',
    fundPct: '56%',
    fundLbl: 'funded',
    partsTotalLbl: 'Total shares',
    partsAvailLbl: 'Available',
    partsSoldLbl: 'Sold',
    perPartLbl: 'Per share',
    perPartVal: '500,000 THB',
    perPartSub: '≈ €13,200',
    distribLbl: 'Distribution / year',
    distribVal: '37,500 THB',
    distribSub: '7.5% · paid in THB/quarter',
    ctaInvest: 'Reserve my shares',
    ctaDl: '📄 Download investor memo',
    disclaimer: 'Risk investment. Past returns not guaranteed. Full documentation available before subscription.',
  },
  th: {
    bc: 'โครงการ',
    tagOpen: 'เปิด', tagType: 'วิลล่า', tagBail: 'สัญญา 20 ปี',
    title: 'Chalok Baan Kao Pool Villa',
    loc: 'Chalok Baan Kao, เกาะพะงัน, ไทย',
    statTri: 'IRR ประมาณ', statDistrib: 'การจ่าย', statTicket: 'ตั๋วขั้นต่ำ', statBail: 'ระยะสัญญา', statParts: 'ส่วนที่มีอยู่',
    bail: '20 ปี', partsTotal: '100', partsAvail: '44', partsSold: '56',
    descTitle: 'เกี่ยวกับโครงการ',
    desc1: 'Chalok Baan Kao Pool Villa คือวิลล่า 3 ห้องนอนที่ปรับปรุงใหม่ พร้อมสระว่ายน้ำอินฟินิตี้ส่วนตัว ตั้งอยู่บนเนินเขาของ Chalok Baan Kao บนเกาะพะงัน มีวิวอ่าวไทยไม่มีสิ่งกีดขวาง และเดินไปชายหาดได้ใน 8 นาที',
    desc2: 'สัญญาเช่า 20 ปีที่จดทะเบียนกับกรมที่ดินไทย ถือครองโดยบริษัทผู้ดูแลระหว่างประเทศแทนนักลงทุน รายได้ค่าเช่าเก็บรายไตรมาสและแจกจ่ายตามสัดส่วน',
    sitTitle: 'ที่ตั้ง',
    sits: [
      { ico: '📍', lbl: 'ที่ตั้ง', val: 'Chalok Baan Kao, เกาะพะงัน' },
      { ico: '🏖️', lbl: 'ชายหาด', val: 'เดิน 8 นาที' },
      { ico: '✈️', lbl: 'สนามบิน', val: 'เกาะสมุย (USM) — เรือเฟอร์รี่ 45 นาที' },
      { ico: '🏥', lbl: 'โรงพยาบาล', val: 'Bangkok Hospital Samui — 55 นาที' },
    ],
    charTitle: 'ลักษณะทั่วไป',
    chars: [
      { ico: '🛏️', val: '3', lbl: 'ห้องนอน' },
      { ico: '🛁', val: '3', lbl: 'ห้องน้ำ' },
      { ico: '📐', val: '320 ม²', lbl: 'พื้นที่' },
      { ico: '🏊', val: 'ส่วนตัว', lbl: 'สระว่ายน้ำ' },
    ],
    amenitiesTitle: 'สิ่งอำนวยความสะดวก',
    amenities: [
      'สระว่ายน้ำอินฟินิตี้', 'วิวทะเลพาโนรามา', 'ครัวครบครัน',
      'เครื่องปรับอากาศ', 'WiFi ไฟเบอร์', 'ที่จอดรถมีหลังคา',
      'ระเบียงกลางแจ้ง', 'สวนเขตร้อน', 'รักษาความปลอดภัย 24 ชม.',
    ],
    leaseTitle: 'โครงสร้างทางกฎหมาย',
    leases: [
      { lbl: 'ประเภทสัญญา', val: 'สัญญาเช่าระยะยาวจดทะเบียน' },
      { lbl: 'ระยะเวลาเหลือ', val: '20 ปี (หมดอายุ 2045)' },
      { lbl: 'ผู้ดูแล', val: 'บริษัทระหว่างประเทศ' },
      { lbl: 'อนุญาโตตุลาการ', val: 'อนุสัญญานิวยอร์ก' },
    ],
    leaseNote: '<strong>การคุ้มครองทางกฎหมาย:</strong> สัญญาเช่าจดทะเบียนกับกรมที่ดินไทย ข้อกำหนดอนุญาโตตุลาการระหว่างประเทศบังคับใช้ได้ในประเทศไทย',
    priceLbl: 'ตั๋วขั้นต่ำ',
    priceThb: '500,000 THB',
    priceEur: '≈ €13,200',
    statusOpen: 'เปิด',
    fundPct: '56%',
    fundLbl: 'ได้รับทุน',
    partsTotalLbl: 'ส่วนทั้งหมด',
    partsAvailLbl: 'ว่าง',
    partsSoldLbl: 'ขายแล้ว',
    perPartLbl: 'ต่อส่วน',
    perPartVal: '500,000 THB',
    perPartSub: '≈ €13,200',
    distribLbl: 'การจ่าย / ปี',
    distribVal: '37,500 THB',
    distribSub: '7.5% · จ่ายเป็น THB/ไตรมาส',
    ctaInvest: 'จองส่วนของฉัน',
    ctaDl: '📄 ดาวน์โหลดบันทึกนักลงทุน',
    disclaimer: 'การลงทุนมีความเสี่ยง ผลตอบแทนในอดีตไม่รับประกัน เอกสารครบถ้วนก่อนสมัคร',
  },
}

// Only one real project for now
const KNOWN_SLUGS = ['chalok-villa']

export default function ProjetDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { lang } = useLang()
  const t = T[lang]
  const [activeImg, setActiveImg] = useState(0)
  const [slug, setSlug] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    params.then(p => { setSlug(p.slug); setReady(true) })
  }, [params])

  if (!ready) return null
  if (!KNOWN_SLUGS.includes(slug!)) notFound()

  return (
    <>
      {/* Hero */}
      <section className="pd-hero">
        <img
          className="pd-hero-img"
          src={GALLERY_IMGS[0]}
          alt={t.title}
        />
        <div className="pd-hero-overlay" />

        <nav className="pd-breadcrumb">
          <Link href="/">LOWI</Link>
          <span className="sep">›</span>
          <Link href="/projets">{t.bc}</Link>
          <span className="sep">›</span>
          <span>{t.title}</span>
        </nav>

        <div className="pd-hero-content">
          <div className="pd-hero-tags">
            <span className="tag tag-open">{t.tagOpen}</span>
            <span className="tag tag-type">{t.tagType}</span>
            <span className="tag tag-bail">🔑 {t.tagBail}</span>
          </div>
          <h1 className="pd-hero-title">{t.title}</h1>
          <p className="pd-hero-loc">📍 {t.loc}</p>
        </div>
      </section>

      {/* Stats bar */}
      <div className="pd-stats-bar">
        <div className="pd-stats-inner">
          <div className="stat-item">
            <span className="sv">11,2<span className="su">%</span></span>
            <span className="sl">{t.statTri}</span>
          </div>
          <div className="stat-item">
            <span className="sv">7,5<span className="su">%/an</span></span>
            <span className="sl">{t.statDistrib}</span>
          </div>
          <div className="stat-item">
            <span className="sv">500 000<span className="su"> THB</span></span>
            <span className="sl">{t.statTicket}</span>
          </div>
          <div className="stat-item">
            <span className="sv">{t.bail}</span>
            <span className="sl">{t.statBail}</span>
          </div>
          <div className="stat-item">
            <span className="sv" style={{ color: 'var(--white)' }}>
              <span style={{ color: 'var(--gold)' }}>{t.partsAvail}</span>/{t.partsTotal}
            </span>
            <span className="sl">{t.statParts}</span>
          </div>
        </div>
      </div>

      {/* Main 2-col */}
      <div className="pd-main">
        {/* LEFT */}
        <div>
          {/* Gallery */}
          <div className="pd-gallery">
            <div className="pd-gallery-main">
              <img
                src={GALLERY_IMGS[activeImg]}
                alt={`${t.title} — photo ${activeImg + 1}`}
              />
              <span className="pd-gallery-counter">{activeImg + 1} / {GALLERY_IMGS.length}</span>
            </div>
            <div className="pd-filmstrip">
              {GALLERY_IMGS.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className={`pd-thumb${i === activeImg ? ' active' : ''}`}
                  onClick={() => setActiveImg(i)}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="sblock">
            <div className="sblock-title">
              <span className="sblock-ico teal-bg">🏡</span>
              {t.descTitle}
            </div>
            <div className="desc">
              <p>{t.desc1}</p>
              <p>{t.desc2}</p>
            </div>
          </div>

          {/* Situation */}
          <div className="sblock">
            <div className="sblock-title">
              <span className="sblock-ico teal-bg">📍</span>
              {t.sitTitle}
            </div>
            <div className="sit-grid">
              {t.sits.map((s, i) => (
                <div key={i} className="sit-item">
                  <span className="sit-ico">{s.ico}</span>
                  <div>
                    <div className="sit-lbl">{s.lbl}</div>
                    <div className="sit-val">{s.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Characteristics */}
          <div className="sblock">
            <div className="sblock-title">
              <span className="sblock-ico cream-bg">📐</span>
              {t.charTitle}
            </div>
            <div className="char-grid">
              {t.chars.map((c, i) => (
                <div key={i} className="char-item">
                  <span className="char-ico">{c.ico}</span>
                  <span className="char-val">{c.val}</span>
                  <span className="char-lbl">{c.lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="sblock">
            <div className="sblock-title">
              <span className="sblock-ico teal-bg">✅</span>
              {t.amenitiesTitle}
            </div>
            <div className="amenities-grid">
              {t.amenities.map((a, i) => (
                <div key={i} className="am-item">
                  <span className="am-check">✓</span>
                  {a}
                </div>
              ))}
            </div>
          </div>

          {/* Leasehold */}
          <div className="sblock">
            <div className="sblock-title">
              <span className="sblock-ico gold-bg">⚖️</span>
              {t.leaseTitle}
            </div>
            <div className="lease-grid">
              {t.leases.map((l, i) => (
                <div key={i} className="lease-item">
                  <div className="lease-lbl">{l.lbl}</div>
                  <div className="lease-val">{l.val}</div>
                </div>
              ))}
            </div>
            <div
              className="lease-note"
              dangerouslySetInnerHTML={{ __html: t.leaseNote }}
            />
          </div>
        </div>

        {/* RIGHT — invest card */}
        <div>
          <div className="invest-card">
            <div className="ic-header">
              <div>
                <div className="ic-price-lbl">{t.priceLbl}</div>
                <div className="ic-price-thb">{t.priceThb}</div>
                <div className="ic-price-eur">{t.priceEur}</div>
              </div>
              <div className="ic-status-col">
                <span className="ic-badge-open">{t.statusOpen}</span>
                <span className="ic-pct">{t.fundPct} {t.fundLbl}</span>
              </div>
            </div>

            <div className="ic-progress">
              <div className="ic-progress-bar">
                <div className="ic-progress-fill" style={{ width: '56%' }} />
              </div>
              <div className="ic-progress-labels">
                <span>0%</span>
                <span>56% financé</span>
                <span>100%</span>
              </div>
            </div>

            <div className="ic-parts">
              <div className="ic-part-stat">
                <div className="ips-val">{t.partsTotal}</div>
                <div className="ips-lbl">{t.partsTotalLbl}</div>
              </div>
              <div className="ic-part-stat">
                <div className="ips-val avail">{t.partsAvail}</div>
                <div className="ips-lbl">{t.partsAvailLbl}</div>
              </div>
              <div className="ic-part-stat">
                <div className="ips-val">{t.partsSold}</div>
                <div className="ips-lbl">{t.partsSoldLbl}</div>
              </div>
            </div>

            <div className="ic-unit-row">
              <div className="ic-unit-block">
                <div className="iub-lbl">{t.perPartLbl}</div>
                <div className="iub-val">{t.perPartVal}</div>
                <div className="iub-sub">{t.perPartSub}</div>
              </div>
              <div className="ic-unit-block">
                <div className="iub-lbl">{t.distribLbl}</div>
                <div className="iub-val teal">{t.distribVal}</div>
                <div className="iub-sub">{t.distribSub}</div>
              </div>
            </div>

            <div className="ic-ctas">
              <Link
                href="/invest/login?redirect=/projets/chalok-villa"
                className="btn-invest-primary"
              >
                {t.ctaInvest}
              </Link>
              <Link
                href="/invest/login?redirect=/projets/chalok-villa"
                className="btn-invest-secondary"
              >
                {t.ctaDl}
              </Link>
            </div>

            <div className="ic-disclaimer">{t.disclaimer}</div>
          </div>
        </div>
      </div>
    </>
  )
}
