import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../utils/firebase'
import { VALID_CHARS } from '../utils/roomCode'
import { joinLobby } from '../hooks/useFirestore'

export default function JoinGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // 'code' → entering room code | 'names' → entering Team 2 names
  const [step, setStep] = useState('code')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Stored when lobby is found, used when names are submitted
  const [team1, setTeam1] = useState(null)

  // Team 2 name inputs
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const ref2 = useRef(null)
  const canJoin = p1.trim() && p2.trim()

  // Auto-fill + auto-lookup from QR scan (?code=XXXX)
  useEffect(() => {
    const qrCode = searchParams.get('code')?.toUpperCase().slice(0, 4) || ''
    if (qrCode.length === 4 && [...qrCode].every(c => VALID_CHARS.has(c))) {
      setCode(qrCode)
      const t = setTimeout(() => lookupCode(qrCode), 600)
      return () => clearTimeout(t)
    }
  }, [])

  const handleCodeInput = (e) => {
    const val = e.target.value
      .toUpperCase()
      .split('')
      .filter(c => VALID_CHARS.has(c))
      .join('')
    setCode(val.slice(0, 4))
    setError('')
  }

  const lookupCode = async (codeToCheck) => {
    setLoading(true)
    setError('')
    try {
      const snap = await getDoc(doc(db, 'games', codeToCheck))
      if (!snap.exists()) {
        setError('Game not found. Double-check the code.')
        setLoading(false)
        return
      }
      const data = snap.data()
      if (data.status === 'lobby') {
        // Team 2 joins: show name entry
        setTeam1(data.team1)
        setStep('names')
        setLoading(false)
      } else if (data.status === 'active') {
        // Game already running — join as scorekeeper/spectator
        navigate('/game', { state: data })
      } else {
        setError('That game has already ended.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  const handleJoinNames = async () => {
    if (!canJoin || !team1) return
    setLoading(true)
    try {
      const n1 = p1.trim(), n2 = p2.trim()
      const team2 = {
        id: crypto.randomUUID(),
        name: `${n1} + ${n2}`,
        playerIds: [crypto.randomUUID(), crypto.randomUUID()],
        playerNames: [n1, n2],
      }
      await joinLobby(code, team1, team2)
      // Navigate to game — host will also receive the Firestore update and navigate
      const snap = await getDoc(doc(db, 'games', code))
      navigate('/game', { state: snap.data() })
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  if (step === 'names') {
    return (
      <div className="screen" style={{ padding: '20px 20px 32px', gap: 0 }}>
        <button
          className="btn btn-ghost"
          onClick={() => { setStep('code'); setTeam1(null); setError('') }}
          style={{ padding: '8px 4px', minHeight: 0, alignSelf: 'flex-start', marginBottom: 24 }}
        >
          ← Back
        </button>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          letterSpacing: '0.06em',
          color: 'var(--color-orange)',
          marginBottom: 6,
        }}>
          YOUR TEAM
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 28, lineHeight: 1.5 }}>
          {team1?.name && (
            <><span style={{ color: 'var(--color-team1)', fontWeight: 700 }}>{team1.name}</span> is waiting. Enter your names to start.</>
          )}
        </p>

        <div style={{
          fontSize: '0.65rem',
          fontFamily: 'var(--font-display)',
          color: 'var(--color-team2)',
          letterSpacing: '0.2em',
          marginBottom: 10,
        }}>
          TEAM 2
        </div>

        <NameInput
          value={p1}
          onChange={setP1}
          placeholder="Player 1"
          color="var(--color-team2)"
          onEnter={() => ref2.current?.focus()}
          autoFocus
        />

        <div style={{
          textAlign: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          color: 'var(--color-team2)',
          opacity: 0.45,
          margin: '6px 0',
        }}>
          +
        </div>

        <NameInput
          inputRef={ref2}
          value={p2}
          onChange={setP2}
          placeholder="Player 2"
          color="var(--color-team2)"
          onEnter={canJoin ? handleJoinNames : undefined}
        />

        {p1.trim() && p2.trim() && (
          <div style={{
            marginTop: 10,
            textAlign: 'center',
            padding: '7px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255,107,26,0.07)',
            border: '1px solid rgba(255,107,26,0.25)',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--color-team2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {p1.trim()} + {p2.trim()}
          </div>
        )}

        {error && (
          <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', textAlign: 'center', marginTop: 12 }}>
            {error}
          </p>
        )}

        <div style={{ flex: 1 }} />

        <button
          className="btn btn-primary"
          onClick={handleJoinNames}
          disabled={!canJoin || loading}
          style={{
            width: '100%',
            fontFamily: 'var(--font-display)',
            fontSize: '1.2rem',
            letterSpacing: '0.1em',
            padding: '18px',
            marginTop: 24,
            opacity: canJoin ? 1 : 0.35,
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'STARTING...' : '🥏 LET\'S PLAY'}
        </button>
      </div>
    )
  }

  // Step: code entry
  return (
    <div className="screen" style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/')}
          style={{ padding: '8px 4px', minHeight: 0 }}
        >
          ← Back
        </button>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          letterSpacing: '0.05em',
          color: 'var(--color-orange)',
        }}>
          JOIN GAME
        </h2>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 14 }}>🥏</div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
          Enter the 4-letter code shown<br />on the other team's phone
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          value={code}
          onChange={handleCodeInput}
          onKeyDown={e => e.key === 'Enter' && code.length === 4 && lookupCode(code)}
          placeholder="A B C D"
          maxLength={4}
          autoFocus
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          style={{
            width: '100%',
            padding: '20px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-elevated)',
            border: `2px solid ${code.length === 4 ? 'var(--color-orange)' : 'rgba(255,255,255,0.1)'}`,
            color: 'var(--color-text)',
            fontSize: '2.8rem',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.5em',
            textAlign: 'center',
            textTransform: 'uppercase',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box',
          }}
        />
        {error && (
          <div style={{
            color: 'var(--color-danger)',
            fontSize: '0.85rem',
            marginTop: 10,
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}
      </div>

      <button
        className="btn btn-primary"
        onClick={() => lookupCode(code)}
        disabled={code.length !== 4 || loading}
        style={{
          width: '100%',
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          letterSpacing: '0.1em',
          padding: '16px',
        }}
      >
        {loading ? 'FINDING GAME...' : 'NEXT →'}
      </button>
    </div>
  )
}

function NameInput({ value, onChange, placeholder, color, onEnter, autoFocus, inputRef }) {
  return (
    <input
      ref={inputRef}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      placeholder={placeholder}
      maxLength={16}
      autoFocus={autoFocus}
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
