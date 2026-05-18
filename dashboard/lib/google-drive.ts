import { google, drive_v3 } from 'googleapis'
import { Readable } from 'stream'

export function getDriveClient(): drive_v3.Drive {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64
  if (!b64) throw new Error('GOOGLE_SERVICE_ACCOUNT_B64 not set')
  const credentials = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'))

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  return google.drive({ version: 'v3', auth })
}

/**
 * Crée ou retourne le dossier Drive du user identifié par son public_id (usr_xxx).
 * Convention : KYC/{usr_xxx}/
 *
 * NB : depuis Sprint 9 le naming est `usr_xxx` (Stripe-style). Avant c'était
 * `firstname_lastname` — voir `scripts/migrate-drive-naming.ts` pour la migration.
 */
export async function ensureUserFolder(publicId: string): Promise<string> {
  if (!/^usr_[A-Za-z0-9]+$/.test(publicId)) {
    throw new Error(`ensureUserFolder: publicId invalide (attendu usr_xxx) : ${publicId}`)
  }

  const drive = getDriveClient()
  const rootId = process.env.GOOGLE_DRIVE_KYC_FOLDER_ID!

  // Échappement basique des quotes pour la requête Drive
  const safeName = publicId.replace(/'/g, "\\'")
  const res = await drive.files.list({
    q: `name='${safeName}' and '${rootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  })

  if (res.data.files?.length) return res.data.files[0].id!

  const { data } = await drive.files.create({
    requestBody: {
      name: publicId,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootId],
    },
    fields: 'id',
  })

  return data.id!
}

/**
 * Renomme un dossier Drive existant. Garde le même folder_id, met juste à jour le nom.
 * Utilisé par le script de migration Sprint 9.
 */
export async function renameDriveFolder(folderId: string, newName: string): Promise<void> {
  const drive = getDriveClient()
  await drive.files.update({
    fileId: folderId,
    requestBody: { name: newName },
  })
}

/**
 * Récupère le nom courant d'un dossier Drive (pour comparer avant rename).
 * Retourne null si le folder n'existe pas / inaccessible.
 */
export async function getDriveFolderName(folderId: string): Promise<string | null> {
  try {
    const drive = getDriveClient()
    const { data } = await drive.files.get({ fileId: folderId, fields: 'name, trashed' })
    if (data.trashed) return null
    return data.name ?? null
  } catch {
    return null
  }
}

export async function uploadFileToDrive(
  folderId: string,
  fileName: string,
  mimeType: string,
  buffer: Buffer
): Promise<{ id: string; url: string }> {
  const drive = getDriveClient()

  const stream = Readable.from(buffer)

  const { data } = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: stream },
    fields: 'id, webViewLink',
  })

  return { id: data.id!, url: data.webViewLink! }
}
