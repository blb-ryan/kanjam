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
        style={{ padding: '8px 4px', minHeight: 0, alignSelf: 'flex-start', marginBottom: 24 }}
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
      <TeamBlock
        color="var(--color-team1)"
        label="TEAM 1"
        valueA={p1t1} onChangeA={setP1t1}
        valueB={p2t1} onChangeB={setP2t1}
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
      <TeamBlock
        color="var(--color-team2)"
        label="TEAM 2"
        valueA={p1t2} onChangeA={setP1t2}
        valueB={p2t2} onChangeB={setP2t2}
        refA={ref2a} refB={ref2b}
        onEnterA={() => ref2b.current?.focus()}
        onEnterB={canStart ? handleStart : undefined}
      />

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

function TeamBlock({ color, label, valueA, onChangeA, valueB, onChangeB, refA, refB, onEnterA, onEnterB }) {
  const previewName = valueA.trim() && valueB.trim()
    ? `${valueA.trim()} + ${valueB.trim()}`
    : null

  return (
    <div>
      <div style={{
        fontSize: '0.65rem',
        fontFamily: 'var(--font-display)',
        color,
        letterSpacing: '0.2em',
        marginBottom: 10,
      }}>
        {label}
      </div>

      {/* Player 1 */}
      <NameInput
        ref={refA}
        value={valueA}
        onChange={onChangeA}
        placeholder="Player 1"
        color={color}
        onEnter={onEnterA}
      />

      {/* + connector */}
      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: '1.1rem',
        color,
        opacity: 0.5,
        margin: '6px 0',
      }}>
        +
      </div>

      {/* Player 2 */}
      <NameInput
        ref={refB}
        value={valueB}
        onChange={onChangeB}
        placeholder="Player 2"
        color={color}
        onEnter={onEnterB}
      />

      {/* Live preview */}
      {previewName && (
        <div style={{
          marginTop: 10,
          textAlign: 'center',
          padding: '7px 12px',
          borderRadius: 'var(--radius-md)',
          background: `${color}12`,
          border: `1px solid ${color}44`,
          fontSize: '0.82rem',
          fontWeight: 700,
          color,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {previewName}
        </div>
      )}
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
        width: '100%',
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
