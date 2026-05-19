/**
 * Email transactionnel via Resend.
 *
 * Sprint email post-audit : envoie email + log dans audit_logs.
 *
 * Notes :
 *  - Avec from=onboarding@resend.dev (test domain), Resend ne livre QUE vers
 *    l'email vérifié du owner du compte Resend. Les autres destinataires
 *    sont silently dropped côté Resend. Pour livrer à tout le monde,
 *    vérifier un domaine custom dans https://resend.com/domains.
 *  - Si RESEND_API_KEY absent (CI build sans key) : log warning + no-op.
 */
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

const FROM     = process.env.RESEND_FROM            || 'onboarding@resend.dev'
const OVERRIDE = process.env.TEST_EMAIL_OVERRIDE    || ''  // si défini, tous les emails partent vers cette adresse (dev/test)

let _resend: Resend | null = null
function client(): Resend | null {
  if (_resend) return _resend
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  _resend = new Resend(key)
  return _resend
}

export type EmailType =
  | 'submission_pending'        // → submitter
  | 'submission_accepted'       // → submitter
  | 'submission_rejected'       // → submitter
  | 'submission_active'         // → submitter
  | 'admin_new_submission'      // → admin
  | 'admin_listing_published'   // → admin

export interface SendEmailArgs {
  to:        string
  subject:   string
  html:      string
  type:      EmailType
  /** optional : public_id de la propriété concernée pour traçabilité audit */
  propertyPublicId?: string | null
  /** optional : id de l'acteur qui a déclenché l'envoi (admin transition, user submit) */
  actorId?: string | null
  actorEmail?: string | null
}

/**
 * Envoie l'email + écrit une entrée audit_logs. Ne throw jamais (les erreurs
 * d'envoi ne doivent pas casser le flow métier).
 *
 * Retourne true si Resend a accepté la requête, false sinon.
 */
export async function sendEmail(args: SendEmailArgs): Promise<boolean> {
  const r = client()
  let ok = false
  let errMsg: string | null = null
  let messageId: string | null = null

  // Test override : redirige tous les emails vers une seule adresse pour QA,
  // avec préfixe sujet pour tracer l'original destinataire.
  const actualTo      = OVERRIDE || args.to
  const actualSubject = OVERRIDE
    ? `[→ ${args.to}] ${args.subject}`
    : args.subject

  if (!r) {
    errMsg = 'RESEND_API_KEY missing — email skipped'
    console.warn('[email]', errMsg, args.type, '→', actualTo)
  } else {
    try {
      const { data, error } = await r.emails.send({
        from:    FROM,
        to:      actualTo,
        subject: actualSubject,
        html:    args.html,
      })
      if (error) {
        errMsg = error.message
        console.error('[email] Resend error', args.type, error.message)
      } else {
        ok = true
        messageId = data?.id ?? null
      }
    } catch (e: unknown) {
      errMsg = e instanceof Error ? e.message : 'unknown'
      console.error('[email] exception', args.type, errMsg)
    }
  }

  // Audit log — toujours, même si l'envoi a échoué (utile pour debug)
  try {
    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      actor_id:    args.actorId ?? null,
      actor_email: args.actorEmail ?? null,
      action:      'email_sent',
      target_type: 'email',
      target_id:   args.propertyPublicId ?? args.to,
      metadata:    {
        type:        args.type,
        to:          args.to,        // original destinataire (avant override)
        delivered_to: actualTo,       // adresse réellement utilisée (peut être override)
        override:    OVERRIDE ? true : false,
        ok,
        message_id:  messageId,
        error:       errMsg,
      },
    })
  } catch (e) {
    console.error('[email] audit log failed', e)
  }

  return ok
}
