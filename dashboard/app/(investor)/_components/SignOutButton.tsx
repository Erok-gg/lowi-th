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
        background: 'none',
        border: 'none',
        color: 'var(--inv-muted)',
        fontSize: 11,
        cursor: 'pointer',
        padding: 0,
        fontFamily: 'inherit',
        textDecoration: 'underline',
        textDecorationColor: 'transparent',
        transition: 'color .15s, text-decoration-color .15s',
      }}
      onMouseEnter={e => {
        (e.target as HTMLButtonElement).style.color = 'var(--inv-navy)'
        ;(e.target as HTMLButtonElement).style.textDecorationColor = 'currentColor'
      }}
      onMouseLeave={e => {
        (e.target as HTMLButtonElement).style.color = 'var(--inv-muted)'
        ;(e.target as HTMLButtonElement).style.textDecorationColor = 'transparent'
      }}
    >
      Se déconnecter
    </button>
  )
}
