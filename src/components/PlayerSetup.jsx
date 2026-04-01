import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateUniqueRoomCode } from '../utils/roomCode'

const TEAM_PLACEHOLDERS = [
  ['🔥 Fire Squad', '💧 Water Works'],
  ['🦅 Eagles', '🐻 Bears'],
  ['⚡ Bolts', '🌊 Waves'],
  ['🎯 Dingers', '🪣 Buckets'],
  ['😎 The Pros', '🫡 The Amateurs'],
]

export default function PlayerSetup() {
  const navigate = useNavigate()
  const [team1Name, setTeam1Name] = useState('')
  const [team2Name, setTeam2Name] = useState('')
  const [generating, setGenerating] = useState(false)

  // Pick a random placeholder pair
  const [placeholders] = useState(() => TEAM_PLACEHOLDERS[Math.floor(Math.random() * TEAM_PLACEHOLDERS.length)])

  const canStart = team1Name.trim().length > 0 && team2Name.trim().length > 0

  const handleStart = async () => {
    if (!canStart) return
    setGenerating(true)
    try {
      const roomCode = await generateUniqueRoomCode()
      const t1 = team1Name.trim()
      const t2 = team2Name.trim()
      const team1 = {
        id: crypto.randomUUID(),
        name: t1,
        playerIds: [crypto.randomUUID()],
        playerNames: [t1],
      }
      const team2 = {
        id: crypto.randomUUID(),
        name: t2,
        playerIds: [crypto.randomUUID()],
        playerNames: [t2],
      }
      navigate('/game', { state: { team1, team2, roomCode } })
    } catch {
      setGenerating(false)
    }
  }

  return (
    <div className="screen" style={{ justifyContent: 'center', padding: '24px 20px', gap: 0 }}>
      <button
        className="btn btn-ghost"
        onClick={() => navigate('/')}
        style={{ padding: '8px 4px', minHeight: 0, alignSelf: 'flex-start', marginBottom: 24 }}
      >
        ← Back
      </button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🥏</div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem',
          letterSpacing: '0.06em',
          color: 'var(--color-orange)',
          marginBottom: 6,
        }}>
          NEW GAME
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Name your teams and go
        </p>
      </div>

      {/* Team inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
        <TeamInput
          label="TEAM 1"
          color="var(--color-team1)"
          value={team1Name}
          onChange={setTeam1Name}
          placeholder={placeholders[0]}
          onEnter={() => document.getElementById('team2-input')?.focus()}
        />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>VS</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <TeamInput
          id="team2-input"
          label="TEAM 2"
          color="var(--color-team2)"
          value={team2Name}
          onChange={setTeam2Name}
          placeholder={placeholders[1]}
          onEnter={canStart ? handleStart : undefined}
        />
      </div>

      <button
        className="btn btn-primary"
        onClick={handleStart}
        disabled={!canStart || generating}
        style={{
          width: '100%',
          fontFamily: 'var(--font-display)',
          fontSize: '1.2rem',
          letterSpacing: '0.1em',
          padding: '18px',
          opacity: canStart ? 1 : 0.4,
          transition: 'opacity 0.2s',
        }}
      >
        {generating ? 'STARTING...' : '🥏 START GAME'}
      </button>
    </div>
  )
}

function TeamInput({ label, color, value, onChange, placeholder, onEnter, id }) {
  return (
    <div>
      <div style={{
        fontSize: '0.65rem',
        fontFamily: 'var(--font-display)',
        color,
        letterSpacing: '0.2em',
        marginBottom: 8,
      }}>
        {label}
      </div>
      <input
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
        placeholder={placeholder}
        maxLength={24}
        style={{
          width: '100%',
          padding: '16px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg-elevated)',
          border: `2px solid ${value.trim() ? `${color}88` : 'rgba(255,255,255,0.08)'}`,
          color: 'var(--color-text)',
          fontSize: '1.15rem',
          fontWeight: 700,
          transition: 'border-color 0.2s',
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
