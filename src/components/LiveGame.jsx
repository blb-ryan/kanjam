import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGameEngine, getStoredActiveGame } from '../hooks/useGameEngine'
import { getCurrentThrower } from '../utils/gameLogic'
import { useGames } from '../hooks/useFirestore'
import Scoreboard from './Scoreboard'
import ScoringButtons from './ScoringButtons'
import ConfettiEffect from './ConfettiEffect'

export default function LiveGame() {
  const location = useLocation()
  const navigate = useNavigate()
  const { saveGame } = useGames()

  // Allow resuming from localStorage if no state passed
  const initData = location.state || getStoredActiveGame()

  const { team1, team2 } = initData || {}
  const existingGame = initData?.status === 'active' ? initData : null

  const { gameState, gameId, recordThrow, undo, canUndoNow } = useGameEngine(
    team1, team2, existingGame
  )

  const [bustAnim, setBustAnim] = useState(false)
  const [showBustText, setShowBustText] = useState(false)
  const [instantWinAnim, setInstantWinAnim] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const containerRef = useRef(null)
  const prevLastThrow = useRef(null)

  // Watch for bust and instant win animations
  useEffect(() => {
    const lt = gameState.lastThrow
    if (!lt || lt === prevLastThrow.current) return
    prevLastThrow.current = lt

    if (lt.busted) {
      setBustAnim(true)
      setShowBustText(true)
      setTimeout(() => { setBustAnim(false); setShowBustText(false) }, 900)
    }
    if (lt.type === 'instant_win') {
      setInstantWinAnim(true)
      setConfetti(true)
      setTimeout(() => setInstantWinAnim(false), 1200)
    }
  }, [gameState.lastThrow])

  // Navigate to game over when complete
  useEffect(() => {
    if (gameState.status === 'complete') {
      saveGame({ ...gameState, id: gameId })
      setConfetti(true)
      const t = setTimeout(() => {
        navigate('/game-over', { state: { gameState, gameId } })
      }, gameState.winType === 'instant_win' ? 2200 : 1400)
      return () => clearTimeout(t)
    }
  }, [gameState.status])

  if (!team1 || !team2) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>No game data found.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>
          Go Home
        </button>
      </div>
    )
  }

  const { team1Score, team2Score, currentRound, currentHalf, isOvertime } = gameState
  const { team, playerIndex, teamKey } = getCurrentThrower(gameState)
  const throwerName = team?.playerIds
    ? (team.playerNames?.[playerIndex] || `Player ${playerIndex + 1}`)
    : '?'

  const teamColor = teamKey === 'team1' ? 'var(--color-team1)' : 'var(--color-team2)'

  return (
    <div
      ref={containerRef}
      className={bustAnim ? 'animate-bust-flash' : instantWinAnim ? 'animate-instant-win' : ''}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: '12px 14px',
        gap: 12,
        background: 'var(--color-bg)',
        minHeight: 0,
      }}
    >
      <ConfettiEffect active={confetti} />

      {/* Scoreboard */}
      <Scoreboard
        team1={team1}
        team2={team2}
        team1Score={team1Score}
        team2Score={team2Score}
        currentHalf={currentHalf}
        roundNumber={currentRound}
        isOvertime={isOvertime}
      />

      {/* Turn indicator */}
      <div className="card" style={{
        textAlign: 'center',
        padding: '12px 16px',
        border: `1px solid ${teamColor}44`,
        background: `${teamColor}11`,
      }}>
        {showBustText ? (
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.2rem',
            color: 'var(--color-danger)',
            animation: 'bounceIn 0.4s ease',
            letterSpacing: '0.1em',
          }}>
            BUST!
          </div>
        ) : instantWinAnim ? (
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            color: 'var(--color-yellow)',
            animation: 'bounceIn 0.4s ease',
            letterSpacing: '0.08em',
          }}>
            ⚡ INSTANT WIN! ⚡
          </div>
        ) : (
          <>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>
              NOW THROWING
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              color: teamColor,
              letterSpacing: '0.05em',
            }}>
              {throwerName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              {team?.name}
            </div>
          </>
        )}
      </div>

      {/* Scoring buttons */}
      <ScoringButtons
        onScore={recordThrow}
        disabled={gameState.status === 'complete'}
      />

      {/* Undo */}
      <button
        className="btn btn-ghost"
        onClick={undo}
        disabled={!canUndoNow || gameState.status === 'complete'}
        style={{
          fontSize: '0.85rem',
          minHeight: 0,
          padding: '10px',
          color: canUndoNow ? 'var(--color-text-muted)' : 'var(--color-text-dim)',
        }}
      >
        ↩ Undo last throw
      </button>
    </div>
  )
}
