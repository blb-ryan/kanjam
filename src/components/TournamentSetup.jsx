import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayers, useTournaments, useGames } from '../hooks/useFirestore'
import {
  generateSingleEliminationBracket,
  generateDoubleEliminationBracket,
  generateRoundRobin,
  seedTeamsByWinRate,
} from '../utils/bracketLogic'

const FORMATS = [
  { key: 'single_elimination', label: 'Single Elim', desc: 'One loss and you\'re out' },
  { key: 'double_elimination', label: 'Double Elim', desc: 'Two losses to be eliminated' },
  { key: 'round_robin', label: 'Round Robin', desc: 'Everyone plays everyone' },
]

export default function TournamentSetup() {
  const navigate = useNavigate()
  const { players, loading, createPlayer } = usePlayers()
  const { saveTournament } = useTournaments()
  const { games } = useGames()

  const [name, setName] = useState('')
  const [format, setFormat] = useState('single_elimination')
  const [teams, setTeams] = useState([])
  const [step, setStep] = useState('config')
  const [newTeamPlayers, setNewTeamPlayers] = useState([])
  const [newTeamName, setNewTeamName] = useState('')
  const [search, setSearch] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [starting, setStarting] = useState(false)
  const [seedByWinRate, setSeedByWinRate] = useState(false)

  const filtered = useMemo(() => {
    if (!search.trim()) return players
    return players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  }, [players, search])

  const usedPlayerIds = teams.flatMap(t => t.playerIds)

  const handleAddPlayerToNewTeam = (playerId) => {
    if (newTeamPlayers.includes(playerId)) {
      setNewTeamPlayers(newTeamPlayers.filter(id => id !== playerId))
    } else if (newTeamPlayers.length < 2) {
      setNewTeamPlayers([...newTeamPlayers, playerId])
    }
  }

  const autoTeamName = () =>
    newTeamPlayers.map(id => players.find(p => p.id === id)?.name || '').filter(Boolean).join(' & ')

  const handleConfirmTeam = () => {
    if (newTeamPlayers.length < 2) return
    const team = {
      id: crypto.randomUUID(),
      name: newTeamName.trim() || autoTeamName(),
      playerIds: newTeamPlayers,
    }
    setTeams([...teams, team])
    setNewTeamPlayers([])
    setNewTeamName('')
    setSearch('')
    setStep('config')
  }

  const handleAddNewPlayer = async () => {
    if (!newPlayerName.trim()) return
    const id = await createPlayer(newPlayerName)
    setNewPlayerName('')
    if (newTeamPlayers.length < 2) setNewTeamPlayers([...newTeamPlayers, id])
  }

  const handleShuffle = () => {
    setTeams(t => [...t].sort(() => Math.random() - 0.5))
  }

  const handleSeedByWinRate = () => {
    const seeded = seedTeamsByWinRate(teams, games)
    setTeams(seeded)
    setSeedByWinRate(true)
  }

  const handleStart = async () => {
    if (teams.length < 3) return
    setStarting(true)

    const seededTeams = seedByWinRate ? teams : teams

    let bracket
    if (format === 'single_elimination') {
      bracket = generateSingleEliminationBracket(seededTeams)
    } else if (format === 'double_elimination') {
      bracket = generateDoubleEliminationBracket(seededTeams)
    } else {
      bracket = generateRoundRobin(seededTeams)
    }

    const id = crypto.randomUUID()
    const tournamentData = {
      id,
      name: name.trim() || `Tournament ${new Date().toLocaleDateString()}`,
      format,
      teamIds: seededTeams.map(t => t.id),
      teams: seededTeams,
      bracket,
      championId: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    }
    await saveTournament(tournamentData)
    setStarting(false)
    navigate('/tournament', { state: { tournament: tournamentData } })
  }

  if (step === 'add-team') {
    return (
      <div className="screen">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button className="btn btn-ghost" onClick={() => { setStep('config'); setNewTeamPlayers([]); setNewTeamName('') }} style={{ padding: '8px 4px', minHeight: 0 }}>
            ← Back
          </button>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--color-blue)', letterSpacing: '0.05em' }}>
            ADD TEAM ({newTeamPlayers.length}/2)
          </h2>
        </div>

        <input
          value={newTeamName}
          onChange={e => setNewTeamName(e.target.value)}
          placeholder={`Team name (default: "${autoTeamName() || 'Team Name'}")`}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text)', fontSize: '1rem', marginBottom: 12 }}
        />

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search players..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text)', fontSize: '1rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input
            value={newPlayerName}
            onChange={e => setNewPlayerName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddNewPlayer()}
            placeholder="Add new player..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text)', fontSize: '1rem' }}
          />
          <button className="btn btn-primary" onClick={handleAddNewPlayer} disabled={!newPlayerName.trim()} style={{ padding: '10px 16px', minHeight: 0 }}>
            + Add
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {filtered.filter(p => !usedPlayerIds.includes(p.id)).map(p => {
            const sel = newTeamPlayers.includes(p.id)
            return (
              <button
                key={p.id}
                onClick={() => handleAddPlayerToNewTeam(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: sel ? 'var(--color-blue)22' : 'var(--color-bg-elevated)',
                  border: `2px solid ${sel ? 'var(--color-blue)' : 'transparent'}`,
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: sel ? 'var(--color-blue)' : 'var(--color-bg-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', color: sel ? '#fff' : 'var(--color-text-muted)',
                }}>
                  {p.name[0].toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, color: sel ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{p.name}</span>
                {sel && <span style={{ marginLeft: 'auto', color: 'var(--color-blue)' }}>✓</span>}
              </button>
            )
          })}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleConfirmTeam}
          disabled={newTeamPlayers.length < 2}
          style={{ width: '100%', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
        >
          ADD TEAM
        </button>
      </div>
    )
  }

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ padding: '8px 4px', minHeight: 0 }}>
          ← Back
        </button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--color-blue)', letterSpacing: '0.05em' }}>
          TOURNAMENT
        </h2>
      </div>

      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Tournament name..."
        style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-elevated)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text)', fontSize: '1rem', marginBottom: 14 }}
      />

      {/* Format */}
      <div className="section-title">Format</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {FORMATS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFormat(opt.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 'var(--radius-md)',
              background: format === opt.key ? 'var(--color-blue)22' : 'var(--color-bg-elevated)',
              border: `2px solid ${format === opt.key ? 'var(--color-blue)' : 'transparent'}`,
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              background: format === opt.key ? 'var(--color-blue)' : 'var(--color-bg-card)',
              border: `2px solid ${format === opt.key ? 'var(--color-blue)' : 'rgba(255,255,255,0.2)'}`,
            }} />
            <div>
              <div style={{ fontWeight: 700, color: format === opt.key ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{opt.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>{opt.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Teams */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="section-title" style={{ margin: 0 }}>Teams ({teams.length})</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {teams.length > 1 && (
            <button className="btn btn-ghost" onClick={handleSeedByWinRate} style={{ minHeight: 0, padding: '4px 10px', fontSize: '0.75rem' }}>
              📊 Seed by W%
            </button>
          )}
          {teams.length > 1 && (
            <button className="btn btn-ghost" onClick={handleShuffle} style={{ minHeight: 0, padding: '4px 10px', fontSize: '0.75rem' }}>
              🔀 Shuffle
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {teams.map((t, i) => (
          <div key={t.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-dim)', width: 24 }}>#{i + 1}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{t.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {t.playerIds.map(id => players.find(p => p.id === id)?.name || id).join(' & ')}
              </div>
            </div>
            <button
              onClick={() => setTeams(teams.filter(x => x.id !== t.id))}
              style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {teams.length < 16 && (
        <button className="btn btn-secondary" onClick={() => setStep('add-team')} style={{ width: '100%', marginBottom: 16 }}>
          + Add Team
        </button>
      )}

      {teams.length < 3 && (
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 12 }}>
          Add at least 3 teams to start.
        </p>
      )}

      <button
        className="btn btn-primary"
        onClick={handleStart}
        disabled={teams.length < 3 || starting}
        style={{ width: '100%', fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.1em', padding: '16px' }}
      >
        {starting ? 'CREATING...' : 'START TOURNAMENT'}
      </button>
    </div>
  )
}
