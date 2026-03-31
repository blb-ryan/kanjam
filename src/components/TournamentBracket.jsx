import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTournaments } from '../hooks/useFirestore'
import {
  advanceSingleElimination,
  advanceDoubleElimination,
  advanceGrandFinal,
  advanceRoundRobin,
  getTournamentChampion,
  getRoundName,
} from '../utils/bracketLogic'
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
    const r = location.state?.gameResult
    if (!r || !tournament) return

    let updatedBracket
    const fmt = tournament.bracket.type

    if (fmt === 'single_elimination') {
      updatedBracket = advanceSingleElimination(
        tournament.bracket, { winnerId: r.winnerId, gameId: r.gameId },
        r.roundNumber, r.matchupIndex,
      )
    } else if (fmt === 'double_elimination') {
      if (r.isGrandFinal) {
        updatedBracket = advanceGrandFinal(tournament.bracket, r.winnerId, r.gameId)
      } else {
        updatedBracket = advanceDoubleElimination(
          tournament.bracket, r.side, r.roundNumber, r.matchupIndex, r.winnerId, r.gameId,
        )
      }
    } else if (fmt === 'round_robin') {
      updatedBracket = advanceRoundRobin(
        tournament.bracket, r.matchupId, r.winnerId, r.team1Score, r.team2Score, r.gameId,
      )
    }

    if (!updatedBracket) return

    const champion = getTournamentChampion(updatedBracket)
    const updatedTournament = {
      ...tournament,
      bracket: updatedBracket,
      championId: champion,
      completedAt: champion ? new Date().toISOString() : null,
    }

    setTournament(updatedTournament)
    saveTournament(updatedTournament).catch(() => {
      // Non-fatal: UI is updated, next save attempt will retry
    })

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
  const fmt = tournament.bracket.type

  const navigateToGame = (team1, team2, extraState) => {
    navigate('/game', {
      state: {
        team1,
        team2,
        returnTo: '/tournament',
        tournamentState: tournament,
        ...extraState,
      },
    })
  }

  const getTeam = (id) => tournament.teams?.find(t => t.id === id)

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
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
          {fmt === 'single_elimination' ? 'Single Elim' : fmt === 'double_elimination' ? 'Double Elim' : 'Round Robin'}
        </span>
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

      {/* Format-specific bracket view */}
      {fmt === 'single_elimination' && (
        <SingleElimView
          bracket={tournament.bracket}
          teams={tournament.teams || []}
          champion={champion}
          getTeam={getTeam}
          onPlay={(rn, mi, m) => {
            navigateToGame(getTeam(m.team1Id), getTeam(m.team2Id), {
              tournamentRound: rn,
              tournamentMatchupIndex: mi,
            })
          }}
        />
      )}

      {fmt === 'double_elimination' && (
        <DoubleElimView
          bracket={tournament.bracket}
          teams={tournament.teams || []}
          champion={champion}
          getTeam={getTeam}
          onPlay={(side, rn, mi, m) => {
            navigateToGame(getTeam(m.team1Id), getTeam(m.team2Id), {
              tournamentSide: side,
              tournamentRound: rn,
              tournamentMatchupIndex: mi,
            })
          }}
          onPlayGrandFinal={(m) => {
            navigateToGame(getTeam(m.team1Id), getTeam(m.team2Id), {
              tournamentIsGrandFinal: true,
            })
          }}
        />
      )}

      {fmt === 'round_robin' && (
        <RoundRobinView
          bracket={tournament.bracket}
          teams={tournament.teams || []}
          champion={champion}
          getTeam={getTeam}
          onPlay={(m) => {
            navigateToGame(getTeam(m.team1Id), getTeam(m.team2Id), {
              tournamentMatchupId: m.id,
            })
          }}
        />
      )}

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

// ─── Single Elimination ────────────────────────────────────────────────────

