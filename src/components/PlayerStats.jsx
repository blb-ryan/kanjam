import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayers, useGames } from '../hooks/useFirestore'
import { calculatePlayerStats, calculateHeadToHead } from '../utils/gameLogic'

const SORT_OPTIONS = [
  { key: 'gamesPlayed', label: 'Games' },
  { key: 'winPct', label: 'Win %' },
  { key: 'totalPoints', label: 'Points' },
  { key: 'instantWins', label: 'Instant Wins' },
  { key: 'busts', label: 'Busts' },
  { key: 'longestWinStreak', label: 'Streak' },
]

const THROW_COLORS = {
  miss: '#6b7280',
  dinger: '#a3e635',
  deuce: '#1a8cff',
  bucket: '#ff6b1a',
  instant_win: '#ffd600',
}

const THROW_EMOJIS = {
  miss: '✗', dinger: '🎯', deuce: '💥', bucket: '🪣', instant_win: '⚡',
}

export default function PlayerStats() {
  const navigate = useNavigate()
  const { players, loading: playersLoading } = usePlayers()
  const { games, loading: gamesLoading } = useGames()
  const [sortKey, setSortKey] = useState('gamesPlayed')
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  const loading = playersLoading || gamesLoading

  const stats = useMemo(() => {
    if (loading) return []
    return calculatePlayerStats(games, players).map(s => ({
      ...s,
      winPct: s.gamesPlayed > 0 ? Math.round((s.wins / s.gamesPlayed) * 100) : 0,
      ptsPerGame: s.gamesPlayed > 0 ? (s.totalPoints / s.gamesPlayed).toFixed(1) : '0.0',
    })).sort((a, b) => {
      if (sortKey === 'busts') return b.busts - a.busts
      return (b[sortKey] || 0) - (a[sortKey] || 0)
    })
  }, [games, players, loading, sortKey])

  if (selectedPlayer) {
    const s = stats.find(x => x.playerId === selectedPlayer)
    return <PlayerDetail stat={s} onBack={() => setSelectedPlayer(null)} games={games} allStats={stats} />
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
                {s.currentStreak > 1 && (
                  <span style={{ color: s.currentStreakWin ? 'var(--color-lime)' : 'var(--color-danger)', marginLeft: 6 }}>
                    {s.currentStreakWin ? `🔥 W${s.currentStreak}` : `❄️ L${s.currentStreak}`}
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--color-yellow)' }}>
                {sortKey === 'winPct' ? `${s.winPct}%`
                  : sortKey === 'totalPoints' ? s.totalPoints
                  : sortKey === 'instantWins' ? `⚡${s.instantWins}`
                  : sortKey === 'busts' ? `💥${s.busts}`
                  : sortKey === 'longestWinStreak' ? `🔥${s.longestWinStreak}`
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

function PlayerDetail({ stat, onBack, games, allStats }) {
  if (!stat) return null
  const [activeTab, setActiveTab] = useState('overview') // overview | heatmap | h2h

  const playerGames = games.filter(g => {
    const allIds = [...(g.team1?.playerIds || []), ...(g.team2?.playerIds || [])]
    return allIds.includes(stat.playerId)
  })

  // Throw heatmap
  const totalThrows = stat.throws || 1
  const heatmap = Object.entries(stat.throwBreakdown || {}).map(([type, count]) => ({
    type,
    count,
    pct: Math.round((count / totalThrows) * 100),
  })).sort((a, b) => b.count - a.count)

  // Head-to-head vs other players — find teammates this player has played with
  // Group by "partner" (the other player on their 2-person team)
  const partnerships = {}
  for (const game of playerGames) {
    const onTeam1 = game.team1?.playerIds?.includes(stat.playerId)
    const myTeam = onTeam1 ? game.team1 : game.team2
    const oppTeam = onTeam1 ? game.team2 : game.team1
    if (!oppTeam?.playerIds?.length) continue

    const oppKey = [...(oppTeam.playerIds || [])].sort().join('|')
    if (!partnerships[oppKey]) {
      partnerships[oppKey] = {
        key: oppKey,
        oppPlayerIds: oppTeam.playerIds,
        oppName: oppTeam.name || oppTeam.playerIds.join(' & '),
        wins: 0,
        losses: 0,
      }
    }
    const won = game.winnerId === myTeam?.id
    if (won) partnerships[oppKey].wins++
    else partnerships[oppKey].losses++
  }

  const h2hList = Object.values(partnerships).sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses))

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
        {stat.currentStreak > 1 && (
          <div style={{ marginTop: 6, fontSize: '0.85rem', color: stat.currentStreakWin ? 'var(--color-lime)' : 'var(--color-danger)', fontWeight: 700 }}>
            {stat.currentStreakWin ? `🔥 ${stat.currentStreak}-game win streak` : `❄️ ${stat.currentStreak}-game losing streak`}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['overview', 'heatmap', 'h2h'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
              background: activeTab === tab ? 'var(--color-yellow)' : 'var(--color-bg-elevated)',
              color: activeTab === tab ? '#000' : 'var(--color-text-muted)',
              fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}
          >
            {tab === 'overview' ? 'Overview' : tab === 'heatmap' ? '🎯 Heatmap' : '⚔️ H2H'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Games', value: stat.gamesPlayed },
              { label: 'Wins', value: stat.wins, color: 'var(--color-lime)' },
              { label: 'Win %', value: `${stat.winPct}%`, color: 'var(--color-lime)' },
              { label: 'Points', value: stat.totalPoints, color: 'var(--color-yellow)' },
              { label: 'Pts/Game', value: stat.ptsPerGame },
              { label: '⚡ IW', value: stat.instantWins, color: 'var(--color-yellow)' },
              { label: 'Busts', value: stat.busts, color: 'var(--color-danger)' },
              { label: '🏅 OT Wins', value: stat.overtimeWins || 0, color: 'var(--color-orange)' },
              { label: '🔥 Best Streak', value: stat.longestWinStreak || 0, color: 'var(--color-lime)' },
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
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px',
                  border: `1px solid ${won ? 'var(--color-lime)' : 'transparent'}44`,
                }}>
                  <div>
                    <span style={{ fontWeight: 600, color: won ? 'var(--color-lime)' : 'var(--color-danger)', marginRight: 8, fontSize: '0.8rem' }}>
                      {won ? 'W' : 'L'}
                    </span>
                    <span style={{ fontSize: '0.9rem' }}>vs {oppTeam?.name}</span>
                    {g.isOvertime && <span style={{ fontSize: '0.7rem', color: 'var(--color-orange)', marginLeft: 6 }}>OT</span>}
                    {g.winType === 'instant_win' && <span style={{ fontSize: '0.7rem', color: 'var(--color-yellow)', marginLeft: 6 }}>⚡</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{myScore}–{oppScore}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{date}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {activeTab === 'heatmap' && (
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Throw Breakdown</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>
            {totalThrows} total throws
          </div>
          {heatmap.map(({ type, count, pct }) => (
            <div key={type} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.9rem', color: THROW_COLORS[type] }}>
                  {THROW_EMOJIS[type]} {type.replace('_', ' ').toUpperCase()}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {count} ({pct}%)
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--color-bg-elevated)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: THROW_COLORS[type],
                  borderRadius: 4,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          ))}

          {/* Specialty badges */}
          <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(() => {
              const badges = []
              const bd = stat.throwBreakdown || {}
              const total = stat.throws || 1
              if (bd.bucket / total > 0.15) badges.push({ label: '🪣 Bucket King', color: 'var(--color-orange)' })
              if (bd.dinger / total > 0.3) badges.push({ label: '🎯 Dinger Machine', color: 'var(--color-lime)' })
              if (bd.instant_win > 0) badges.push({ label: '⚡ Instant Win Club', color: 'var(--color-yellow)' })
              if (stat.busts === 0 && stat.gamesPlayed >= 3) badges.push({ label: '😇 Never Busted', color: 'var(--color-blue)' })
              if (stat.overtimeWins >= 3) badges.push({ label: '🏅 Clutch Player', color: 'var(--color-orange)' })
              return badges.map(b => (
                <div key={b.label} style={{
                  padding: '6px 12px', borderRadius: 20,
                  background: `${b.color}22`, border: `1px solid ${b.color}66`,
                  color: b.color, fontSize: '0.8rem', fontWeight: 700,
                }}>
                  {b.label}
                </div>
              ))
            })()}
          </div>
        </div>
      )}

      {activeTab === 'h2h' && (
        <div>
          <div className="section-title" style={{ marginBottom: 12 }}>Head-to-Head Records</div>
          {h2hList.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 20 }}>No matchup data yet.</p>
          )}
          {h2hList.map(({ oppKey, oppName, wins, losses }) => {
            const total = wins + losses
            const pct = total > 0 ? Math.round((wins / total) * 100) : 0
            return (
              <div key={oppKey} className="card" style={{ marginBottom: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>vs {oppName}</span>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    color: wins >= losses ? 'var(--color-lime)' : 'var(--color-danger)',
                    fontSize: '1.1rem',
                  }}>
                    {wins}–{losses}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--color-bg-elevated)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: wins >= losses ? 'var(--color-lime)' : 'var(--color-danger)',
                    borderRadius: 3,
                  }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {total} game{total !== 1 ? 's' : ''} · {pct}% win rate
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
