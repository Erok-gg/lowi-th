/**
 * Détection MIME par magic bytes (pas de dépendance externe).
 * Couvre : PDF, JPEG, PNG, WebP, HEIC/HEIF.
 *
 * Refactor Sprint 10 post-audit : code dupliqué auparavant entre
 * /api/properties/[id]/photos et /api/properties/[id]/kyb.
 */

export type DetectedMime = { mime: string; ext: string }

const HEIC_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1']

function isPdf(b: Buffer):  boolean { return b[0]===0x25 && b[1]===0x50 && b[2]===0x44 && b[3]===0x46 }                       // %PDF
function isJpeg(b: Buffer): boolean { return b[0]===0xFF && b[1]===0xD8 && b[2]===0xFF }                                       // FF D8 FF
function isPng(b: Buffer):  boolean { return b[0]===0x89 && b[1]===0x50 && b[2]===0x4E && b[3]===0x47 }                       // 89 50 4E 47
function isWebp(b: Buffer): boolean {
  return b[0]===0x52 && b[1]===0x49 && b[2]===0x46 && b[3]===0x46 && b[8]===0x57 && b[9]===0x45 && b[10]===0x42 && b[11]===0x50
} // RIFF????WEBP
function isHeic(b: Buffer): boolean { return b.toString('ascii', 4, 8) === 'ftyp' && HEIC_BRANDS.includes(b.toString('ascii', 8, 12)) }

/**
 * Détecte uniquement les formats image (pas PDF).
 * Utilisé par : property-photos upload.
 */
export function detectImageMime(buf: Buffer): DetectedMime | null {
  if (buf.length < 12) return null
  if (isJpeg(buf)) return { mime: 'image/jpeg', ext: 'jpg' }
  if (isPng(buf))  return { mime: 'image/png',  ext: 'png' }
  if (isWebp(buf)) return { mime: 'image/webp', ext: 'webp' }
  if (isHeic(buf)) return { mime: 'image/heic', ext: 'heic' }
  return null
}

/**
 * Détecte PDF + image. Utilisé par : property-kyb, kyc/upload.
 */
export function detectDocOrImageMime(buf: Buffer): DetectedMime | null {
  if (buf.length < 12) return null
  if (isPdf(buf))  return { mime: 'application/pdf', ext: 'pdf'  }
  if (isJpeg(buf)) return { mime: 'image/jpeg',      ext: 'jpg'  }
  if (isPng(buf))  return { mime: 'image/png',       ext: 'png'  }
  if (isWebp(buf)) return { mime: 'image/webp',      ext: 'webp' }
  if (isHeic(buf)) return { mime: 'image/heic',      ext: 'heic' }
  return null
}
