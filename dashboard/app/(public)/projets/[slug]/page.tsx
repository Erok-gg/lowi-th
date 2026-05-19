'use client'
import '../../projet-detail.css'
import { useLang } from '../../_components/LangContext'
import Link from 'next/link'
import Image from 'next/image'
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

// Only one real hardcoded project (démo)
const KNOWN_SLUGS = ['chalok-villa']

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
function dbPhotoUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/property-photos/${path}`
}

export default function ProjetDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string | null>(null)
  useEffect(() => { params.then(p => setSlug(p.slug)) }, [params])

  if (slug === null) return null
  if (/^prop_[A-Za-z0-9]+$/.test(slug)) return <DbProjetDetail publicId={slug} />
  if (KNOWN_SLUGS.includes(slug)) return <ChalokHardcoded />
  notFound()
}

function ChalokHardcoded() {
  const { lang } = useLang()
  const t = T[lang]
  const [activeImg, setActiveImg] = useState(0)

  return (
    <>
      {/* Hero */}
      <section className="pd-hero">
        <Image
          className="pd-hero-img"
          src={GALLERY_IMGS[0]}
          alt={t.title}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
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
              <Image
                src={GALLERY_IMGS[activeImg]}
                alt={`${t.title} — photo ${activeImg + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 720px"
                style={{ objectFit: 'cover' }}
              />
              <span className="pd-gallery-counter">{activeImg + 1} / {GALLERY_IMGS.length}</span>
            </div>
            <div className="pd-filmstrip">
              {GALLERY_IMGS.map((src, i) => (
                <Image
                  key={i}
                  src={src}
                  alt=""
                  width={90}
                  height={62}
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

// ─────────────────────────────────────────────────────────────────────────────
// DB-driven render : pour /projets/prop_xxxxxxxx
// Affiche uniquement les sections où l'admin a saisi des données.
// ─────────────────────────────────────────────────────────────────────────────

type DbPhoto = { id: string; storage_path: string; position: number | null; width: number | null; height: number | null }
type DbProperty = {
  id: string; public_id: string; title: string
  description: string | null
  property_type: string | null
  location_city: string | null
  location_country: string | null
  estimated_value_thb: number | null
  surface_sqm: number | null
  bedrooms: number | null
  bathrooms: number | null
  pool_type: string | null
  view_description: string | null
  amenities: string[] | null
  beach_access: string | null
  airport_access: string | null
  hospital_access: string | null
  irr_pct: number | null
  distribution_pct: number | null
  min_ticket_thb: number | null
  lease_years: number | null
  lease_remaining_years: number | null
  lease_expiry_year: number | null
  lease_type: string | null
  trustee_name: string | null
  arbitration_clause: string | null
  legal_note: string | null
  shares_total: number | null
  shares_sold: number | null
  funding_status: string | null
  investor_memo_url: string | null
  property_photos: DbPhoto[]
}

const DB_I18N = {
  fr: {
    bc: 'Projets',
    tagOpen: 'Ouvert', tagFull: 'Complet', tagSoon: 'Bientôt',
    statTri: 'TRI estimé', statDistrib: 'Distribution', statTicket: 'Ticket min.', statBail: 'Durée du bail', statParts: 'Parts disponibles',
    yrs: 'ans',
    descTitle: 'À propos du projet',
    sitTitle: 'Situation',
    charTitle: 'Caractéristiques',
    bedrooms: 'Chambres', bathrooms: 'Salles de bain', surface: 'Surface', pool: 'Piscine',
    pool_private: 'Privée', pool_shared: 'Partagée', pool_none: 'Aucune',
    amenitiesTitle: 'Équipements',
    leaseTitle: 'Structure juridique',
    leaseTypeLbl: 'Type de bail', leaseRemainingLbl: 'Durée restante', trusteeLbl: 'Trustee', arbitrationLbl: 'Arbitrage',
    priceLbl: 'Ticket minimum',
    fundLbl: 'financé',
    partsTotalLbl: 'Parts totales', partsAvailLbl: 'Disponibles', partsSoldLbl: 'Vendues',
    distribLbl: 'Distribution / an',
    ctaInvest: 'Réserver mes parts',
    ctaDl: '📄 Télécharger le mémo investisseur',
    disclaimer: 'Investissement à risque. Rendements passés non garantis. Documentation complète disponible avant souscription.',
    beachLbl: 'Accès plage', airportLbl: 'Aéroport', hospitalLbl: 'Hôpital', viewLbl: 'Vue', locationLbl: 'Localisation',
    expiryLbl: 'expire',
  },
  en: {
    bc: 'Projects',
    tagOpen: 'Open', tagFull: 'Full', tagSoon: 'Soon',
    statTri: 'Est. IRR', statDistrib: 'Distribution', statTicket: 'Min. ticket', statBail: 'Lease term', statParts: 'Shares available',
    yrs: 'yrs',
    descTitle: 'About the project',
    sitTitle: 'Location',
    charTitle: 'Characteristics',
    bedrooms: 'Bedrooms', bathrooms: 'Bathrooms', surface: 'Surface', pool: 'Pool',
    pool_private: 'Private', pool_shared: 'Shared', pool_none: 'None',
    amenitiesTitle: 'Amenities',
    leaseTitle: 'Legal structure',
    leaseTypeLbl: 'Lease type', leaseRemainingLbl: 'Remaining', trusteeLbl: 'Trustee', arbitrationLbl: 'Arbitration',
    priceLbl: 'Min. ticket',
    fundLbl: 'funded',
    partsTotalLbl: 'Total shares', partsAvailLbl: 'Available', partsSoldLbl: 'Sold',
    distribLbl: 'Distribution / yr',
    ctaInvest: 'Reserve my shares',
    ctaDl: '📄 Download investor memo',
    disclaimer: 'Investment carries risk. Past returns do not guarantee future ones. Full documentation provided before subscription.',
    beachLbl: 'Beach access', airportLbl: 'Airport', hospitalLbl: 'Hospital', viewLbl: 'View', locationLbl: 'Location',
    expiryLbl: 'expires',
  },
  th: {
    bc: 'โครงการ',
    tagOpen: 'เปิด', tagFull: 'เต็ม', tagSoon: 'เร็วๆ นี้',
    statTri: 'IRR ประมาณ', statDistrib: 'การจ่าย', statTicket: 'ขั้นต่ำ', statBail: 'ระยะเช่า', statParts: 'ส่วนที่มี',
    yrs: 'ปี',
    descTitle: 'เกี่ยวกับโครงการ',
    sitTitle: 'ที่ตั้ง',
    charTitle: 'คุณสมบัติ',
    bedrooms: 'ห้องนอน', bathrooms: 'ห้องน้ำ', surface: 'พื้นที่', pool: 'สระว่ายน้ำ',
    pool_private: 'ส่วนตัว', pool_shared: 'ส่วนกลาง', pool_none: 'ไม่มี',
    amenitiesTitle: 'สิ่งอำนวยความสะดวก',
    leaseTitle: 'โครงสร้างทางกฎหมาย',
    leaseTypeLbl: 'ประเภทเช่า', leaseRemainingLbl: 'เหลือ', trusteeLbl: 'ผู้ดูแล', arbitrationLbl: 'อนุญาโต',
    priceLbl: 'ขั้นต่ำ',
    fundLbl: 'ระดมทุนแล้ว',
    partsTotalLbl: 'รวมส่วน', partsAvailLbl: 'ว่าง', partsSoldLbl: 'ขาย',
    distribLbl: 'การจ่าย / ปี',
    ctaInvest: 'จองส่วนของฉัน',
    ctaDl: '📄 ดาวน์โหลดบันทึก',
    disclaimer: 'การลงทุนมีความเสี่ยง',
    beachLbl: 'ชายหาด', airportLbl: 'สนามบิน', hospitalLbl: 'โรงพยาบาล', viewLbl: 'วิว', locationLbl: 'ที่ตั้ง',
    expiryLbl: 'หมดอายุ',
  },
}

function fmtThbCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M฿`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)} K฿`
  return `${n} ฿`
}

function DbProjetDetail({ publicId }: { publicId: string }) {
  const { lang } = useLang()
  const t = DB_I18N[lang]
  const [data, setData] = useState<DbProperty | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    fetch(`/api/public/properties/${publicId}`)
      .then(r => r.ok ? r.json() : null)
      .then((p: DbProperty | null) => {
        setData(p && 'id' in p ? p : null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [publicId])

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>⏳</div>
  if (!data) notFound()

  const photos = (data.property_photos ?? []).map(p => dbPhotoUrl(p.storage_path))
  const heroImg = photos[0] ?? 'https://images.unsplash.com/photo-1582610116397-edb72278f033?w=1600&q=80'

  // Status badge mapping
  const statusBadge =
    data.funding_status === 'full' ? { cls: 'tag-full', label: t.tagFull } :
    data.funding_status === 'soon' ? { cls: 'tag-soon', label: t.tagSoon } :
    { cls: 'tag-open', label: t.tagOpen }

  const fundingPct = (data.shares_total && data.shares_total > 0 && data.shares_sold !== null)
    ? Math.round((data.shares_sold / data.shares_total) * 100)
    : null

  const partsAvail = (data.shares_total !== null && data.shares_sold !== null)
    ? data.shares_total - data.shares_sold : null

  const annualDistribThb = (data.min_ticket_thb && data.distribution_pct)
    ? Math.round(data.min_ticket_thb * (data.distribution_pct / 100))
    : null

  const loc = [data.location_city, data.location_country].filter(Boolean).join(', ') || '—'

  const hasSituation = data.beach_access || data.airport_access || data.hospital_access || data.view_description
  const hasChars = data.bedrooms !== null || data.bathrooms !== null || data.surface_sqm !== null || data.pool_type
  const hasAmenities = (data.amenities ?? []).length > 0
  const hasLease = data.lease_type || data.trustee_name || data.arbitration_clause || data.legal_note || data.lease_remaining_years !== null
  const hasStats = data.irr_pct !== null || data.distribution_pct !== null || data.min_ticket_thb !== null || data.lease_years !== null

  const poolLabel = data.pool_type === 'private' ? t.pool_private
    : data.pool_type === 'shared' ? t.pool_shared
    : data.pool_type === 'none' ? t.pool_none : null

  return (
    <>
      {/* Hero */}
      <section className="pd-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pd-hero-img" src={heroImg} alt={data.title} />
        <div className="pd-hero-overlay" />

        <nav className="pd-breadcrumb">
          <Link href="/">LOWI</Link>
          <span className="sep">›</span>
          <Link href="/projets">{t.bc}</Link>
          <span className="sep">›</span>
          <span>{data.title}</span>
        </nav>

        <div className="pd-hero-content">
          <div className="pd-hero-tags">
            <span className={`tag ${statusBadge.cls}`}>{statusBadge.label}</span>
            {data.property_type && <span className="tag tag-type">{data.property_type}</span>}
            {data.lease_years !== null && <span className="tag tag-bail">🔑 {data.lease_years} {t.yrs}</span>}
          </div>
          <h1 className="pd-hero-title">{data.title}</h1>
          <p className="pd-hero-loc">📍 {loc}</p>
        </div>
      </section>

      {/* Stats bar — visible si au moins une métrique */}
      {hasStats && (
        <div className="pd-stats-bar">
          <div className="pd-stats-inner">
            {data.irr_pct !== null && (
              <div className="stat-item">
                <span className="sv">{Number(data.irr_pct).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}<span className="su">%</span></span>
                <span className="sl">{t.statTri}</span>
              </div>
            )}
            {data.distribution_pct !== null && (
              <div className="stat-item">
                <span className="sv">{Number(data.distribution_pct).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}<span className="su">%/an</span></span>
                <span className="sl">{t.statDistrib}</span>
              </div>
            )}
            {data.min_ticket_thb !== null && (
              <div className="stat-item">
                <span className="sv">{data.min_ticket_thb.toLocaleString('fr-FR')}<span className="su"> THB</span></span>
                <span className="sl">{t.statTicket}</span>
              </div>
            )}
            {data.lease_years !== null && (
              <div className="stat-item">
                <span className="sv">{data.lease_years} {t.yrs}</span>
                <span className="sl">{t.statBail}</span>
              </div>
            )}
            {data.shares_total !== null && partsAvail !== null && (
              <div className="stat-item">
                <span className="sv" style={{ color: 'var(--white)' }}>
                  <span style={{ color: 'var(--gold)' }}>{partsAvail}</span>/{data.shares_total}
                </span>
                <span className="sl">{t.statParts}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main 2-col */}
      <div className="pd-main">
        {/* LEFT */}
        <div>
          {/* Gallery */}
          {photos.length > 0 && (
            <div className="pd-gallery">
              <div className="pd-gallery-main">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photos[activeImg]} alt={`${data.title} — photo ${activeImg + 1}`} />
                <span className="pd-gallery-counter">{activeImg + 1} / {photos.length}</span>
              </div>
              {photos.length > 1 && (
                <div className="pd-filmstrip">
                  {photos.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt="" className={`pd-thumb${i === activeImg ? ' active' : ''}`} onClick={() => setActiveImg(i)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {data.description && (
            <div className="sblock">
              <div className="sblock-title">
                <span className="sblock-ico teal-bg">🏡</span>
                {t.descTitle}
              </div>
              <div className="desc">
                {data.description.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </div>
          )}

          {/* Situation */}
          {hasSituation && (
            <div className="sblock">
              <div className="sblock-title">
                <span className="sblock-ico teal-bg">📍</span>
                {t.sitTitle}
              </div>
              <div className="sit-grid">
                <div className="sit-item">
                  <span className="sit-ico">📍</span>
                  <div><div className="sit-lbl">{t.locationLbl}</div><div className="sit-val">{loc}</div></div>
                </div>
                {data.beach_access && (
                  <div className="sit-item">
                    <span className="sit-ico">🏖️</span>
                    <div><div className="sit-lbl">{t.beachLbl}</div><div className="sit-val">{data.beach_access}</div></div>
                  </div>
                )}
                {data.airport_access && (
                  <div className="sit-item">
                    <span className="sit-ico">✈️</span>
                    <div><div className="sit-lbl">{t.airportLbl}</div><div className="sit-val">{data.airport_access}</div></div>
                  </div>
                )}
                {data.hospital_access && (
                  <div className="sit-item">
                    <span className="sit-ico">🏥</span>
                    <div><div className="sit-lbl">{t.hospitalLbl}</div><div className="sit-val">{data.hospital_access}</div></div>
                  </div>
                )}
                {data.view_description && (
                  <div className="sit-item">
                    <span className="sit-ico">🌅</span>
                    <div><div className="sit-lbl">{t.viewLbl}</div><div className="sit-val">{data.view_description}</div></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Characteristics */}
          {hasChars && (
            <div className="sblock">
              <div className="sblock-title">
                <span className="sblock-ico cream-bg">📐</span>
                {t.charTitle}
              </div>
              <div className="char-grid">
                {data.bedrooms !== null && (
                  <div className="char-item"><span className="char-ico">🛏️</span><span className="char-val">{data.bedrooms}</span><span className="char-lbl">{t.bedrooms}</span></div>
                )}
                {data.bathrooms !== null && (
                  <div className="char-item"><span className="char-ico">🛁</span><span className="char-val">{data.bathrooms}</span><span className="char-lbl">{t.bathrooms}</span></div>
                )}
                {data.surface_sqm !== null && (
                  <div className="char-item"><span className="char-ico">📐</span><span className="char-val">{data.surface_sqm} m²</span><span className="char-lbl">{t.surface}</span></div>
                )}
                {poolLabel && (
                  <div className="char-item"><span className="char-ico">🏊</span><span className="char-val">{poolLabel}</span><span className="char-lbl">{t.pool}</span></div>
                )}
              </div>
            </div>
          )}

          {/* Amenities */}
          {hasAmenities && (
            <div className="sblock">
              <div className="sblock-title">
                <span className="sblock-ico teal-bg">✅</span>
                {t.amenitiesTitle}
              </div>
              <div className="amenities-grid">
                {(data.amenities ?? []).map((a, i) => (
                  <div key={i} className="am-item"><span className="am-check">✓</span>{a}</div>
                ))}
              </div>
            </div>
          )}

          {/* Lease */}
          {hasLease && (
            <div className="sblock">
              <div className="sblock-title">
                <span className="sblock-ico gold-bg">⚖️</span>
                {t.leaseTitle}
              </div>
              <div className="lease-grid">
                {data.lease_type && (
                  <div className="lease-item"><div className="lease-lbl">{t.leaseTypeLbl}</div><div className="lease-val">{data.lease_type}</div></div>
                )}
                {data.lease_remaining_years !== null && (
                  <div className="lease-item">
                    <div className="lease-lbl">{t.leaseRemainingLbl}</div>
                    <div className="lease-val">{data.lease_remaining_years} {t.yrs}{data.lease_expiry_year ? ` (${t.expiryLbl} ${data.lease_expiry_year})` : ''}</div>
                  </div>
                )}
                {data.trustee_name && (
                  <div className="lease-item"><div className="lease-lbl">{t.trusteeLbl}</div><div className="lease-val">{data.trustee_name}</div></div>
                )}
                {data.arbitration_clause && (
                  <div className="lease-item"><div className="lease-lbl">{t.arbitrationLbl}</div><div className="lease-val">{data.arbitration_clause}</div></div>
                )}
              </div>
              {data.legal_note && (
                <div className="lease-note">{data.legal_note}</div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — invest card */}
        <div>
          <div className="invest-card">
            <div className="ic-header">
              <div>
                <div className="ic-price-lbl">{t.priceLbl}</div>
                <div className="ic-price-thb">{data.min_ticket_thb ? fmtThbCompact(data.min_ticket_thb) : '—'}</div>
              </div>
              <div className="ic-status-col">
                <span className={`ic-badge-${data.funding_status ?? 'open'}`}>{statusBadge.label}</span>
                {fundingPct !== null && <span className="ic-pct">{fundingPct}% {t.fundLbl}</span>}
              </div>
            </div>

            {fundingPct !== null && (
              <div className="ic-progress">
                <div className="ic-progress-bar">
                  <div className="ic-progress-fill" style={{ width: `${fundingPct}%` }} />
                </div>
                <div className="ic-progress-labels">
                  <span>0%</span>
                  <span>{fundingPct}% {t.fundLbl}</span>
                  <span>100%</span>
                </div>
              </div>
            )}

            {data.shares_total !== null && partsAvail !== null && data.shares_sold !== null && (
              <div className="ic-parts">
                <div className="ic-part-stat">
                  <div className="ips-val">{data.shares_total}</div>
                  <div className="ips-lbl">{t.partsTotalLbl}</div>
                </div>
                <div className="ic-part-stat">
                  <div className="ips-val avail">{partsAvail}</div>
                  <div className="ips-lbl">{t.partsAvailLbl}</div>
                </div>
                <div className="ic-part-stat">
                  <div className="ips-val">{data.shares_sold}</div>
                  <div className="ips-lbl">{t.partsSoldLbl}</div>
                </div>
              </div>
            )}

            {(data.distribution_pct !== null && annualDistribThb !== null) && (
              <div className="ic-unit-row">
                <div className="ic-unit-block">
                  <div className="iub-lbl">{t.distribLbl}</div>
                  <div className="iub-val teal">{annualDistribThb.toLocaleString('fr-FR')} THB</div>
                  <div className="iub-sub">{Number(data.distribution_pct).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %</div>
                </div>
              </div>
            )}

            <div className="ic-ctas">
              <Link
                href={`/invest/login?redirect=${encodeURIComponent(`/projets/${data.public_id}`)}`}
                className="btn-invest-primary"
              >
                {t.ctaInvest}
              </Link>
              {data.investor_memo_url && (
                <a
                  href={data.investor_memo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-invest-secondary"
                >
                  {t.ctaDl}
                </a>
              )}
            </div>

            <div className="ic-disclaimer">{t.disclaimer}</div>
          </div>
        </div>
      </div>
    </>
  )
}
