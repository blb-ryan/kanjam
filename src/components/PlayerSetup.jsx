import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateUniqueRoomCode } from '../utils/roomCode'
import { createLobby, resolvePlayer, nameToDisplay, usePlayers } from '../hooks/useFirestore'
import PlayerNameInput from './PlayerNameInput'

export default function PlayerSetup() {
  const navigate = useNavigate()
  const { players } = usePlayers()

  const [name1, setName1] = useState('')
  const [selected1, setSelected1] = useState(null)
  const [name2, setName2] = useState('')
  const [selected2, setSelected2] = useState(null)
  const [creating, setCreating] = useState(false)
  const ref2 = useRef(null)

  const canCreate = name1.trim() && name2.trim()

  const handleCreate = async () => {
    if (!canCreate) return
    setCreating(true)
    try {
      const roomCode = await generateUniqueRoomCode()
      const [pid1, pid2] = await Promise.all([
        resolvePlayer(name1, selected1),
        resolvePlayer(name2, selected2),
      ])
      const d1 = nameToDisplay(name1, selected1)
      const d2 = nameToDisplay(name2, selected2)
      const team1 = {
        id: crypto.randomUUID(),
        name: `${d1} + ${d2}`,
        playerIds: [pid1, pid2],
        playerNames: [d1, d2],
      }
      await createLobby(roomCode, team1)
      navigate('/lobby', { state: { roomCode, team1 } })
    } catch {
      setCreating(false)
    }
  }

  const preview = name1.trim() && name2.trim()
    ? `${nameToDisplay(name1, selected1)} + ${nameToDisplay(name2, selected2)}`
    : null

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

      <PlayerNameInput
        value={name1}
        onChange={setName1}
        onSelect={setSelected1}
        players={players}
        placeholder="First Last"
        color="var(--color-team1)"
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

      <PlayerNameInput
        inputRef={ref2}
        value={name2}
        onChange={setName2}
        onSelect={setSelected2}
        players={players}
        placeholder="First Last"
        color="var(--color-team1)"
      />

      {preview && (
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
          {preview}
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
