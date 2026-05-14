import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="win-panel" style={{ height: '100%' }}>
      <div className="win-titlebar">
        <span>📁 Users — Active</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>{users?.length ?? 0} user(s)</span>
      </div>

      <div style={{ padding: 8 }}>
        <div className="win-inset" style={{ marginBottom: 8, padding: '4px 8px', background: 'var(--win-bg)' }}>
          <span style={{ fontSize: 12 }}>
            📂 All users with dashboard access. Manage permissions in <strong>Manage Users</strong>.
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="win-table">
            <thead>
              <tr>
                <th style={{ width: 24 }}>#</th>
                <th>Email</th>
                <th>Display Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {!users?.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--win-text-muted)' }}>
                    No users found.
                  </td>
                </tr>
              )}
              {users?.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--win-text-muted)' }}>{i + 1}</td>
                  <td><strong>{u.email}</strong></td>
                  <td>{u.display_name ?? <span style={{ color: 'var(--win-text-muted)' }}>—</span>}</td>
                  <td>
                    {u.is_superadmin
                      ? <span style={{ color: 'var(--win-navy)', fontWeight: 'bold' }}>⭐ Superadmin</span>
                      : <span style={{ color: 'var(--win-text-muted)' }}>User</span>}
                  </td>
                  <td>
                    {u.is_active
                      ? <span className="win-badge win-badge-approved">Active</span>
                      : <span className="win-badge win-badge-pending">Inactive</span>}
                  </td>
                  <td style={{ color: 'var(--win-text-muted)', fontSize: 11 }}>{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
