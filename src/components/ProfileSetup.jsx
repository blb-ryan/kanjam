import { useState } from 'react'
import { usePlayer } from '../contexts/PlayerContext'

export default function ProfileSetup({ onComplete }) {
  const { createProfile, recoverProfile } = usePlayer()
  const [mode, setMode] = useState('create')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    if (phone.replace(/\D/g, '').length < 7) { setError('Enter a valid phone number'); return }
    setLoading(true)
    setError('')
    try {
      await createProfile(name.trim(), phone)
      onComplete?.()
    } catch (err) {
      if (err.message === 'PHONE_EXISTS') {
        setError('That phone number is already registered. Try "Find My Profile" instead.')
      } else {
        setError('Something went wrong. Try again.')
      }
    }
    setLoading(false)
  }

  async function handleRecover(e) {
    e.preventDefault()
    if (phone.replace(/\D/g, '').length < 7) { setError('Enter a valid phone number'); return }
    setLoading(true)
    setError('')
    try {
      await recoverProfile(phone)
      onComplete?.()
    } catch (err) {
      if (err.message === 'NOT_FOUND') {
        setError('No profile found with that number. Try creating one instead.')
      } else {
        setError('Something went wrong. Try again.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="screen" style={{ justifyContent: 'center', padding: '32px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(3rem, 15vw, 4.5rem)',
          lineHeight: 0.9,
          background: 'linear-gradient(135deg, #ff6b1a 0%, #ffd600 50%, #ff6b1a 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '0.04em',
          marginBottom: 12,
        }}>
          KAN<br />JAM
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Set up your player profile to track stats across devices
        </p>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[{ key: 'create', label: 'New Profile' }, { key: 'recover', label: 'Find My Profile' }].map(opt => (
          <button
            key={opt.key}
            onClick={() => { setMode(opt.key); setError('') }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              background: mode === opt.key ? 'var(--color-orange)' : 'var(--color-bg-elevated)',
              color: mode === opt.key ? '#fff' : 'var(--color-text-muted)',
              fontFamily: 'var(--font-display)',
              fontSize: '0.8rem',
              letterSpacing: '0.05em',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {opt.label.toUpperCase()}
          </button>
        ))}
      </div>

      <form onSubmit={mode === 'create' ? handleCreate : handleRecover} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mode === 'create' && (
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            maxLength={24}
            style={{
              padding: '14px', borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg-elevated)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--color-text)', fontSize: '1rem',
            }}
          />
        )}

        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Phone number"
          type="tel"
          style={{
            padding: '14px', borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-elevated)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--color-text)', fontSize: '1rem',
          }}
        />

        {mode === 'recover' && (
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Enter the phone number you used to register
          </p>
        )}

        {error && (
          <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: '100%', fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.1em', padding: '16px', marginTop: 4 }}
        >
          {loading ? '...' : mode === 'create' ? 'CREATE PROFILE' : 'FIND MY PROFILE'}
        </button>
      </form>

      <button
        onClick={onComplete}
        style={{
          background: 'none', border: 'none', color: 'var(--color-text-muted)',
          fontSize: '0.8rem', marginTop: 20, cursor: 'pointer', textDecoration: 'underline',
        }}
      >
        Skip for now (stats won't be tracked)
      </button>
    </div>
  )
}
