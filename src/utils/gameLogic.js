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
    // 0 = team1 throws first, 1 = team2 throws first this half-round
    currentHalf: 0,
    isOvertime: false,
    winnerId: null,
    winType: null,
    status: 'active', // active | complete
  }
}

// Returns which player index throws this round (alternates each round)
export function getThrowerIndex(roundNumber) {
  return (roundNumber - 1) % 2
}

export function getCurrentThrower(gameState) {
  const { currentRound, currentHalf, team1, team2 } = gameState
  const throwerIdx = getThrowerIndex(currentRound)
  if (currentHalf === 0) {
    return { team: team1, playerIndex: throwerIdx, teamKey: 'team1' }
  } else {
    return { team: team2, playerIndex: throwerIdx, teamKey: 'team2' }
  }
}

export function applyThrow(gameState, throwType) {
  const { currentRound, currentHalf, team1Score, team2Score, rounds, isOvertime } = gameState
  const points = THROW_POINTS[throwType]

  // Instant win — game ends immediately
  if (throwType === THROW_TYPES.INSTANT_WIN) {
    const winningTeamKey = currentHalf === 0 ? 'team1' : 'team2'
    const winningTeamId = currentHalf === 0 ? gameState.team1.id : gameState.team2.id
    const throwerIdx = getThrowerIndex(currentRound)
    const throwerPlayerId = currentHalf === 0
      ? gameState.team1.playerIds[throwerIdx]
      : gameState.team2.playerIds[throwerIdx]

    const throwRecord = {
      type: throwType,
      points: 0,
      throwerPlayerId,
      busted: false,
    }

    const newRounds = recordThrowInRounds(rounds, currentRound, currentHalf, throwRecord)

    return {
      ...gameState,
      rounds: newRounds,
      winnerId: winningTeamId,
      winType: 'instant_win',
      status: 'complete',
    }
  }

  // Normal throw
  const isTeam1Throwing = currentHalf === 0
  const currentScore = isTeam1Throwing ? team1Score : team2Score
  const newScore = currentScore + points
  const throwerIdx = getThrowerIndex(currentRound)
  const throwerPlayerId = isTeam1Throwing
    ? gameState.team1.playerIds[throwerIdx]
    : gameState.team2.playerIds[throwerIdx]

  let busted = false
  let effectiveScore = newScore

  if (newScore > WIN_SCORE) {
    busted = true
    effectiveScore = currentScore // score doesn't change on bust
  }

  const throwRecord = {
    type: throwType,
    points,
    throwerPlayerId,
    busted,
  }

  const newRounds = recordThrowInRounds(rounds, currentRound, currentHalf, throwRecord)

  let newTeam1Score = team1Score
  let newTeam2Score = team2Score
  if (!busted) {
    if (isTeam1Throwing) newTeam1Score = newScore
    else newTeam2Score = newScore
  }

  // Determine next state
  let newCurrentHalf = currentHalf
  let newCurrentRound = currentRound
  let winnerId = null
  let winType = null
  let status = 'active'
  let newIsOvertime = isOvertime

  if (currentHalf === 0) {
    // Team 1 just threw — move to team 2's turn
    newCurrentHalf = 1

    // Check if team1 hit exactly 21 — they might win after team2 throws
    // (no action yet — just advance the half)
  } else {
    // Team 2 just threw — end of round
    newCurrentHalf = 0
    newCurrentRound = currentRound + 1

    // Check win conditions now that the round is complete
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
    currentRound: newCurrentRound,
    currentHalf: newCurrentHalf,
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

  if (t1wins && t2wins) {
    // Tie at 21 — overtime
    return { overtime: true }
  }
  if (t1wins) {
    return { winnerId: team1Id, winType: 'score' }
  }
  if (t2wins) {
    return { winnerId: team2Id, winType: 'score' }
  }

  // In overtime, first to lead after a full round wins
  if (wasAlreadyOvertime) {
    if (team1Score > team2Score) {
      return { winnerId: team1Id, winType: 'score' }
    }
    if (team2Score > team1Score) {
      return { winnerId: team2Id, winType: 'score' }
    }
  }

  return {}
}

function recordThrowInRounds(rounds, roundNumber, half, throwRecord) {
  const existing = rounds.find(r => r.roundNumber === roundNumber)
  if (existing) {
    const updated = {
      ...existing,
      ...(half === 0 ? { team1Throw: throwRecord } : { team2Throw: throwRecord }),
    }
    return rounds.map(r => r.roundNumber === roundNumber ? updated : r)
  } else {
    const newRound = {
      roundNumber,
      ...(half === 0 ? { team1Throw: throwRecord } : { team2Throw: throwRecord }),
    }
    return [...rounds, newRound]
  }
}

export function canUndo(gameState) {
  // Can undo if at least one throw has been recorded
  const { rounds, currentRound, currentHalf } = gameState
  if (currentHalf === 1) {
    // Team 2 hasn't thrown yet this round, so team1 throw is the last one
    const round = rounds.find(r => r.roundNumber === currentRound)
    return round && round.team1Throw
  }
  // We're at the start of a round (half===0) — last throw was team2 of previous round
  return currentRound > 1 || rounds.length > 0
}

export function undoLastThrow(gameState) {
  const { rounds, currentRound, currentHalf, team1Score, team2Score } = gameState

  if (currentHalf === 1) {
    // Undo team1's throw this round
    const round = rounds.find(r => r.roundNumber === currentRound)
    if (!round || !round.team1Throw) return gameState

    const { team1Throw } = round
    const pointsToRemove = team1Throw.busted ? 0 : team1Throw.points

    const newRounds = rounds.map(r =>
      r.roundNumber === currentRound ? { ...r, team1Throw: undefined } : r
    ).filter(r => r.team1Throw || r.team2Throw)

    return {
      ...gameState,
      team1Score: team1Score - pointsToRemove,
      rounds: newRounds,
      currentHalf: 0,
      lastThrow: null,
    }
  } else {
    // Undo team2's throw from previous round
    const prevRound = rounds.find(r => r.roundNumber === currentRound - 1)
    if (!prevRound || !prevRound.team2Throw) return gameState

    const { team2Throw } = prevRound
    const pointsToRemove = team2Throw.busted ? 0 : team2Throw.points

    const newRounds = rounds.map(r =>
      r.roundNumber === currentRound - 1 ? { ...r, team2Throw: undefined } : r
    )

    // Also need to revert overtime/win status
    const prevTeam2Score = team2Score - pointsToRemove

    return {
      ...gameState,
      team2Score: prevTeam2Score,
      rounds: newRounds,
      currentRound: currentRound - 1,
      currentHalf: 1,
      winnerId: null,
      winType: null,
      status: 'active',
      isOvertime: prevTeam2Score < WIN_SCORE && team1Score < WIN_SCORE ? false : gameState.isOvertime,
      lastThrow: null,
    }
  }
}

export function calculatePlayerStats(games, players) {
  const stats = {}

  for (const player of players) {
    stats[player.id] = {
      playerId: player.id,
      name: player.name,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      totalPoints: 0,
      instantWins: 0,
      busts: 0,
      throws: 0,
    }
  }

  for (const game of games) {
    const allThrows = []
    for (const round of game.rounds || []) {
      if (round.team1Throw) allThrows.push({ ...round.team1Throw, teamId: game.team1Id })
      if (round.team2Throw) allThrows.push({ ...round.team2Throw, teamId: game.team2Id })
    }

    // Figure out which players were in this game
    const playersInGame = new Set()
    for (const t of allThrows) {
      if (t.throwerPlayerId) playersInGame.add(t.throwerPlayerId)
    }

    for (const pid of playersInGame) {
      if (!stats[pid]) continue
      stats[pid].gamesPlayed++

      // Determine which team this player is on
      const playerTeamId = allThrows.find(t => t.throwerPlayerId === pid)?.teamId
      if (game.winnerId === playerTeamId) stats[pid].wins++
      else stats[pid].losses++
    }

    for (const t of allThrows) {
      if (!t.throwerPlayerId || !stats[t.throwerPlayerId]) continue
      const s = stats[t.throwerPlayerId]
      s.throws++
      if (!t.busted) s.totalPoints += t.points || 0
      if (t.busted) s.busts++
      if (t.type === THROW_TYPES.INSTANT_WIN) s.instantWins++
    }
  }

  return Object.values(stats)
}
