import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureUserFolder, uploadFileToDrive } from '@/lib/google-drive'
import { identityFolderName } from '@/lib/identity'

const ALLOWED_TYPES = ['id_front', 'id_back', 'address_proof', 'selfie', 'fund_origin']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file         = formData.get('file') as File | null
  const documentType = formData.get('document_type') as string | null

  if (!file || !documentType)
    return NextResponse.json({ error: 'Missing file or document_type' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(documentType))
    return NextResponse.json({ error: 'Invalid document_type' }, { status: 400 })
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })

  const admin = createAdminClient()

  // Check identity is complete
  const { data: identity } = await admin
    .from('identity_profiles')
    .select('first_name, last_name')
    .eq('user_id', user.id)
    .single()

  if (!identity?.first_name || !identity?.last_name)
    return NextResponse.json({ error: 'Complétez vos informations personnelles avant d\'uploader' }, { status: 400 })

  // Get or create kyc_submission
  let { data: submission } = await admin
    .from('kyc_submissions')
    .select('id, drive_folder_id, status')
    .eq('user_id', user.id)
    .single()

  if (submission?.status === 'approved')
    return NextResponse.json({ error: 'KYC already approved' }, { status: 400 })

  // Ensure Drive folder named prénom_nom
  let folderId = submission?.drive_folder_id
  if (!folderId) {
    const folderName = identityFolderName(identity)
    folderId = await ensureUserFolder(folderName)
  }

  // Upload to Drive
  const buffer   = Buffer.from(await file.arrayBuffer())
  const ext      = file.name.split('.').pop() ?? 'bin'
  const fileName = `${documentType}.${ext}`

  const { id: driveFileId, url: driveFileUrl } = await uploadFileToDrive(
    folderId,
    fileName,
    file.type || 'application/octet-stream',
    buffer
  )

  // Create submission if needed
  if (!submission) {
    const { data: newSub } = await admin
      .from('kyc_submissions')
      .insert({ user_id: user.id, email: user.email!, drive_folder_id: folderId })
      .select('id, drive_folder_id, status')
      .single()
    submission = newSub
  } else if (!submission.drive_folder_id) {
    await admin
      .from('kyc_submissions')
      .update({ drive_folder_id: folderId })
      .eq('id', submission!.id)
  }

  // Reset to incomplete if previously rejected
  if (submission?.status === 'rejected') {
    await admin
      .from('kyc_submissions')
      .update({ status: 'incomplete', rejection_reason: null })
      .eq('id', submission!.id)
  }

  // Upsert document record
  await admin
    .from('kyc_documents')
    .upsert({
      submission_id:  submission!.id,
      user_id:        user.id,
      document_type:  documentType,
      drive_file_id:  driveFileId,
      drive_file_url: driveFileUrl,
      file_name:      file.name,
      uploaded_at:    new Date().toISOString(),
    }, { onConflict: 'submission_id,document_type' })

  return NextResponse.json({ ok: true, drive_file_url: driveFileUrl })
}
