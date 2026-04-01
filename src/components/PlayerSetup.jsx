import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateUniqueRoomCode } from '../utils/roomCode'
import { createLobby } from '../hooks/useFirestore'

export default function PlayerSetup() {
  const navigate = useNavigate()
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [creating, setCreating] = useState(false)
  const ref2 = useRef(null)

  const canCreate = p1.trim() && p2.trim()

  const handleCreate = async () => {
    if (!canCreate) return
    setCreating(true)
    try {
      const roomCode = await generateUniqueRoomCode()
      const n1 = p1.trim(), n2 = p2.trim()
      const team1 = {
        id: crypto.randomUUID(),
        name: `${n1} + ${n2}`,
        playerIds: [crypto.randomUUID(), crypto.randomUUID()],
        playerNames: [n1, n2],
      }
      await createLobby(roomCode, team1)
      navigate('/lobby', { state: { roomCode, team1 } })
    } catch {
      setCreating(false)
    }
  }

  return (
    <div className="screen" style={{ padding: '20px 20px 32px', gap: 0 }}>
      <button
        className="btn btn-ghost"
        onClick={() => navigate('/')}
        style={{ padding: '8px 4px', minHeight: 0, alignSelf: 'flex-start', marginBottom: 24 }}
      >
        ← Back
      </button>

      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.4rem',
        letterSpacing: '0.06em',
        color: 'var(--color-orange)',
        marginBottom: 6,
      }}>
        YOUR TEAM
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 28, lineHeight: 1.5 }}>
        Enter your names. You'll get a code to share with the other team.
      </p>

      <div style={{
        fontSize: '0.65rem',
        fontFamily: 'var(--font-display)',
        color: 'var(--color-team1)',
        letterSpacing: '0.2em',
        marginBottom: 10,
      }}>
        TEAM 1
      </div>

      <NameInput
        value={p1}
        onChange={setP1}
        placeholder="Player 1"
        color="var(--color-team1)"
        onEnter={() => ref2.current?.focus()}
        autoFocus
      />

      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: '1.1rem',
        color: 'var(--color-team1)',
        opacity: 0.45,
        margin: '6px 0',
      }}>
        +
      </div>

      <NameInput
        inputRef={ref2}
        value={p2}
        onChange={setP2}
        placeholder="Player 2"
        color="var(--color-team1)"
        onEnter={canCreate ? handleCreate : undefined}
      />

      {p1.trim() && p2.trim() && (
        <div style={{
          marginTop: 10,
          textAlign: 'center',
          padding: '7px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(64,196,255,0.07)',
          border: '1px solid rgba(64,196,255,0.25)',
          fontSize: '0.82rem',
          fontWeight: 700,
          color: 'var(--color-team1)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {p1.trim()} + {p2.trim()}
        </div>
      )}

      <div style={{ flex: 1 }} />

      <button
        className="btn btn-primary"
        onClick={handleCreate}
        disabled={!canCreate || creating}
        style={{
          width: '100%',
          fontFamily: 'var(--font-display)',
          fontSize: '1.2rem',
          letterSpacing: '0.1em',
          padding: '18px',
          marginTop: 24,
          opacity: canCreate ? 1 : 0.35,
          transition: 'opacity 0.2s',
        }}
      >
        {creating ? 'CREATING...' : '🥏 CREATE GAME'}
      </button>
    </div>
  )
}

function NameInput({ value, onChange, placeholder, color, onEnter, autoFocus, inputRef }) {
  return (
    <input
      ref={inputRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      placeholder={placeholder}
      maxLength={16}
      autoFocus={autoFocus}
      style={{
        width: '100%',
        padding: '13px 14px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-bg-elevated)',
        border: `2px solid ${value.trim() ? `${color}88` : 'rgba(255,255,255,0.08)'}`,
        color: 'var(--color-text)',
        fontSize: '1rem',
        fontWeight: 700,
        textAlign: 'center',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
      }}
    />
  )
}
