// Pure bracket generation logic — no React, no Firebase

export function nextPowerOf2(n) {
  let p = 1
  while (p < n) p *= 2
  return p
}

export function generateSingleEliminationBracket(teams) {
  const size = nextPowerOf2(teams.length)
  const byeCount = size - teams.length

  // Seed teams — first byeCount teams get byes in first round
  // Byes are represented as null in matchup slots
  const seeded = [...teams]
  while (seeded.length < size) {
    seeded.push(null) // null = bye
  }

  const rounds = []
  let currentSlots = seeded

  let roundNumber = 1
  while (currentSlots.length > 1) {
    const matchups = []
    for (let i = 0; i < currentSlots.length; i += 2) {
      const t1 = currentSlots[i]
      const t2 = currentSlots[i + 1]
      matchups.push({
        team1Id: t1 ? t1.id : null,
        team2Id: t2 ? t2.id : null,
        winnerId: null,
        gameId: null,
        isBye: !t1 || !t2,
        // Auto-advance bye winners
        autoWinnerId: !t1 ? (t2 ? t2.id : null) : (!t2 ? t1.id : null),
      })
    }

    // Auto-resolve byes
    for (const m of matchups) {
      if (m.isBye) {
        m.winnerId = m.autoWinnerId
      }
    }

    rounds.push({ roundNumber, matchups })
    roundNumber++
    currentSlots = matchups.map(m => {
      const winnerId = m.winnerId
      if (winnerId) {
        return seeded.find(t => t && t.id === winnerId) || { id: winnerId, name: 'TBD' }
      }
      return { id: null, name: 'TBD' }
    })
  }

  return { rounds }
}

export function advanceSingleElimination(bracket, completedMatchup, roundNumber, matchupIndex) {
  const rounds = bracket.rounds.map(r => ({ ...r, matchups: [...r.matchups] }))
  const round = rounds.find(r => r.roundNumber === roundNumber)
  if (!round) return bracket

  round.matchups[matchupIndex] = { ...round.matchups[matchupIndex], ...completedMatchup }

  const winnerId = completedMatchup.winnerId
  if (!winnerId) return { ...bracket, rounds }

  // Advance winner to next round
  const nextRound = rounds.find(r => r.roundNumber === roundNumber + 1)
  if (!nextRound) return { ...bracket, rounds }

  const nextMatchupIndex = Math.floor(matchupIndex / 2)
  const isFirstSlot = matchupIndex % 2 === 0
  const nextMatchup = { ...nextRound.matchups[nextMatchupIndex] }

  if (isFirstSlot) {
    nextMatchup.team1Id = winnerId
  } else {
    nextMatchup.team2Id = winnerId
  }

  nextRound.matchups[nextMatchupIndex] = nextMatchup

  return { ...bracket, rounds }
}

export function getAvailableMatchups(bracket) {
  const available = []
  for (const round of bracket.rounds) {
    for (let i = 0; i < round.matchups.length; i++) {
      const m = round.matchups[i]
      if (!m.winnerId && !m.isBye && m.team1Id && m.team2Id) {
        // Check all previous rounds are complete
        const prevRoundsComplete = bracket.rounds
          .filter(r => r.roundNumber < round.roundNumber)
          .every(r => r.matchups.every(mm => mm.winnerId || mm.isBye))
        if (prevRoundsComplete) {
          available.push({ roundNumber: round.roundNumber, matchupIndex: i, matchup: m })
        }
      }
    }
  }
  return available
}

export function getTournamentChampion(bracket) {
  const lastRound = bracket.rounds[bracket.rounds.length - 1]
  if (!lastRound) return null
  const finalMatchup = lastRound.matchups[0]
  return finalMatchup?.winnerId || null
}

export function getRoundName(roundNumber, totalRounds) {
  const fromEnd = totalRounds - roundNumber
  if (fromEnd === 0) return 'Final'
  if (fromEnd === 1) return 'Semifinals'
  if (fromEnd === 2) return 'Quarterfinals'
  return `Round ${roundNumber}`
}
