// Filigrane dynamique : chaque PDF est re-généré à l'ouverture avec le nom,
// l'e-mail du lecteur et l'horodatage. Il ne bloque ni capture ni impression —
// rien ne le peut côté navigateur — mais rend toute fuite attribuable.
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'

export async function watermarkPdf(bytes, { name, email, at = new Date() }) {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const stamp = `${name || email} · ${email} · ${at.toISOString().slice(0, 16).replace('T', ' ')} UTC`
  // Helvetica standard ne couvre que WinAnsi : on retire ce qu'elle ne sait pas
  // dessiner (thaï, emoji…) plutôt que de faire échouer tout le document.
  const safe = stamp.replace(/[^\x20-\x7E -ÿ·]/g, '?')
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize()
    const size = Math.max(14, Math.min(width, height) / 22)
    const tw = font.widthOfTextAtSize(safe, size)
    page.drawText(safe, {
      x: width / 2 - (tw / 2) * Math.cos(Math.PI / 6),
      y: height / 2 - (tw / 2) * Math.sin(Math.PI / 6),
      size,
      font,
      color: rgb(0.45, 0.42, 0.62),
      opacity: 0.16,
      rotate: degrees(30),
    })
    page.drawText(`Confidential — prepared for ${safe}`, {
      x: 24,
      y: 14,
      size: 7,
      font,
      color: rgb(0.4, 0.4, 0.45),
      opacity: 0.8,
    })
  }
  return doc.save()
}
