import { useState } from 'react'
import { playerFullName } from '../hooks/useFirestore'

export default function PlayerNameInput({
  value, onChange, onSelect, players, color, placeholder, autoFocus, inputRef,
}) {
  const [focused, setFocused] = useState(false)

  const q = value.trim().toLowerCase()
  const matches = focused && q.length >= 1
    ? players.filter(p => {
        const full = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().trim()
        return (
          full.includes(q) ||
          (p.firstName || '').toLowerCase().startsWith(q) ||
          (p.lastName || '').toLowerCase().startsWith(q)
        )
      }).slice(0, 5)
    : []

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        value={value}
        onChange={e => { onChange(e.target.value); onSelect(null) }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        placeholder={placeholder}
        maxLength={30}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
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
      {matches.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 20,
          marginTop: 4,
          background: 'var(--color-bg-card)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {matches.map(p => (
            <button
              key={p.id}
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                onChange(playerFullName(p))
                onSelect(p)
                setFocused(false)
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--color-text)',
                fontSize: '0.9rem',
                fontWeight: 600,
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: `${color}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '0.75rem',
                color,
                flexShrink: 0,
              }}>
                {(p.firstName || '?')[0].toUpperCase()}
              </div>
              <span>{p.firstName} {p.lastName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
