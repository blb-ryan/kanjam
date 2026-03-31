import { useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { PlayerProvider, usePlayer } from './contexts/PlayerContext'
import Home from './components/Home'
import PlayerSetup from './components/PlayerSetup'
import LiveGame from './components/LiveGame'
import GameOver from './components/GameOver'
import GameHistory from './components/GameHistory'
import PlayerStats from './components/PlayerStats'
import TournamentSetup from './components/TournamentSetup'
import TournamentBracket from './components/TournamentBracket'
import ProfileSetup from './components/ProfileSetup'
import './styles/global.css'

function AppRoutes() {
  const { player, loading } = usePlayer()
  const [skipped, setSkipped] = useState(false)

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flex: 1, fontFamily: 'var(--font-display)', color: 'var(--color-orange)',
        fontSize: '2rem', letterSpacing: '0.1em',
      }}>
        KAN JAM
      </div>
    )
  }

  if (!player && !skipped) {
    return <ProfileSetup onComplete={() => setSkipped(true)} />
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/setup" element={<PlayerSetup />} />
      <Route path="/game" element={<LiveGame />} />
      <Route path="/game-over" element={<GameOver />} />
      <Route path="/history" element={<GameHistory />} />
      <Route path="/stats" element={<PlayerStats />} />
      <Route path="/tournament-setup" element={<TournamentSetup />} />
      <Route path="/tournament" element={<TournamentBracket />} />
    </Routes>
  )
}

export default function App() {
  return (
    <PlayerProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </PlayerProvider>
  )
}
