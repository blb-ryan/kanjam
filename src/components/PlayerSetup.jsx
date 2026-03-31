import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayers } from '../hooks/useFirestore'
import PlayerCard from './PlayerCard'

const TEAM_COLORS = ['var(--color-team1)', 'var(--color-team2)']

export default function PlayerSetup() {
  const navigate = useNavigate()
  const { players, loading, createPlayer } = usePlayers()

  const [team1Players, setTeam1Players] = useState([])
  const [team2Players, setTeam2Players] = useState([])
  const [team1Name, setTeam1Name] = useState('')
  const [team2Name, setTeam2Name] = useState('')
  const [search, setSearch] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [adding, setAdding] = useState(false)
  const [activeTeam, setActiveTeam] = useState(1) // which team tab we're assigning to

  const filtered = useMemo(() => {
    if (!search.trim()) return players
    return players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  }, [players, search])

  const getTeamLabel = (teamNum) => {
    const arr = teamNum === 1 ? team1Players : team2Players
    if (arr.length === 0) return `Team ${teamNum}`
    const names = arr.map(id => players.find(p => p.id === id)?.name || '').filter(Boolean)
    return names.join(' & ')
  }

  const autoTeamName = (teamNum) => {
    const arr = teamNum === 1 ? team1Players : team2Players
    if (arr.length === 0) return ''
    return arr.map(id => players.find(p => p.id === id)?.name || '').filter(Boolean).join(' & ')
  }

  const handleTogglePlayer = (playerId) => {
    const setFn = activeTeam === 1 ? setTeam1Players : setTeam2Players
    const arr = activeTeam === 1 ? team1Players : team2Players
    const otherArr = activeTeam === 1 ? team2Players : team1Players

    if (otherArr.includes(playerId)) return // can't be on both teams

    if (arr.includes(playerId)) {
      setFn(arr.filter(id => id !== playerId))
    } else if (arr.length < 2) {
      setFn([...arr, playerId])
    }
  }

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return
    setAdding(true)
    const id = await createPlayer(newPlayerName)
    setAdding(false)
    setNewPlayerName('')
    // Auto-assign to active team if there's room
    const arr = activeTeam === 1 ? team1Players : team2Players
    if (arr.length < 2) {
      const setFn = activeTeam === 1 ? setTeam1Players : setTeam2Players
      setFn([...arr, id])
    }
  }

  const canStart = team1Players.length === 2 && team2Players.length === 2

  const handleStart = () => {
    const t1Name = team1Name.trim() || autoTeamName(1)
    const t2Name = team2Name.trim() || autoTeamName(2)
    const team1 = {
      id: crypto.randomUUID(),
      name: t1Name,
      playerIds: team1Players,
      playerNames: team1Players.map(id => players.find(p => p.id === id)?.name || 'Player'),
    }
    const team2 = {
      id: crypto.randomUUID(),
      name: t2Name,
      playerIds: team2Players,
      playerNames: team2Players.map(id => players.find(p => p.id === id)?.name || 'Player'),
    }
    navigate('/game', { state: { team1, team2 } })
  }

  const playerSelectionFor = (teamNum) => {
    return teamNum === 1 ? team1Players : team2Players
  }

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ padding: '8px 4px', minHeight: 0 }}>
          ← Back
        </button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.05em', color: 'var(--color-orange)' }}>
          PLAYER SETUP
        </h2>
      </div>

      {/* Team tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[1, 2].map(n => (
          <button
            key={n}
            onClick={() => setActiveTeam(n)}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: activeTeam === n
                ? (n === 1 ? 'var(--color-team1)' : 'var(--color-team2)')
                : 'var(--color-bg-elevated)',
              color: activeTeam === n ? '#fff' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-display)',
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {`TEAM ${n} (${playerSelectionFor(n).length}/2)`}
          </button>
        ))}
      </div>

      {/* Team name input */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={activeTeam === 1 ? team1Name : team2Name}
          onChange={e => activeTeam === 1 ? setTeam1Name(e.target.value) : setTeam2Name(e.target.value)}
          placeholder={`Team name (default: "${autoTeamName(activeTeam) || `Team ${activeTeam}`}")`}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-elevated)',
            border: `1px solid ${activeTeam === 1 ? 'var(--color-team1)' : 'var(--color-team2)'}44`,
            color: 'var(--color-text)',
            fontSize: '1rem',
          }}
        />
      </div>

      {/* Search + add player */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search players..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-elevated)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--color-text)',
            fontSize: '1rem',
          }}
        />
      </div>

      {/* Add new player */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={newPlayerName}
          onChange={e => setNewPlayerName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
          placeholder="Add new player..."
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-elevated)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--color-text)',
            fontSize: '1rem',
          }}
        />
        <button
          className="btn btn-primary"
          onClick={handleAddPlayer}
          disabled={!newPlayerName.trim() || adding}
          style={{ padding: '10px 18px', minHeight: 0 }}
        >
          + Add
        </button>
      </div>

      {/* Player list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {loading && <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 20 }}>Loading players...</div>}
        {!loading && filtered.length === 0 && (
          <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 20 }}>
            No players yet. Add some above!
          </div>
        )}
        {filtered.map(player => {
          const onTeam1 = team1Players.includes(player.id)
          const onTeam2 = team2Players.includes(player.id)
          const selected = activeTeam === 1 ? onTeam1 : onTeam2
          const onOtherTeam = activeTeam === 1 ? onTeam2 : onTeam1
          return (
            <div key={player.id} style={{ opacity: onOtherTeam ? 0.4 : 1 }}>
              <PlayerCard
                player={player}
                selected={selected}
                onToggle={() => handleTogglePlayer(player.id)}
                teamColor={activeTeam === 1 ? 'var(--color-team1)' : 'var(--color-team2)'}
              />
              {onOtherTeam && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', padding: '2px 14px' }}>
                  On Team {activeTeam === 1 ? 2 : 1}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Team preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[1, 2].map(n => {
          const arr = n === 1 ? team1Players : team2Players
          const color = n === 1 ? 'var(--color-team1)' : 'var(--color-team2)'
          return (
            <div key={n} className="card" style={{ border: `1px solid ${color}44`, padding: '10px 12px' }}>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-display)', color, letterSpacing: '0.1em', marginBottom: 6 }}>
                TEAM {n}
              </div>
              {arr.length === 0 && <div style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>No players</div>}
              {arr.map(id => {
                const p = players.find(pl => pl.id === id)
                return p ? (
                  <div key={id} style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    {p.name}
                  </div>
                ) : null
              })}
            </div>
          )
        })}
      </div>

      <button
        className="btn btn-primary"
        onClick={handleStart}
        disabled={!canStart}
        style={{
          width: '100%',
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          letterSpacing: '0.1em',
          padding: '16px',
        }}
      >
        START GAME
      </button>
    </div>
  )
}
