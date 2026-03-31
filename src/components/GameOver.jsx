import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ConfettiEffect from './ConfettiEffect'
import { clearStoredActiveGame } from '../hooks/useGameEngine'
import { THROW_TYPES } from '../utils/gameLogic'

const THROW_LABELS = {
  miss: 'Miss',
  dinger: 'Dinger',
  deuce: 'Deuce',
  bucket: 'Bucket',
  instant_win: 'Instant Win',
}

export default function GameOver() {
  const location = useLocation()
  const navigate = useNavigate()
  const { gameState, gameId } = location.state || {}

  const [showRounds, setShowRounds] = useState(false)

  if (!gameState) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>No game data.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
          Home
        </button>
      </div>
    )
  }

  clearStoredActiveGame()

  const { team1, team2, team1Score, team2Score, winnerId, winType, rounds, isOvertime } = gameState
  const winningTeam = winnerId === team1?.id ? team1 : team2
  const isTeam1Winner = winnerId === team1?.id
  const winColor = isTeam1Winner ? 'var(--color-team1)' : 'var(--color-team2)'

  // Per-player stats for this game
  const playerStats = {}
  for (const round of rounds || []) {
    for (const [key, thr] of [['team1Throw', round.team1Throw], ['team2Throw', round.team2Throw]]) {
      if (!thr) continue
      const pid = thr.throwerPlayerId
      if (!pid) continue
      if (!playerStats[pid]) playerStats[pid] = { throws: 0, points: 0, busts: 0, instantWins: 0 }
      playerStats[pid].throws++
      if (!thr.busted) playerStats[pid].points += thr.points || 0
      if (thr.busted) playerStats[pid].busts++
      if (thr.type === THROW_TYPES.INSTANT_WIN) playerStats[pid].instantWins++
    }
  }

  function getPlayerName(playerId) {
    const allPlayers = [
      ...(team1?.playerNames || []).map((name, i) => ({ id: team1?.playerIds?.[i], name })),
      ...(team2?.playerNames || []).map((name, i) => ({ id: team2?.playerIds?.[i], name })),
    ]
    return allPlayers.find(p => p.id === playerId)?.name || 'Player'
  }

  const handleRematch = () => {
    clearStoredActiveGame()
    navigate('/game', { state: { team1, team2 } })
  }

  return (
    <div className="screen" style={{ gap: 16 }}>
      <ConfettiEffect active count={80} />

      {/* Winner banner */}
      <div style={{
        textAlign: 'center',
        padding: '24px 16px',
        borderRadius: 'var(--radius-xl)',
        background: `${winColor}18`,
        border: `2px solid ${winColor}66`,
        animation: 'bounceIn 0.5s ease',
      }}>
        {winType === 'instant_win' ? (
          <>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>⚡</div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              letterSpacing: '0.15em',
              color: 'var(--color-yellow)',
              marginBottom: 4,
            }}>
              INSTANT WIN
            </div>
          </>
        ) : (
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🏆</div>
        )}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.8rem, 8vw, 2.8rem)',
          color: winColor,
          letterSpacing: '0.05em',
          lineHeight: 1.1,
        }}>
          {winningTeam?.name}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1rem',
          color: 'var(--color-text-muted)',
          marginTop: 6,
          letterSpacing: '0.1em',
        }}>
          {winType === 'instant_win' ? 'WINS — INSTANT WIN!' : isOvertime ? 'WINS IN OVERTIME!' : 'WINS!'}
        </div>
      </div>

      {/* Final score */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 12,
        padding: '16px',
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--color-team1)', letterSpacing: '0.1em', marginBottom: 4 }}>
            {team1?.name?.toUpperCase()}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', color: isTeam1Winner ? 'var(--color-team1)' : 'var(--color-text-muted)', lineHeight: 1 }}>
            {team1Score}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-text-dim)' }}>vs</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--color-team2)', letterSpacing: '0.1em', marginBottom: 4 }}>
            {team2?.name?.toUpperCase()}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', color: !isTeam1Winner ? 'var(--color-team2)' : 'var(--color-text-muted)', lineHeight: 1 }}>
            {team2Score}
          </div>
        </div>
      </div>

      {/* Per-player stats */}
      {Object.keys(playerStats).length > 0 && (
        <div className="card">
          <div className="section-title">Player Stats This Game</div>
          {Object.entries(playerStats).map(([pid, s]) => (
            <div key={pid} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ fontWeight: 600 }}>{getPlayerName(pid)}</span>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <span>+{s.points}pts</span>
                {s.busts > 0 && <span style={{ color: 'var(--color-danger)' }}>{s.busts} bust{s.busts > 1 ? 's' : ''}</span>}
                {s.instantWins > 0 && <span style={{ color: 'var(--color-yellow)' }}>⚡ IW</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Round breakdown */}
      {rounds && rounds.length > 0 && (
        <div className="card">
          <button
            onClick={() => setShowRounds(v => !v)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'none',
              color: 'var(--color-text)',
              fontSize: '0.9rem',
              fontWeight: 600,
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <span>Round-by-Round</span>
            <span>{showRounds ? '▲' : '▼'}</span>
          </button>
          {showRounds && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {rounds.map(r => (
                <div key={r.roundNumber} style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr 1fr',
                  gap: 8,
                  fontSize: '0.8rem',
                  alignItems: 'center',
                  padding: '4px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.7rem' }}>R{r.roundNumber}</span>
                  <ThrowSummary thr={r.team1Throw} color="var(--color-team1)" />
                  <ThrowSummary thr={r.team2Throw} color="var(--color-team2)" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn-primary" onClick={handleRematch} style={{ width: '100%', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
          🔄 REMATCH
        </button>
        <button className="btn btn-secondary" onClick={() => { clearStoredActiveGame(); navigate('/setup') }} style={{ width: '100%' }}>
          New Game
        </button>
        <button className="btn btn-ghost" onClick={() => { clearStoredActiveGame(); navigate('/') }} style={{ width: '100%' }}>
          Home
        </button>
      </div>
    </div>
  )
}

function ThrowSummary({ thr, color }) {
  if (!thr) return <span style={{ color: 'var(--color-text-dim)' }}>—</span>
  return (
    <span style={{ color: thr.busted ? 'var(--color-danger)' : color }}>
      {THROW_LABELS[thr.type] || thr.type}
      {thr.busted ? ' (bust)' : thr.points > 0 ? ` +${thr.points}` : ''}
    </span>
  )
}
