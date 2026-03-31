import { createContext, useContext, useState, useEffect } from 'react'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../utils/firebase'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = localStorage.getItem('kanjam_player')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setPlayer(parsed)
        refreshFromFirestore(parsed.id)
      } catch {
        localStorage.removeItem('kanjam_player')
      }
    }
    setLoading(false)
  }, [])

  async function refreshFromFirestore(playerId) {
    try {
      const snap = await getDoc(doc(db, 'players', playerId))
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() }
        setPlayer(data)
        localStorage.setItem('kanjam_player', JSON.stringify(data))
      }
    } catch (e) {
      console.warn('Could not refresh player:', e)
    }
  }

  async function createProfile(name, phone) {
    const cleanPhone = phone.replace(/\D/g, '')
    // Check phone index
    const indexSnap = await getDoc(doc(db, 'phoneIndex', cleanPhone))
    if (indexSnap.exists()) {
      throw new Error('PHONE_EXISTS')
    }

    const playerId = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    const playerData = {
      name: name.trim(),
      phone: cleanPhone,
      createdAt: new Date().toISOString(),
      stats: {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        totalPoints: 0,
        instantWins: 0,
        busts: 0,
      },
    }

    await setDoc(doc(db, 'players', playerId), playerData)
    await setDoc(doc(db, 'phoneIndex', cleanPhone), { playerId })

    const full = { id: playerId, ...playerData }
    setPlayer(full)
    localStorage.setItem('kanjam_player', JSON.stringify(full))
    return full
  }

  async function recoverProfile(phone) {
    const cleanPhone = phone.replace(/\D/g, '')
    const indexSnap = await getDoc(doc(db, 'phoneIndex', cleanPhone))
    if (!indexSnap.exists()) throw new Error('NOT_FOUND')

    const { playerId } = indexSnap.data()
    const playerSnap = await getDoc(doc(db, 'players', playerId))
    if (!playerSnap.exists()) throw new Error('NOT_FOUND')

    const full = { id: playerSnap.id, ...playerSnap.data() }
    setPlayer(full)
    localStorage.setItem('kanjam_player', JSON.stringify(full))
    return full
  }

  async function updateName(newName) {
    if (!player) return
    await updateDoc(doc(db, 'players', player.id), { name: newName })
    const updated = { ...player, name: newName }
    setPlayer(updated)
    localStorage.setItem('kanjam_player', JSON.stringify(updated))
  }

  async function updateStats(delta) {
    if (!player) return
    const current = player.stats || {}
    const newStats = {
      gamesPlayed: (current.gamesPlayed || 0) + (delta.gamesPlayed || 0),
      wins: (current.wins || 0) + (delta.wins || 0),
      losses: (current.losses || 0) + (delta.losses || 0),
      totalPoints: (current.totalPoints || 0) + (delta.totalPoints || 0),
      instantWins: (current.instantWins || 0) + (delta.instantWins || 0),
      busts: (current.busts || 0) + (delta.busts || 0),
    }
    await updateDoc(doc(db, 'players', player.id), { stats: newStats })
    const updated = { ...player, stats: newStats }
    setPlayer(updated)
    localStorage.setItem('kanjam_player', JSON.stringify(updated))
  }

  function logout() {
    setPlayer(null)
    localStorage.removeItem('kanjam_player')
  }

  return (
    <PlayerContext.Provider value={{
      player,
      loading,
      createProfile,
      recoverProfile,
      updateName,
      updateStats,
      logout,
      refreshFromFirestore: () => player && refreshFromFirestore(player.id),
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider')
  return ctx
}
