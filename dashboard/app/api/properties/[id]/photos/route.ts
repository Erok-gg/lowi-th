import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const MAX_SIZE    = 10 * 1024 * 1024  // 10 Mo
const MAX_PHOTOS  = 20
const BUCKET      = 'property-photos'

// Validation magic bytes (sans dépendance externe)
function detectImageMime(buf: Buffer): string | null {
  if (buf.length < 12) return null
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg'
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png'
  // WebP: RIFF????WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'image/webp'
  // HEIC/HEIF: ftyp box
  if (buf.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buf.toString('ascii', 8, 12)
    const heicBrands = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1']
    if (heicBrands.includes(brand)) return 'image/heic'
  }
  return null
}

// POST /api/properties/[id]/photos — upload + re-encode webp + strip EXIF
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tooMany = enforceRateLimit(req, { scope: 'photos_post', key: user.id, ...RATE_LIMITS.PHOTOS_POST })
  if (tooMany) return tooMany

  // Vérifier ownership + statut
  const { data: prop } = await supabase
    .from('properties')
    .select('id, public_id, status')
    .eq('id', id)
    .single()

  if (!prop) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['lead', 'reviewing'].includes(prop.status)) {
    return NextResponse.json({ error: 'Upload non autorisé pour ce statut' }, { status: 403 })
  }

  // Vérifier quota
  const { count } = await supabase
    .from('property_photos')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', id)

  if ((count ?? 0) >= MAX_PHOTOS) {
    return NextResponse.json({ error: `Maximum ${MAX_PHOTOS} photos par propriété` }, { status: 400 })
  }

  // Parser multipart
  let formData: FormData
  try { formData = await req.formData() } catch {
    return NextResponse.json({ error: 'Multipart invalide' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Champ "file" manquant' }, { status: 400 })
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 })
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer())

  // Validation MIME via magic bytes
  const mime = detectImageMime(rawBuffer)
  if (!mime) {
    return NextResponse.json({ error: 'Format invalide. JPEG, PNG, WebP ou HEIC acceptés.' }, { status: 400 })
  }

  // Re-encodage sharp : webp, max 2400px, auto-rotate (EXIF orientation), strip EXIF
  let processedBuffer: Buffer
  let info: sharp.OutputInfo
  try {
    const result = await sharp(rawBuffer)
      .rotate()                                                         // auto-rotate selon EXIF, puis EXIF supprimé
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true })
    processedBuffer = result.data
    info = result.info
  } catch {
    return NextResponse.json({ error: 'Impossible de traiter l\'image' }, { status: 400 })
  }

  // Upload vers Supabase Storage (admin client = bypass RLS storage)
  const admin = createAdminClient()
  const storagePath = `${prop.public_id}/${randomUUID()}.webp`

  const { error: storageErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, processedBuffer, { contentType: 'image/webp', upsert: false })

  if (storageErr) return NextResponse.json({ error: storageErr.message }, { status: 500 })

  // Insérer en DB
  const { data: photo, error: dbErr } = await supabase
    .from('property_photos')
    .insert({
      property_id:  id,
      storage_path: storagePath,
      position:     count ?? 0,
      width:        info.width,
      height:       info.height,
    })
    .select()
    .single()

  if (dbErr) {
    await admin.storage.from(BUCKET).remove([storagePath])  // rollback
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  return NextResponse.json(photo, { status: 201 })
}

// DELETE /api/properties/[id]/photos — supprime une photo
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const photoId = typeof body.photo_id === 'string' ? body.photo_id : null
  if (!photoId) return NextResponse.json({ error: 'photo_id requis' }, { status: 400 })

  // Vérifier ownership de la property (RLS)
  const { data: prop } = await supabase
    .from('properties')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!prop) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!['lead', 'reviewing'].includes(prop.status)) {
    return NextResponse.json({ error: 'Suppression non autorisée pour ce statut' }, { status: 403 })
  }

  // Récupérer la photo
  const { data: photo } = await supabase
    .from('property_photos')
    .select('id, storage_path')
    .eq('id', photoId)
    .eq('property_id', id)
    .single()

  if (!photo) return NextResponse.json({ error: 'Photo introuvable' }, { status: 404 })

  // Supprimer du storage
  const admin = createAdminClient()
  await admin.storage.from(BUCKET).remove([photo.storage_path])

  // Supprimer de la DB
  const { error: dbErr } = await supabase
    .from('property_photos')
    .delete()
    .eq('id', photoId)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
