// Pure game logic — no React, no Firebase dependencies

export const THROW_TYPES = {
  MISS: 'miss',
  DINGER: 'dinger',
  DEUCE: 'deuce',
  BUCKET: 'bucket',
  INSTANT_WIN: 'instant_win',
}

export const THROW_POINTS = {
  miss: 0,
  dinger: 1,
  deuce: 2,
  bucket: 3,
  instant_win: 0, // doesn't count as points — it's an instant win
}

export const WIN_SCORE = 21

export function createInitialGameState(team1, team2) {
  return {
    team1,
    team2,
    team1Score: 0,
    team2Score: 0,
    rounds: [],
    currentRound: 1,
    currentHalf: 0,         // 0 = team1's turn, 1 = team2's turn
    currentThrowInHalf: 0,  // which throw within the team's turn
    isOvertime: false,
    winnerId: null,
    winType: null,
    status: 'active',
  }
}

// How many players on a team (1 or 2)
function teamSize(team) {
  return team?.playerIds?.length || 1
}

// Which player index throws for a given round + throwInHalf (handles 1- and 2-player teams)
export function getThrowerIndex(roundNumber, throwInHalf, size) {
  if (size <= 1) return 0
  return ((roundNumber - 1) + throwInHalf) % size
}

export function getCurrentThrower(gameState) {
  const { currentRound, currentHalf, currentThrowInHalf, team1, team2 } = gameState
  const team = currentHalf === 0 ? team1 : team2
  const teamKey = currentHalf === 0 ? 'team1' : 'team2'
  const size = teamSize(team)
  const playerIndex = getThrowerIndex(currentRound, currentThrowInHalf, size)
  return { team, playerIndex, teamKey }
}

export function applyThrow(gameState, throwType) {
  const { currentRound, currentHalf, currentThrowInHalf, team1Score, team2Score, rounds, isOvertime } = gameState
  const points = THROW_POINTS[throwType]
  const isTeam1Throwing = currentHalf === 0
  const throwingTeam = isTeam1Throwing ? gameState.team1 : gameState.team2
  const size = teamSize(throwingTeam)
  const playerIndex = getThrowerIndex(currentRound, currentThrowInHalf, size)
  const throwerPlayerId = throwingTeam?.playerIds?.[playerIndex] || null

  // Instant win — game ends immediately
  if (throwType === THROW_TYPES.INSTANT_WIN) {
    const winningTeamId = isTeam1Throwing ? gameState.team1.id : gameState.team2.id
    const throwRecord = { type: throwType, points: 0, throwerPlayerId, busted: false }
    const newRounds = recordThrowInRounds(rounds, currentRound, currentHalf, throwRecord)
    return {
      ...gameState,
      rounds: newRounds,
      winnerId: winningTeamId,
      winType: 'instant_win',
      status: 'complete',
      lastThrow: { busted: false, type: throwType, points: 0 },
    }
  }

  // Normal throw
  const currentScore = isTeam1Throwing ? team1Score : team2Score
  const newScore = currentScore + points
  const busted = newScore > WIN_SCORE

  const throwRecord = { type: throwType, points, throwerPlayerId, busted }
  const newRounds = recordThrowInRounds(rounds, currentRound, currentHalf, throwRecord)

  let newTeam1Score = team1Score
  let newTeam2Score = team2Score
  if (!busted) {
    if (isTeam1Throwing) newTeam1Score = newScore
    else newTeam2Score = newScore
  }

  // Advance the state machine
  const isLastThrowInTurn = currentThrowInHalf + 1 >= size
  let nextHalf = currentHalf
  let nextThrowInHalf = currentThrowInHalf
  let nextRound = currentRound
  let winnerId = null
  let winType = null
  let status = 'active'
  let newIsOvertime = isOvertime

  if (!isLastThrowInTurn) {
    // More throws left for this team this turn
    nextThrowInHalf = currentThrowInHalf + 1
  } else if (currentHalf === 0) {
    // Team 1 finished their turn — switch to Team 2
    nextHalf = 1
    nextThrowInHalf = 0
  } else {
    // Team 2 finished their turn — round complete, check win conditions
    nextHalf = 0
    nextThrowInHalf = 0
    nextRound = currentRound + 1

    const result = checkWinConditions(newTeam1Score, newTeam2Score, gameState.team1.id, gameState.team2.id, newIsOvertime)
    if (result.winnerId) {
      winnerId = result.winnerId
      winType = result.winType
      status = 'complete'
    } else if (result.overtime) {
      newIsOvertime = true
    }
  }

  return {
    ...gameState,
    team1Score: newTeam1Score,
    team2Score: newTeam2Score,
    rounds: newRounds,
    currentRound: nextRound,
    currentHalf: nextHalf,
    currentThrowInHalf: nextThrowInHalf,
    isOvertime: newIsOvertime,
    winnerId,
    winType,
    status,
    lastThrow: { busted, type: throwType, points: busted ? 0 : points },
  }
}

