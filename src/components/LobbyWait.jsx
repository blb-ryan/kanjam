import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../utils/firebase'
import QRCode from 'qrcode'

export default function LobbyWait() {
  const location = useLocation()
  const navigate = useNavigate()
  const { roomCode } = location.state || {}

  const [codeCopied, setCodeCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState(null)

  useEffect(() => {
    if (!roomCode) { navigate('/'); return }

    // Generate QR for the join URL
    const joinUrl = `https://blb-ryan.github.io/kanjam/#/join?code=${roomCode}`
    QRCode.toDataURL(joinUrl, { width: 200, margin: 1, color: { dark: '#ff6b1a', light: '#1e2330' } })
      .then(setQrDataUrl)
      .catch(() => {})

    // Listen for Team 2 to join
    const unsub = onSnapshot(doc(db, 'games', roomCode), (snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      if (data.status === 'active' && data.team2) {
        navigate('/game', { state: data })
      }
    })

    return unsub
  }, [roomCode])

  const handleCopy = () => {
    navigator.clipboard?.writeText(roomCode)?.then(() => {
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 1500)
    })
  }

  if (!roomCode) return null

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
        marginBottom: 6,
      }}>
        SHARE CODE
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 32, lineHeight: 1.5 }}>
        Send this to Team 2 so they can join and enter their names.
      </p>

      {/* Big tappable code */}
      <button
        onClick={handleCopy}
        style={{
          width: '100%',
          background: 'var(--color-bg-elevated)',
          border: `2px solid ${codeCopied ? 'var(--color-orange)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 'var(--radius-xl)',
          padding: '28px 20px',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        <div style={{
          fontSize: '0.65rem',
          color: 'var(--color-text-dim)',
          letterSpacing: '0.2em',
          fontFamily: 'var(--font-display)',
          marginBottom: 10,
        }}>
          GAME CODE
        </div>
        <div style={{
          fontSize: '3.5rem',
          fontFamily: 'var(--font-display)',
          letterSpacing: '0.4em',
          color: 'var(--color-orange)',
          lineHeight: 1,
        }}>
          {roomCode}
        </div>
        <div style={{
          fontSize: '0.78rem',
          color: codeCopied ? 'var(--color-orange)' : 'var(--color-text-dim)',
          marginTop: 12,
          transition: 'color 0.2s',
        }}>
          {codeCopied ? '✓ Copied!' : 'Tap to copy'}
        </div>
      </button>

      {/* QR code */}
      {qrDataUrl && (
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={qrDataUrl} alt="QR code to join" style={{ width: 160, height: 160, borderRadius: 12 }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
            Or scan to join
          </div>
        </div>
      )}

      {/* Waiting indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        color: 'var(--color-text-muted)',
        fontSize: '0.9rem',
      }}>
        <div
          className="animate-spin"
          style={{
            width: 16,
            height: 16,
            border: '2px solid rgba(255,255,255,0.12)',
            borderTopColor: 'var(--color-orange)',
            borderRadius: '50%',
            flexShrink: 0,
          }}
        />
        Waiting for Team 2 to join…
      </div>
    </div>
  )
}
