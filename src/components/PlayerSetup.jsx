import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateUniqueRoomCode } from '../utils/roomCode'

export default function PlayerSetup() {
  const navigate = useNavigate()
  const [p1t1, setP1t1] = useState('') // Team 1, Player 1
  const [p2t1, setP2t1] = useState('') // Team 1, Player 2
  const [p1t2, setP1t2] = useState('') // Team 2, Player 1
  const [p2t2, setP2t2] = useState('') // Team 2, Player 2
  const [generating, setGenerating] = useState(false)

  const ref1b = useRef(null)
  const ref2a = useRef(null)
  const ref2b = useRef(null)

  const canStart = p1t1.trim() && p2t1.trim() && p1t2.trim() && p2t2.trim()

  const handleStart = async () => {
    if (!canStart) return
    setGenerating(true)
    try {
      const roomCode = await generateUniqueRoomCode()
      const n1a = p1t1.trim(), n1b = p2t1.trim()
      const n2a = p1t2.trim(), n2b = p2t2.trim()
      const team1 = {
        id: crypto.randomUUID(),
        name: `${n1a} + ${n1b}`,
        playerIds: [crypto.randomUUID(), crypto.randomUUID()],
        playerNames: [n1a, n1b],
      }
      const team2 = {
        id: crypto.randomUUID(),
        name: `${n2a} + ${n2b}`,
        playerIds: [crypto.randomUUID(), crypto.randomUUID()],
        playerNames: [n2a, n2b],
      }
      navigate('/game', { state: { team1, team2, roomCode } })
    } catch {
      setGenerating(false)
    }
  }

  return (
    <div className="screen" style={{ padding: '20px 20px 32px', gap: 0 }}>
      <button
        className="btn btn-ghost"
        onClick={() => navigate('/')}
        style={{ padding: '8px 4px', minHeight: 0, alignSelf: 'flex-start', marginBottom: 28 }}
      >
        ← Back
      </button>

      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.4rem',
        letterSpacing: '0.06em',
        color: 'var(--color-orange)',
        marginBottom: 28,
      }}>
        WHO'S PLAYING?
      </h2>

      {/* Team 1 */}
      <TeamNameRow
        color="var(--color-team1)"
        label="TEAM 1"
        valueA={p1t1} onChangeA={setP1t1} placeholderA="Player 1"
        valueB={p2t1} onChangeB={setP2t1} placeholderB="Player 2"
        refA={null} refB={ref1b}
        onEnterA={() => ref1b.current?.focus()}
        onEnterB={() => ref2a.current?.focus()}
      />

      {/* VS divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.15em' }}>VS</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Team 2 */}
      <TeamNameRow
        color="var(--color-team2)"
        label="TEAM 2"
        valueA={p1t2} onChangeA={setP1t2} placeholderA="Player 1"
        valueB={p2t2} onChangeB={setP2t2} placeholderB="Player 2"
        refA={ref2a} refB={ref2b}
        onEnterA={() => ref2b.current?.focus()}
        onEnterB={canStart ? handleStart : undefined}
      />

      {/* Team name previews */}
      {(p1t1.trim() || p2t1.trim() || p1t2.trim() || p2t2.trim()) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '20px 0 4px' }}>
          <TeamPreview color="var(--color-team1)" a={p1t1.trim()} b={p2t1.trim()} />
          <TeamPreview color="var(--color-team2)" a={p1t2.trim()} b={p2t2.trim()} />
        </div>
      )}

      <div style={{ flex: 1 }} />

      <button
        className="btn btn-primary"
        onClick={handleStart}
        disabled={!canStart || generating}
        style={{
          width: '100%',
          fontFamily: 'var(--font-display)',
          fontSize: '1.2rem',
          letterSpacing: '0.1em',
          padding: '18px',
          marginTop: 24,
          opacity: canStart ? 1 : 0.35,
          transition: 'opacity 0.2s',
        }}
      >
        {generating ? 'STARTING...' : '🥏 LET\'S PLAY'}
      </button>
    </div>
  )
}

function TeamNameRow({ color, label, valueA, onChangeA, placeholderA, valueB, onChangeB, placeholderB, refA, refB, onEnterA, onEnterB }) {
  return (
    <div>
      <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-display)', color, letterSpacing: '0.2em', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <NameInput ref={refA} value={valueA} onChange={onChangeA} placeholder={placeholderA} color={color} onEnter={onEnterA} />
        <span style={{ fontFamily: 'var(--font-display)', color, fontSize: '1.1rem', flexShrink: 0 }}>+</span>
        <NameInput ref={refB} value={valueB} onChange={onChangeB} placeholder={placeholderB} color={color} onEnter={onEnterB} />
      </div>
    </div>
  )
}

function NameInput({ value, onChange, placeholder, color, onEnter, ref: externalRef }) {
  return (
    <input
      ref={externalRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      placeholder={placeholder}
      maxLength={16}
      style={{
        flex: 1,
        padding: '13px 14px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-bg-elevated)',
        border: `2px solid ${value.trim() ? `${color}88` : 'rgba(255,255,255,0.08)'}`,
        color: 'var(--color-text)',
        fontSize: '1rem',
        fontWeight: 700,
        textAlign: 'center',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
      }}
    />
  )
}

function TeamPreview({ color, a, b }) {
  const name = a && b ? `${a} + ${b}` : a || b || ''
  if (!name) return <div />
  return (
    <div style={{
      textAlign: 'center',
      padding: '8px 10px',
      borderRadius: 'var(--radius-md)',
      background: `${color}12`,
      border: `1px solid ${color}44`,
      fontSize: '0.8rem',
      fontWeight: 700,
      color,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}>
      {name}
    </div>
  )
}
