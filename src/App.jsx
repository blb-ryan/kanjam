import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import PlayerSetup from './components/PlayerSetup'
import LiveGame from './components/LiveGame'
import GameOver from './components/GameOver'
import GameHistory from './components/GameHistory'
import PlayerStats from './components/PlayerStats'
import TournamentSetup from './components/TournamentSetup'
import TournamentBracket from './components/TournamentBracket'
import JoinGame from './components/JoinGame'
import LobbyWait from './components/LobbyWait'
import './styles/global.css'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/setup" element={<PlayerSetup />} />
        <Route path="/game" element={<LiveGame />} />
        <Route path="/game-over" element={<GameOver />} />
        <Route path="/history" element={<GameHistory />} />
        <Route path="/stats" element={<PlayerStats />} />
        <Route path="/tournament-setup" element={<TournamentSetup />} />
        <Route path="/tournament" element={<TournamentBracket />} />
        <Route path="/join" element={<JoinGame />} />
        <Route path="/lobby" element={<LobbyWait />} />
      </Routes>
    </HashRouter>
  )
}
