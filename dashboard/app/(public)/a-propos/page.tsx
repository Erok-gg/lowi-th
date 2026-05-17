'use client'
import '../a-propos.css'
import { useLang } from '../_components/LangContext'
import Link from 'next/link'

const T = {
  fr: {
    pageLabel: 'À propos de LOWI',
    pageTitle: 'Un contrat signé.<br>Une structure qui vous protège.',
    pageSub: "Des droits économiques sur un bail immobilier enregistré en Thaïlande. Loyers, plus-value à la sortie — proportionnellement à votre part. Pas une promesse. Un contrat signé, auditable, protégé par une structure juridique internationale.",
    vpLabel: 'Ce que vous achetez',
    vpTitle: 'Des droits économiques réels,<br>sur des biens qui existent.',
    vpSub: "Chaque projet LOWI est un bien existant, fonctionnel, avec un historique locatif vérifiable. Vous co-détenez les droits économiques via une structure trustee internationale.",
    vp: [
      { icon: '🏡', h: 'Des baux long termes', p: "LOWI ne propose que des locations en accord avec la loi thaïlandaise sur la détention de la propriété par les étrangers dans le royaume." },
      { icon: '💵', h: 'Distribution trimestrielle en THB', p: "Les revenus locatifs sont collectés par le management et vous sont reversés trimestriellement en fonction de votre quote-part." },
      { icon: '📋', h: 'Horizon défini', p: "La durée du bail structure naturellement l'investissement. La date de sortie est connue dès le départ. Vous avez la possibilité de revendre vos parts sur le marché secondaire." },
      { icon: '🔍', h: 'Documentation complète', p: "Chaque projet dispose de son coffre-fort en ligne : bail enregistré, valorisation indépendante, historique locatif, rapport de due diligence, décomposition des frais." },
      { icon: '🏝️', h: 'Expertise locale', p: "Une équipe sur place à Ko Phangan, Koh Samui et Phuket. Sélection, structuration, gestion locative et reporting — tout est opéré localement." },
      { icon: '🤝', h: 'Skin in the game', p: "Sur les projets LOWI Select, nous réinvestissons notre commission dans le projet. Nos droits sont dans le même contrat que les vôtres. Nous gagnons quand vous gagnez." },
    ],
    structLabel: 'La structure de confiance',
    structTitle: 'Quatre piliers juridiques<br>non négociables.',
    structSub: 'Chaque projet LOWI repose sur la même architecture juridique. Sans exception.',
    pillars: [
      { icon: '🏛️', h: 'Trustee internationale', p: "Une société trustee internationale signe chaque bail et détient les droits pour le compte des investisseurs. Comptabilité séparée par projet. Vos fonds ne se mélangent jamais." },
      { icon: '⚖️', h: 'Arbitrage international', p: "Tous les contrats incluent une clause d'arbitrage dans une juridiction reconnue, exécutoire en Thaïlande sous la Convention de New York." },
      { icon: '🛡️', h: 'Réserve de sécurité', p: "Constituée dès le closing, elle absorbe les variations saisonnières. Si un trimestre est inférieur aux projections, votre distribution est assurée depuis cette réserve." },
      { icon: '📊', h: 'Évaluations indépendantes', p: "Chaque bien est suivi par un gestionnaire indépendant. Les rapports sont accessibles sur votre dashboard. Les jalons clés sont conservés de manière immuable et vérifiable." },
    ],
    skinTitle: 'Nous investissons avec vous.',
    skinP: "Sur les projets LOWI Select, nous réinvestissons une partie de notre commission dans le projet lui-même. Nos droits sont dans le même contrat que les vôtres. Visibles. Vérifiables. Nous gagnons quand vous gagnez.",
    rows: [
      { lbl: "Commission d'acquisition", val: '6%', gold: false },
      { lbl: 'Property management', val: '13–18% des loyers', gold: false },
      { lbl: 'Co-investissement Select', val: '6% conservés avec vous', gold: true },
      { lbl: 'Carried interest à la sortie', val: '15–20% au-dessus du hurdle', gold: false },
    ],
    ctaTitle: 'Consulter les projets disponibles',
    ctaP: 'Documentation complète, historiques locatifs et baux enregistrés accessibles avant toute souscription.',
    ctaBtn1: 'Voir les projets →',
    ctaBtn2: 'Comment ça marche →',
  },
  en: {
    pageLabel: 'About LOWI',
    pageTitle: 'A signed contract.<br>A structure that protects you.',
    pageSub: 'Economic rights secured by a registered leasehold in Thailand. Rental income and capital gains upon exit — distributed pro rata. Not a promise, but a legally binding, auditable contract protected by an international legal framework.',
    vpLabel: 'What you buy',
    vpTitle: 'Real economic rights,<br>on properties that exist.',
    vpSub: 'Every LOWI project is an existing, operational property with a verifiable rental history. You co-own economic rights via an international trustee structure.',
    vp: [
      { icon: '🏡', h: 'Long-term leases', p: 'LOWI only offers properties in compliance with Thai law on foreign property ownership.' },
      { icon: '💵', h: 'Quarterly distribution in THB', p: 'Rental income is collected by management and redistributed quarterly in proportion to your share.' },
      { icon: '📋', h: 'Defined horizon', p: 'The exit date is known from day one. You may also resell your shares at any point on the secondary market.' },
      { icon: '🔍', h: 'Full documentation', p: 'Each project has its own secure vault: registered lease, independent valuation, rental history, due diligence report, fee breakdown.' },
      { icon: '🏝️', h: 'Local expertise', p: 'An on-the-ground team in Ko Phangan, Koh Samui and Phuket — all operated locally by reputable professionals based in Thailand.' },
      { icon: '🤝', h: 'Skin in the game', p: 'On LOWI Select projects, we reinvest our commission into the project. Our rights are in the same contract as yours. We win when you win.' },
    ],
    structLabel: 'The trust structure',
    structTitle: 'Four non-negotiable<br>legal pillars.',
    structSub: 'Every LOWI project rests on the same legal architecture. Without exception.',
    pillars: [
      { icon: '🏛️', h: 'International trustee', p: "An international trustee company signs each lease and holds rights on behalf of investors. Separate accounting per project. Your funds never mix with another project's." },
      { icon: '⚖️', h: 'International arbitration', p: 'All contracts include an arbitration clause enforceable in Thailand under the New York Convention.' },
      { icon: '🛡️', h: 'Safety reserve', p: 'Established at closing, it absorbs seasonal variations. If a quarter falls short, your distribution is covered from this reserve.' },
      { icon: '📊', h: 'Independent evaluations', p: 'Each property is monitored by an independent manager. Reports are accessible on your dashboard. Key milestones are immutably recorded.' },
    ],
    skinTitle: 'We invest alongside you.',
    skinP: 'On LOWI Select projects, we reinvest part of our commission into the project itself. Our rights are in the same contract as yours. Visible. Verifiable. We win when you win.',
    rows: [
      { lbl: 'Acquisition fee', val: '6%', gold: false },
      { lbl: 'Property management', val: '13–18% of rents', gold: false },
      { lbl: 'Select co-investment', val: '6% held alongside you', gold: true },
      { lbl: 'Carried interest at exit', val: '15–20% above hurdle', gold: false },
    ],
    ctaTitle: 'View available projects',
    ctaP: 'Full documentation, rental histories and registered leases accessible before any subscription.',
    ctaBtn1: 'View projects →',
    ctaBtn2: 'How it works →',
  },
  th: {
    pageLabel: 'เกี่ยวกับ LOWI',
    pageTitle: 'สัญญาที่ลงนาม<br>โครงสร้างที่ปกป้องคุณ',
    pageSub: 'สิทธิ์ทางเศรษฐกิจบนสัญญาเช่าอสังหาริมทรัพย์ที่จดทะเบียนในประเทศไทย ค่าเช่าและกำไรเมื่อออก — ตามสัดส่วนของคุณ',
    vpLabel: 'สิ่งที่คุณซื้อ',
    vpTitle: 'สิทธิ์ทางเศรษฐกิจจริง<br>บนอสังหาริมทรัพย์ที่มีอยู่จริง',
    vpSub: 'ทุกโครงการ LOWI คืออสังหาริมทรัพย์ที่ดำเนินการแล้ว พร้อมประวัติการเช่าที่ตรวจสอบได้',
    vp: [
      { icon: '🏡', h: 'สัญญาเช่าระยะยาว', p: 'LOWI เสนอเฉพาะอสังหาริมทรัพย์ที่สอดคล้องกับกฎหมายไทยว่าด้วยการถือครองทรัพย์สินของชาวต่างชาติ' },
      { icon: '💵', h: 'การจ่ายรายไตรมาสเป็น THB', p: 'รายได้ค่าเช่าถูกเก็บโดยผู้จัดการและแจกจ่ายรายไตรมาสตามสัดส่วนการถือครองของคุณ' },
      { icon: '📋', h: 'ระยะเวลาที่กำหนดชัด', p: 'วันออกทราบตั้งแต่วันแรก คุณยังสามารถขายส่วนของคุณในตลาดรองได้ตลอดเวลา' },
      { icon: '🔍', h: 'เอกสารครบถ้วน', p: 'ทุกโครงการมีห้องนิรภัยออนไลน์: สัญญาเช่าที่จดทะเบียน การประเมินอิสระ ประวัติการเช่า รายงาน due diligence' },
      { icon: '🏝️', h: 'ความเชี่ยวชาญในพื้นที่', p: 'ทีมงานในพื้นที่ที่เกาะพะงัน เกาะสมุย และภูเก็ต ดำเนินการทั้งหมดโดยผู้เชี่ยวชาญในพื้นที่' },
      { icon: '🤝', h: 'ลงทุนร่วมกับคุณ', p: 'ในโครงการ LOWI Select สิทธิ์ของเราอยู่ในสัญญาเดียวกับของคุณ เราชนะเมื่อคุณชนะ' },
    ],
    structLabel: 'โครงสร้างความไว้วางใจ',
    structTitle: 'สี่เสาหลักทางกฎหมาย<br>ที่ไม่สามารถต่อรองได้',
    structSub: 'ทุกโครงการ LOWI ยึดสถาปัตยกรรมทางกฎหมายเดียวกัน โดยไม่มีข้อยกเว้น',
    pillars: [
      { icon: '🏛️', h: 'ผู้ดูแลระหว่างประเทศ', p: 'บริษัทผู้ดูแลระหว่างประเทศลงนามในสัญญาเช่าแต่ละฉบับและถือสิทธิ์แทนนักลงทุน บัญชีแยกต่างหากต่อโครงการ' },
      { icon: '⚖️', h: 'อนุญาโตตุลาการระหว่างประเทศ', p: 'สัญญาทุกฉบับมีข้อกำหนดอนุญาโตตุลาการบังคับใช้ได้ในประเทศไทยภายใต้อนุสัญญานิวยอร์ก' },
      { icon: '🛡️', h: 'กองทุนสำรองความปลอดภัย', p: 'จัดตั้งตั้งแต่ปิดการลงทุน เพื่อรองรับความผันผวนตามฤดูกาล' },
      { icon: '📊', h: 'การประเมินอิสระ', p: 'แต่ละอสังหาริมทรัพย์ถูกติดตามโดยผู้จัดการอิสระ รายงานเข้าถึงได้ในแดชบอร์ดของคุณ' },
    ],
    skinTitle: 'เราลงทุนร่วมกับคุณ',
    skinP: 'ในโครงการ LOWI Select สิทธิ์ของเราอยู่ในสัญญาเดียวกับของคุณ มองเห็นได้ ตรวจสอบได้ เราชนะเมื่อคุณชนะ',
    rows: [
      { lbl: 'ค่าธรรมเนียมการได้มา', val: '6%', gold: false },
      { lbl: 'การจัดการอสังหาริมทรัพย์', val: '13–18% ของค่าเช่า', gold: false },
      { lbl: 'การร่วมลงทุน Select', val: '6% ถือร่วมกับคุณ', gold: true },
      { lbl: 'Carried interest เมื่อออก', val: '15–20% เหนือ hurdle', gold: false },
    ],
    ctaTitle: 'ดูโครงการที่พร้อม',
    ctaP: 'เอกสารครบถ้วนพร้อมก่อนการสมัคร',
    ctaBtn1: 'ดูโครงการ →',
    ctaBtn2: 'วิธีการทำงาน →',
  },
}

