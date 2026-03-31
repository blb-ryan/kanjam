const SCORE_BUTTONS = [
  { type: 'miss',   label: 'MISS',   points: 0, color: '#3a3f4b', textColor: '#6b7280', emoji: '✗' },
  { type: 'dinger', label: 'DINGER', points: 1, color: '#1a5c1a', textColor: '#a3e635', emoji: '🎯' },
  { type: 'deuce',  label: 'DEUCE',  points: 2, color: '#0a3d6b', textColor: '#1a8cff', emoji: '💥' },
  { type: 'bucket', label: 'BUCKET', points: 3, color: '#5c3a00', textColor: '#ff6b1a', emoji: '🪣' },
]

export default function ScoringButtons({ onScore, disabled }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {SCORE_BUTTONS.map(btn => (
          <button
            key={btn.type}
            onClick={() => onScore(btn.type)}
            disabled={disabled}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              minHeight: 96,
              borderRadius: 'var(--radius-lg)',
              background: btn.color,
              border: `2px solid ${btn.textColor}33`,
              cursor: 'pointer',
              transition: 'transform 0.1s, box-shadow 0.1s',
              boxShadow: `0 6px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)`,
              userSelect: 'none',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.94)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: '1.6rem' }}>{btn.emoji}</span>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.1rem',
              letterSpacing: '0.08em',
              color: btn.textColor,
            }}>
              {btn.label}
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: `${btn.textColor}99`,
              fontWeight: 600,
            }}>
              {btn.points === 0 ? '0 pts' : `+${btn.points} pt${btn.points > 1 ? 's' : ''}`}
            </span>
          </button>
        ))}
      </div>

      {/* Instant Win — full width, special */}
      <button
        onClick={() => onScore('instant_win')}
        disabled={disabled}
        style={{
          width: '100%',
          minHeight: 72,
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(90deg, #3d2a00, #5c3f00, #3d2a00)',
          border: '2px solid #ffd60088',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          boxShadow: '0 6px 30px rgba(255,214,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
          transition: 'transform 0.1s, box-shadow 0.1s',
          userSelect: 'none',
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 6px 30px rgba(255,214,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)' }}
        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
        onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ fontSize: '1.8rem' }}>⚡</span>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            letterSpacing: '0.1em',
            color: 'var(--color-yellow)',
          }}>
            INSTANT WIN
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,214,0,0.6)' }}>
            Disc through the slot — game over!
          </div>
        </div>
        <span style={{ fontSize: '1.8rem' }}>⚡</span>
      </button>
    </div>
  )
}
