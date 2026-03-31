import { getRoundName } from '../utils/bracketLogic'

export default function BracketVisualization({ bracket, teams, onPlayMatchup }) {
  if (!bracket || !bracket.rounds) return null

  const totalRounds = bracket.rounds.length
  const getTeam = (id) => teams.find(t => t.id === id)

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{
        display: 'flex',
        gap: 12,
        minWidth: `${totalRounds * 180}px`,
      }}>
        {bracket.rounds.map(round => (
          <div key={round.roundNumber} style={{ flex: '0 0 168px' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
              marginBottom: 10,
              textTransform: 'uppercase',
            }}>
              {getRoundName(round.roundNumber, totalRounds)}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              justifyContent: 'space-around',
              minHeight: `${Math.max(round.matchups.length, 1) * 90}px`,
            }}>
              {round.matchups.map((m, idx) => {
                const t1 = getTeam(m.team1Id)
                const t2 = getTeam(m.team2Id)
                const canPlay = !m.winnerId && !m.isBye && t1 && t2
                const isDone = !!m.winnerId

                return (
                  <div key={idx} style={{
                    background: 'var(--color-bg-card)',
                    borderRadius: 'var(--radius-md)',
                    border: isDone
                      ? '1px solid rgba(163,230,53,0.3)'
                      : canPlay
                        ? '1px solid rgba(26,140,255,0.4)'
                        : '1px solid rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                  }}>
                    {/* Team 1 slot */}
                    <MatchupSlot
                      team={t1}
                      isWinner={m.winnerId === m.team1Id}
                      isBye={m.isBye && !m.team1Id}
                    />
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    {/* Team 2 slot */}
                    <MatchupSlot
                      team={t2}
                      isWinner={m.winnerId === m.team2Id}
                      isBye={m.isBye && !m.team2Id}
                    />

                    {canPlay && onPlayMatchup && (
                      <button
                        onClick={() => onPlayMatchup(round.roundNumber, idx, m)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          background: 'var(--color-blue)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.7rem',
                          letterSpacing: '0.08em',
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
        ))}
      </div>
    </div>
  )
}

function MatchupSlot({ team, isWinner, isBye }) {
  if (isBye) {
    return (
      <div style={{ padding: '8px 10px', color: 'var(--color-text-dim)', fontSize: '0.75rem', fontStyle: 'italic' }}>
        BYE
      </div>
    )
  }
  if (!team) {
    return (
      <div style={{ padding: '8px 10px', color: 'var(--color-text-dim)', fontSize: '0.75rem' }}>
        TBD
      </div>
    )
  }
  return (
    <div style={{
      padding: '8px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: isWinner ? 'rgba(163,230,53,0.12)' : 'transparent',
    }}>
      {isWinner && <span style={{ color: 'var(--color-lime)', fontSize: '0.8rem' }}>✓</span>}
      <span style={{
        fontSize: '0.8rem',
        fontWeight: isWinner ? 700 : 500,
        color: isWinner ? 'var(--color-lime)' : 'var(--color-text)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {team.name}
      </span>
    </div>
  )
}
