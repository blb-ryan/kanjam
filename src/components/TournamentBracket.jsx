import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTournaments } from '../hooks/useFirestore'
import { advanceSingleElimination, getTournamentChampion } from '../utils/bracketLogic'
import BracketVisualization from './BracketVisualization'
import ConfettiEffect from './ConfettiEffect'

export default function TournamentBracket() {
  const location = useLocation()
  const navigate = useNavigate()
  const { saveTournament } = useTournaments()

  const [tournament, setTournament] = useState(location.state?.tournament || null)
  const [confetti, setConfetti] = useState(false)
  const [showChampBanner, setShowChampBanner] = useState(false)

  // If returning from a game with result
  useEffect(() => {
    const resultState = location.state?.gameResult
    if (!resultState || !tournament) return

    const { roundNumber, matchupIndex, winnerId, gameId } = resultState
    const updatedBracket = advanceSingleElimination(
      tournament.bracket,
      { winnerId, gameId },
      roundNumber,
      matchupIndex,
    )

    const champion = getTournamentChampion(updatedBracket)
    const updatedTournament = {
      ...tournament,
      bracket: updatedBracket,
      championId: champion,
      completedAt: champion ? new Date().toISOString() : null,
    }

    setTournament(updatedTournament)
    saveTournament(updatedTournament)

    if (champion) {
      setConfetti(true)
      setShowChampBanner(true)
    }
  }, [])

  if (!tournament) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>No tournament data.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: 16 }}>Home</button>
      </div>
    )
  }

  const champion = tournament.teams?.find(t => t.id === tournament.championId)

  const handlePlayMatchup = (roundNumber, matchupIndex, matchup) => {
    const team1 = tournament.teams.find(t => t.id === matchup.team1Id)
    const team2 = tournament.teams.find(t => t.id === matchup.team2Id)
    navigate('/game', {
      state: {
        team1,
        team2,
        tournamentId: tournament.id,
        tournamentRound: roundNumber,
        tournamentMatchupIndex: matchupIndex,
        returnTo: '/tournament',
        tournamentState: tournament,
      },
    })
  }

  return (
    <div className="screen">
      <ConfettiEffect active={confetti} count={100} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ padding: '8px 4px', minHeight: 0 }}>
          ← Back
        </button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--color-blue)', letterSpacing: '0.05em', flex: 1 }}>
          {tournament.name?.toUpperCase()}
        </h2>
      </div>

      {/* Champion banner */}
      {champion && (
        <div style={{
          textAlign: 'center',
          padding: '20px 16px',
          borderRadius: 'var(--radius-xl)',
          background: 'rgba(255,214,0,0.12)',
          border: '2px solid var(--color-yellow)',
          marginBottom: 20,
          animation: showChampBanner ? 'bounceIn 0.6s ease' : 'none',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🏆</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--color-yellow)', letterSpacing: '0.15em', marginBottom: 4 }}>
            TOURNAMENT CHAMPION
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--color-yellow)' }}>
            {champion.name}
          </div>
        </div>
      )}

      {/* Bracket */}
      <div className="section-title">Bracket</div>
      <BracketVisualization
        bracket={tournament.bracket}
        teams={tournament.teams || []}
        onPlayMatchup={!champion ? handlePlayMatchup : null}
      />

      {/* Teams list */}
      <div style={{ marginTop: 20 }}>
        <div className="section-title">Teams</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tournament.teams?.map((t, i) => {
            const isChamp = t.id === tournament.championId
            return (
              <div key={t.id} className="card" style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                border: `1px solid ${isChamp ? 'var(--color-yellow)44' : 'rgba(255,255,255,0.05)'}`,
              }}>
                <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-dim)', width: 24 }}>#{i + 1}</span>
                <span style={{ flex: 1, fontWeight: 600, color: isChamp ? 'var(--color-yellow)' : 'var(--color-text)' }}>
                  {isChamp && '🏆 '}{t.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
