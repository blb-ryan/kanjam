import { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, arrayUnion,
  query, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../utils/firebase'
import { createInitialGameState } from '../utils/gameLogic'

// ─── Display helpers ──────────────────────────────────────────────────────────

export function playerDisplayName(player) {
  if (!player) return ''
  if (player.firstName) {
    return player.lastName
      ? `${player.firstName} ${player.lastName[0]}.`
      : player.firstName
  }
  return player.name || ''
}

export function playerFullName(player) {
  if (!player) return ''
  if (player.firstName) {
    return player.lastName
      ? `${player.firstName} ${player.lastName}`
      : player.firstName
  }
  return player.name || ''
}

// ─── Lobby helpers (standalone, not hooks) ────────────────────────────────────

export async function createLobby(roomCode, team1) {
  await setDoc(doc(db, 'games', roomCode), {
    status: 'lobby',
    id: roomCode,
    team1,
    team2: null,
    createdAt: serverTimestamp(),
  })
}

export async function joinLobby(roomCode, team1, team2) {
  const initialState = createInitialGameState(team1, team2)
  await setDoc(doc(db, 'games', roomCode), {
    ...initialState,
    id: roomCode,
    status: 'active',
    createdAt: serverTimestamp(),
  })
}

// ─── Tournament lobby helpers ─────────────────────────────────────────────────

export async function createTournamentLobby(roomCode, name, format, hostTeam) {
  await setDoc(doc(db, 'tournaments', roomCode), {
    id: roomCode,
    status: 'lobby',
    name,
    format,
    teams: [hostTeam],
    bracket: null,
    championId: null,
    completedAt: null,
    createdAt: serverTimestamp(),
  })
}

export async function joinTournamentLobby(roomCode, team) {
  await updateDoc(doc(db, 'tournaments', roomCode), {
    teams: arrayUnion(team),
  })
}

export async function startTournament(roomCode, tournamentData, bracket) {
  await setDoc(doc(db, 'tournaments', roomCode), {
    ...tournamentData,
    bracket,
    status: 'active',
  })
}

// ─── Player resolution ────────────────────────────────────────────────────────

export async function resolvePlayer(nameText, existingPlayer) {
  // If user picked from autocomplete, use that player's ID
  if (existingPlayer) return existingPlayer.id

  // Otherwise create a new player doc
  const parts = nameText.trim().split(/\s+/)
  const firstName = parts[0] || ''
  const lastName = parts.slice(1).join(' ') || ''
  const id = crypto.randomUUID()
  await setDoc(doc(db, 'players', id), {
    firstName,
    lastName,
    createdAt: new Date().toISOString(),
  })
  return id
}

// Build a display name from raw input text + selected player
export function nameToDisplay(nameText, existingPlayer) {
  if (existingPlayer) return playerDisplayName(existingPlayer)
  const parts = nameText.trim().split(/\s+/)
  const first = parts[0] || ''
  const last = parts.slice(1).join(' ') || ''
  return last ? `${first} ${last[0]}.` : first
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function usePlayers() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'players'), orderBy('firstName'))
    const unsub = onSnapshot(q,
      (snap) => { setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) },
      () => setLoading(false),
    )
    return unsub
  }, [])

  const createPlayer = useCallback(async (firstName, lastName = '') => {
    const id = crypto.randomUUID()
    await setDoc(doc(db, 'players', id), {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      createdAt: new Date().toISOString(),
    })
    return id
  }, [])

  return { players, loading, createPlayer }
}

export function useTeams() {
  const [teams, setTeams] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'teams'), orderBy('name'))
    const unsub = onSnapshot(q, (snap) => {
      setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const createTeam = useCallback(async (name, playerIds) => {
    const id = crypto.randomUUID()
    await setDoc(doc(db, 'teams', id), {
      name,
      playerIds,
      createdAt: new Date().toISOString(),
    })
    return id
  }, [])

  return { teams, createTeam }
}

export function useGames() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'games'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q,
      (snap) => { setGames(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) },
      () => setLoading(false),
    )
    return unsub
  }, [])

  const saveGame = useCallback(async (gameData) => {
    const id = gameData.id || crypto.randomUUID()
    await setDoc(doc(db, 'games', id), { ...gameData, id })
    return id
  }, [])

  const deleteGame = useCallback(async (id) => {
    await deleteDoc(doc(db, 'games', id))
  }, [])

  return { games, loading, saveGame, deleteGame }
}

export function useTournaments() {
  const [tournaments, setTournaments] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const saveTournament = useCallback(async (data) => {
    const id = data.id || crypto.randomUUID()
    await setDoc(doc(db, 'tournaments', id), { ...data, id })
    return id
  }, [])

  return { tournaments, saveTournament }
}
