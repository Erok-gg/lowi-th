'use client'
import '../comment-ca-marche.css'
import { useLang } from '../_components/LangContext'
import Link from 'next/link'

const T = {
  fr: {
    label: 'Comment ça marche',
    title: 'De la sélection du bien<br>à votre première distribution.',
    steps: [
      {
        h: 'Sélection',
        p: "LOWI identifie et audite les meilleurs projets immobiliers en Thaïlande. Nos équipes référencent les projets et propriétés les plus prometteurs dans notre réseau. La connaissance et l'expérience terrain nous permettent de filtrer une première fois. Un deuxième filtre vérifie que les acteurs en jeu ont un historique, des capacités financières et techniques suffisantes pour assumer le projet. Enfin, des valorisations indépendantes sont demandées pour s'assurer de la cohérence du prix.",
        detail: "Critères de sélection : projets VEFA ou construction achevée, durée de bail minimum cohérente avec le rendement, rendement brut estimé minimum 8 % par rapport au prix d'achat.",
      },
      {
        h: 'Structuration',
        p: "Une société trustee internationale vous représente et signe le bail en votre nom. Votre contrat avec le trustee vous confère des droits économiques sur le bien à proportion de votre participation. Chaque projet est isolé juridiquement et comptablement — votre investissement ne peut pas être utilisé pour couvrir un autre projet.",
        detail: "La structure permet de mutualiser les coûts et de renforcer vos droits opposables entre associés : comptabilité séparée par projet, clause d'arbitrage international exécutoire en Thaïlande, réserve de trésorerie constituée dès le closing.",
      },
      {
        h: 'Investissement',
        p: "Vous faites l'acquisition de vos parts en THB, EUR ou USD. Votre contrat est signé électroniquement, horodaté et son empreinte est conservée de manière immuable et vérifiable à tout moment.",
        detail: "Les fonds sont détenus en séquestre jusqu'à l'atteinte de l'objectif de financement. Si l'objectif n'est pas atteint, vos fonds sont intégralement restitués sur le compte émetteur du paiement.",
      },
      {
        h: 'Distribution',
        p: "La mise en location, le marketing, la maintenance et les check-in & check-out sont assurés par des prestataires reconnus localement, à des tarifs négociés par la plateforme. Les frais sont décomposés et transparents. Votre quote-part est virée en THB chaque trimestre. Tout est visible sur votre portail personnel.",
        detail: "De la construction à la livraison, de la location à la sortie, tous les documents sont conservés de manière sécurisée et accessibles depuis votre portail client.",
      },
      {
        h: 'Sortie',
        p: "Au terme du bail, le bien est revendu à d'autres locataires et une plus-value peut être distribuée aux investisseurs proportionnellement à leur part. Pour les baux long-termes non renouvelés, le bien est rendu au propriétaire — un plan de sortie des liquidités non distribuées est organisé conformément au contrat avec le trustee.",
        detail: "Pour les investisseurs souhaitant sortir avant le terme, il est possible de céder ses droits sur le marché secondaire LOWI.",
      },
    ],
    ctaTitle: 'Prêt à investir ?',
    ctaP: 'Consultez les projets disponibles et leur documentation complète avant toute décision.',
    ctaBtn1: 'Voir les projets disponibles →',
    ctaBtn2: 'En savoir plus sur la structure →',
  },
  en: {
    label: 'How it works',
    title: 'From property selection<br>to your first distribution.',
    steps: [
      {
        h: 'Selection',
        p: "LOWI identifies and audits premier real estate opportunities across Thailand. Leveraging deep local expertise and an extensive professional network, our team conducts a rigorous multi-stage vetting process. This begins with an initial strategic filter, followed by a comprehensive due diligence phase to verify the track record, financial solvency, and technical execution capabilities of all stakeholders. To conclude our assessment, we secure independent valuations to ensure price transparency and market alignment.",
        detail: "Selection criteria: off-plan (VEFA) or completed construction, minimum lease duration consistent with the expected yield, estimated minimum gross yield of 8% relative to purchase price.",
      },
      {
        h: 'Structuring',
        p: "An international trustee company represents you and signs the lease in your name. Your contract with the trustee grants you economic rights over the property in proportion to your participation. Each project is legally and accountably isolated — your investment cannot be used to cover another project.",
        detail: "The structure allows costs to be shared while strengthening your enforceable rights as a co-investor: separate accounting per project, international arbitration clause enforceable in Thailand, cash reserve established at closing.",
      },
      {
        h: 'Investment',
        p: "You acquire your shares in THB, EUR or USD. Your contract is electronically signed, timestamped, with its digital fingerprint stored immutably — ensuring it remains verifiable at any time.",
        detail: "Funds are held in escrow until the financing target is reached. If the target is not met, your funds are fully returned to the originating payment account.",
      },
      {
        h: 'Distribution',
        p: "Operational management — encompassing marketing, maintenance, and guest relations — is entrusted to premier local service providers under pre-negotiated, preferential rates. These partners provide comprehensive annual reporting and oversee rent collection with full fiscal transparency. Dividends are disbursed quarterly in THB, with all performance metrics accessible via your dedicated investor portal.",
        detail: "From construction to delivery, from rental to exit, all documents are securely stored and accessible from your client portal.",
      },
      {
        h: 'Exit',
        p: "At the end of the lease, the property is resold to other lessees and any capital gain may be distributed to investors in proportion to their share. For long-term leases that are not renewed, the property is returned to the owner — an exit plan for undistributed proceeds will be organised in accordance with the trustee agreement.",
        detail: "Investors wishing to exit before the end of the term may transfer their rights on the LOWI secondary market.",
      },
    ],
    ctaTitle: 'Ready to invest?',
    ctaP: 'Review available projects and their full documentation before any decision.',
    ctaBtn1: 'View available projects →',
    ctaBtn2: 'Learn more about the structure →',
  },
  th: {
    label: 'วิธีการทำงาน',
    title: 'ตั้งแต่การคัดเลือกอสังหาริมทรัพย์<br>จนถึงการจ่ายเงินครั้งแรก',
    steps: [
      {
        h: 'การคัดเลือก',
        p: 'LOWI ระบุและตรวจสอบโครงการอสังหาริมทรัพย์ที่ดีที่สุดในประเทศไทย ทีมงานของเราคัดกรองโครงการที่มีแนวโน้มดีที่สุดจากเครือข่ายของเรา ความรู้และประสบการณ์ในพื้นที่ช่วยให้เราคัดกรองได้ในขั้นแรก',
        detail: 'เกณฑ์การคัดเลือก: โครงการ VEFA หรือก่อสร้างแล้วเสร็จ ระยะเวลาสัญญาเช่าขั้นต่ำสอดคล้องกับผลตอบแทน ผลตอบแทนรวมประมาณขั้นต่ำ 8% เทียบกับราคาซื้อ',
      },
      {
        h: 'การจัดโครงสร้าง',
        p: 'บริษัทผู้ดูแลระหว่างประเทศเป็นตัวแทนของคุณและลงนามในสัญญาเช่าในนามของคุณ สัญญากับผู้ดูแลให้สิทธิ์ทางเศรษฐกิจบนอสังหาริมทรัพย์ตามสัดส่วนการมีส่วนร่วมของคุณ',
        detail: 'โครงสร้างช่วยแบ่งปันต้นทุนและเสริมสร้างสิทธิ์ของคุณ: บัญชีแยกต่างหากต่อโครงการ ข้อกำหนดอนุญาโตตุลาการระหว่างประเทศ กองทุนสำรองจัดตั้งตั้งแต่ปิด',
      },
      {
        h: 'การลงทุน',
        p: 'คุณซื้อส่วนของคุณเป็น THB EUR หรือ USD สัญญาของคุณลงนามทางอิเล็กทรอนิกส์ ประทับเวลา และจัดเก็บอย่างไม่สามารถเปลี่ยนแปลงได้',
        detail: 'เงินถูกเก็บไว้ในบัญชีเอสโครว์จนกว่าจะถึงเป้าหมายการจัดหาเงินทุน หากไม่ถึงเป้า เงินของคุณจะถูกคืนครบถ้วน',
      },
      {
        h: 'การจ่ายเงิน',
        p: 'การจัดการ การตลาด การบำรุงรักษา และการเช็คอิน/เช็คเอาต์ดูแลโดยผู้ให้บริการที่มีชื่อเสียงในพื้นที่ ค่าธรรมเนียมแจกแจงชัดเจนและโปร่งใส ส่วนแบ่งของคุณโอนรายไตรมาสเป็น THB',
        detail: 'ตั้งแต่การก่อสร้างจนถึงการส่งมอบ ตั้งแต่การเช่าจนถึงการออก เอกสารทั้งหมดจัดเก็บอย่างปลอดภัยและเข้าถึงได้จากพอร์ทัลลูกค้าของคุณ',
      },
      {
        h: 'การออกจากการลงทุน',
        p: 'เมื่อสิ้นสุดสัญญา อสังหาริมทรัพย์ถูกขายและกำไรถูกแจกจ่ายตามสัดส่วน สำหรับสัญญาเช่าระยะยาวที่ไม่ต่ออายุ อสังหาริมทรัพย์จะถูกคืนให้เจ้าของ',
        detail: 'นักลงทุนที่ต้องการออกก่อนสิ้นสุดสัญญาสามารถโอนสิทธิ์ในตลาดรองของ LOWI ได้',
      },
    ],
    ctaTitle: 'พร้อมลงทุนแล้วหรือยัง?',
    ctaP: 'ตรวจสอบโครงการที่พร้อมและเอกสารครบถ้วนก่อนตัดสินใจ',
    ctaBtn1: 'ดูโครงการที่พร้อม →',
    ctaBtn2: 'เรียนรู้เพิ่มเติมเกี่ยวกับโครงสร้าง →',
  },
}

export default function CommentCaMarchePage() {
  const { lang } = useLang()
  const t = T[lang]

  return (
    <>
      <div className="ccm-hero">
        <div className="label">{t.label}</div>
        <h1 dangerouslySetInnerHTML={{ __html: t.title }} />
      </div>

      <section className="steps-section">
        <div className="steps-list">
          {t.steps.map((s, i) => (
            <div key={i} className="step-row">
              <div className="step-left">
                <h3>{s.h}</h3>
                <p>{s.p}</p>
              </div>
              <div className="step-right">
                <div className="step-detail">{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="ccm-cta">
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaP}</p>
        <div className="ccm-cta-btns">
          <Link href="/projets" className="btn-gold">{t.ctaBtn1}</Link>
          <Link href="/a-propos" className="btn-outline">{t.ctaBtn2}</Link>
        </div>
      </div>
    </>
  )
}
