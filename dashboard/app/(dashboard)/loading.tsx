export default function DashboardLoading() {
  return (
    <div className="win-panel" style={{ height: '100%' }}>
      <div className="win-titlebar">
        <span>⌛ Loading…</span>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 320,
        padding: 24,
      }}>
        <div
          aria-hidden
          style={{
            fontSize: 48,
            animation: 'win-hourglass 1.2s steps(2, end) infinite',
            transformOrigin: 'center',
          }}
        >
          ⌛
        </div>
        <div style={{ marginTop: 16, fontSize: 12, color: 'var(--win-text-muted)' }}>
          Please wait…
        </div>
        <style>{`
          @keyframes win-hourglass {
            0%   { transform: rotate(0deg); }
            50%  { transform: rotate(180deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}
