import { google } from 'googleapis'
import { Readable } from 'stream'

function getDriveClient() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64
  if (!b64) throw new Error('GOOGLE_SERVICE_ACCOUNT_B64 not set')
  const credentials = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'))

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
  return google.drive({ version: 'v3', auth })
}

export async function ensureUserFolder(userEmail: string): Promise<string> {
  const drive = getDriveClient()
  const rootId = process.env.GOOGLE_DRIVE_KYC_FOLDER_ID!
  const folderName = userEmail

  const res = await drive.files.list({
    q: `name='${folderName}' and '${rootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  })

  if (res.data.files?.length) return res.data.files[0].id!

  const { data } = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootId],
    },
    fields: 'id',
  })

  return data.id!
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
