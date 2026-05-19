/**
 * Templates email transactionnels — Sprint post-audit.
 * HTML inline minimaliste pour compat Gmail/Outlook (pas de <style>, table-based).
 *
 * Convention : chaque fonction retourne { subject, html }.
 * Les valeurs sont déjà nettoyées (échappées) avant l'appel.
 */

const NAVY = '#0a1628'
const GOLD = '#c9a96e'
const GREY = '#6b7280'
const BG   = '#f9f8f5'

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function shell(title: string, body: string, ctaUrl?: string, ctaLabel?: string): string {
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
          LOWI · Investissement immobilier fractionné · Thaïlande
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

function recapTable(p: PropertyRecap): string {
  const rows: [string, string][] = [
    ['Référence', p.public_id],
    ['Titre',     p.title],
  ]
  if (p.property_type)        rows.push(['Type',    p.property_type])
  if (p.location_city)        rows.push(['Ville',   `${p.location_city}${p.location_country ? ', ' + p.location_country : ''}`])
  if (p.estimated_value_thb)  rows.push(['Valeur',  `${p.estimated_value_thb.toLocaleString('fr-FR')} THB`])
  if (p.surface_sqm)          rows.push(['Surface', `${p.surface_sqm} m²`])
  if (p.bedrooms !== null && p.bedrooms !== undefined) rows.push(['Chambres', String(p.bedrooms)])

  return `<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin:16px 0;font-size:14px">
    ${rows.map(([k, v]) => `
      <tr>
        <td style="padding:8px 12px 8px 0;color:${GREY};font-weight:600;width:120px;border-bottom:1px solid #f0f0f0">${esc(k)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">${esc(v)}</td>
      </tr>`).join('')}
  </table>`
}

// ── Templates ───────────────────────────────────────────────────────────────

export function submissionPending(p: PropertyRecap, siteUrl: string) {
  return {
    subject: `[LOWI] Soumission reçue — ${p.public_id}`,
    html: shell(
      'Votre soumission est bien reçue',
      `<p style="font-size:14px;line-height:1.6">Merci d'avoir soumis votre bien sur LOWI. Notre équipe va l'examiner sous 72h.</p>
       <p style="font-size:14px;line-height:1.6"><strong>Statut actuel :</strong> En attente d'examen</p>
       ${recapTable(p)}
       <p style="font-size:13px;color:${GREY};line-height:1.6">Vous recevrez un email dès qu'une décision sera prise. Si la soumission est acceptée, nous vous demanderons 4 documents juridiques (passeport, titre de propriété, extrait Kbis, acte de nomination).</p>`,
      `${siteUrl}/profile`,
      'Voir mon profil',
    ),
  }
}

export function submissionAccepted(p: PropertyRecap, siteUrl: string) {
  return {
    subject: `[LOWI] Soumission acceptée — ${p.public_id} — KYB à compléter`,
    html: shell(
      'Félicitations, votre bien est accepté',
      `<p style="font-size:14px;line-height:1.6">Notre équipe a examiné votre soumission et donne suite. Il vous reste une étape : <strong>téléverser les documents KYB</strong>.</p>
       ${recapTable(p)}
       <p style="font-size:14px;line-height:1.6"><strong>Prochaine étape :</strong> connectez-vous à votre espace, sélectionnez la propriété, cliquez sur « Compléter les documents KYB » et téléversez les 4 documents demandés (passeport du porteur, titre de propriété, extrait Kbis &lt; 3 mois, acte de nomination du directeur).</p>
       <p style="font-size:13px;color:${GREY};line-height:1.6">Une fois les 4 documents approuvés, votre bien sera mis en ligne publiquement.</p>`,
      `${siteUrl}/profile`,
      'Accéder à mes propriétés',
    ),
  }
}

export function submissionRejected(p: PropertyRecap, siteUrl: string, contactEmail: string) {
  return {
    subject: `[LOWI] Soumission non retenue — ${p.public_id}`,
    html: shell(
      'Soumission non retenue',
      `<p style="font-size:14px;line-height:1.6">Après examen, votre bien n'a pas été retenu cette fois-ci.</p>
       ${recapTable(p)}
       <p style="font-size:14px;line-height:1.6">Pour connaître les raisons précises ou discuter d'une éventuelle resoumission, écrivez-nous à <a href="mailto:${esc(contactEmail)}" style="color:${NAVY};font-weight:600">${esc(contactEmail)}</a> en mentionnant la référence <code>${esc(p.public_id)}</code>.</p>
       <p style="font-size:13px;color:${GREY};line-height:1.6">Vous pouvez aussi soumettre un autre bien à tout moment depuis votre espace.</p>`,
      `mailto:${contactEmail}?subject=${encodeURIComponent('Soumission ' + p.public_id + ' — demande d\'explications')}`,
      'Nous contacter',
    ),
  }
}

export function submissionActive(p: PropertyRecap, siteUrl: string) {
  const publicUrl = `${siteUrl}/projets/${p.public_id}`
  return {
    subject: `[LOWI] Votre bien est en ligne — ${p.public_id}`,
    html: shell(
      'Votre bien est en ligne 🎉',
      `<p style="font-size:14px;line-height:1.6">Tous les documents ont été validés. Votre bien est désormais visible publiquement sur LOWI.</p>
       ${recapTable(p)}
       <p style="font-size:14px;line-height:1.6"><strong>URL publique :</strong><br><a href="${esc(publicUrl)}" style="color:${NAVY};word-break:break-all">${esc(publicUrl)}</a></p>`,
      publicUrl,
      'Voir la fiche publique',
    ),
  }
}

export function adminNewSubmission(p: PropertyRecap, siteUrl: string, submitterEmail: string) {
  const dashboardUrl = `${siteUrl}/admin/properties`
  return {
    subject: `[LOWI Admin] Nouvelle soumission ${p.public_id}`,
    html: shell(
      'Nouvelle soumission à examiner',
      `<p style="font-size:14px;line-height:1.6"><strong>Soumettant :</strong> ${esc(submitterEmail)}</p>
       ${recapTable(p)}
       <p style="font-size:13px;color:${GREY};line-height:1.6">Référence : <code>${esc(p.public_id)}</code></p>`,
      dashboardUrl,
      'Ouvrir la queue admin',
    ),
  }
}

export function adminListingPublished(p: PropertyRecap, siteUrl: string, submitterEmail: string) {
  const adminUrl = `${siteUrl}/admin/properties`
  return {
    subject: `[LOWI Admin] Bien ${p.public_id} mis en ligne`,
    html: shell(
      'Bien listé publiquement',
      `<p style="font-size:14px;line-height:1.6">Le bien <strong>${esc(p.public_id)}</strong> vient d'être passé au statut <strong>active</strong> et apparaît sur /projets.</p>
       <p style="font-size:14px;line-height:1.6"><strong>Soumettant :</strong> ${esc(submitterEmail)}</p>
       ${recapTable(p)}`,
      adminUrl,
      'Voir dans le dashboard',
    ),
  }
}
