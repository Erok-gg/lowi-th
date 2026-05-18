import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_SIZE      = 25 * 1024 * 1024    // 25 Mo
const BUCKET        = 'property-kyb'
const SIGNED_TTL    = 3600                // 1h
const DOC_TYPES     = ['passport', 'title_deed', 'company_dbd', 'director_nomination'] as const
type DocType        = typeof DOC_TYPES[number]

// Validation magic bytes : PDF / JPEG / PNG
function detectMime(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length < 8) return null
  // PDF : %PDF
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
    return { mime: 'application/pdf', ext: 'pdf' }
  }
  // JPEG : FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) {
    return { mime: 'image/jpeg', ext: 'jpg' }
  }
  // PNG : 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
    return { mime: 'image/png', ext: 'png' }
  }
  return null
}

// GET /api/properties/[id]/kyb — liste docs + URLs signées
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // RLS filtre par owner ; on récupère aussi le statut de la property pour l'UI
  const { data: prop } = await supabase
    .from('properties')
    .select('id, public_id, status, kyb_requested_at')
    .eq('id', id)
    .single()

  if (!prop) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: docs, error } = await supabase
    .from('property_kyb_documents')
    .select('id, doc_type, storage_path, status, rejection_reason, uploaded_at, reviewed_at')
    .eq('property_id', id)
    .order('uploaded_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // URLs signées via admin client (bucket privé)
  const admin = createAdminClient()
  const withUrls = await Promise.all((docs ?? []).map(async d => {
    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(d.storage_path, SIGNED_TTL)
    return { ...d, signed_url: signed?.signedUrl ?? null }
  }))

  return NextResponse.json({ property: prop, docs: withUrls })
}

// POST /api/properties/[id]/kyb — upload doc (multipart : file + doc_type)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Ownership + statut accepted requis (RLS le ferait aussi mais on veut un message clair)
  const { data: prop } = await supabase
    .from('properties')
    .select('id, public_id, status')
    .eq('id', id)
    .single()

  if (!prop) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (prop.status !== 'accepted') {
    return NextResponse.json({ error: 'Upload KYB autorisé uniquement après acceptation' }, { status: 403 })
  }

  let formData: FormData
  try { formData = await req.formData() } catch {
    return NextResponse.json({ error: 'Multipart invalide' }, { status: 400 })
  }

  const docType = formData.get('doc_type') as string | null
  const file    = formData.get('file') as File | null
  if (!docType || !DOC_TYPES.includes(docType as DocType)) {
    return NextResponse.json({ error: 'doc_type invalide' }, { status: 400 })
  }
  if (!file) return NextResponse.json({ error: 'Champ "file" manquant' }, { status: 400 })
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 25 Mo)' }, { status: 400 })
  }

  const buffer  = Buffer.from(await file.arrayBuffer())
  const detected = detectMime(buffer)
  if (!detected) {
    return NextResponse.json({ error: 'Format invalide. PDF, JPEG ou PNG uniquement.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Si un doc existe déjà pour ce type → on le remplace (storage + DB)
  const { data: existing } = await supabase
    .from('property_kyb_documents')
    .select('id, storage_path')
    .eq('property_id', id)
    .eq('doc_type', docType)
    .maybeSingle()

  if (existing) {
    await admin.storage.from(BUCKET).remove([existing.storage_path])
    await supabase.from('property_kyb_documents').delete().eq('id', existing.id)
  }

  // Upload
  const storagePath = `${prop.public_id}/${docType}/${randomUUID()}.${detected.ext}`
  const { error: storageErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: detected.mime, upsert: false })

  if (storageErr) return NextResponse.json({ error: storageErr.message }, { status: 500 })

  // Insert DB (RLS : owner + status='accepted')
  const { data: doc, error: dbErr } = await supabase
    .from('property_kyb_documents')
    .insert({
      property_id:  id,
      doc_type:     docType,
      storage_path: storagePath,
      status:       'pending',
    })
    .select('id, doc_type, storage_path, status, uploaded_at')
    .single()

  if (dbErr) {
    await admin.storage.from(BUCKET).remove([storagePath]) // rollback
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  return NextResponse.json(doc, { status: 201 })
}

// DELETE /api/properties/[id]/kyb — body { doc_id } — supprime un doc
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const docId = typeof body.doc_id === 'string' ? body.doc_id : null
  if (!docId) return NextResponse.json({ error: 'doc_id requis' }, { status: 400 })

  // Vérif ownership + statut
  const { data: prop } = await supabase
    .from('properties')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!prop) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (prop.status !== 'accepted') {
    return NextResponse.json({ error: 'Suppression non autorisée pour ce statut' }, { status: 403 })
  }

  const { data: doc } = await supabase
    .from('property_kyb_documents')
    .select('id, storage_path')
    .eq('id', docId)
    .eq('property_id', id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Doc introuvable' }, { status: 404 })

  const admin = createAdminClient()
  await admin.storage.from(BUCKET).remove([doc.storage_path])

  const { error } = await supabase.from('property_kyb_documents').delete().eq('id', docId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
