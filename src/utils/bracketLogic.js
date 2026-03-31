// Pure bracket generation logic — no React, no Firebase

export function nextPowerOf2(n) {
  let p = 1
  while (p < n) p *= 2
  return p
}

// ─── Single Elimination ────────────────────────────────────────────────────

export function generateSingleEliminationBracket(teams) {
  const size = nextPowerOf2(teams.length)
  const seeded = [...teams]
  while (seeded.length < size) seeded.push(null) // null = bye

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
        autoWinnerId: !t1 ? (t2 ? t2.id : null) : (!t2 ? t1.id : null),
      })
    }

    for (const m of matchups) {
      if (m.isBye) m.winnerId = m.autoWinnerId
    }

    rounds.push({ roundNumber, matchups })
    roundNumber++
    currentSlots = matchups.map(m => {
      const wId = m.winnerId
      if (wId) return seeded.find(t => t && t.id === wId) || { id: wId, name: 'TBD' }
      return { id: null, name: 'TBD' }
    })
  }

  return { type: 'single_elimination', rounds }
}

export function advanceSingleElimination(bracket, completedMatchup, roundNumber, matchupIndex) {
  const rounds = bracket.rounds.map(r => ({ ...r, matchups: [...r.matchups] }))
  const round = rounds.find(r => r.roundNumber === roundNumber)
  if (!round) return bracket

  round.matchups[matchupIndex] = { ...round.matchups[matchupIndex], ...completedMatchup }

  const winnerId = completedMatchup.winnerId
  if (!winnerId) return { ...bracket, rounds }

  const nextRound = rounds.find(r => r.roundNumber === roundNumber + 1)
  if (!nextRound) return { ...bracket, rounds }

  const nextMatchupIndex = Math.floor(matchupIndex / 2)
  const isFirstSlot = matchupIndex % 2 === 0
  const nextMatchup = { ...nextRound.matchups[nextMatchupIndex] }

  if (isFirstSlot) nextMatchup.team1Id = winnerId
  else nextMatchup.team2Id = winnerId

  nextRound.matchups[nextMatchupIndex] = nextMatchup
  return { ...bracket, rounds }
}