export default function AProposPage() {
  const { lang } = useLang()
  const t = T[lang]

  return (
    <>
      {/* Page hero */}
      <div className="page-hero">
        <div className="label">{t.pageLabel}</div>
        <h1 dangerouslySetInnerHTML={{ __html: t.pageTitle }} />
        <p>{t.pageSub}</p>
      </div>

      {/* What you buy */}
      <section className="what-section">
        <div className="section-label">{t.vpLabel}</div>
        <h2 className="section-title" dangerouslySetInnerHTML={{ __html: t.vpTitle }} />
        <p className="section-sub">{t.vpSub}</p>
        <div className="vp-grid">
          {t.vp.map((item, i) => (
            <div key={i} className="vp-card">
              <h3><span className="title-icon">{item.icon}</span> {item.h}</h3>
              <p>{item.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust structure */}
      <section className="structure-section">
        <div className="section-label">{t.structLabel}</div>
        <h2 className="section-title" dangerouslySetInnerHTML={{ __html: t.structTitle }} />
        <p className="section-sub">{t.structSub}</p>
        <div className="pillars">
          {t.pillars.map((p, i) => (
            <div key={i} className="pillar">
              <h3><span className="title-icon">{p.icon}</span> {p.h}</h3>
              <p>{p.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Skin in the game */}
      <section className="skin-section">
        <div>
          <h2>{t.skinTitle}</h2>
          <p>{t.skinP}</p>
        </div>
        <div className="skin-visual">
          {t.rows.map((r, i) => (
            <div key={i} className="skin-row">
              <span className="lbl">{r.lbl}</span>
              <span className={`val${r.gold ? ' gold' : ''}`}>{r.val}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="page-cta">
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaP}</p>
        <div className="cta-btns">
          <Link href="/" className="btn-gold">{t.ctaBtn1}</Link>
          <Link href="/comment-ca-marche" className="btn-outline">{t.ctaBtn2}</Link>
        </div>
      </div>
    </>
  )
}
