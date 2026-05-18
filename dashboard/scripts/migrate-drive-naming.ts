/**
 * Sprint 9 — Renommer les dossiers Google Drive KYC du naming
 * historique `firstname_lastname` vers `usr_xxx` (profiles.public_id).
 *
 * Usage :
 *   npx tsx scripts/migrate-drive-naming.ts             # dry-run (par défaut)
 *   npx tsx scripts/migrate-drive-naming.ts --apply     # exécution réelle
 *
 * Variables d'env requises (lues depuis .env.local) :
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_SERVICE_ACCOUNT_B64
 *   GOOGLE_DRIVE_KYC_FOLDER_ID
 *
 * Comportement :
 *   - Liste toutes les kyc_submissions avec drive_folder_id non null
 *   - Pour chaque, récupère profiles.public_id et le nom courant du dossier Drive
 *   - Si nom != public_id → rename via Drive API
 *   - Folder_id stable, fichiers inchangés
 *   - Skip si folder introuvable / trashed (log)
 *   - Skip si public_id absent (log warning)
 *
 * Idempotent : peut être relancé sans risque.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { getDriveFolderName, renameDriveFolder } from '../lib/google-drive'

config({ path: '.env.local' })

const APPLY = process.argv.includes('--apply')

type Row = {
  id: string
  user_id: string
  drive_folder_id: string | null
  first_name: string | null
  last_name: string | null
}

async function main() {
  console.log(`\n📁 Drive naming migration — mode: ${APPLY ? '🟢 APPLY' : '🟡 DRY-RUN'}`)
  console.log('   (passe --apply pour exécuter les renames)\n')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants')
    process.exit(1)
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  // 1) Charger les submissions avec dossier Drive existant
  const { data: subs, error } = await supabase
    .from('kyc_submissions')
    .select('id, user_id, drive_folder_id, first_name, last_name')
    .not('drive_folder_id', 'is', null)

  if (error) {
    console.error('❌ Erreur fetch kyc_submissions :', error.message)
    process.exit(1)
  }

  if (!subs || subs.length === 0) {
    console.log('✓ Aucune submission avec drive_folder_id. Rien à faire.')
    return
  }

  console.log(`Trouvé ${subs.length} submission(s) avec dossier Drive.\n`)

  // 2) Récupérer les public_id correspondants en bulk
  const userIds = subs.map((s: Row) => s.user_id)
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, public_id')
    .in('id', userIds)

  if (profErr) {
    console.error('❌ Erreur fetch profiles :', profErr.message)
    process.exit(1)
  }

  const publicIdMap = new Map<string, string>()
  for (const p of profiles ?? []) {
    if (p.public_id) publicIdMap.set(p.id, p.public_id)
  }

  // 3) Itérer
  let renamed   = 0
  let alreadyOk = 0
  let skipped   = 0
  let errors    = 0

  for (const sub of subs as Row[]) {
    const publicId = publicIdMap.get(sub.user_id)
    if (!publicId) {
      console.log(`⚠ ${sub.id} — pas de public_id pour user ${sub.user_id}. SKIP.`)
      skipped++
      continue
    }

    const folderId = sub.drive_folder_id!
    const oldLabel = [sub.first_name, sub.last_name].filter(Boolean).join('_') || '?'

    const currentName = await getDriveFolderName(folderId)
    if (currentName === null) {
      console.log(`⚠ ${publicId} — dossier Drive ${folderId} introuvable / trashed. SKIP.`)
      skipped++
      continue
    }

    if (currentName === publicId) {
      console.log(`✓ ${publicId} — déjà au bon nom`)
      alreadyOk++
      continue
    }

    console.log(`${APPLY ? '🔄' : '   '} ${publicId} — "${currentName}" (${oldLabel}) → "${publicId}"`)

    if (APPLY) {
      try {
        await renameDriveFolder(folderId, publicId)
        renamed++
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.log(`   ❌ Échec rename : ${msg}`)
        errors++
      }
    } else {
      renamed++ // compté comme "to-rename" en dry-run
    }
  }

  console.log(`\n${'═'.repeat(50)}`)
  if (APPLY) {
    console.log(`✓ Terminé.  Renommés: ${renamed} · Déjà OK: ${alreadyOk} · Skipped: ${skipped} · Erreurs: ${errors}`)
  } else {
    console.log(`🟡 DRY-RUN.  À renommer: ${renamed} · Déjà OK: ${alreadyOk} · Skipped: ${skipped}`)
    console.log('   Relance avec --apply pour exécuter.')
  }
  console.log('')
}

main().catch(e => {
  console.error('💥 Erreur fatale :', e)
  process.exit(1)
})
