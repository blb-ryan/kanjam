import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../utils/firebase'
import { VALID_CHARS } from '../utils/roomCode'

export default function JoinGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Auto-fill + auto-join from QR scan (?code=XXXX)
  useEffect(() => {
    const qrCode = searchParams.get('code')?.toUpperCase().slice(0, 4) || ''
    if (qrCode.length === 4 && [...qrCode].every(c => VALID_CHARS.has(c))) {
      setCode(qrCode)
      // Small delay so user sees the code before auto-joining
      const t = setTimeout(() => {
        setLoading(true)
        setError('')
        getDoc(doc(db, 'games', qrCode)).then(snap => {
          if (!snap.exists()) { setError('Game not found.'); setLoading(false); return }
          const gameData = snap.data()
          if (gameData.status !== 'active') { setError('That game has already ended.'); setLoading(false); return }
          navigate('/game', { state: gameData })
        }).catch(() => { setError('Something went wrong. Try again.'); setLoading(false) })
      }, 600)
      return () => clearTimeout(t)
    }
  }, [])

  const handleInput = (e) => {
    const val = e.target.value
      .toUpperCase()
      .split('')
      .filter(c => VALID_CHARS.has(c))
      .join('')
    setCode(val.slice(0, 4))
    setError('')
  }

  const handleJoin = async () => {
    if (code.length !== 4) return
    setLoading(true)
    setError('')
    try {
      const snap = await getDoc(doc(db, 'games', code))
      if (!snap.exists()) {
        setError('Game not found. Double-check the code.')
        setLoading(false)
        return
      }
      const gameData = snap.data()
      if (gameData.status !== 'active') {
        setError('That game has already ended.')
        setLoading(false)
        return
      }
      navigate('/game', { state: gameData })
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="screen" style={{ padding: '20px 16px' }}>
      {/* Header */}
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

      {/* Icon + description */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 14 }}>🥏</div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
          Enter the 4-letter code shown<br />on the host's phone
        </p>
      </div>

      {/* Code input */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={code}
          onChange={handleInput}
          onKeyDown={e => e.key === 'Enter' && code.length === 4 && handleJoin()}
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
        onClick={handleJoin}
        disabled={code.length !== 4 || loading}
        style={{
          width: '100%',
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          letterSpacing: '0.1em',
          padding: '16px',
        }}
      >
        {loading ? 'FINDING GAME...' : 'JOIN GAME'}
      </button>
    </div>
  )
}