function SingleElimView({ bracket, teams, champion, getTeam, onPlay }) {
  const rounds = bracket.rounds || []
  const totalRounds = rounds.length

  return (
    <>
      <div className="section-title">Bracket</div>
      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 10, minWidth: `${totalRounds * 176}px` }}>
          {rounds.map(round => (
            <BracketColumn
              key={round.roundNumber}
              label={getRoundName(round.roundNumber, totalRounds)}
              matchups={round.matchups}
              getTeam={getTeam}
              onPlay={champion ? null : (mi, m) => onPlay(round.roundNumber, mi, m)}
            />
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Double Elimination ────────────────────────────────────────────────────

function DoubleElimView({ bracket, champion, getTeam, onPlay, onPlayGrandFinal }) {
  const { wbRounds = [], lbRounds = [], grandFinal } = bracket

  return (
    <>
      {/* Winners bracket */}
      <div className="section-title" style={{ color: 'var(--color-lime)' }}>Winners Bracket</div>
      <div style={{ overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, minWidth: `${wbRounds.length * 176}px` }}>
          {wbRounds.map(round => (
            <BracketColumn
              key={`wb-${round.roundNumber}`}
              label={round.label}
              matchups={round.matchups}
              getTeam={getTeam}
              accentColor="var(--color-lime)"
              onPlay={champion ? null : (mi, m) => onPlay('winners', round.roundNumber, mi, m)}
            />
          ))}
        </div>
      </div>

      {/* Losers bracket */}
      <div className="section-title" style={{ color: 'var(--color-danger)' }}>Losers Bracket</div>
      <div style={{ overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, minWidth: `${lbRounds.length * 176}px` }}>
          {lbRounds.map(round => (
            <BracketColumn
              key={`lb-${round.roundNumber}`}
              label={round.label}
              matchups={round.matchups}
              getTeam={getTeam}
              accentColor="var(--color-danger)"
              onPlay={champion ? null : (mi, m) => onPlay('losers', round.roundNumber, mi, m)}
            />
          ))}
        </div>
      </div>

      {/* Grand Final */}
      {grandFinal && (
        <>
          <div className="section-title" style={{ color: 'var(--color-yellow)' }}>Grand Final</div>
          <GrandFinalCard
            gf={grandFinal}
            getTeam={getTeam}
            onPlay={champion ? null : onPlayGrandFinal}
          />
        </>
      )}
    </>
  )
}

function GrandFinalCard({ gf, getTeam, onPlay }) {
  const t1 = getTeam(gf.team1Id)
  const t2 = getTeam(gf.team2Id)
  const canPlay = !gf.winnerId && t1 && t2

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: `2px solid ${gf.winnerId ? 'var(--color-yellow)66' : canPlay ? 'var(--color-yellow)44' : 'rgba(255,255,255,0.08)'}`,
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      <div style={{ padding: '8px 12px', background: 'rgba(255,214,0,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--color-yellow)', letterSpacing: '0.12em' }}>GRAND FINAL</span>
        {gf.reset && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>(Reset Match)</span>}
      </div>
      <GfSlot team={t1} isWinner={gf.winnerId === gf.team1Id} label="WB Champion" />
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
      <GfSlot team={t2} isWinner={gf.winnerId === gf.team2Id} label="LB Champion" />
      {canPlay && onPlay && (
        <button
          onClick={() => onPlay(gf)}
          style={{
            width: '100%', padding: '8px', background: 'var(--color-yellow)',
            color: '#111', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.08em',
          }}
        >
          ▶ PLAY GRAND FINAL
        </button>
      )}
    </div>
  )
}

function GfSlot({ team, isWinner, label }) {
  return (
    <div style={{
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: isWinner ? 'rgba(255,214,0,0.1)' : 'transparent',
    }}>
      {isWinner && <span style={{ color: 'var(--color-yellow)', fontSize: '1rem' }}>🏆</span>}
      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)' }}>{label}</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isWinner ? 'var(--color-yellow)' : team ? 'var(--color-text)' : 'var(--color-text-dim)' }}>
          {team ? team.name : 'TBD'}
        </div>
      </div>
    </div>
  )
}

// ─── Round Robin ──────────────────────────────────────────────────────────

function RoundRobinView({ bracket, teams, champion, getTeam, onPlay }) {
  const { matchups = [], standings = [] } = bracket
  const completed = matchups.filter(m => m.winnerId).length
  const total = matchups.length

  return (
    <>
      {/* Standings */}
      <div className="section-title">Standings</div>
      <div className="card" style={{ marginBottom: 16, padding: '4px 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '24px 1fr 32px 32px 48px',
          gap: 8,
          padding: '6px 14px',
          fontSize: '0.65rem',
          color: 'var(--color-text-dim)',
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.1em',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span>#</span><span>Team</span><span style={{ textAlign: 'center' }}>W</span>
          <span style={{ textAlign: 'center' }}>L</span><span style={{ textAlign: 'right' }}>+/-</span>
        </div>
        {standings.map((s, i) => {
          const team = getTeam(s.teamId)
          const isChamp = s.teamId === champion?.id
          const diff = s.pointsFor - s.pointsAgainst
          return (
            <div key={s.teamId} style={{
              display: 'grid',
              gridTemplateColumns: '24px 1fr 32px 32px 48px',
              gap: 8,
              padding: '9px 14px',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              background: i === 0 && isChamp ? 'rgba(255,214,0,0.06)' : i === 0 ? 'rgba(163,230,53,0.05)' : 'transparent',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-dim)', fontSize: '0.75rem' }}>{i + 1}</span>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isChamp ? 'var(--color-yellow)' : i === 0 ? 'var(--color-lime)' : 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isChamp ? '🏆 ' : ''}{team?.name || s.teamId}
              </span>
              <span style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--color-lime)' }}>{s.wins}</span>
              <span style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--color-danger)' }}>{s.losses}</span>
              <span style={{ textAlign: 'right', fontSize: '0.8rem', color: diff >= 0 ? 'var(--color-lime)' : 'var(--color-danger)' }}>
                {diff >= 0 ? '+' : ''}{diff}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="section-title" style={{ margin: 0 }}>
          Matchups ({completed}/{total})
        </div>
        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
          <div style={{ width: `${(completed / Math.max(total, 1)) * 100}%`, height: '100%', background: 'var(--color-blue)', borderRadius: 2, transition: 'width 0.4s' }} />
        </div>
      </div>

      {/* Matchup list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {matchups.map(m => {
          const t1 = getTeam(m.team1Id)
          const t2 = getTeam(m.team2Id)
          const done = !!m.winnerId
          const canPlay = !done && t1 && t2 && !champion

          return (
            <div key={m.id} style={{
              background: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-md)',
              border: done
                ? '1px solid rgba(163,230,53,0.2)'
                : canPlay
                  ? '1px solid rgba(26,140,255,0.3)'
                  : '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              padding: '10px 14px',
              gap: 10,
            }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <RrTeamRow team={t1} isWinner={m.winnerId === m.team1Id} done={done} />
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
                <RrTeamRow team={t2} isWinner={m.winnerId === m.team2Id} done={done} />
              </div>
              {canPlay && (
                <button
                  onClick={() => onPlay(m)}
                  style={{
                    padding: '10px 14px',
                    background: 'var(--color-blue)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ▶ PLAY
                </button>
              )}
              {done && (
                <span style={{ color: 'var(--color-lime)', fontSize: '1rem' }}>✓</span>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

function RrTeamRow({ team, isWinner, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {isWinner && <span style={{ color: 'var(--color-lime)', fontSize: '0.8rem' }}>✓</span>}
      <span style={{
        fontSize: '0.85rem',
        fontWeight: isWinner ? 700 : 500,
        color: isWinner ? 'var(--color-lime)' : done ? 'var(--color-text-muted)' : 'var(--color-text)',
      }}>
        {team?.name || 'TBD'}
      </span>
    </div>
  )
}

// ─── Shared column component ───────────────────────────────────────────────

function BracketColumn({ label, matchups, getTeam, onPlay, accentColor = 'var(--color-lime)' }) {
  return (
    <div style={{ flex: '0 0 164px' }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '0.65rem',
        letterSpacing: '0.12em',
        color: 'var(--color-text-muted)',
        textAlign: 'center',
        marginBottom: 10,
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        justifyContent: 'space-around',
        minHeight: `${Math.max(matchups.length, 1) * 88}px`,
      }}>
        {matchups.map((m, idx) => {
          const t1 = getTeam(m.team1Id)
          const t2 = getTeam(m.team2Id)
          const canPlay = !m.winnerId && !m.isBye && t1 && t2 && !!onPlay
          const isDone = !!m.winnerId

          return (
            <div key={idx} style={{
              background: 'var(--color-bg-card)',
              borderRadius: 'var(--radius-md)',
              border: isDone
                ? `1px solid ${accentColor}44`
                : canPlay
                  ? '1px solid rgba(26,140,255,0.4)'
                  : '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
              <MatchupSlot team={t1} isWinner={m.winnerId === m.team1Id} isBye={m.isBye && !m.team1Id} accentColor={accentColor} />
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <MatchupSlot team={t2} isWinner={m.winnerId === m.team2Id} isBye={m.isBye && !m.team2Id} accentColor={accentColor} />
              {canPlay && (
                <button
                  onClick={() => onPlay(idx, m)}
                  style={{
                    width: '100%', padding: '5px',
                    background: 'var(--color-blue)',
                    color: '#fff', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.08em',
                  }}
                >
                  ▶ PLAY
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MatchupSlot({ team, isWinner, isBye, accentColor = 'var(--color-lime)' }) {
  if (isBye) {
    return <div style={{ padding: '8px 10px', color: 'var(--color-text-dim)', fontSize: '0.75rem', fontStyle: 'italic' }}>BYE</div>
  }
  if (!team) {
    return <div style={{ padding: '8px 10px', color: 'var(--color-text-dim)', fontSize: '0.75rem' }}>TBD</div>
  }
  return (
    <div style={{
      padding: '8px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      background: isWinner ? `${accentColor}18` : 'transparent',
    }}>
      {isWinner && <span style={{ color: accentColor, fontSize: '0.75rem' }}>✓</span>}
      <span style={{
        fontSize: '0.78rem',
        fontWeight: isWinner ? 700 : 500,
        color: isWinner ? accentColor : 'var(--color-text)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {team.name}
      </span>
    </div>
  )
}
