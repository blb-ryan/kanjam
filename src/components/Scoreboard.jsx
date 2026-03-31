import { useEffect, useRef } from 'react'

export default function Scoreboard({ team1, team2, team1Score, team2Score, currentHalf, roundNumber, isOvertime }) {
  const prevT1 = useRef(team1Score)
  const prevT2 = useRef(team2Score)
  const t1Ref = useRef(null)
  const t2Ref = useRef(null)

  useEffect(() => {
    if (team1Score !== prevT1.current && t1Ref.current) {
      t1Ref.current.classList.remove('animate-score-pop')
      void t1Ref.current.offsetWidth
      t1Ref.current.classList.add('animate-score-pop')
      prevT1.current = team1Score
    }
  }, [team1Score])

  useEffect(() => {
    if (team2Score !== prevT2.current && t2Ref.current) {
      t2Ref.current.classList.remove('animate-score-pop')
      void t2Ref.current.offsetWidth
      t2Ref.current.classList.add('animate-score-pop')
      prevT2.current = team2Score
    }
  }, [team2Score])

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      gap: 8,
      padding: '16px 12px 12px',
      background: 'var(--color-navy)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Team 1 */}
      <TeamScore
        team={team1}
        score={team1Score}
        color="var(--color-team1)"
        glow="var(--color-team1-glow)"
        active={currentHalf === 0}
        scoreRef={t1Ref}
        align="left"
      />

      {/* Center */}
      <div style={{ textAlign: 'center', userSelect: 'none' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.7rem',
          letterSpacing: '0.12em',
          color: isOvertime ? 'var(--color-yellow)' : 'var(--color-text-muted)',
          marginBottom: 2,
        }}>
          {isOvertime ? 'OT' : `RND`}
        </div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.6rem',
          color: isOvertime ? 'var(--color-yellow)' : 'var(--color-text)',
          lineHeight: 1,
        }}>
          {roundNumber}
        </div>
        <div style={{
          width: 20,
          height: 2,
          background: 'var(--color-text-dim)',
          margin: '4px auto 0',
          borderRadius: 1,
        }} />
      </div>

      {/* Team 2 */}
      <TeamScore
        team={team2}
        score={team2Score}
        color="var(--color-team2)"
        glow="var(--color-team2-glow)"
        active={currentHalf === 1}
        scoreRef={t2Ref}
        align="right"
      />
    </div>
  )
}

function TeamScore({ team, score, color, glow, active, scoreRef, align }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'left' ? 'flex-start' : 'flex-end',
      gap: 2,
      padding: '8px 10px',
      borderRadius: 'var(--radius-md)',
      background: active ? `${color}18` : 'transparent',
      border: active ? `1px solid ${color}55` : '1px solid transparent',
      transition: 'all 0.3s',
      ...(active ? {
        animation: 'pulseGlow 2.5s ease-in-out infinite',
        '--glow-color': glow,
      } : {}),
    }}>
      <div style={{
        fontSize: '0.7rem',
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.08em',
        color: active ? color : 'var(--color-text-muted)',
        maxWidth: 120,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {team?.name?.toUpperCase()}
      </div>
      <div
        ref={scoreRef}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(3rem, 16vw, 5rem)',
          lineHeight: 1,
          color: active ? color : 'var(--color-text)',
          transition: 'color 0.3s',
        }}
      >
        {score}
      </div>
    </div>
  )
}
