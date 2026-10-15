// Dépose ou remplace un fichier dans la data room, depuis le poste local.
// Passe par la base directement : pas de limite de 4,5 Mo comme une requête
// HTTP vers Vercel.
//
//   npm run dataroom:upload -- docs/model.pdf --folder methodology --title "How the maths works" --key
//   npm run dataroom:upload -- README.md --folder start --title "Read me first" --pin
//   npm run dataroom:upload -- README.fr.md --folder start --name README.md --lang fr   (version FR d'un markdown)
//
// Options : --folder <slug> (obligatoire) · --title / --title-fr · --desc / --desc-fr
//           --name <nom affiché> · --key (document clé) · --pin (carte read-me) · --lang fr · --sort <n>
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

const args = process.argv.slice(2)
const VALUED = ['--folder', '--title', '--title-fr', '--desc', '--desc-fr', '--name', '--lang', '--sort']
const file = args.find((a, i) => !a.startsWith('--') && !VALUED.includes(args[i - 1]))
const opt = (k) => {
  const i = args.indexOf('--' + k)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null
}
const flag = (k) => args.includes('--' + k)

if (!file || !fs.existsSync(file) || !opt('folder')) {
  console.error('Usage : npm run dataroom:upload -- <fichier> --folder <slug> [--title "…"] [--key] [--pin] [--lang fr]')
  process.exit(1)
}

const ext = path.extname(file).toLowerCase()
const kind = ext === '.pdf' ? 'pdf' : ext === '.md' ? 'markdown' : 'other'
const MIME = { '.pdf': 'application/pdf', '.md': 'text/markdown', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.csv': 'text/csv' }
const name = opt('name') || path.basename(file)
const fr = opt('lang') === 'fr'
const buf = fs.readFileSync(file)
if (kind === 'pdf' && buf.length > 4.4 * 1024 * 1024)
  console.warn(`⚠ ${(buf.length / 1048576).toFixed(1)} Mo : au-delà de 4,5 Mo, Vercel refusera de servir le PDF filigrané. Compresser avant.`)

const c = new pg.Client({ connectionString: process.env.DATAROOM_DATABASE_URL, ssl: { rejectUnauthorized: false } })
await c.connect()
try {
  const folder = await c.query('select 1 from dataroom.folders where slug=$1', [opt('folder')])
  if (!folder.rowCount) throw new Error(`dossier inconnu : ${opt('folder')}`)
  const title = opt('title') || name.replace(/\.[^.]+$/, '')

  if (kind === 'markdown' && fr) {
    const r = await c.query(
      'update dataroom.files set body_md_fr=$3, title_fr=coalesce($4,title_fr), updated_at=now() where folder=$1 and name=$2',
      [opt('folder'), name, buf.toString('utf8'), opt('title-fr') || opt('title')],
    )
    if (!r.rowCount) throw new Error("version anglaise absente : déposer d'abord le fichier EN avec le même --name")
    console.log(`✓ version française de ${name} enregistrée`)
  } else {
    const r = await c.query(
      `insert into dataroom.files (folder, name, title_en, title_fr, desc_en, desc_fr, kind, mime, body_md_en, content, size_bytes, highlighted, pinned, sort)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       on conflict (folder, name) do update set title_en=excluded.title_en, title_fr=coalesce(excluded.title_fr, files.title_fr),
         desc_en=coalesce(excluded.desc_en, files.desc_en), desc_fr=coalesce(excluded.desc_fr, files.desc_fr),
         kind=excluded.kind, mime=excluded.mime, body_md_en=excluded.body_md_en, content=excluded.content,
         size_bytes=excluded.size_bytes, highlighted=files.highlighted or excluded.highlighted,
         pinned=files.pinned or excluded.pinned, updated_at=now()
       returning id, (xmax = 0) as inserted`,
      [
        opt('folder'), name, title, opt('title-fr'), opt('desc'), opt('desc-fr'), kind, MIME[ext] || 'application/octet-stream',
        kind === 'markdown' ? buf.toString('utf8') : null, kind === 'markdown' ? null : buf, buf.length,
        flag('key'), flag('pin'), Number(opt('sort') || 0),
      ],
    )
    console.log(`✓ ${r.rows[0].inserted ? 'ajouté' : 'remplacé'} : ${opt('folder')}/${name} (${(buf.length / 1024).toFixed(0)} Ko) — id ${r.rows[0].id}`)
  }
} catch (e) {
  console.error('✗', e.message)
  process.exitCode = 1
} finally {
  await c.end()
}
