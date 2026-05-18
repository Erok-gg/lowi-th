'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/invest/login')
  }
  return (
    <button
      onClick={handleSignOut}
      style={{
        background: 'none', border: 'none', padding: 0,
        color: 'var(--inv-muted)', fontSize: 12, cursor: 'pointer',
        textDecoration: 'underline', textDecorationColor: 'transparent',
        transition: 'text-decoration-color .15s', fontFamily: 'inherit',
      }}
      onMouseEnter={e => (e.currentTarget.style.textDecorationColor = 'var(--inv-muted)')}
      onMouseLeave={e => (e.currentTarget.style.textDecorationColor = 'transparent')}
    >
      Se déconnecter
    </button>
  )
}
