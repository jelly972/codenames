import { v4 as uuidv4 } from 'uuid';
import {
  Game,
  GameSettings,
  TeamId,
  CardType,
  TeamScore,
  BOARD_DIMENSIONS,
  TEAM_ORDER,
  getDefaultSettings,
} from '@/types/game';
import { getRandomWords } from './words';

/**
 * Generate a unique 6-character room code
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous characters
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a key card for the game
 * Distributes cards among teams, neutral cards, and assassin(s)
 */
export function generateKeyCard(settings: GameSettings): CardType[] {
  const totalCards = BOARD_DIMENSIONS[settings.boardSize] ** 2;
  const teams = TEAM_ORDER.slice(0, settings.teamCount);
  
  // Build the card distribution
  const cardTypes: CardType[] = [];
  
  // Add team cards
  teams.forEach((team, index) => {
    // First team gets one extra card
    const count = settings.wordsPerTeam + (index === 0 ? 1 : 0);
    for (let i = 0; i < count; i++) {
      cardTypes.push(team);
    }
  });
  
  // Add assassin cards
  for (let i = 0; i < settings.assassinCount; i++) {
    cardTypes.push('assassin');
  }
  
  // Fill rest with neutral
  while (cardTypes.length < totalCards) {
    cardTypes.push('neutral');
  }
  
  // Shuffle the key card
  return shuffleArray(cardTypes);
}

/**
 * Initialize scores for all teams
 */
export function initializeScores(settings: GameSettings): Record<TeamId, TeamScore> {
  const teams = TEAM_ORDER.slice(0, settings.teamCount);
  const scores: Record<TeamId, TeamScore> = {
    red: { found: 0, total: 0 },
    blue: { found: 0, total: 0 },
    green: { found: 0, total: 0 },
    yellow: { found: 0, total: 0 },
  };
  
  teams.forEach((team, index) => {
    // First team gets one extra card to find
    scores[team].total = settings.wordsPerTeam + (index === 0 ? 1 : 0);
  });
  
  return scores;
}

/**
 * Create a new game with the given settings
 */
export function createGame(
  hostId: string,
  settings: Partial<GameSettings> = {}
): Game {
  // Merge with default settings
  const fullSettings = {
    ...getDefaultSettings(settings.boardSize, settings.teamCount),
    ...settings,
  };
  
  const totalCards = BOARD_DIMENSIONS[fullSettings.boardSize] ** 2;
  const teams = TEAM_ORDER.slice(0, fullSettings.teamCount);
  
  const game: Game = {
    code: generateRoomCode(),
    hostId,
    status: 'lobby',
    settings: fullSettings,
    
    // Board state - will be populated when game starts
    words: getRandomWords(totalCards),
    keyCard: generateKeyCard(fullSettings),
    revealed: new Array(totalCards).fill(false),
    
    // Turn state
    teams,
    currentTeamIndex: 0,
    currentClue: null,
    guessesRemaining: 0,
    
    // Players & scoring
    players: [],
    scores: initializeScores(fullSettings),
    eliminatedTeams: [],
    winner: null,
    
    createdAt: Date.now(),
  };
  
  return game;
}

/**
 * Regenerate the board with new words and key card
 * (useful when resetting a game)
 */
export function regenerateBoard(game: Game): Game {
  const totalCards = BOARD_DIMENSIONS[game.settings.boardSize] ** 2;
  
  return {
    ...game,
    words: getRandomWords(totalCards),
    keyCard: generateKeyCard(game.settings),
    revealed: new Array(totalCards).fill(false),
    currentTeamIndex: 0,
    currentClue: null,
    guessesRemaining: 0,
    scores: initializeScores(game.settings),
    eliminatedTeams: [],
    winner: null,
    status: 'lobby',
  };
}

/**
 * Validate that a game is ready to start
 */
export function validateGameStart(game: Game): { valid: boolean; error?: string } {
  if (game.status !== 'lobby') {
    return { valid: false, error: 'Game has already started' };
  }
  
  const activeTeams = game.teams;
  
  // Check each team has at least one spymaster
  for (const team of activeTeams) {
    const hasSpymaster = game.players.some(
      (p) => p.team === team && p.role === 'spymaster'
    );
    if (!hasSpymaster) {
      return { valid: false, error: `${team} team needs a spymaster` };
    }
  }
  
  // Check each team has at least one operative (optional, but recommended)
  for (const team of activeTeams) {
    const hasOperative = game.players.some(
      (p) => p.team === team && p.role === 'operative'
    );
    if (!hasOperative) {
      return { valid: false, error: `${team} team needs at least one operative` };
    }
  }
  
  return { valid: true };
}

/**
 * Check if a team has won
 */
export function checkWinCondition(game: Game): TeamId | null {
  for (const team of game.teams) {
    if (game.eliminatedTeams.includes(team)) continue;
    
    const score = game.scores[team];
    if (score.found >= score.total) {
      return team;
    }
  }
  
  // Check if only one team remains
  const remainingTeams = game.teams.filter((t) => !game.eliminatedTeams.includes(t));
  if (remainingTeams.length === 1) {
    return remainingTeams[0];
  }
  
  return null;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Get the current team's turn
 */
export function getCurrentTeam(game: Game): TeamId {
  return game.teams[game.currentTeamIndex];
}

/**
 * Check if it's a player's turn to act
 */
export function isPlayersTurn(game: Game, playerId: string): boolean {
  const player = game.players.find((p) => p.id === playerId);
  if (!player || !player.team) return false;
  
  return player.team === getCurrentTeam(game);
}

/**
 * Check if a player can give a clue
 */
export function canGiveClue(game: Game, playerId: string): boolean {
  if (game.status !== 'playing') return false;
  if (game.currentClue) return false; // Clue already given
  
  const player = game.players.find((p) => p.id === playerId);
  if (!player) return false;
  
  return (
    player.role === 'spymaster' &&
    player.team === getCurrentTeam(game)
  );
}

/**
 * Check if a player can guess
 */
export function canGuess(game: Game, playerId: string): boolean {
  if (game.status !== 'playing') return false;
  if (!game.currentClue) return false; // No clue given yet
  if (game.guessesRemaining <= 0) return false;
  
  const player = game.players.find((p) => p.id === playerId);
  if (!player) return false;
  
  return (
    player.role === 'operative' &&
    player.team === getCurrentTeam(game)
  );
}

