import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayers, useGames } from '../hooks/useFirestore'
import { calculatePlayerStats } from '../utils/gameLogic'

const SORT_OPTIONS = [
  { key: 'gamesPlayed', label: 'Games' },
  { key: 'winPct', label: 'Win %' },
  { key: 'totalPoints', label: 'Points' },
  { key: 'instantWins', label: 'Instant Wins' },
  { key: 'busts', label: 'Busts' },
]

export default function PlayerStats() {
  const navigate = useNavigate()
  const { players, loading: playersLoading } = usePlayers()
  const { games, loading: gamesLoading } = useGames()
  const [sortKey, setSortKey] = useState('gamesPlayed')
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  const loading = playersLoading || gamesLoading

  const rawStats = loading ? [] : calculatePlayerStats(games, players)
  const stats = rawStats.map(s => ({
    ...s,
    winPct: s.gamesPlayed > 0 ? Math.round((s.wins / s.gamesPlayed) * 100) : 0,
    ptsPerGame: s.gamesPlayed > 0 ? (s.totalPoints / s.gamesPlayed).toFixed(1) : '0.0',
  })).sort((a, b) => {
    if (sortKey === 'busts') return b.busts - a.busts
    return (b[sortKey] || 0) - (a[sortKey] || 0)
  })

  if (selectedPlayer) {
    const s = stats.find(x => x.playerId === selectedPlayer)
    return <PlayerDetail stat={s} onBack={() => setSelectedPlayer(null)} games={games} />
  }

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ padding: '8px 4px', minHeight: 0 }}>
          ← Back
        </button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--color-yellow)', letterSpacing: '0.05em' }}>
          PLAYER STATS
        </h2>
      </div>

      {/* Sort controls */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortKey(opt.key)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: sortKey === opt.key ? 'var(--color-yellow)' : 'var(--color-bg-elevated)',
              color: sortKey === opt.key ? '#000' : 'var(--color-text-muted)',
              fontSize: '0.78rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 24 }}>Loading...</p>}

      {!loading && stats.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 24 }}>No stats yet.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {stats.map((s, i) => (
          <button
            key={s.playerId}
            onClick={() => setSelectedPlayer(s.playerId)}
            className="card"
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr auto',
              alignItems: 'center',
              gap: 12,
              textAlign: 'left',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.1rem',
              color: i === 0 ? 'var(--color-yellow)' : i === 1 ? 'var(--color-text-muted)' : 'var(--color-text-dim)',
            }}>
              #{i + 1}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{s.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                {s.gamesPlayed} games · {s.winPct}% wins · {s.ptsPerGame} pts/game
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                color: 'var(--color-yellow)',
              }}>
                {sortKey === 'winPct' ? `${s.winPct}%`
                  : sortKey === 'totalPoints' ? s.totalPoints
                  : sortKey === 'instantWins' ? `⚡${s.instantWins}`
                  : sortKey === 'busts' ? `💥${s.busts}`
                  : s.gamesPlayed}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {SORT_OPTIONS.find(o => o.key === sortKey)?.label}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function PlayerDetail({ stat, onBack, games }) {
  if (!stat) return null

  const playerGames = games.filter(g => {
    const allPlayerIds = [
      ...(g.team1?.playerIds || []),
      ...(g.team2?.playerIds || []),
    ]
    return allPlayerIds.includes(stat.playerId)
  })

  return (
    <div className="screen">
      <button className="btn btn-ghost" onClick={onBack} style={{ padding: '8px 4px', minHeight: 0, marginBottom: 16, alignSelf: 'flex-start' }}>
        ← Back
      </button>

      <div className="card" style={{ textAlign: 'center', marginBottom: 16, border: '1px solid var(--color-yellow)44' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--color-yellow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#000',
          margin: '0 auto 12px',
        }}>
          {stat.name[0].toUpperCase()}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', letterSpacing: '0.05em' }}>{stat.name}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Games', value: stat.gamesPlayed },
          { label: 'Wins', value: stat.wins, color: 'var(--color-lime)' },
          { label: 'Win %', value: `${stat.winPct}%`, color: 'var(--color-lime)' },
          { label: 'Points', value: stat.totalPoints, color: 'var(--color-yellow)' },
          { label: 'Pts/Game', value: stat.ptsPerGame },
          { label: '⚡ IW', value: stat.instantWins, color: 'var(--color-yellow)' },
          { label: 'Busts', value: stat.busts, color: 'var(--color-danger)' },
        ].map(item => (
          <div key={item.label} className="card" style={{ textAlign: 'center', padding: '10px 8px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: item.color || 'var(--color-text)' }}>
              {item.value}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div className="section-title">Recent Games</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {playerGames.slice(0, 10).map(g => {
          const onTeam1 = g.team1?.playerIds?.includes(stat.playerId)
          const myTeam = onTeam1 ? g.team1 : g.team2
          const oppTeam = onTeam1 ? g.team2 : g.team1
          const myScore = onTeam1 ? g.team1Score : g.team2Score
          const oppScore = onTeam1 ? g.team2Score : g.team1Score
          const won = g.winnerId === myTeam?.id
          const date = g.completedAt ? new Date(g.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''
          return (
            <div key={g.id} className="card" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              border: `1px solid ${won ? 'var(--color-lime)' : 'transparent'}44`,
            }}>
              <div>
                <span style={{ fontWeight: 600, color: won ? 'var(--color-lime)' : 'var(--color-danger)', marginRight: 8, fontSize: '0.8rem' }}>
                  {won ? 'W' : 'L'}
                </span>
                <span style={{ fontSize: '0.9rem' }}>vs {oppTeam?.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{myScore}–{oppScore}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{date}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
