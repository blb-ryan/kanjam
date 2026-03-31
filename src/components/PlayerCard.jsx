export default function PlayerCard({ player, selected, onToggle, teamColor }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 'var(--radius-md)',
        background: selected ? `${teamColor}22` : 'var(--color-bg-elevated)',
        border: selected ? `2px solid ${teamColor}` : '2px solid transparent',
        cursor: 'pointer',
        width: '100%',
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        background: selected ? teamColor : 'var(--color-bg-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: '1rem',
        color: selected ? '#fff' : 'var(--color-text-muted)',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}>
        {player.name[0].toUpperCase()}
      </div>
      <span style={{
        fontWeight: 600,
        color: selected ? 'var(--color-text)' : 'var(--color-text-muted)',
        fontSize: '1rem',
      }}>
        {player.name}
      </span>
      {selected && (
        <span style={{ marginLeft: 'auto', color: teamColor, fontSize: '1.1rem' }}>✓</span>
      )}
    </button>
  )
}
