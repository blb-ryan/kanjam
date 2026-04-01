import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayers, createTournamentLobby, resolvePlayer, nameToDisplay } from '../hooks/useFirestore'
import { generateUniqueRoomCode } from '../utils/roomCode'
import PlayerNameInput from './PlayerNameInput'

const FORMATS = [
  { key: 'single_elimination', label: 'Single Elim', desc: 'One loss and you\'re out' },
  { key: 'double_elimination', label: 'Double Elim', desc: 'Two losses to be eliminated' },
  { key: 'round_robin', label: 'Round Robin', desc: 'Everyone plays everyone' },
]

export default function TournamentSetup() {
  const navigate = useNavigate()
  const { players } = usePlayers()

  const [tournamentName, setTournamentName] = useState('')
  const [format, setFormat] = useState('single_elimination')

  // Host team (Team 1)
  const [name1, setName1] = useState('')
  const [selected1, setSelected1] = useState(null)
  const [name2, setName2] = useState('')
  const [selected2, setSelected2] = useState(null)

  const [creating, setCreating] = useState(false)

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
      const hostTeam = {
        id: crypto.randomUUID(),
        name: `${d1} + ${d2}`,
        playerIds: [pid1, pid2],
        playerNames: [d1, d2],
      }
      const name = tournamentName.trim() || `Tournament ${new Date().toLocaleDateString()}`
      await createTournamentLobby(roomCode, name, format, hostTeam)
      navigate('/tournament-lobby', { state: { roomCode, isHost: true } })
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
        color: 'var(--color-blue)',
        marginBottom: 6,
      }}>
        CREATE TOURNAMENT
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.5 }}>
        Set up your tournament, then share the code for other teams to join.
      </p>

      {/* Tournament name */}
      <input
        value={tournamentName}
        onChange={e => setTournamentName(e.target.value)}
        placeholder="Tournament name (optional)"
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg-elevated)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'var(--color-text)',
          fontSize: '1rem',
          marginBottom: 20,
          boxSizing: 'border-box',
        }}
      />

      {/* Format picker */}
      <div style={{
        fontSize: '0.65rem',
        fontFamily: 'var(--font-display)',
        color: 'var(--color-text-muted)',
        letterSpacing: '0.2em',
        marginBottom: 10,
      }}>
        FORMAT
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {FORMATS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFormat(opt.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: format === opt.key ? 'rgba(26,140,255,0.12)' : 'var(--color-bg-elevated)',
              border: `2px solid ${format === opt.key ? 'var(--color-blue)' : 'transparent'}`,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              flexShrink: 0,
              background: format === opt.key ? 'var(--color-blue)' : 'transparent',
              border: `2px solid ${format === opt.key ? 'var(--color-blue)' : 'rgba(255,255,255,0.2)'}`,
            }} />
            <div>
              <div style={{ fontWeight: 700, color: format === opt.key ? 'var(--color-text)' : 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                {opt.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{opt.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Host team */}
      <div style={{
        fontSize: '0.65rem',
        fontFamily: 'var(--font-display)',
        color: 'var(--color-team1)',
        letterSpacing: '0.2em',
        marginBottom: 10,
      }}>
        YOUR TEAM
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
          background: 'var(--color-blue)',
        }}
      >
        {creating ? 'CREATING...' : '🏆 CREATE TOURNAMENT'}
      </button>
    </div>
  )
}
