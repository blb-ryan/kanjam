import { getPrefs } from '../utils/prefs'
import { playSound } from '../utils/sounds'
import { haptic } from '../utils/haptics'

const SCORE_BUTTONS = [
  { type: 'miss',   label: 'MISS',   points: 0, color: '#3a3f4b', textColor: '#6b7280', emoji: '✗' },
  { type: 'dinger', label: 'DINGER', points: 1, color: '#1a5c1a', textColor: '#a3e635', emoji: '🎯' },
  { type: 'deuce',  label: 'DEUCE',  points: 2, color: '#0a3d6b', textColor: '#1a8cff', emoji: '💥' },
  { type: 'bucket', label: 'BUCKET', points: 3, color: '#5c3a00', textColor: '#ff6b1a', emoji: '🪣' },
]

export default function ScoringButtons({ onScore, disabled }) {
  const handleScore = (type) => {
    const prefs = getPrefs()
    haptic(type, prefs.hapticEnabled)
    playSound(type, prefs.soundEnabled)
    onScore(type)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {SCORE_BUTTONS.map(btn => (
          <button
            key={btn.type}
            onClick={() => handleScore(btn.type)}
            disabled={disabled}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              minHeight: 116,
              borderRadius: 'var(--radius-lg)',
              background: btn.color,
              border: `2px solid ${btn.textColor}33`,
              cursor: 'pointer',
              transition: 'transform 0.1s, box-shadow 0.1s',
              boxShadow: `0 6px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)`,
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.94)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: '2rem' }}>{btn.emoji}</span>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              letterSpacing: '0.08em',
              color: btn.textColor,
            }}>
              {btn.label}
            </span>
            <span style={{
              fontSize: '0.8rem',
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
        onClick={() => handleScore('instant_win')}
        disabled={disabled}
        style={{
          width: '100%',
          minHeight: 80,
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
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
        onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ fontSize: '2rem' }}>⚡</span>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.3rem',
            letterSpacing: '0.1em',
            color: 'var(--color-yellow)',
          }}>
            INSTANT WIN
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,214,0,0.6)' }}>
            Disc through the slot — game over!
          </div>
        </div>
        <span style={{ fontSize: '2rem' }}>⚡</span>
      </button>
    </div>
  )
}
