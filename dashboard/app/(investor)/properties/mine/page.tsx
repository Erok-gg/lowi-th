import { redirect } from 'next/navigation'

// /properties/mine est désormais intégré dans /profile (hub investor).
// On garde l'URL pour ne pas casser bookmarks / liens existants.
export default function MyPropertiesRedirect() {
  redirect('/profile')
}
