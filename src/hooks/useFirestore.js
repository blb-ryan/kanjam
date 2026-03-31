import { useState, useEffect, useCallback } from 'react'
import {
  collection, doc, setDoc, getDoc, getDocs, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../utils/firebase'

export function usePlayers() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'players'), orderBy('name'))
    const unsub = onSnapshot(q, (snap) => {
      setPlayers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const createPlayer = useCallback(async (name) => {
    const id = crypto.randomUUID()
    await setDoc(doc(db, 'players', id), {
      name: name.trim(),
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
    const unsub = onSnapshot(q, (snap) => {
      setGames(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
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
