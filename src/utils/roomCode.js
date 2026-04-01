import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateRoomCode() {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}

export async function generateUniqueRoomCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateRoomCode()
    const [gameSnap, tournSnap] = await Promise.all([
      getDoc(doc(db, 'games', code)),
      getDoc(doc(db, 'tournaments', code)),
    ])
    if (!gameSnap.exists() && !tournSnap.exists()) return code
  }
  throw new Error('Could not generate a unique room code after 10 attempts')
}

export const VALID_CHARS = new Set(CHARS.split(''))
