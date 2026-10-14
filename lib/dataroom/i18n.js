// Textes de la data room. L'anglais est la langue de départ ; le français est
// prévu dès maintenant (même clés) pour qu'aucun texte ne soit codé en dur dans
// les pages. Langue : ?lang=fr|en, sinon cookie dr_lang, sinon anglais.
import { cookies } from 'next/headers'

export const LANGS = ['en', 'fr']

const dict = {
  en: {
    title: 'Data Room',
    tagline: 'Due-diligence documents for prospective investors.',
    requestTitle: 'Request access',
    requestIntro:
      'Access is granted individually. Tell us who you are; you will receive a personal sign-in link by e-mail once your request is approved.',
    name: 'Full name',
    email: 'E-mail',
    company: 'Company or fund (optional)',
    message: 'Message (optional)',
    submitRequest: 'Request access',
    requestSent:
      'Thank you. Your request has been sent. You will receive an e-mail as soon as it is reviewed.',
    haveAccess: 'Already approved?',
    linkIntro: 'Enter your e-mail to receive a new sign-in link.',
    sendLink: 'Send me a link',
    linkSent: 'If this address has access, a sign-in link is on its way. It is valid for one hour.',
    invalid: 'Please check the form: name and a valid e-mail are required.',
    error: 'Something went wrong. Please try again in a moment.',
    confidentiality:
      'Every document is watermarked with your name and the date when opened, and every consultation is logged.',
    allFiles: 'All files',
    highlighted: 'Key documents',
    folders: 'Folders',
    colName: 'Name',
    colFolder: 'Folder',
    colUpdated: 'Updated',
    colSize: 'Size',
    empty: 'No documents here yet.',
    open: 'Open',
    download: 'Download',
    back: 'Back to the data room',
    signOut: 'Sign out',
    signedInAs: 'Signed in as',
    admin: 'Admin',
    enterTitle: 'Your access to the LOWI data room',
    enterIntro: 'Click below to open the data room on this device.',
    enterBtn: 'Enter the data room',
    enterInvalid: 'This link has expired or has already been used. Request a new one below.',
    key: 'Key document',
    readme: 'Read me first',
    watermarkNote: 'Watermarked for',
  },
  fr: {
    title: 'Data room',
    tagline: 'Documents de due diligence pour les investisseurs.',
    requestTitle: 'Demander un accès',
    requestIntro:
      "L'accès est accordé individuellement. Présentez-vous ; vous recevrez un lien de connexion personnel par e-mail dès que votre demande sera validée.",
    name: 'Nom complet',
    email: 'E-mail',
    company: 'Société ou fonds (facultatif)',
    message: 'Message (facultatif)',
    submitRequest: "Demander l'accès",
    requestSent: 'Merci. Votre demande a été envoyée. Vous recevrez un e-mail dès son examen.',
    haveAccess: 'Déjà validé ?',
    linkIntro: 'Saisissez votre e-mail pour recevoir un nouveau lien de connexion.',
    sendLink: 'Recevoir un lien',
    linkSent: "Si cette adresse a un accès, un lien de connexion est en route. Il est valable une heure.",
    invalid: 'Vérifiez le formulaire : le nom et un e-mail valide sont requis.',
    error: 'Une erreur est survenue. Réessayez dans un instant.',
    confidentiality:
      "Chaque document est filigrané à votre nom et à la date d'ouverture, et chaque consultation est journalisée.",
    allFiles: 'Tous les fichiers',
    highlighted: 'Documents clés',
    folders: 'Dossiers',
    colName: 'Nom',
    colFolder: 'Dossier',
    colUpdated: 'Mis à jour',
    colSize: 'Taille',
    empty: 'Aucun document ici pour le moment.',
    open: 'Ouvrir',
    download: 'Télécharger',
    back: 'Retour à la data room',
    signOut: 'Se déconnecter',
    signedInAs: 'Connecté en tant que',
    admin: 'Admin',
    enterTitle: 'Votre accès à la data room LOWI',
    enterIntro: 'Cliquez ci-dessous pour ouvrir la data room sur cet appareil.',
    enterBtn: 'Entrer dans la data room',
    enterInvalid: 'Ce lien a expiré ou a déjà servi. Demandez-en un nouveau ci-dessous.',
    key: 'Document clé',
    readme: 'À lire en premier',
    watermarkNote: 'Filigrané pour',
  },
}

export async function getLang(searchParams) {
  const sp = searchParams ? await searchParams : {}
  if (LANGS.includes(sp?.lang)) return sp.lang
  const c = (await cookies()).get('dr_lang')?.value
  return LANGS.includes(c) ? c : 'en'
}

export const t = (lang) => dict[lang] || dict.en

// Champ localisé d'une ligne : title_fr si présent, sinon title_en.
export const loc = (row, field, lang) => (lang === 'fr' && row[`${field}_fr`]) || row[`${field}_en`]
