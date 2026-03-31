import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGames } from '../hooks/useFirestore'

const THROW_LABELS = {
  miss: 'Miss', dinger: 'Dinger', deuce: 'Deuce', bucket: 'Bucket', instant_win: '⚡ IW',
}

export default function GameHistory() {
  const navigate = useNavigate()
  const { games, loading, deleteGame } = useGames()
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  const filtered = games.filter(g => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return (
      g.team1?.name?.toLowerCase().includes(s) ||
      g.team2?.name?.toLowerCase().includes(s)
    )
  })

  const handleDelete = async (id) => {
    try {
      await deleteGame(id)
      setConfirmDelete(null)
      setDeleteError('')
      if (expanded === id) setExpanded(null)
    } catch {
      setDeleteError('Delete failed. Try again.')
      setConfirmDelete(null)
    }
  }

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ padding: '8px 4px', minHeight: 0 }}>
          ← Back
        </button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--color-lime)', letterSpacing: '0.05em' }}>
          GAME HISTORY
        </h2>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Filter by team name..."
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg-elevated)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'var(--color-text)',
          fontSize: '1rem',
          marginBottom: 14,
        }}
      />

      {loading && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 24 }}>Loading...</p>}
      {deleteError && (
        <p style={{ color: 'var(--color-danger)', textAlign: 'center', fontSize: '0.85rem', marginBottom: 8 }}>{deleteError}</p>
      )}

      {!loading && filtered.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 24 }}>
          {search ? 'No games matching that search.' : 'No games yet. Start playing!'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(game => {
          const isExpanded = expanded === game.id
          const isT1Winner = game.winnerId === game.team1?.id
          const date = game.completedAt ? new Date(game.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

          return (
            <div key={game.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Card header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : game.id)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'none',
                  cursor: 'pointer',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.95rem',
                    color: isT1Winner ? 'var(--color-team1)' : 'var(--color-text)',
                    letterSpacing: '0.03em',
                  }}>
                    {isT1Winner && '🏆 '}{game.team1?.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-team1)', lineHeight: 1 }}>
                    {game.team1Score}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>{date}</div>
                  {game.winType === 'instant_win' && <div style={{ fontSize: '0.65rem', color: 'var(--color-yellow)' }}>⚡ IW</div>}
                  {game.isOvertime && <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>OT</div>}
                  <div style={{ color: 'var(--color-text-dim)', fontSize: '1rem', marginTop: 2 }}>{isExpanded ? '▲' : '▼'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.95rem',
                    color: !isT1Winner ? 'var(--color-team2)' : 'var(--color-text)',
                    letterSpacing: '0.03em',
                  }}>
                    {!isT1Winner && '🏆 '}{game.team2?.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-team2)', lineHeight: 1 }}>
                    {game.team2Score}
                  </div>
                </div>
              </button>

              {/* Expanded round detail */}
              {isExpanded && (
                <div style={{ padding: '0 16px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ marginTop: 12, marginBottom: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}></span>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-display)', color: 'var(--color-team1)', letterSpacing: '0.08em' }}>
                        {game.team1?.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-display)', color: 'var(--color-team2)', letterSpacing: '0.08em' }}>
                        {game.team2?.name}
                      </span>
                    </div>
                    {(game.rounds || []).map(r => (
                      <div key={r.roundNumber} style={{
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr 1fr',
                        gap: 6,
                        fontSize: '0.78rem',
                        padding: '3px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}>
                        <span style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-display)', fontSize: '0.65rem' }}>R{r.roundNumber}</span>
                        <span style={{ color: r.team1Throw?.busted ? 'var(--color-danger)' : 'var(--color-team1)' }}>
                          {r.team1Throw ? `${THROW_LABELS[r.team1Throw.type] || r.team1Throw.type}${r.team1Throw.busted ? ' (bust)' : r.team1Throw.points > 0 ? ` +${r.team1Throw.points}` : ''}` : '—'}
                        </span>
                        <span style={{ color: r.team2Throw?.busted ? 'var(--color-danger)' : 'var(--color-team2)' }}>
                          {r.team2Throw ? `${THROW_LABELS[r.team2Throw.type] || r.team2Throw.type}${r.team2Throw.busted ? ' (bust)' : r.team2Throw.points > 0 ? ` +${r.team2Throw.points}` : ''}` : '—'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Delete */}
                  {confirmDelete === game.id ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button className="btn btn-danger" onClick={() => handleDelete(game.id)} style={{ flex: 1, minHeight: 0, padding: '8px' }}>
                        Confirm Delete
                      </button>
                      <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)} style={{ flex: 1, minHeight: 0, padding: '8px' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-ghost"
                      onClick={() => setConfirmDelete(game.id)}
                      style={{ color: 'var(--color-danger)', minHeight: 0, padding: '6px 10px', fontSize: '0.8rem', marginTop: 4 }}
                    >
                      🗑 Delete game
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
