import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../utils/firebase'
import { VALID_CHARS } from '../utils/roomCode'
import { joinLobby, joinTournamentLobby, resolvePlayer, nameToDisplay, usePlayers } from '../hooks/useFirestore'
import PlayerNameInput from './PlayerNameInput'

export default function JoinGame() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { players } = usePlayers()

  // 'code' → entering room code | 'names' → game team 2 names | 'tournament-names' → tournament team names
  const [step, setStep] = useState('code')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Stored when lobby is found
  const [team1, setTeam1] = useState(null)
  const [tournamentData, setTournamentData] = useState(null)

  // Team 2 name inputs
  const [name1, setName1] = useState('')
  const [selected1, setSelected1] = useState(null)
  const [name2, setName2] = useState('')
  const [selected2, setSelected2] = useState(null)
  const ref2 = useRef(null)
  const canJoin = name1.trim() && name2.trim()

  // Auto-fill from QR scan (?code=XXXX)
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
      // Check games collection first
      const gameSnap = await getDoc(doc(db, 'games', codeToCheck))
      if (gameSnap.exists()) {
        const data = gameSnap.data()
        if (data.status === 'lobby') {
          setTeam1(data.team1)
          setStep('names')
          setLoading(false)
          return
        }
        if (data.status === 'active') {
          navigate('/game', { state: data })
          return
        }
        setError('That game has already ended.')
        setLoading(false)
        return
      }

      // Check tournaments collection
      const tournSnap = await getDoc(doc(db, 'tournaments', codeToCheck))
      if (tournSnap.exists()) {
        const data = tournSnap.data()
        if (data.status === 'lobby') {
          setTournamentData(data)
          setStep('tournament-names')
          setLoading(false)
          return
        }
        if (data.status === 'active') {
          navigate('/tournament', { state: { tournament: data } })
          return
        }
        setError('That tournament has already ended.')
        setLoading(false)
        return
      }

      setError('Game not found. Double-check the code.')
      setLoading(false)
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  const handleJoinTournament = async () => {
    if (!canJoin || !tournamentData) return
    setLoading(true)
    try {
      const [pid1, pid2] = await Promise.all([
        resolvePlayer(name1, selected1),
        resolvePlayer(name2, selected2),
      ])
      const d1 = nameToDisplay(name1, selected1)
      const d2 = nameToDisplay(name2, selected2)
      const team = {
        id: crypto.randomUUID(),
        name: `${d1} + ${d2}`,
        playerIds: [pid1, pid2],
        playerNames: [d1, d2],
      }
      await joinTournamentLobby(code, team)
      navigate('/tournament-lobby', { state: { roomCode: code, isHost: false } })
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  const handleJoinNames = async () => {
    if (!canJoin || !team1) return
    setLoading(true)
    try {
      const [pid1, pid2] = await Promise.all([
        resolvePlayer(name1, selected1),
        resolvePlayer(name2, selected2),
      ])
      const d1 = nameToDisplay(name1, selected1)
      const d2 = nameToDisplay(name2, selected2)
      const team2 = {
        id: crypto.randomUUID(),
        name: `${d1} + ${d2}`,
        playerIds: [pid1, pid2],
        playerNames: [d1, d2],
      }
      await joinLobby(code, team1, team2)
      const snap = await getDoc(doc(db, 'games', code))
      navigate('/game', { state: snap.data() })
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  const preview = name1.trim() && name2.trim()
    ? `${nameToDisplay(name1, selected1)} + ${nameToDisplay(name2, selected2)}`
    : null

  // Step: Tournament team name entry
  if (step === 'tournament-names') {
    return (
      <div className="screen" style={{ padding: '20px 20px 32px', gap: 0 }}>
        <button
          className="btn btn-ghost"
          onClick={() => { setStep('code'); setTournamentData(null); setError(''); setName1(''); setName2(''); setSelected1(null); setSelected2(null) }}
          style={{ padding: '8px 4px', minHeight: 0, alignSelf: 'flex-start', marginBottom: 24 }}
        >
          ← Back
        </button>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          letterSpacing: '0.06em',
          color: 'var(--color-blue)',
          marginBottom: 6,
        }}>
          JOIN TOURNAMENT
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 6, lineHeight: 1.5 }}>
          <span style={{ color: 'var(--color-blue)', fontWeight: 700 }}>{tournamentData?.name}</span>
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 28, lineHeight: 1.5 }}>
          {tournamentData?.teams?.length || 0} team{(tournamentData?.teams?.length || 0) !== 1 ? 's' : ''} already joined. Enter your names to join.
        </p>

        <div style={{
          fontSize: '0.65rem',
          fontFamily: 'var(--font-display)',
          color: 'var(--color-blue)',
          letterSpacing: '0.2em',
          marginBottom: 10,
        }}>
          YOUR TEAM
        </div>

        <PlayerNameInput
          value={name1}
          onChange={setName1}
          onSelect={setSelected1}
          players={players}
          placeholder="First Last"
          color="var(--color-blue)"
          autoFocus
        />

        <div style={{
          textAlign: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          color: 'var(--color-blue)',
          opacity: 0.45,
          margin: '6px 0',
        }}>
          +
        </div>

        <PlayerNameInput
          inputRef={ref2}
          value={name2}
          onChange={setName2}
          onSelect={setSelected2}
          players={players}
          placeholder="First Last"
          color="var(--color-blue)"
        />

        {preview && (
          <div style={{
            marginTop: 10,
            textAlign: 'center',
            padding: '7px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(26,140,255,0.07)',
            border: '1px solid rgba(26,140,255,0.25)',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--color-blue)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {preview}
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
          onClick={handleJoinTournament}
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
            background: 'var(--color-blue)',
          }}
        >
          {loading ? 'JOINING...' : '🏆 JOIN TOURNAMENT'}
        </button>
      </div>
    )
  }

  // Step 2: Team 2 name entry
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

        <PlayerNameInput
          value={name1}
          onChange={setName1}
          onSelect={setSelected1}
          players={players}
          placeholder="First Last"
          color="var(--color-team2)"
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

        <PlayerNameInput
          inputRef={ref2}
          value={name2}
          onChange={setName2}
          onSelect={setSelected2}
          players={players}
          placeholder="First Last"
          color="var(--color-team2)"
        />

        {preview && (
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
            {preview}
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

  // Step 1: Code entry
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