export function getAvailableMatchups(bracket) {
  const available = []
  for (const round of bracket.rounds) {
    for (let i = 0; i < round.matchups.length; i++) {
      const m = round.matchups[i]
      if (!m.winnerId && !m.isBye && m.team1Id && m.team2Id) {
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
  if (bracket.type === 'double_elimination') {
    return bracket.grandFinal?.winnerId || null
  }
  if (bracket.type === 'round_robin') {
    return bracket.champion || null
  }
  const lastRound = bracket.rounds[bracket.rounds.length - 1]
  if (!lastRound) return null
  return lastRound.matchups[0]?.winnerId || null
}

export function getRoundName(roundNumber, totalRounds) {
  const fromEnd = totalRounds - roundNumber
  if (fromEnd === 0) return 'Final'
  if (fromEnd === 1) return 'Semifinals'
  if (fromEnd === 2) return 'Quarterfinals'
  return `Round ${roundNumber}`
}

// ─── Double Elimination ────────────────────────────────────────────────────

export function generateDoubleEliminationBracket(teams) {
  const size = nextPowerOf2(teams.length)
  const seeded = [...teams]
  while (seeded.length < size) seeded.push(null)

  // Winners bracket — same as single elim
  const wbMatchups = []
  for (let i = 0; i < seeded.length; i += 2) {
    const t1 = seeded[i]
    const t2 = seeded[i + 1]
    const isBye = !t1 || !t2
    wbMatchups.push({
      id: `wb-1-${i / 2}`,
      team1Id: t1?.id || null,
      team2Id: t2?.id || null,
      winnerId: isBye ? (t1?.id || t2?.id) : null,
      loserId: null,
      isBye,
      gameId: null,
    })
  }

  // Build winners bracket rounds
  const wbRounds = [{ roundNumber: 1, label: 'Winners Round 1', side: 'winners', matchups: wbMatchups }]
  let current = wbMatchups
  let roundNum = 2
  while (current.length > 1) {
    const next = []
    for (let i = 0; i < current.length; i += 2) {
      next.push({
        id: `wb-${roundNum}-${i / 2}`,
        team1Id: null,
        team2Id: null,
        winnerId: null,
        loserId: null,
        isBye: false,
        gameId: null,
      })
    }
    wbRounds.push({ roundNumber: roundNum, label: wbRoundLabel(roundNum, Math.log2(size)), side: 'winners', matchups: next })
    current = next
    roundNum++
  }

  // Losers bracket — one LB round for each WB round (except the last)
  // LB gets populated as WB losers are determined
  const lbRounds = []
  const lbRoundCount = (Math.log2(size) - 1) * 2
  for (let i = 0; i < lbRoundCount; i++) {
    const matchCount = Math.pow(2, Math.floor((lbRoundCount - 1 - i) / 2))
    const matchups = []
    for (let j = 0; j < matchCount; j++) {
      matchups.push({
        id: `lb-${i + 1}-${j}`,
        team1Id: null,
        team2Id: null,
        winnerId: null,
        loserId: null,
        isBye: false,
        gameId: null,
      })
    }
    lbRounds.push({
      roundNumber: i + 1,
      label: i === lbRoundCount - 1 ? 'Losers Final' : `Losers Round ${i + 1}`,
      side: 'losers',
      matchups,
    })
  }

  // Grand final
  const grandFinal = {
    id: 'gf',
    team1Id: null, // WB champion
    team2Id: null, // LB champion
    winnerId: null,
    reset: false, // true if LB winner wins grand final (triggers reset match)
    gameId: null,
  }

  return {
    type: 'double_elimination',
    wbRounds,
    lbRounds,
    grandFinal,
    teams: seeded.filter(Boolean),
  }
}

function wbRoundLabel(roundNum, totalWbRounds) {
  const fromEnd = totalWbRounds - roundNum
  if (fromEnd === 0) return 'Winners Final'
  if (fromEnd === 1) return 'Winners Semifinals'
  return `Winners Round ${roundNum}`
}

export function advanceDoubleElimination(bracket, side, roundNumber, matchupIndex, winnerId, gameId = null) {
  const b = JSON.parse(JSON.stringify(bracket)) // deep clone

  const rounds = side === 'winners' ? b.wbRounds : b.lbRounds
  const round = rounds.find(r => r.roundNumber === roundNumber)
  if (!round) return bracket

  const matchup = round.matchups[matchupIndex]
  const loserId = matchup.team1Id === winnerId ? matchup.team2Id : matchup.team1Id
  matchup.winnerId = winnerId
  matchup.loserId = loserId
  if (gameId) matchup.gameId = gameId

  if (side === 'winners') {
    // Winner advances in WB
    const nextWbRound = b.wbRounds.find(r => r.roundNumber === roundNumber + 1)
    if (nextWbRound) {
      const nextIdx = Math.floor(matchupIndex / 2)
      if (matchupIndex % 2 === 0) nextWbRound.matchups[nextIdx].team1Id = winnerId
      else nextWbRound.matchups[nextIdx].team2Id = winnerId
    } else {
      // WB champion goes to grand final team1
      b.grandFinal.team1Id = winnerId
    }

    // Loser drops to losers bracket
    if (loserId) {
      // WB R1 losers → LB R1, WB R2 losers → LB R3, etc. (every 2 LB rounds = 1 WB round)
      const lbTargetRound = b.lbRounds[(roundNumber - 1) * 2]
      if (lbTargetRound) {
        // Fill next open slot
        const m = lbTargetRound.matchups.find(m => !m.team1Id || !m.team2Id)
        if (m) {
          if (!m.team1Id) m.team1Id = loserId
          else m.team2Id = loserId
        }
      }
    }
  } else {
    // LB: winner advances in LB
    const nextLbRound = b.lbRounds.find(r => r.roundNumber === roundNumber + 1)
    if (nextLbRound) {
      const nextIdx = Math.floor(matchupIndex / 2)
      if (matchupIndex % 2 === 0) nextLbRound.matchups[nextIdx].team1Id = winnerId
      else nextLbRound.matchups[nextIdx].team2Id = winnerId
    } else {
      // LB champion goes to grand final team2
      b.grandFinal.team2Id = winnerId
    }
    // Loser is eliminated (no action needed)
  }

  return b
}

export function advanceGrandFinal(bracket, winnerId, gameId = null) {
  const b = JSON.parse(JSON.stringify(bracket))
  b.grandFinal.winnerId = winnerId
  if (gameId) b.grandFinal.gameId = gameId
  return b
}

// ─── Round Robin ───────────────────────────────────────────────────────────

export function generateRoundRobin(teams) {
  const matchups = []

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matchups.push({
        id: `rr-${i}-${j}`,
        team1Id: teams[i].id,
        team2Id: teams[j].id,
        winnerId: null,
        gameId: null,
      })
    }
  }

  const standings = teams.map(t => ({
    teamId: t.id,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  }))

  return {
    type: 'round_robin',
    matchups,
    standings,
    champion: null,
  }
}

export function advanceRoundRobin(bracket, matchupId, winnerId, team1Score = 0, team2Score = 0, gameId = null) {
  const b = JSON.parse(JSON.stringify(bracket))
  const matchup = b.matchups.find(m => m.id === matchupId)
  if (!matchup) return bracket

  matchup.winnerId = winnerId
  if (gameId) matchup.gameId = gameId

  const loserId = matchup.team1Id === winnerId ? matchup.team2Id : matchup.team1Id

  // Update standings
  const winner = b.standings.find(s => s.teamId === winnerId)
  const loser = b.standings.find(s => s.teamId === loserId)

  if (winner) {
    winner.wins++
    winner.pointsFor += team1Score
    winner.pointsAgainst += team2Score
  }
  if (loser) {
    loser.losses++
    loser.pointsFor += team2Score
    loser.pointsAgainst += team1Score
  }

  // Sort standings: wins desc, then point differential desc
  b.standings.sort((a, b) => {
    const winDiff = b.wins - a.wins
    if (winDiff !== 0) return winDiff
    return (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst)
  })

  // Check if all matchups complete
  const allDone = b.matchups.every(m => m.winnerId)
  if (allDone) {
    b.champion = b.standings[0]?.teamId || null
  }

  return b
}

// Sort teams by win rate for seeding
export function seedTeamsByWinRate(teams, games) {
  const stats = {}
  for (const team of teams) {
    stats[team.id] = { wins: 0, played: 0 }
  }

  for (const game of games) {
    for (const team of teams) {
      const onTeam1 = game.team1?.playerIds?.some(id => team.playerIds?.includes(id))
      const onTeam2 = game.team2?.playerIds?.some(id => team.playerIds?.includes(id))
      if (onTeam1 || onTeam2) {
        stats[team.id].played++
        if ((onTeam1 && game.winnerId === game.team1?.id) ||
            (onTeam2 && game.winnerId === game.team2?.id)) {
          stats[team.id].wins++
        }
      }
    }
  }

  return [...teams].sort((a, b) => {
    const aRate = stats[a.id].played > 0 ? stats[a.id].wins / stats[a.id].played : 0
    const bRate = stats[b.id].played > 0 ? stats[b.id].wins / stats[b.id].played : 0
    return bRate - aRate
  })
}
