import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../utils/firebase'
import { startTournament } from '../hooks/useFirestore'
import {
  generateSingleEliminationBracket,
  generateDoubleEliminationBracket,
  generateRoundRobin,
} from '../utils/bracketLogic'
import QRCode from 'qrcode'

export default function TournamentLobby() {
  const location = useLocation()
  const navigate = useNavigate()
  const { roomCode, isHost } = location.state || {}

  const [tournament, setTournament] = useState(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!roomCode) { navigate('/'); return }

    // Generate QR
    const joinUrl = `https://blb-ryan.github.io/kanjam/#/join?code=${roomCode}`
    QRCode.toDataURL(joinUrl, { width: 200, margin: 1, color: { dark: '#1a8cff', light: '#1e2330' } })
      .then(setQrDataUrl)
      .catch(() => {})

    // Listen to tournament doc
    const unsub = onSnapshot(doc(db, 'tournaments', roomCode), (snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      setTournament(data)

      // If tournament started and we're a joiner, show bracket
      if (data.status === 'active' && !isHost) {
        navigate('/tournament', { state: { tournament: data } })
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

  const handleStart = async () => {
    if (!tournament || starting) return
    setStarting(true)
    try {
      const { teams, format } = tournament
      let bracket
      if (format === 'single_elimination') {
        bracket = generateSingleEliminationBracket(teams)
      } else if (format === 'double_elimination') {
        bracket = generateDoubleEliminationBracket(teams)
      } else {
        bracket = generateRoundRobin(teams)
      }

      const tournamentData = {
        ...tournament,
        teamIds: teams.map(t => t.id),
      }

      await startTournament(roomCode, tournamentData, bracket)
      navigate('/tournament', {
        state: { tournament: { ...tournamentData, bracket, status: 'active' } },
      })
    } catch {
      setStarting(false)
    }
  }

  if (!roomCode) return null

  const teams = tournament?.teams || []
  const canStart = isHost && teams.length >= 3
  const formatLabel = tournament?.format === 'single_elimination' ? 'Single Elim'
    : tournament?.format === 'double_elimination' ? 'Double Elim'
    : tournament?.format === 'round_robin' ? 'Round Robin' : ''

  return (
    <div className="screen" style={{ padding: '20px 20px 32px', gap: 0 }}>
      <button
        className="btn btn-ghost"
        onClick={() => navigate('/')}
        style={{ padding: '8px 4px', minHeight: 0, alignSelf: 'flex-start', marginBottom: 24 }}
      >
        ← Back
      </button>

      {/* Tournament name + format */}
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.3rem',
        letterSpacing: '0.06em',
        color: 'var(--color-blue)',
        marginBottom: 4,
      }}>
        {tournament?.name?.toUpperCase() || 'TOURNAMENT'}
      </h2>
      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 24 }}>
        {formatLabel} · {isHost ? 'You\'re the host' : 'You\'ve joined'}
      </div>

      {/* Room code */}
      <button
        onClick={handleCopy}
        style={{
          width: '100%',
          background: 'var(--color-bg-elevated)',
          border: `2px solid ${codeCopied ? 'var(--color-blue)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 'var(--radius-xl)',
          padding: '24px 20px',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-dim)', letterSpacing: '0.2em', fontFamily: 'var(--font-display)', marginBottom: 8 }}>
          TOURNAMENT CODE
        </div>
        <div style={{ fontSize: '3rem', fontFamily: 'var(--font-display)', letterSpacing: '0.4em', color: 'var(--color-blue)', lineHeight: 1 }}>
          {roomCode}
        </div>
        <div style={{ fontSize: '0.78rem', color: codeCopied ? 'var(--color-blue)' : 'var(--color-text-dim)', marginTop: 10 }}>
          {codeCopied ? '✓ Copied!' : 'Tap to copy · Share with other teams'}
        </div>
      </button>

      {/* QR code */}
      {qrDataUrl && (
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={qrDataUrl} alt="QR code to join" style={{ width: 140, height: 140, borderRadius: 12 }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 6 }}>Scan to join</div>
        </div>
      )}

      {/* Teams list */}
      <div style={{
        fontSize: '0.65rem',
        fontFamily: 'var(--font-display)',
        color: 'var(--color-text-muted)',
        letterSpacing: '0.2em',
        marginBottom: 10,
      }}>
        TEAMS ({teams.length})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {teams.map((t, i) => (
          <div
            key={t.id}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              border: '1px solid rgba(255,255,255,0.06)',
              animation: 'slideUp 0.3s ease forwards',
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(26,140,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '0.8rem',
              color: 'var(--color-blue)',
              flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.name}</div>
              {i === 0 && isHost && (
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>Your team</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Waiting / minimum teams message */}
      {teams.length < 3 && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: 12 }}>
          Need at least 3 teams to start ({3 - teams.length} more).
        </p>
      )}

      {!isHost && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          color: 'var(--color-text-muted)',
          fontSize: '0.9rem',
          marginTop: 8,
        }}>
          <div
            className="animate-spin"
            style={{
              width: 16,
              height: 16,
              border: '2px solid rgba(255,255,255,0.12)',
              borderTopColor: 'var(--color-blue)',
              borderRadius: '50%',
              flexShrink: 0,
            }}
          />
          Waiting for host to start…
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Start button (host only) */}
      {isHost && (
        <button
          className="btn btn-primary"
          onClick={handleStart}
          disabled={!canStart || starting}
          style={{
            width: '100%',
            fontFamily: 'var(--font-display)',
            fontSize: '1.2rem',
            letterSpacing: '0.1em',
            padding: '18px',
            marginTop: 24,
            opacity: canStart ? 1 : 0.35,
            transition: 'opacity 0.2s',
            background: 'var(--color-blue)',
          }}
        >
          {starting ? 'GENERATING BRACKET...' : `🏆 START TOURNAMENT (${teams.length} TEAMS)`}
        </button>
      )}
    </div>
  )
}
