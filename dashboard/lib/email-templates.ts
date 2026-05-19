/**
 * Templates email transactionnels multi-lang (FR/EN/TH).
 * HTML inline minimaliste pour compat Gmail/Outlook (pas de <style>, table-based).
 *
 * Convention : chaque fonction prend (recap, siteUrl[, contactEmail], lang)
 * et retourne { subject, html }.
 *
 * Admin templates restent en FR (un seul admin, lowi.platform@gmail.com).
 */

export type Lang = 'fr' | 'en' | 'th'

const NAVY = '#0a1628'
const GOLD = '#c9a96e'
const GREY = '#6b7280'
const BG   = '#f9f8f5'

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function shell(title: string, body: string, footer: string, ctaUrl?: string, ctaLabel?: string): string {
  const cta = ctaUrl && ctaLabel
    ? `<tr><td align="center" style="padding:24px 0">
         <a href="${esc(ctaUrl)}" style="display:inline-block;background:${NAVY};color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:24px;font-family:Segoe UI,system-ui,sans-serif;font-size:14px">
           ${esc(ctaLabel)}
         </a>
       </td></tr>`
    : ''
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG};font-family:Segoe UI,system-ui,sans-serif;color:#1a1a1a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)">
        <tr><td style="background:${NAVY};padding:24px 32px">
          <div style="color:${GOLD};font-weight:700;font-size:20px;letter-spacing:.04em">LOWI</div>
        </td></tr>
        <tr><td style="padding:32px">
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:800;color:${NAVY}">${esc(title)}</h1>
          ${body}
        </td></tr>
        ${cta}
        <tr><td style="padding:16px 32px;background:#f5f5f3;border-top:1px solid #e2e2dc;font-size:11px;color:${GREY};text-align:center">
          ${esc(footer)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

interface PropertyRecap {
  public_id: string
  title: string
  property_type?: string | null
  location_city?: string | null
  location_country?: string | null
  estimated_value_thb?: number | null
  surface_sqm?: number | null
  bedrooms?: number | null
}

const LOCALE: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB', th: 'th-TH' }

const RECAP_LABELS: Record<Lang, { ref: string; title: string; type: string; city: string; value: string; surface: string; bedrooms: string }> = {
  fr: { ref: 'Référence', title: 'Titre', type: 'Type', city: 'Ville',      value: 'Valeur', surface: 'Surface',   bedrooms: 'Chambres' },
  en: { ref: 'Reference', title: 'Title', type: 'Type', city: 'City',       value: 'Value',  surface: 'Surface',   bedrooms: 'Bedrooms' },
  th: { ref: 'รหัส',       title: 'ชื่อ',   type: 'ประเภท', city: 'เมือง',      value: 'มูลค่า',  surface: 'พื้นที่',     bedrooms: 'ห้องนอน' },
}

const FOOTER: Record<Lang, string> = {
  fr: 'LOWI · Investissement immobilier fractionné · Thaïlande',
  en: 'LOWI · Fractional real estate investment · Thailand',
  th: 'LOWI · การลงทุนอสังหาฯ แบบแบ่งส่วน · ประเทศไทย',
}

function recapTable(p: PropertyRecap, lang: Lang): string {
  const L = RECAP_LABELS[lang]
  const rows: [string, string][] = [
    [L.ref,   p.public_id],
    [L.title, p.title],
  ]
  if (p.property_type)        rows.push([L.type,    p.property_type])
  if (p.location_city)        rows.push([L.city,    `${p.location_city}${p.location_country ? ', ' + p.location_country : ''}`])
  if (p.estimated_value_thb)  rows.push([L.value,   `${p.estimated_value_thb.toLocaleString(LOCALE[lang])} THB`])
  if (p.surface_sqm)          rows.push([L.surface, `${p.surface_sqm} m²`])
  if (p.bedrooms !== null && p.bedrooms !== undefined) rows.push([L.bedrooms, String(p.bedrooms)])

  return `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin:16px 0;font-size:14px">
    ${rows.map(([k, v]) => `
      <tr>
        <td style="padding:8px 12px 8px 0;color:${GREY};font-weight:600;width:140px;border-bottom:1px solid #f0f0f0">${esc(k)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${esc(v)}</td>
      </tr>`).join('')}
  </table>`
}

// ── Helper compose ──────────────────────────────────────────────────────────
type TplOut = { subject: string; html: string }
function compose(title: string, bodyHtml: string, lang: Lang, ctaUrl?: string, ctaLabel?: string, subject?: string): TplOut {
  return {
    subject: subject ?? title,
    html: shell(title, bodyHtml, FOOTER[lang], ctaUrl, ctaLabel),
  }
}

// ───────────────────────────────────────────────────────────────────────────
// TEMPLATES USER (multi-lang)
// ───────────────────────────────────────────────────────────────────────────

// 1. Submission received (pending)
export function submissionPending(p: PropertyRecap, siteUrl: string, lang: Lang = 'fr'): TplOut {
  const url = `${siteUrl}/profile`
  if (lang === 'en') return compose(
    'Your submission was received',
    `<p style="font-size:14px;line-height:1.6">Thank you for submitting your property to LOWI. Our team will review it within 72 hours.</p>
     <p style="font-size:14px;line-height:1.6"><strong>Current status:</strong> Pending review</p>
     ${recapTable(p, lang)}
     <p style="font-size:13px;color:${GREY};line-height:1.6">You will receive an email once a decision is made. If accepted, we will request 4 legal documents (passport, title deed, company DBD extract, director nomination).</p>`,
    lang, url, 'View my profile',
    `[LOWI] Submission received — ${p.public_id}`,
  )
  if (lang === 'th') return compose(
    'เราได้รับใบสมัครของคุณแล้ว',
    `<p style="font-size:14px;line-height:1.6">ขอบคุณที่ส่งอสังหาริมทรัพย์ของคุณมายัง LOWI ทีมงานของเราจะตรวจสอบภายใน 72 ชั่วโมง</p>
     <p style="font-size:14px;line-height:1.6"><strong>สถานะปัจจุบัน:</strong> รอการตรวจสอบ</p>
     ${recapTable(p, lang)}
     <p style="font-size:13px;color:${GREY};line-height:1.6">คุณจะได้รับอีเมลแจ้งผลทันทีที่มีการตัดสินใจ หากได้รับการอนุมัติ เราจะขอเอกสารทางกฎหมาย 4 ฉบับ (หนังสือเดินทาง โฉนด ใบ DBD ใบแต่งตั้งกรรมการ)</p>`,
    lang, url, 'ดูโปรไฟล์ของฉัน',
    `[LOWI] ได้รับใบสมัครแล้ว — ${p.public_id}`,
  )
  return compose(
    'Votre soumission est bien reçue',
    `<p style="font-size:14px;line-height:1.6">Merci d'avoir soumis votre bien sur LOWI. Notre équipe va l'examiner sous 72h.</p>
     <p style="font-size:14px;line-height:1.6"><strong>Statut actuel :</strong> En attente d'examen</p>
     ${recapTable(p, lang)}
     <p style="font-size:13px;color:${GREY};line-height:1.6">Vous recevrez un email dès qu'une décision sera prise. Si la soumission est acceptée, nous vous demanderons 4 documents juridiques (passeport, titre de propriété, extrait Kbis, acte de nomination).</p>`,
    lang, url, 'Voir mon profil',
    `[LOWI] Soumission reçue — ${p.public_id}`,
  )
}

// 2. Accepted → KYB
export function submissionAccepted(p: PropertyRecap, siteUrl: string, lang: Lang = 'fr'): TplOut {
  const url = `${siteUrl}/profile`
  if (lang === 'en') return compose(
    'Congratulations — your property is accepted',
    `<p style="font-size:14px;line-height:1.6">Our team has reviewed your submission and approved it. One step remains: <strong>upload your KYB documents</strong>.</p>
     ${recapTable(p, lang)}
     <p style="font-size:14px;line-height:1.6"><strong>Next step:</strong> log in to your dashboard, open your property and click "Complete KYB documents" to upload the 4 required files (porter passport, title deed, company DBD &lt; 3 months, director nomination).</p>
     <p style="font-size:13px;color:${GREY};line-height:1.6">Once the 4 documents are approved, your property will go live publicly.</p>`,
    lang, url, 'Access my properties',
    `[LOWI] Submission accepted — ${p.public_id} — KYB required`,
  )
  if (lang === 'th') return compose(
    'ยินดีด้วย — อสังหาริมทรัพย์ของคุณได้รับการอนุมัติ',
    `<p style="font-size:14px;line-height:1.6">ทีมงานของเราตรวจสอบและอนุมัติแล้ว เหลือเพียงขั้นตอนเดียว: <strong>อัปโหลดเอกสาร KYB</strong></p>
     ${recapTable(p, lang)}
     <p style="font-size:14px;line-height:1.6"><strong>ขั้นตอนถัดไป:</strong> เข้าสู่ระบบของคุณ เลือกอสังหาริมทรัพย์ และคลิก "ดำเนินการเอกสาร KYB" เพื่ออัปโหลดเอกสาร 4 ฉบับ (หนังสือเดินทางผู้ถือ โฉนด DBD &lt; 3 เดือน ใบแต่งตั้งกรรมการ)</p>
     <p style="font-size:13px;color:${GREY};line-height:1.6">เมื่อเอกสารทั้ง 4 ได้รับการอนุมัติ อสังหาริมทรัพย์ของคุณจะออนไลน์</p>`,
    lang, url, 'เข้าสู่อสังหาริมทรัพย์ของฉัน',
    `[LOWI] อนุมัติแล้ว — ${p.public_id} — ต้องการ KYB`,
  )
  return compose(
    'Félicitations, votre bien est accepté',
    `<p style="font-size:14px;line-height:1.6">Notre équipe a examiné votre soumission et donne suite. Il vous reste une étape : <strong>téléverser les documents KYB</strong>.</p>
     ${recapTable(p, lang)}
     <p style="font-size:14px;line-height:1.6"><strong>Prochaine étape :</strong> connectez-vous à votre espace, sélectionnez la propriété, cliquez sur « Compléter les documents KYB » et téléversez les 4 documents demandés (passeport du porteur, titre de propriété, extrait Kbis &lt; 3 mois, acte de nomination du directeur).</p>
     <p style="font-size:13px;color:${GREY};line-height:1.6">Une fois les 4 documents approuvés, votre bien sera mis en ligne publiquement.</p>`,
    lang, url, 'Accéder à mes propriétés',
    `[LOWI] Soumission acceptée — ${p.public_id} — KYB à compléter`,
  )
}

// 3. Rejected
export function submissionRejected(p: PropertyRecap, _siteUrl: string, contactEmail: string, lang: Lang = 'fr'): TplOut {
  const ctaUrl = `mailto:${contactEmail}?subject=${encodeURIComponent(`Soumission ${p.public_id}`)}`
  if (lang === 'en') return compose(
    'Submission not accepted',
    `<p style="font-size:14px;line-height:1.6">After review, your property was not accepted this time.</p>
     ${recapTable(p, lang)}
     <p style="font-size:14px;line-height:1.6">To learn the specific reasons or discuss a possible resubmission, write to <a href="mailto:${esc(contactEmail)}" style="color:${NAVY};font-weight:600">${esc(contactEmail)}</a> mentioning reference <code>${esc(p.public_id)}</code>.</p>
     <p style="font-size:13px;color:${GREY};line-height:1.6">You can also submit another property anytime from your dashboard.</p>`,
    lang, ctaUrl, 'Contact us',
    `[LOWI] Submission not accepted — ${p.public_id}`,
  )
  if (lang === 'th') return compose(
    'ใบสมัครไม่ได้รับการอนุมัติ',
    `<p style="font-size:14px;line-height:1.6">หลังจากการตรวจสอบ อสังหาริมทรัพย์ของคุณยังไม่ได้รับการอนุมัติในครั้งนี้</p>
     ${recapTable(p, lang)}
     <p style="font-size:14px;line-height:1.6">เพื่อทราบเหตุผลและพูดคุยเรื่องการส่งใหม่ กรุณาเขียนถึง <a href="mailto:${esc(contactEmail)}" style="color:${NAVY};font-weight:600">${esc(contactEmail)}</a> โดยอ้างอิงรหัส <code>${esc(p.public_id)}</code></p>
     <p style="font-size:13px;color:${GREY};line-height:1.6">คุณสามารถส่งอสังหาริมทรัพย์อื่นได้ทุกเมื่อจากโปรไฟล์ของคุณ</p>`,
    lang, ctaUrl, 'ติดต่อเรา',
    `[LOWI] ไม่ได้รับการอนุมัติ — ${p.public_id}`,
  )
  return compose(
    'Soumission non retenue',
    `<p style="font-size:14px;line-height:1.6">Après examen, votre bien n'a pas été retenu cette fois-ci.</p>
     ${recapTable(p, lang)}
     <p style="font-size:14px;line-height:1.6">Pour connaître les raisons précises ou discuter d'une éventuelle resoumission, écrivez-nous à <a href="mailto:${esc(contactEmail)}" style="color:${NAVY};font-weight:600">${esc(contactEmail)}</a> en mentionnant la référence <code>${esc(p.public_id)}</code>.</p>
     <p style="font-size:13px;color:${GREY};line-height:1.6">Vous pouvez aussi soumettre un autre bien à tout moment depuis votre espace.</p>`,
    lang, ctaUrl, 'Nous contacter',
    `[LOWI] Soumission non retenue — ${p.public_id}`,
  )
}

// 4. Active (listed publicly)
export function submissionActive(p: PropertyRecap, siteUrl: string, lang: Lang = 'fr'): TplOut {
  const publicUrl = `${siteUrl}/projets/${p.public_id}`
  if (lang === 'en') return compose(
    'Your property is live 🎉',
    `<p style="font-size:14px;line-height:1.6">All documents are validated. Your property is now publicly visible on LOWI.</p>
     ${recapTable(p, lang)}
     <p style="font-size:14px;line-height:1.6"><strong>Public URL:</strong><br><a href="${esc(publicUrl)}" style="color:${NAVY};word-break:break-all">${esc(publicUrl)}</a></p>`,
    lang, publicUrl, 'View public listing',
    `[LOWI] Your property is live — ${p.public_id}`,
  )
  if (lang === 'th') return compose(
    'อสังหาริมทรัพย์ของคุณออนไลน์แล้ว 🎉',
    `<p style="font-size:14px;line-height:1.6">เอกสารทั้งหมดได้รับการอนุมัติ อสังหาริมทรัพย์ของคุณปรากฏบน LOWI แล้ว</p>
     ${recapTable(p, lang)}
     <p style="font-size:14px;line-height:1.6"><strong>URL สาธารณะ:</strong><br><a href="${esc(publicUrl)}" style="color:${NAVY};word-break:break-all">${esc(publicUrl)}</a></p>`,
    lang, publicUrl, 'ดูหน้าสาธารณะ',
    `[LOWI] อสังหาริมทรัพย์ของคุณออนไลน์ — ${p.public_id}`,
  )
  return compose(
    'Votre bien est en ligne 🎉',
    `<p style="font-size:14px;line-height:1.6">Tous les documents ont été validés. Votre bien est désormais visible publiquement sur LOWI.</p>
     ${recapTable(p, lang)}
     <p style="font-size:14px;line-height:1.6"><strong>URL publique :</strong><br><a href="${esc(publicUrl)}" style="color:${NAVY};word-break:break-all">${esc(publicUrl)}</a></p>`,
    lang, publicUrl, 'Voir la fiche publique',
    `[LOWI] Votre bien est en ligne — ${p.public_id}`,
  )
}

// ───────────────────────────────────────────────────────────────────────────
// TEMPLATES ADMIN (FR only — un seul destinataire interne)
// ───────────────────────────────────────────────────────────────────────────

export function adminNewSubmission(p: PropertyRecap, siteUrl: string, submitterEmail: string): TplOut {
  const dashboardUrl = `${siteUrl}/admin/properties`
  return compose(
    'Nouvelle soumission à examiner',
    `<p style="font-size:14px;line-height:1.6"><strong>Soumettant :</strong> ${esc(submitterEmail)}</p>
     ${recapTable(p, 'fr')}
     <p style="font-size:13px;color:${GREY};line-height:1.6">Référence : <code>${esc(p.public_id)}</code></p>`,
    'fr', dashboardUrl, 'Ouvrir la queue admin',
    `[LOWI Admin] Nouvelle soumission ${p.public_id}`,
  )
}

export function adminListingPublished(p: PropertyRecap, siteUrl: string, submitterEmail: string): TplOut {
  const adminUrl = `${siteUrl}/admin/properties`
  return compose(
    'Bien listé publiquement',
    `<p style="font-size:14px;line-height:1.6">Le bien <strong>${esc(p.public_id)}</strong> vient d'être passé au statut <strong>active</strong> et apparaît sur /projets.</p>
     <p style="font-size:14px;line-height:1.6"><strong>Soumettant :</strong> ${esc(submitterEmail)}</p>
     ${recapTable(p, 'fr')}`,
    'fr', adminUrl, 'Voir dans le dashboard',
    `[LOWI Admin] Bien ${p.public_id} mis en ligne`,
  )
}
