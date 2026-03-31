import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStoredActiveGame } from '../hooks/useGameEngine'
import { VERSION_LABEL } from '../utils/version'
import { getPrefs, setPrefs } from '../utils/prefs'

const NAV_ITEMS = [
  { label: 'Quick Game', icon: '🥏', path: '/setup', color: 'var(--color-orange)' },
  { label: 'Join Game', icon: '🔗', path: '/join', color: 'var(--color-yellow)' },
  { label: 'Tournament', icon: '🏆', path: '/tournament-setup', color: 'var(--color-blue)' },
  { label: 'Game History', icon: '📋', path: '/history', color: 'var(--color-lime)' },
  { label: 'Player Stats', icon: '📊', path: '/stats', color: 'var(--color-yellow)' },
]

export default function Home() {
  const navigate = useNavigate()
  const activeGame = getStoredActiveGame()
  const hasResume = activeGame && activeGame.status === 'active'

  const [isSunMode, setIsSunMode] = useState(() => getPrefs().theme === 'sun')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isSunMode ? 'sun' : 'dark')
    setPrefs({ theme: isSunMode ? 'sun' : 'dark' })
  }, [isSunMode])

  return (
    <div className="screen" style={{ justifyContent: 'space-between', padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', paddingTop: 24, position: 'relative' }}>
        <div style={{
          fontSize: '0.75rem',
          letterSpacing: '0.3em',
          color: 'var(--color-orange)',
          fontFamily: 'var(--font-display)',
          marginBottom: 4,
        }}>
          THE GAME
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(3.5rem, 18vw, 5.5rem)',
          lineHeight: 0.9,
          letterSpacing: '0.04em',
          background: 'linear-gradient(135deg, #ff6b1a 0%, #ffd600 50%, #ff6b1a 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 6,
        }}>
          KAN<br />JAM
        </h1>
        <div style={{
          width: 60,
          height: 3,
          background: 'linear-gradient(90deg, var(--color-orange), var(--color-yellow))',
          borderRadius: 2,
          margin: '0 auto',
        }} />

        {/* Sun / Dark mode toggle */}
        <button
          onClick={() => setIsSunMode(v => !v)}
          title={isSunMode ? 'Switch to dark mode' : 'Switch to sun mode'}
          style={{
            position: 'absolute',
            top: 24,
            right: 0,
            background: isSunMode ? 'rgba(255,214,0,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${isSunMode ? 'rgba(255,214,0,0.4)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '6px 10px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            lineHeight: 1,
          }}
        >
          {isSunMode ? '🌙' : '☀️'}
        </button>
      </div>

      {/* Resume banner */}
      {hasResume && (
        <button
          className="btn"
          onClick={() => navigate('/game')}
          style={{
            background: 'linear-gradient(90deg, var(--color-orange-dark), var(--color-orange))',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            letterSpacing: '0.05em',
            animation: 'pulseGlow 2s ease-in-out infinite',
            '--glow-color': 'var(--color-team1-glow)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          ⚡ RESUME ACTIVE GAME
        </button>
      )}

      {/* Nav grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.path}
            className="card btn"
            onClick={() => navigate(item.path)}
            style={{
              flexDirection: 'column',
              gap: 10,
              padding: '24px 16px',
              minHeight: 110,
              border: `1px solid rgba(255,255,255,0.07)`,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
          >
            <span style={{ fontSize: '2rem' }}>{item.icon}</span>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.9rem',
              letterSpacing: '0.04em',
              color: item.color,
            }}>
              {item.label.toUpperCase()}
            </span>
          </button>
        ))}
      </div>

      <div className="version-badge">{VERSION_LABEL}</div>
    </div>
  )
}
