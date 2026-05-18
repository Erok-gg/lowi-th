type Props = {
  icon: string
  title: string
  description?: string
  sprintRef?: string
}

export default function ComingSoon({ icon, title, description, sprintRef }: Props) {
  return (
    <div className="win-panel" style={{ height: '100%' }}>
      <div className="win-titlebar">
        <span>{icon} {title}</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>Under construction</span>
      </div>

      <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
        <div className="win-inset" style={{ padding: '32px 40px', background: 'var(--win-bg)', textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🚧</div>
          <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
            {title} — Coming soon
          </div>
          <div style={{ fontSize: 12, color: 'var(--win-text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
            {description ?? 'This module is being built. It will appear here when ready.'}
          </div>
          {sprintRef && (
            <div style={{ fontSize: 11, color: 'var(--win-text-muted)', borderTop: '1px solid var(--win-border-lt)', paddingTop: 12, marginTop: 8 }}>
              Planned: <strong>{sprintRef}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
