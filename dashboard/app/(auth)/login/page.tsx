import { redirect } from 'next/navigation'

// Ancien login staff — redirige vers /dashboard/login (nouvelle URL).
// On garde la route pour ne pas casser bookmarks / liens email externes.
export default function LegacyLoginRedirect() {
  redirect('/dashboard/login')
}
