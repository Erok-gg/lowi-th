// E-mails envoyés aux investisseurs, dans leur langue.
import { baseUrl } from './auth'
import { layout, button, esc } from './mail'

export function loginMail(member, token, lang = member.lang || 'en', first = false) {
  const link = `${baseUrl()}/data-room/enter?t=${token}&lang=${lang}`
  const fr = lang === 'fr'
  const title = first
    ? fr ? 'Votre accès à la data room LOWI' : 'Your access to the LOWI data room'
    : fr ? 'Votre lien de connexion' : 'Your sign-in link'
  const intro = first
    ? fr
      ? `Bonjour ${esc(member.name || '')}, votre demande a été acceptée. Ce lien personnel ouvre la data room ; il est valable 72 heures et ne sert qu'une fois.`
      : `Hello ${esc(member.name || '')}, your request has been approved. This personal link opens the data room; it is valid for 72 hours and works once.`
    : fr
      ? 'Ce lien personnel est valable une heure et ne sert qu’une fois.'
      : 'This personal link is valid for one hour and works once.'
  const note = fr
    ? 'Chaque document est filigrané à votre nom à l’ouverture et chaque consultation est journalisée. Merci de ne pas transférer ce lien.'
    : 'Every document is watermarked with your name when opened, and every consultation is logged. Please do not forward this link.'
  return {
    to: member.email,
    subject: title,
    html: layout(title, `<p>${intro}</p>${button(link, fr ? 'Ouvrir la data room' : 'Open the data room')}<p style="color:#7C828D;font-size:13px;margin-top:24px">${note}</p>`),
    text: `${intro}\n\n${link}\n\n${note}`,
  }
}