function checkWinConditions(team1Score, team2Score, team1Id, team2Id, wasAlreadyOvertime) {
  const t1wins = team1Score === WIN_SCORE
  const t2wins = team2Score === WIN_SCORE

  if (t1wins && t2wins) return { overtime: true }
  if (t1wins) return { winnerId: team1Id, winType: 'score' }
  if (t2wins) return { winnerId: team2Id, winType: 'score' }

  if (wasAlreadyOvertime) {
    if (team1Score > team2Score) return { winnerId: team1Id, winType: 'score' }
    if (team2Score > team1Score) return { winnerId: team2Id, winType: 'score' }
  }

  return {}
}

// Rounds now store team1Throws/team2Throws as arrays (one entry per player throw)
function recordThrowInRounds(rounds, roundNumber, half, throwRecord) {
  const throwsKey = half === 0 ? 'team1Throws' : 'team2Throws'
  const existing = rounds.find(r => r.roundNumber === roundNumber)
  if (existing) {
    return rounds.map(r =>
      r.roundNumber === roundNumber
        ? { ...r, [throwsKey]: [...(r[throwsKey] || []), throwRecord] }
        : r
    )
  }
  return [...rounds, { roundNumber, [throwsKey]: [throwRecord] }]
}

export function canUndo(gameState) {
  const { currentRound, currentHalf, currentThrowInHalf } = gameState
  return !(currentRound === 1 && currentHalf === 0 && currentThrowInHalf === 0)
}

export function undoLastThrow(gameState) {
  const { rounds, currentRound, currentHalf, currentThrowInHalf, team1Score, team2Score } = gameState
  const t1Size = teamSize(gameState.team1)
  const t2Size = teamSize(gameState.team2)

  // Removes the last throw from the given round+half and returns the info needed to update state
  const popThrow = (roundNum, half) => {
    const throwsKey = half === 0 ? 'team1Throws' : 'team2Throws'
    const round = rounds.find(r => r.roundNumber === roundNum)
    const throws = round?.[throwsKey] || []
    const lastThrow = throws[throws.length - 1]
    if (!lastThrow) return null

    const pointsToRemove = lastThrow.busted ? 0 : (lastThrow.points || 0)
    const newThrows = throws.slice(0, -1)
    const newRounds = rounds
      .map(r => r.roundNumber === roundNum ? { ...r, [throwsKey]: newThrows } : r)
      .filter(r => (r.team1Throws?.length || 0) + (r.team2Throws?.length || 0) > 0)

    return { pointsToRemove, newRounds }
  }

  // Case 1: undo within current team's turn (not the first throw of the turn)
  if (currentThrowInHalf > 0) {
    const result = popThrow(currentRound, currentHalf)
    if (!result) return gameState
    const scoreUpdate = currentHalf === 0
      ? { team1Score: team1Score - result.pointsToRemove }
      : { team2Score: team2Score - result.pointsToRemove }
    return { ...gameState, ...scoreUpdate, rounds: result.newRounds, currentThrowInHalf: currentThrowInHalf - 1, lastThrow: null }
  }

  // Case 2: at start of team2's turn → undo team1's last throw
  if (currentHalf === 1) {
    const result = popThrow(currentRound, 0)
    if (!result) return gameState
    return {
      ...gameState,
      team1Score: team1Score - result.pointsToRemove,
      rounds: result.newRounds,
      currentHalf: 0,
      currentThrowInHalf: t1Size - 1,
      lastThrow: null,
    }
  }

  // Case 3: at start of team1's turn → undo previous round's team2 last throw
  if (currentRound > 1) {
    const result = popThrow(currentRound - 1, 1)
    if (!result) return gameState
    const newTeam2Score = team2Score - result.pointsToRemove
    return {
      ...gameState,
      team2Score: newTeam2Score,
      rounds: result.newRounds,
      currentRound: currentRound - 1,
      currentHalf: 1,
      currentThrowInHalf: t2Size - 1,
      winnerId: null,
      winType: null,
      status: 'active',
      isOvertime: newTeam2Score < WIN_SCORE && team1Score < WIN_SCORE ? false : gameState.isOvertime,
      lastThrow: null,
    }
  }

  return gameState
}

// ─── Stats calculations ────────────────────────────────────────────────────

