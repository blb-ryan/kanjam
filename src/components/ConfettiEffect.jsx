import { useEffect, useState } from 'react'

const COLORS = ['#ff6b1a', '#1a8cff', '#ffd600', '#a3e635', '#ff3b3b', '#ffffff']

function randomBetween(a, b) {
  return a + Math.random() * (b - a)
}

export default function ConfettiEffect({ active, count = 60 }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (!active) {
      setPieces([])
      return
    }
    const p = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: randomBetween(5, 95),
      delay: randomBetween(0, 0.8),
      duration: randomBetween(1.8, 3.2),
      size: randomBetween(6, 14),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotate: randomBetween(0, 360),
    }))
    setPieces(p)

    const t = setTimeout(() => setPieces([]), 4000)
    return () => clearTimeout(t)
  }, [active])

  if (!pieces.length) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden',
    }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-20px',
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: 2,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}
