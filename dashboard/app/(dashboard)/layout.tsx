'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const TREE = [
  {
    key: 'projects', label: 'Projects', icon: '📁',
    children: [
      { key: 'projects/active',   label: 'Active',   href: '/projects/active' },
      { key: 'projects/pipeline', label: 'Pipeline', href: '/projects/pipeline' },
      { key: 'projects/closed',   label: 'Closed',   href: '/projects/closed' },
    ]
  },
  {
    key: 'users', label: 'Users', icon: '📁',
    children: [
      { key: 'users',          label: 'Active Users', href: '/users' },
      { key: 'users/waitlist', label: 'Waitlist',     href: '/users/waitlist' },
    ]
  },
  { key: 'kyc', label: 'My KYC', icon: '🪪', href: '/kyc', children: [] },
  {
    key: 'accounting', label: 'Accounting', icon: '📁',
    children: [
      { key: 'accounting/spv',         label: 'SPV',          href: '/accounting/spv' },
      { key: 'accounting/distributions',label: 'Distributions',href: '/accounting/distributions' },
    ]
  },
  {
    key: 'submissions', label: 'Submissions', icon: '📁',
    children: [
      { key: 'submissions/kyc',      label: 'Pending KYC', href: '/submissions/kyc' },
      { key: 'submissions/approved', label: 'Approved',    href: '/submissions/approved' },
    ]
  },
  {
    key: 'sui', label: 'SUI', icon: '⛓',
    children: [
      { key: 'sui/collections', label: 'Collections', href: '/sui/collections' },
      { key: 'sui/nfts',        label: 'NFTs',        href: '/sui/nfts' },
    ]
  },
  { key: 'bin', label: 'Bin', icon: '🗑️', href: '/bin', children: [] },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [user, setUser]       = useState<{ email?: string } | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['users']))
  const [time, setTime]       = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB'))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function toggleFolder(key: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // Determine active key from pathname
  const activeKey = pathname === '/' ? 'users'
    : pathname.startsWith('/users/waitlist') ? 'users/waitlist'
    : pathname.startsWith('/users') ? 'users'
    : pathname.slice(1).replace(/\//g, '/')

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Title bar ── */}
      <div className="win-titlebar" style={{ flexShrink: 0 }}>
        <span>🖥 LOWI Admin Dashboard</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <span style={{ opacity: 0.7 }}>{user?.email}</span>
          <button
            onClick={handleLogout}
            className="win-titlebar-btn"
            style={{ width: 'auto', padding: '0 6px', fontSize: 11 }}
          >
            Sign out
          </button>
          <button className="win-titlebar-btn">_</button>
          <button className="win-titlebar-btn">□</button>
          <button className="win-titlebar-btn">×</button>
        </div>
      </div>

      {/* ── Menu bar ── */}
      <div className="win-menubar" style={{ flexShrink: 0 }}>
        <span className="win-menu-item">File</span>
        <span className="win-menu-item">Edit</span>
        <span className="win-menu-item">View</span>
        <span className="win-menu-item">Tools</span>
        <span className="win-menu-item">Help</span>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', borderTop: '1px solid var(--win-border-lt)' }}>

        {/* ── Sidebar ── */}
        <div style={{
          width: 190,
          flexShrink: 0,
          background: 'var(--win-bg)',
          borderRight: '2px solid',
          borderColor: 'var(--win-border-dk) var(--win-border-lt) var(--win-border-lt) var(--win-border-dk)',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
          <div style={{ padding: '4px 0' }}>
            {TREE.map(folder => (
              <div key={folder.key}>
                {/* Folder row */}
                {folder.children.length > 0 ? (
                  <div
                    className={`win-tree-item ${activeKey === folder.key ? 'active' : ''}`}
                    onClick={() => toggleFolder(folder.key)}
                  >
                    <span style={{ fontSize: 10, width: 10, flexShrink: 0 }}>
                      {expanded.has(folder.key) ? '▼' : '▶'}
                    </span>
                    <span>{folder.icon}</span>
                    <span>{folder.label}</span>
                  </div>
                ) : (
                  <Link href={folder.href || '/'} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className={`win-tree-item ${activeKey === folder.key ? 'active' : ''}`}>
                      <span style={{ width: 10, flexShrink: 0 }} />
                      <span>{folder.icon}</span>
                      <span>{folder.label}</span>
                    </div>
                  </Link>
                )}

                {/* Children */}
                {expanded.has(folder.key) && folder.children.map(child => (
                  <Link key={child.key} href={child.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className={`win-tree-item child ${activeKey === child.key ? 'active' : ''}`}>
                      <span style={{ width: 10, flexShrink: 0 }} />
                      <span>📄</span>
                      <span>{child.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {children}
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="win-statusbar" style={{ flexShrink: 0 }}>
        <span>LOWI Admin v1.0</span>
        <span>·</span>
        <span>{user?.email ?? '—'}</span>
        <span style={{ marginLeft: 'auto' }}>{time}</span>
      </div>
    </div>
  )
}