// Normalize a round to arrays — handles both old (team1Throw) and new (team1Throws) format
function getRoundThrows(round, teamId, game) {
  const out = []
  // New format
  for (const thr of round.team1Throws || []) out.push({ ...thr, teamId: game.team1?.id })
  for (const thr of round.team2Throws || []) out.push({ ...thr, teamId: game.team2?.id })
  // Backward-compat: old single-throw format
  if (round.team1Throw) out.push({ ...round.team1Throw, teamId: game.team1?.id })
  if (round.team2Throw) out.push({ ...round.team2Throw, teamId: game.team2?.id })
  return out
}

export function calculatePlayerStats(games, players) {
  const stats = {}
  const gameResults = {} // playerId -> boolean[]

  for (const player of players) {
    // Support both old (name) and new (firstName/lastName) schemas
    const displayName = player.firstName
      ? (player.lastName ? `${player.firstName} ${player.lastName[0]}.` : player.firstName)
      : (player.name || 'Player')
    stats[player.id] = {
      playerId: player.id,
      name: displayName,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      totalPoints: 0,
      instantWins: 0,
      busts: 0,
      throws: 0,
      overtimeWins: 0,
      throwBreakdown: { miss: 0, dinger: 0, deuce: 0, bucket: 0, instant_win: 0 },
    }
    gameResults[player.id] = []
  }

  // Sort games chronologically for accurate streaks
  const sortedGames = [...games]
    .map(g => ({ g, t: g.completedAt ? new Date(g.completedAt).getTime() : 0 }))
    .sort((a, b) => a.t - b.t)
    .map(x => x.g)

  for (const game of sortedGames) {
    const allThrows = []
    for (const round of game.rounds || []) {
      for (const thr of getRoundThrows(round, null, game)) allThrows.push(thr)
    }

    // Build player→team map once
    const playerToTeamId = {}
    const playersInGame = new Set()
    for (const t of allThrows) {
      if (t.throwerPlayerId) {
        playersInGame.add(t.throwerPlayerId)
        playerToTeamId[t.throwerPlayerId] = t.teamId
      }
    }

    for (const pid of playersInGame) {
      if (!stats[pid]) continue
      stats[pid].gamesPlayed++
      const playerTeamId = playerToTeamId[pid]
      const won = game.winnerId === playerTeamId
      if (won) {
        stats[pid].wins++
        if (game.isOvertime) stats[pid].overtimeWins++
      } else {
        stats[pid].losses++
      }
      if (gameResults[pid]) gameResults[pid].push(won)
    }

    for (const t of allThrows) {
      if (!t.throwerPlayerId || !stats[t.throwerPlayerId]) continue
      const s = stats[t.throwerPlayerId]
      s.throws++
      if (!t.busted) s.totalPoints += t.points || 0
      if (t.busted) s.busts++
      if (t.type === THROW_TYPES.INSTANT_WIN) s.instantWins++
      if (s.throwBreakdown[t.type] !== undefined) s.throwBreakdown[t.type]++
    }
  }

  // Compute streaks
  for (const s of Object.values(stats)) {
    const results = gameResults[s.playerId] || []
    let currentStreak = 0
    let longestStreak = 0
    let currentStreakType = null

    for (let i = results.length - 1; i >= 0; i--) {
      const won = results[i]
      if (i === results.length - 1) { currentStreakType = won; currentStreak = 1 }
      else if (won === currentStreakType) currentStreak++
      else break
    }

    let runStreak = 0
    let runType = null
    for (const won of results) {
      if (runType === null) { runType = won; runStreak = 1 }
      else if (won === runType) runStreak++
      else { runType = won; runStreak = 1 }
      if (won && runStreak > longestStreak) longestStreak = runStreak
    }

    s.currentStreak = currentStreak
    s.currentStreakWin = currentStreakType === true
    s.longestWinStreak = longestStreak
  }

  return Object.values(stats)
}

// Head-to-head record between two sets of playerIds
export function calculateHeadToHead(games, playerIds1, playerIds2) {
  let wins = 0, losses = 0

  for (const game of games) {
    const t1Ids = new Set(game.team1?.playerIds || [])
    const t2Ids = new Set(game.team2?.playerIds || [])

    const t1IsSet1 = playerIds1.every(id => t1Ids.has(id)) && t1Ids.size === playerIds1.length
    const t1IsSet2 = playerIds2.every(id => t1Ids.has(id)) && t1Ids.size === playerIds2.length
    const t2IsSet1 = playerIds1.every(id => t2Ids.has(id)) && t2Ids.size === playerIds1.length
    const t2IsSet2 = playerIds2.every(id => t2Ids.has(id)) && t2Ids.size === playerIds2.length

    if ((t1IsSet1 && t2IsSet2) || (t1IsSet2 && t2IsSet1)) {
      const set1TeamId = t1IsSet1 ? game.team1?.id : game.team2?.id
      if (game.winnerId === set1TeamId) wins++
      else losses++
    }
  }

  return { wins, losses, total: wins + losses }
}
