'use client'
import '../projets.css'
import { useLang } from '../_components/LangContext'
import Link from 'next/link'
import { useState, useMemo } from 'react'

type ProjectStatus = 'open' | 'full' | 'soon'

interface Project {
  id: number
  name: string
  type: string
  loc: string
  city: string
  img: string
  tri: number
  distrib: number
  ticket: number
  bail: number
  funding: number
  status: ProjectStatus
  slug?: string
}

const PROJECTS: Project[] = [
  { id: 1,  name: 'Nai Wok Jungle Villa',        type: 'villa',          loc: 'ko-phangan', city: 'Nai Wok, Ko Phangan',         img: 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=600&q=80',    tri: 12.1, distrib: 8.0, ticket: 500000,  bail: 28, funding: 87,  status: 'open' },
  { id: 2,  name: 'Haad Yao Beach Bungalows',    type: 'bungalow',       loc: 'ko-phangan', city: 'Haad Yao, Ko Phangan',         img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80',    tri: 11.5, distrib: 7.5, ticket: 750000,  bail: 25, funding: 62,  status: 'open' },
  { id: 3,  name: 'Srithanu Digital Nest',        type: 'co-living',      loc: 'ko-phangan', city: 'Srithanu, Ko Phangan',         img: '/img/fazwaz/22_497459229-122100024890872966-6608606544588209344-n.jpg',    tri: 13.2, distrib: 8.5, ticket: 500000,  bail: 26, funding: 55,  status: 'open' },
  { id: 4,  name: 'Thong Sala Eco-Resort',        type: 'eco-resort',     loc: 'ko-phangan', city: 'Thong Sala, Ko Phangan',       img: '/img/fazwaz/58_cover-image.jpg',                                              tri: 11.8, distrib: 7.8, ticket: 500000,  bail: 22, funding: 38,  status: 'open' },
  { id: 5,  name: 'Haad Rin Sunrise Villa',       type: 'villa',          loc: 'ko-phangan', city: 'Haad Rin, Ko Phangan',         img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80',    tri: 10.8, distrib: 7.2, ticket: 1000000, bail: 30, funding: 100, status: 'full' },
  { id: 6,  name: 'Ban Tai Pool Villa',           type: 'villa',          loc: 'ko-phangan', city: 'Ban Tai, Ko Phangan',          img: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&q=80',    tri: 10.5, distrib: 7.0, ticket: 1500000, bail: 29, funding: 72,  status: 'open' },
  { id: 7,  name: 'Bottle Beach Bungalows',       type: 'bungalow',       loc: 'ko-phangan', city: 'Bottle Beach, Ko Phangan',     img: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&q=80',    tri: 12.8, distrib: 8.3, ticket: 500000,  bail: 24, funding: 18,  status: 'open' },
  { id: 8,  name: 'Chaloklum Bay Villa',          type: 'villa',          loc: 'ko-phangan', city: 'Chaloklum, Ko Phangan',        img: '/img/fazwaz/17_koh-phangan-luxury-villa-4-bed-sea-view-haad-salad-30252.jpg', tri: 11.2, distrib: 7.5, ticket: 2000000, bail: 27, funding: 0,   status: 'soon' },
  { id: 9,  name: 'Mae Haad Oceanfront Villa',    type: 'villa',          loc: 'ko-phangan', city: 'Mae Haad, Ko Phangan',         img: 'https://images.unsplash.com/photo-1613553507747-5f8d62ad5904?w=600&q=80',    tri: 11.0, distrib: 7.3, ticket: 750000,  bail: 28, funding: 45,  status: 'open' },
  { id: 10, name: 'Srithanu Wellness Retreat',    type: 'eco-resort',     loc: 'ko-phangan', city: 'Srithanu, Ko Phangan',         img: '/img/fazwaz/05_img-20251001-wa0032.jpg',                                      tri: 10.2, distrib: 6.8, ticket: 1000000, bail: 25, funding: 0,   status: 'soon' },
  { id: 11, name: 'Baan Tai Hillside Villa',      type: 'villa',          loc: 'ko-phangan', city: 'Baan Tai, Ko Phangan',         img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',    tri: 11.9, distrib: 7.9, ticket: 750000,  bail: 26, funding: 33,  status: 'open' },
  { id: 12, name: 'Ao Plaay Condo',               type: 'condo',          loc: 'ko-phangan', city: 'Thong Sala, Ko Phangan',       img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',    tri: 10.6, distrib: 7.1, ticket: 500000,  bail: 24, funding: 61,  status: 'open' },
  { id: 13, name: 'Lamai Seaview Villa',          type: 'villa',          loc: 'koh-samui',  city: 'Lamai, Koh Samui',            img: 'https://images.unsplash.com/photo-1559599746-8823b46ded1f?w=600&q=80',    tri: 9.8,  distrib: 6.5, ticket: 1000000, bail: 30, funding: 100, status: 'full' },
  { id: 14, name: 'Chaweng Beach Condo',          type: 'condo',          loc: 'koh-samui',  city: 'Chaweng, Koh Samui',          img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',    tri: 10.5, distrib: 7.0, ticket: 500000,  bail: 28, funding: 67,  status: 'open' },
  { id: 15, name: 'Bophut Heritage Villa',        type: 'villa',          loc: 'koh-samui',  city: 'Bophut, Koh Samui',           img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80',    tri: 9.5,  distrib: 6.3, ticket: 2000000, bail: 29, funding: 81,  status: 'open' },
  { id: 16, name: 'Maenam Yoga Retreat',          type: 'eco-resort',     loc: 'koh-samui',  city: 'Maenam, Koh Samui',           img: '/img/fazwaz/53_dsc7053.jpg',                                                  tri: 10.8, distrib: 7.2, ticket: 750000,  bail: 23, funding: 34,  status: 'open' },
  { id: 17, name: 'Nathon Hillside Villa',        type: 'villa',          loc: 'koh-samui',  city: 'Nathon, Koh Samui',           img: '/img/fazwaz/48_tbr5713-luminarneo-edit.jpg',                                  tri: 11.2, distrib: 7.4, ticket: 500000,  bail: 26, funding: 22,  status: 'open' },
  { id: 18, name: 'Taling Ngam Pool Villa',       type: 'villa',          loc: 'koh-samui',  city: 'Taling Ngam, Koh Samui',      img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',    tri: 9.2,  distrib: 6.1, ticket: 1500000, bail: 27, funding: 91,  status: 'open' },
  { id: 19, name: 'Bang Por Beachfront Villa',    type: 'villa',          loc: 'koh-samui',  city: 'Bang Por, Koh Samui',          img: '/img/fazwaz/33_img-20250219-wa0023_1.jpg',                                    tri: 10.0, distrib: 6.7, ticket: 750000,  bail: 28, funding: 48,  status: 'open' },
  { id: 20, name: 'Samui Azure Villas',           type: 'villa',          loc: 'koh-samui',  city: 'Chaweng, Koh Samui',          img: '/img/fazwaz/27_130728345-210423494135482-4966638142273167273-n.jpg',          tri: 11.5, distrib: 7.5, ticket: 750000,  bail: 25, funding: 62,  status: 'open' },
  { id: 21, name: 'Choeng Mon Bungalows',         type: 'bungalow',       loc: 'koh-samui',  city: 'Choeng Mon, Koh Samui',        img: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80',    tri: 10.3, distrib: 6.9, ticket: 500000,  bail: 22, funding: 29,  status: 'open' },
  { id: 22, name: 'Rawai Pool Villa',             type: 'villa',          loc: 'phuket',     city: 'Rawai, Phuket',               img: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80',    tri: 10.2, distrib: 6.8, ticket: 750000,  bail: 29, funding: 55,  status: 'open' },
  { id: 23, name: 'Kata Beach Condo',             type: 'condo',          loc: 'phuket',     city: 'Kata, Phuket',                img: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80',    tri: 11.8, distrib: 7.8, ticket: 500000,  bail: 26, funding: 73,  status: 'open' },
  { id: 24, name: 'Patong Heights Villa',         type: 'villa',          loc: 'phuket',     city: 'Patong, Phuket',              img: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=600&q=80',    tri: 9.0,  distrib: 6.0, ticket: 2000000, bail: 28, funding: 88,  status: 'open' },
  { id: 25, name: 'Chalong Bay Bungalows',        type: 'bungalow',       loc: 'phuket',     city: 'Chalong, Phuket',             img: 'https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?w=600&q=80',    tri: 12.2, distrib: 8.1, ticket: 500000,  bail: 23, funding: 31,  status: 'open' },
  { id: 26, name: 'Nai Harn Nature Retreat',      type: 'eco-resort',     loc: 'phuket',     city: 'Nai Harn, Phuket',            img: '/img/fazwaz/10_photo-2024-02-14-01-45-01.jpg',                                tri: 10.5, distrib: 7.0, ticket: 1000000, bail: 25, funding: 0,   status: 'soon' },
  { id: 27, name: 'Kamala Beachfront Condo',      type: 'condo',          loc: 'phuket',     city: 'Kamala, Phuket',              img: 'https://images.unsplash.com/photo-1560185127-6ed189af22c4?w=600&q=80',    tri: 11.0, distrib: 7.3, ticket: 750000,  bail: 27, funding: 44,  status: 'open' },
  { id: 28, name: 'Cape Yamu Luxury Villa',       type: 'villa',          loc: 'phuket',     city: 'Cape Yamu, Phuket',           img: 'https://images.unsplash.com/photo-1596386461350-326ccb383e9f?w=600&q=80',    tri: 8.8,  distrib: 5.8, ticket: 3000000, bail: 30, funding: 19,  status: 'open' },
  { id: 29, name: 'Surin Beach Residences',       type: 'condo',          loc: 'phuket',     city: 'Surin, Phuket',               img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',    tri: 10.8, distrib: 7.1, ticket: 500000,  bail: 26, funding: 52,  status: 'open' },
  { id: 30, name: 'Layan Forest Villas',          type: 'villa',          loc: 'phuket',     city: 'Layan, Phuket',               img: '/img/fazwaz/38_front.jpeg',                                                   tri: 9.5,  distrib: 6.3, ticket: 1500000, bail: 28, funding: 0,   status: 'soon' },
  { id: 31, name: 'Chalok Baan Kao Pool Villa',   type: 'villa',          loc: 'ko-phangan', city: 'Chalok Baan Kao, Ko Phangan', img: 'https://images.unsplash.com/photo-1582610116397-edb72278f033?w=600&q=80',    tri: 11.2, distrib: 7.5, ticket: 500000,  bail: 20, funding: 56,  status: 'open', slug: 'chalok-villa' },
]

const PER_PAGE = 25

const I18N = {
  fr: {
    heroTitle1: 'Tous les', heroTitle2: 'projets',
    heroSub: "Explorez l'ensemble des baux emphytéotiques disponibles à travers la Thaïlande. Filtrez par type, localisation et rendement pour trouver l'investissement qui vous correspond.",
    filterType: 'Type', filterAll: 'Tous', filterEco: 'Éco-resort', filterBoutique: 'Boutique Hotel',
    filterLoc: 'Localisation', filterAllLoc: 'Tous',
    filterSort: 'Trier',
    sortTriDesc: 'TRI décroissant', sortDistribDesc: 'Distribution décroissante', sortPriceAsc: 'Prix croissant', sortPriceDesc: 'Prix décroissant',
    applyBtn: 'Appliquer',
    resultsLabel: 'projets',
    metricTri: 'TRI', metricDistrib: 'Distribution', metricTicket: 'Ticket min.', metricBail: 'Bail', bailUnit: 'ans',
    fundingLabel: 'Financement',
    btnDetail: 'Voir la fiche →', btnWaitlist: "Liste d'attente", btnSoon: 'Bientôt disponible',
    badgeOpen: 'Ouvert', badgeFull: 'Complet', badgeSoon: 'Bientôt',
    noResultsTitle: 'Aucun projet trouvé', noResultsSub: 'Essayez de modifier vos filtres.',
    prev: 'Précédent', next: 'Suivant',
    ecoLabel: 'Éco-resort',
  },
  en: {
    heroTitle1: 'All', heroTitle2: 'projects',
    heroSub: 'Explore all available leasehold properties across Thailand. Filter by type, location and yield to find the investment that suits you.',
    filterType: 'Type', filterAll: 'All', filterEco: 'Eco-resort', filterBoutique: 'Boutique Hotel',
    filterLoc: 'Location', filterAllLoc: 'All',
    filterSort: 'Sort',
    sortTriDesc: 'IRR descending', sortDistribDesc: 'Distribution descending', sortPriceAsc: 'Price ascending', sortPriceDesc: 'Price descending',
    applyBtn: 'Apply',
    resultsLabel: 'projects',
    metricTri: 'IRR', metricDistrib: 'Distribution', metricTicket: 'Min. ticket', metricBail: 'Lease', bailUnit: 'yrs',
    fundingLabel: 'Funding',
    btnDetail: 'View project →', btnWaitlist: 'Join waitlist', btnSoon: 'Coming soon',
    badgeOpen: 'Open', badgeFull: 'Full', badgeSoon: 'Soon',
    noResultsTitle: 'No projects found', noResultsSub: 'Try adjusting your filters.',
    prev: 'Previous', next: 'Next',
    ecoLabel: 'Eco-resort',
  },
  th: {
    heroTitle1: 'โครงการ', heroTitle2: 'ทั้งหมด',
    heroSub: 'สำรวจสัญญาเช่าทั้งหมดในประเทศไทย กรองตามประเภท ที่ตั้ง และผลตอบแทนเพื่อหาการลงทุนที่เหมาะกับคุณ',
    filterType: 'ประเภท', filterAll: 'ทั้งหมด', filterEco: 'Eco-resort', filterBoutique: 'Boutique Hotel',
    filterLoc: 'ที่ตั้ง', filterAllLoc: 'ทั้งหมด',
    filterSort: 'เรียง',
    sortTriDesc: 'IRR มากไปน้อย', sortDistribDesc: 'การจ่ายมากไปน้อย', sortPriceAsc: 'ราคาน้อยไปมาก', sortPriceDesc: 'ราคามากไปน้อย',
    applyBtn: 'ใช้',
    resultsLabel: 'โครงการ',
    metricTri: 'IRR', metricDistrib: 'การจ่าย', metricTicket: 'ตั๋วขั้นต่ำ', metricBail: 'สัญญา', bailUnit: 'ปี',
    fundingLabel: 'เงินทุน',
    btnDetail: 'ดูโครงการ →', btnWaitlist: 'เข้าคิวรอ', btnSoon: 'เร็วๆ นี้',
    badgeOpen: 'เปิด', badgeFull: 'เต็ม', badgeSoon: 'เร็วๆ นี้',
    noResultsTitle: 'ไม่พบโครงการ', noResultsSub: 'ลองปรับตัวกรองของคุณ',
    prev: 'ก่อนหน้า', next: 'ถัดไป',
    ecoLabel: 'Eco-resort',
  },
}

type SortKey = 'tri-desc' | 'distrib-desc' | 'price-asc' | 'price-desc'

function fmtThb(n: number) {
  return n.toLocaleString('fr-FR') + ' THB'
}

function typeLabel(type: string, ecoLabel: string) {
  const map: Record<string, string> = {
    villa: 'Villa', bungalow: 'Bungalow', condo: 'Condo',
    'eco-resort': ecoLabel, 'co-living': 'Co-living', 'boutique-hotel': 'Boutique Hotel',
  }
  return map[type] || type
}

export default function ProjetsPage() {
  const { lang } = useLang()
  const t = I18N[lang]

  const [typeFilter, setTypeFilter] = useState('all')
  const [locFilter, setLocFilter] = useState('all')
  const [sort, setSort] = useState<SortKey>('tri-desc')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    let r = PROJECTS.slice()
    if (typeFilter !== 'all') r = r.filter(p => p.type === typeFilter)
    if (locFilter !== 'all') r = r.filter(p => p.loc === locFilter)
    switch (sort) {
      case 'tri-desc':     r.sort((a, b) => b.tri     - a.tri);     break
      case 'distrib-desc': r.sort((a, b) => b.distrib - a.distrib); break
      case 'price-asc':    r.sort((a, b) => a.ticket  - b.ticket);  break
      case 'price-desc':   r.sort((a, b) => b.ticket  - a.ticket);  break
    }
    return r
  }, [typeFilter, locFilter, sort])

  const pages = Math.ceil(filtered.length / PER_PAGE)
  const currentPage = Math.min(page, Math.max(1, pages))
  const slice = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  function setFilter(kind: 'type' | 'loc', val: string) {
    if (kind === 'type') setTypeFilter(val)
    else setLocFilter(val)
    setPage(1)
  }

  function goTo(p: number) {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function pill(kind: 'type' | 'loc', val: string, label: string, active: string) {
    return (
      <button
        key={val}
        className={`filter-pill${active === val ? ' active' : ''}`}
        onClick={() => setFilter(kind, val)}
      >
        {label}
      </button>
    )
  }

  function renderCard(p: Project) {
    const annual = Math.round(p.ticket * (p.distrib / 100))
    const annualFmt = annual.toLocaleString('fr-FR')
    const detailHref = p.slug ? `/projets/${p.slug}` : '/projets/chalok-villa'
    const badgeClass = { open: 'badge-open', full: 'badge-full', soon: 'badge-soon' }[p.status]
    const badgeText = { open: t.badgeOpen, full: t.badgeFull, soon: t.badgeSoon }[p.status]
    const barClass = p.status === 'full' ? 'full' : p.status === 'soon' ? 'soon' : ''
    const pctClass = p.status === 'full' ? 'full' : ''

    let ctaClass = 'card-cta cta-invest'
    let ctaText = t.btnDetail
    if (p.status === 'full') { ctaClass = 'card-cta cta-waitlist'; ctaText = t.btnWaitlist }
    if (p.status === 'soon') { ctaClass = 'card-cta cta-soon'; ctaText = t.btnSoon }

    return (
      <article key={p.id} className="project-card">
        <div className="card-image-wrap">
          <img src={p.img} alt={p.name} loading="lazy" width={600} height={200} />
          <span className="card-type-tag">{typeLabel(p.type, t.ecoLabel)}</span>
          <span className={`card-status-badge ${badgeClass}`}>{badgeText}</span>
          <div className="card-img-bar">
            <div className="card-img-bar-fill" style={{ width: `${p.funding}%` }} />
          </div>
        </div>
        <div className="card-body">
          <div>
            <h3 className="card-title">{p.name}</h3>
            <p className="card-city">📍 {p.city}</p>
          </div>
          <div className="card-metrics">
            <div className="metric-item">
              <span className="metric-label">{t.metricTri}</span>
              <span className="metric-value">{p.tri.toFixed(1)}%</span>
              <span className="metric-sub">&nbsp;</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{t.metricDistrib}</span>
              <span className="metric-value gold">{p.distrib.toFixed(1)}%/an</span>
              <span className="metric-sub">~{annualFmt} THB/an</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">{t.metricTicket}</span>
              <span className="metric-value sm">{fmtThb(p.ticket)}</span>
              <span className="metric-sub">{t.metricBail}: {p.bail} {t.bailUnit}</span>
            </div>
          </div>
          <div className="card-funding">
            <div className="funding-label-row">
              <span className="funding-label">{t.fundingLabel}</span>
              <span className={`funding-pct ${pctClass}`}>{p.funding}%</span>
            </div>
            <div className="funding-bar-track">
              <div className={`funding-bar-fill ${barClass}`} style={{ width: `${p.funding}%` }} />
            </div>
          </div>
          <Link href={detailHref} className={ctaClass}>{ctaText}</Link>
        </div>
      </article>
    )
  }

  function renderPagination() {
    if (filtered.length <= PER_PAGE) return null
    const nums: (number | '...')[] = []
    if (pages <= 7) {
      for (let i = 1; i <= pages; i++) nums.push(i)
    } else {
      nums.push(1)
      if (currentPage > 3) nums.push('...')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(pages - 1, currentPage + 1); i++) nums.push(i)
      if (currentPage < pages - 2) nums.push('...')
      nums.push(pages)
    }
    return (
      <nav className="pagination">
        <button className="page-btn" disabled={currentPage === 1} onClick={() => goTo(currentPage - 1)}>
          ‹ {t.prev}
        </button>
        {nums.map((n, i) =>
          n === '...'
            ? <span key={i} className="page-ellipsis">…</span>
            : <button key={n} className={`page-btn${n === currentPage ? ' active' : ''}`} onClick={() => goTo(n as number)}>{n}</button>
        )}
        <button className="page-btn" disabled={currentPage === pages} onClick={() => goTo(currentPage + 1)}>
          {t.next} ›
        </button>
      </nav>
    )
  }

  return (
    <>
      <div className="projets-hero">
        <h1><span>{t.heroTitle1}</span> {t.heroTitle2}</h1>
        <p className="hero-subtitle">{t.heroSub}</p>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <span className="filter-label">{t.filterType}</span>
          {pill('type', 'all', t.filterAll, typeFilter)}
          {pill('type', 'villa', 'Villa', typeFilter)}
          {pill('type', 'bungalow', 'Bungalow', typeFilter)}
          {pill('type', 'condo', 'Condo', typeFilter)}
          {pill('type', 'eco-resort', t.filterEco, typeFilter)}
          {pill('type', 'co-living', 'Co-living', typeFilter)}
          {pill('type', 'boutique-hotel', t.filterBoutique, typeFilter)}
        </div>
        <div className="filter-divider" />
        <div className="filter-group">
          <span className="filter-label">{t.filterLoc}</span>
          {pill('loc', 'all', t.filterAllLoc, locFilter)}
          {pill('loc', 'ko-phangan', 'Ko Phangan', locFilter)}
          {pill('loc', 'koh-samui', 'Koh Samui', locFilter)}
          {pill('loc', 'phuket', 'Phuket', locFilter)}
        </div>
        <div className="filter-divider" />
        <div className="filter-group">
          <label className="filter-label" htmlFor="sort-select">{t.filterSort}</label>
          <select
            id="sort-select"
            className="filter-select"
            value={sort}
            onChange={e => { setSort(e.target.value as SortKey); setPage(1) }}
          >
            <option value="tri-desc">{t.sortTriDesc}</option>
            <option value="distrib-desc">{t.sortDistribDesc}</option>
            <option value="price-asc">{t.sortPriceAsc}</option>
            <option value="price-desc">{t.sortPriceDesc}</option>
          </select>
        </div>
      </div>

      <main className="projets-main">
        <div className="results-bar">
          <p className="results-count">
            <strong>{filtered.length}</strong> {t.resultsLabel}
          </p>
        </div>

        <div className="project-grid">
          {slice.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>{t.noResultsTitle}</h3>
              <p>{t.noResultsSub}</p>
            </div>
          ) : (
            slice.map(renderCard)
          )}
        </div>

        {renderPagination()}
      </main>
    </>
  )
}
