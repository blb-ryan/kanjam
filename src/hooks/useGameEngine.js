import { useState, useEffect, useCallback, useRef } from 'react'
import { createInitialGameState, applyThrow, undoLastThrow, canUndo } from '../utils/gameLogic'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../utils/firebase'

const DRAFT_KEY = 'kanjam_active_game'
const SYNC_INTERVAL = 30000

export function useGameEngine(team1, team2, existingGame = null) {
  const [gameState, setGameState] = useState(() => {
    if (existingGame) return existingGame
    return createInitialGameState(team1, team2)
  })
  const [gameId] = useState(() => existingGame?.id || crypto.randomUUID())
  const syncTimerRef = useRef(null)

  // Persist to localStorage as a quick local cache
  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...gameState, id: gameId }))
  }, [gameState, gameId])

  // Periodic Firestore sync
  useEffect(() => {
    const sync = () => {
      if (gameState.status === 'active') {
        setDoc(doc(db, 'games', gameId), { ...gameState, id: gameId }).catch(() => {})
      }
    }

    syncTimerRef.current = setInterval(sync, SYNC_INTERVAL)

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') sync()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(syncTimerRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [gameState, gameId])

  const recordThrow = useCallback((throwType) => {
    setGameState(prev => {
      const next = applyThrow(prev, throwType)
      // If round just ended or game over, sync to Firestore immediately
      if (next.status === 'complete' || next.currentHalf === 0) {
        setDoc(doc(db, 'games', gameId), { ...next, id: gameId }).catch(() => {})
      }
      return next
    })
  }, [gameId])

  const undo = useCallback(() => {
    setGameState(prev => undoLastThrow(prev))
  }, [])

  const canUndoNow = canUndo(gameState)

  return {
    gameState,
    gameId,
    recordThrow,
    undo,
    canUndoNow,
  }
}

export function getStoredActiveGame() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearStoredActiveGame() {
  localStorage.removeItem(DRAFT_KEY)
}
