import { describe, it, expect } from 'vitest';
import { generateRoomCode, generateKeyCard, initializeScores, createGame, validateGameStart, checkWinCondition, getCurrentTeam, isPlayersTurn, canGiveClue, canGuess, regenerateBoard } from './game-logic';
import { Player } from '@/types/game';
import { GameSettings, BOARD_DIMENSIONS, CardType } from '@/types/game';

describe('generateRoomCode', () => {
  const ALLOWED_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  it('should return a 6-character string', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
  });

  it('should only contain allowed characters (no ambiguous chars like 0, O, 1, I)', () => {
    // Run multiple times to increase confidence
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      for (const char of code) {
        expect(ALLOWED_CHARS).toContain(char);
      }
    }
  });

  it('should generate unique codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateRoomCode());
    }
    // With 32^6 possibilities, 100 codes should all be unique
    expect(codes.size).toBe(100);
  });
});

describe('generateKeyCard', () => {
  function countCardTypes(keyCard: CardType[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const card of keyCard) {
      counts[card] = (counts[card] || 0) + 1;
    }
    return counts;
  }

  it('should generate correct number of cards for standard 2-team game', () => {
    const settings: GameSettings = {
      boardSize: 'standard',
      teamCount: 2,
      wordsPerTeam: 8,
      assassinCount: 1,
    };
    const keyCard = generateKeyCard(settings);
    const totalCards = BOARD_DIMENSIONS.standard ** 2; // 25

    expect(keyCard).toHaveLength(totalCards);

    const counts = countCardTypes(keyCard);
    // First team (red) gets wordsPerTeam + 1 = 9
    expect(counts['red']).toBe(9);
    // Second team (blue) gets wordsPerTeam = 8
    expect(counts['blue']).toBe(8);
    // 1 assassin
    expect(counts['assassin']).toBe(1);
    // Rest are neutral: 25 - 9 - 8 - 1 = 7
    expect(counts['neutral']).toBe(7);
  });

  it('should generate correct distribution for 4-team large board', () => {
    const settings: GameSettings = {
      boardSize: 'large',
      teamCount: 4,
      wordsPerTeam: 7,
      assassinCount: 2,
    };
    const keyCard = generateKeyCard(settings);
    const totalCards = BOARD_DIMENSIONS.large ** 2; // 36

    expect(keyCard).toHaveLength(totalCards);

    const counts = countCardTypes(keyCard);
    // First team gets wordsPerTeam + 1 = 8
    expect(counts['red']).toBe(8);
    // Other teams get wordsPerTeam = 7
    expect(counts['blue']).toBe(7);
    expect(counts['green']).toBe(7);
    expect(counts['yellow']).toBe(7);
    // 2 assassins
    expect(counts['assassin']).toBe(2);
    // Rest are neutral: 36 - 8 - 7 - 7 - 7 - 2 = 5
    expect(counts['neutral']).toBe(5);
  });

  it('should shuffle the key card (not in predictable order)', () => {
    const settings: GameSettings = {
      boardSize: 'standard',
      teamCount: 2,
      wordsPerTeam: 8,
      assassinCount: 1,
    };
    
    // Generate multiple key cards and check they're not identical
    const keyCards = Array.from({ length: 5 }, () => generateKeyCard(settings));
    const uniqueCards = new Set(keyCards.map(kc => JSON.stringify(kc)));
    
    // All 5 should be different (extremely unlikely to be same if shuffled)
    expect(uniqueCards.size).toBe(5);
  });
});

describe('initializeScores', () => {
  it('should set up scores for 2-team game with first team bonus', () => {
    const settings: GameSettings = {
      boardSize: 'standard',
      teamCount: 2,
      wordsPerTeam: 8,
      assassinCount: 1,
    };
    const scores = initializeScores(settings);

    // First team (red) gets wordsPerTeam + 1
    expect(scores.red).toEqual({ found: 0, total: 9 });
    // Second team (blue) gets wordsPerTeam
    expect(scores.blue).toEqual({ found: 0, total: 8 });
    // Non-participating teams have 0 totals
    expect(scores.green).toEqual({ found: 0, total: 0 });
    expect(scores.yellow).toEqual({ found: 0, total: 0 });
  });

  it('should set up scores for 4-team game', () => {
    const settings: GameSettings = {
      boardSize: 'large',
      teamCount: 4,
      wordsPerTeam: 7,
      assassinCount: 2,
    };
    const scores = initializeScores(settings);

    // First team gets bonus
    expect(scores.red).toEqual({ found: 0, total: 8 });
    // Other teams get base amount
    expect(scores.blue).toEqual({ found: 0, total: 7 });
    expect(scores.green).toEqual({ found: 0, total: 7 });
    expect(scores.yellow).toEqual({ found: 0, total: 7 });
  });

  it('should start all teams with 0 found cards', () => {
    const settings: GameSettings = {
      boardSize: 'standard',
      teamCount: 3,
      wordsPerTeam: 6,
      assassinCount: 1,
    };
    const scores = initializeScores(settings);

    expect(scores.red.found).toBe(0);
    expect(scores.blue.found).toBe(0);
    expect(scores.green.found).toBe(0);
    expect(scores.yellow.found).toBe(0);
  });
});

describe('createGame', () => {
  it('should create a game with default settings', () => {
    const hostId = 'host-123';
    const game = createGame(hostId);

    expect(game.hostId).toBe(hostId);
    expect(game.status).toBe('lobby');
    expect(game.code).toHaveLength(6);
    expect(game.players).toEqual([]);
    expect(game.winner).toBeNull();
    expect(game.eliminatedTeams).toEqual([]);
    expect(game.currentTeamIndex).toBe(0);
    expect(game.currentClue).toBeNull();
    expect(game.guessesRemaining).toBe(0);
  });

  it('should create a game with custom settings', () => {
    const hostId = 'host-456';
    const game = createGame(hostId, {
      boardSize: 'large',
      teamCount: 4,
    });

    expect(game.settings.boardSize).toBe('large');
    expect(game.settings.teamCount).toBe(4);
    expect(game.teams).toHaveLength(4);
    expect(game.teams).toEqual(['red', 'blue', 'green', 'yellow']);
  });

  it('should initialize board with correct number of words', () => {
    const game = createGame('host', { boardSize: 'standard' });
    const expectedCards = 5 * 5; // standard = 5x5

    expect(game.words).toHaveLength(expectedCards);
    expect(game.keyCard).toHaveLength(expectedCards);
    expect(game.revealed).toHaveLength(expectedCards);
    expect(game.revealed.every(r => r === false)).toBe(true);
  });

  it('should set createdAt timestamp', () => {
    const before = Date.now();
    const game = createGame('host');
    const after = Date.now();

    expect(game.createdAt).toBeGreaterThanOrEqual(before);
    expect(game.createdAt).toBeLessThanOrEqual(after);
  });
});

describe('validateGameStart', () => {
  function createPlayer(overrides: Partial<Player>): Player {
    return {
      id: 'player-1',
      name: 'Player 1',
      team: null,
      role: null,
      isHost: false,
      ...overrides,
    };
  }

  it('should reject if game is not in lobby status', () => {
    const game = createGame('host');
    game.status = 'playing';

    const result = validateGameStart(game);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Game has already started');
  });

  it('should reject if a team is missing a spymaster', () => {
    const game = createGame('host', { teamCount: 2 });
    game.players = [
      createPlayer({ id: '1', team: 'red', role: 'spymaster' }),
      createPlayer({ id: '2', team: 'red', role: 'operative' }),
      // Blue team has no spymaster
      createPlayer({ id: '3', team: 'blue', role: 'operative' }),
    ];

    const result = validateGameStart(game);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('blue team needs a spymaster');
  });

  it('should reject if a team is missing an operative', () => {
    const game = createGame('host', { teamCount: 2 });
    game.players = [
      createPlayer({ id: '1', team: 'red', role: 'spymaster' }),
      createPlayer({ id: '2', team: 'red', role: 'operative' }),
      createPlayer({ id: '3', team: 'blue', role: 'spymaster' }),
      // Blue team has no operative
    ];

    const result = validateGameStart(game);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('blue team needs at least one operative');
  });

  it('should accept valid 2-team setup', () => {
    const game = createGame('host', { teamCount: 2 });
    game.players = [
      createPlayer({ id: '1', team: 'red', role: 'spymaster' }),
      createPlayer({ id: '2', team: 'red', role: 'operative' }),
      createPlayer({ id: '3', team: 'blue', role: 'spymaster' }),
      createPlayer({ id: '4', team: 'blue', role: 'operative' }),
    ];

    const result = validateGameStart(game);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept valid 4-team setup', () => {
    const game = createGame('host', { teamCount: 4 });
    game.players = [
      createPlayer({ id: '1', team: 'red', role: 'spymaster' }),
      createPlayer({ id: '2', team: 'red', role: 'operative' }),
      createPlayer({ id: '3', team: 'blue', role: 'spymaster' }),
      createPlayer({ id: '4', team: 'blue', role: 'operative' }),
      createPlayer({ id: '5', team: 'green', role: 'spymaster' }),
      createPlayer({ id: '6', team: 'green', role: 'operative' }),
      createPlayer({ id: '7', team: 'yellow', role: 'spymaster' }),
      createPlayer({ id: '8', team: 'yellow', role: 'operative' }),
    ];

    const result = validateGameStart(game);
    expect(result.valid).toBe(true);
  });
});

describe('checkWinCondition', () => {
  it('should return null when no team has won yet', () => {
    const game = createGame('host', { teamCount: 2 });
    // Scores are initialized but no one has found all cards
    game.scores.red = { found: 5, total: 9 };
    game.scores.blue = { found: 3, total: 8 };

    const winner = checkWinCondition(game);
    expect(winner).toBeNull();
  });

  it('should detect when a team has found all their cards', () => {
    const game = createGame('host', { teamCount: 2 });
    game.scores.red = { found: 9, total: 9 };
    game.scores.blue = { found: 3, total: 8 };

    const winner = checkWinCondition(game);
    expect(winner).toBe('red');
  });

  it('should detect when blue team wins', () => {
    const game = createGame('host', { teamCount: 2 });
    game.scores.red = { found: 5, total: 9 };
    game.scores.blue = { found: 8, total: 8 };

    const winner = checkWinCondition(game);
    expect(winner).toBe('blue');
  });

  it('should return last remaining team when others are eliminated', () => {
    const game = createGame('host', { teamCount: 3 });
    game.eliminatedTeams = ['red', 'green'];

    const winner = checkWinCondition(game);
    expect(winner).toBe('blue');
  });

  it('should skip eliminated teams when checking win condition', () => {
    const game = createGame('host', { teamCount: 2 });
    game.eliminatedTeams = ['red'];
    game.scores.red = { found: 9, total: 9 }; // Would win, but eliminated

    const winner = checkWinCondition(game);
    expect(winner).toBe('blue'); // Only remaining team
  });

  it('should return null in 4-team game with multiple teams still playing', () => {
    const game = createGame('host', { teamCount: 4 });
    game.eliminatedTeams = ['red'];
    // 3 teams still active, none have won
    game.scores.blue = { found: 3, total: 7 };
    game.scores.green = { found: 2, total: 7 };
    game.scores.yellow = { found: 1, total: 7 };

    const winner = checkWinCondition(game);
    expect(winner).toBeNull();
  });
});

describe('getCurrentTeam', () => {
  it('should return the first team at game start', () => {
    const game = createGame('host', { teamCount: 2 });
    expect(getCurrentTeam(game)).toBe('red');
  });

  it('should return the correct team based on currentTeamIndex', () => {
    const game = createGame('host', { teamCount: 4 });
    
    game.currentTeamIndex = 0;
    expect(getCurrentTeam(game)).toBe('red');
    
    game.currentTeamIndex = 1;
    expect(getCurrentTeam(game)).toBe('blue');
    
    game.currentTeamIndex = 2;
    expect(getCurrentTeam(game)).toBe('green');
    
    game.currentTeamIndex = 3;
    expect(getCurrentTeam(game)).toBe('yellow');
  });
});

describe('isPlayersTurn', () => {
  function createPlayer(overrides: Partial<Player>): Player {
    return {
      id: 'player-1',
      name: 'Player 1',
      team: null,
      role: null,
      isHost: false,
      ...overrides,
    };
  }

  it('should return true when player is on the current team', () => {
    const game = createGame('host', { teamCount: 2 });
    game.currentTeamIndex = 0; // Red's turn
    game.players = [
      createPlayer({ id: 'red-player', team: 'red', role: 'operative' }),
    ];

    expect(isPlayersTurn(game, 'red-player')).toBe(true);
  });

  it('should return false when player is not on the current team', () => {
    const game = createGame('host', { teamCount: 2 });
    game.currentTeamIndex = 0; // Red's turn
    game.players = [
      createPlayer({ id: 'blue-player', team: 'blue', role: 'operative' }),
    ];

    expect(isPlayersTurn(game, 'blue-player')).toBe(false);
  });

  it('should return false for player not in the game', () => {
    const game = createGame('host', { teamCount: 2 });
    expect(isPlayersTurn(game, 'unknown-player')).toBe(false);
  });

  it('should return false for player without a team', () => {
    const game = createGame('host', { teamCount: 2 });
    game.players = [
      createPlayer({ id: 'spectator', team: null, role: 'spectator' }),
    ];

    expect(isPlayersTurn(game, 'spectator')).toBe(false);
  });
});

describe('canGiveClue', () => {
  function createPlayer(overrides: Partial<Player>): Player {
    return {
      id: 'player-1',
      name: 'Player 1',
      team: null,
      role: null,
      isHost: false,
      ...overrides,
    };
  }

  it('should return true for spymaster on current team with no clue given', () => {
    const game = createGame('host', { teamCount: 2 });
    game.status = 'playing';
    game.currentTeamIndex = 0; // Red's turn
    game.currentClue = null;
    game.players = [
      createPlayer({ id: 'red-spy', team: 'red', role: 'spymaster' }),
    ];

    expect(canGiveClue(game, 'red-spy')).toBe(true);
  });

  it('should return false if game is not playing', () => {
    const game = createGame('host', { teamCount: 2 });
    game.status = 'lobby';
    game.players = [
      createPlayer({ id: 'red-spy', team: 'red', role: 'spymaster' }),
    ];

    expect(canGiveClue(game, 'red-spy')).toBe(false);
  });

  it('should return false if clue already given', () => {
    const game = createGame('host', { teamCount: 2 });
    game.status = 'playing';
    game.currentClue = { word: 'TEST', count: 2 };
    game.players = [
      createPlayer({ id: 'red-spy', team: 'red', role: 'spymaster' }),
    ];

    expect(canGiveClue(game, 'red-spy')).toBe(false);
  });

  it('should return false for operative (not spymaster)', () => {
    const game = createGame('host', { teamCount: 2 });
    game.status = 'playing';
    game.currentClue = null;
    game.players = [
      createPlayer({ id: 'red-op', team: 'red', role: 'operative' }),
    ];

    expect(canGiveClue(game, 'red-op')).toBe(false);
  });

  it('should return false for spymaster not on current team', () => {
    const game = createGame('host', { teamCount: 2 });
    game.status = 'playing';
    game.currentTeamIndex = 0; // Red's turn
    game.currentClue = null;
    game.players = [
      createPlayer({ id: 'blue-spy', team: 'blue', role: 'spymaster' }),
    ];

    expect(canGiveClue(game, 'blue-spy')).toBe(false);
  });
});

describe('canGuess', () => {
  function createPlayer(overrides: Partial<Player>): Player {
    return {
      id: 'player-1',
      name: 'Player 1',
      team: null,
      role: null,
      isHost: false,
      ...overrides,
    };
  }

  it('should return true for operative on current team with clue given and guesses remaining', () => {
    const game = createGame('host', { teamCount: 2 });
    game.status = 'playing';
    game.currentTeamIndex = 0; // Red's turn
    game.currentClue = { word: 'TEST', count: 2 };
    game.guessesRemaining = 3;
    game.players = [
      createPlayer({ id: 'red-op', team: 'red', role: 'operative' }),
    ];

    expect(canGuess(game, 'red-op')).toBe(true);
  });

  it('should return false if game is not playing', () => {
    const game = createGame('host', { teamCount: 2 });
    game.status = 'lobby';
    game.players = [
      createPlayer({ id: 'red-op', team: 'red', role: 'operative' }),
    ];

    expect(canGuess(game, 'red-op')).toBe(false);
  });

  it('should return false if no clue given yet', () => {
    const game = createGame('host', { teamCount: 2 });
    game.status = 'playing';
    game.currentClue = null;
    game.players = [
      createPlayer({ id: 'red-op', team: 'red', role: 'operative' }),
    ];

    expect(canGuess(game, 'red-op')).toBe(false);
  });

  it('should return false if no guesses remaining', () => {
    const game = createGame('host', { teamCount: 2 });
    game.status = 'playing';
    game.currentClue = { word: 'TEST', count: 2 };
    game.guessesRemaining = 0;
    game.players = [
      createPlayer({ id: 'red-op', team: 'red', role: 'operative' }),
    ];

    expect(canGuess(game, 'red-op')).toBe(false);
  });

  it('should return false for spymaster (not operative)', () => {
    const game = createGame('host', { teamCount: 2 });
    game.status = 'playing';
    game.currentClue = { word: 'TEST', count: 2 };
    game.guessesRemaining = 3;
    game.players = [
      createPlayer({ id: 'red-spy', team: 'red', role: 'spymaster' }),
    ];

    expect(canGuess(game, 'red-spy')).toBe(false);
  });

  it('should return false for operative not on current team', () => {
    const game = createGame('host', { teamCount: 2 });
    game.status = 'playing';
    game.currentTeamIndex = 0; // Red's turn
    game.currentClue = { word: 'TEST', count: 2 };
    game.guessesRemaining = 3;
    game.players = [
      createPlayer({ id: 'blue-op', team: 'blue', role: 'operative' }),
    ];

    expect(canGuess(game, 'blue-op')).toBe(false);
  });
});

describe('regenerateBoard', () => {
  it('should reset game to lobby status', () => {
    const game = createGame('host', { teamCount: 2 });
    game.status = 'finished';
    game.winner = 'red';

    const regenerated = regenerateBoard(game);

    expect(regenerated.status).toBe('lobby');
    expect(regenerated.winner).toBeNull();
  });

  it('should reset all revealed cards', () => {
    const game = createGame('host', { teamCount: 2 });
    game.revealed = game.revealed.map(() => true); // All revealed

    const regenerated = regenerateBoard(game);

    expect(regenerated.revealed.every(r => r === false)).toBe(true);
  });

  it('should generate new words', () => {
    const game = createGame('host', { teamCount: 2 });
    const originalWords = [...game.words];

    const regenerated = regenerateBoard(game);

    // Words should be different (very unlikely to be same)
    expect(regenerated.words).not.toEqual(originalWords);
    expect(regenerated.words).toHaveLength(originalWords.length);
  });

  it('should generate new key card', () => {
    const game = createGame('host', { teamCount: 2 });
    const originalKeyCard = [...game.keyCard];

    const regenerated = regenerateBoard(game);

    // Key card should be different (very unlikely to be same)
    expect(regenerated.keyCard).not.toEqual(originalKeyCard);
    expect(regenerated.keyCard).toHaveLength(originalKeyCard.length);
  });

  it('should reset turn state', () => {
    const game = createGame('host', { teamCount: 2 });
    game.currentTeamIndex = 1;
    game.currentClue = { word: 'TEST', count: 3 };
    game.guessesRemaining = 2;
    game.guessesThisTurn = 1;

    const regenerated = regenerateBoard(game);

    expect(regenerated.currentTeamIndex).toBe(0);
    expect(regenerated.currentClue).toBeNull();
    expect(regenerated.guessesRemaining).toBe(0);
    expect(regenerated.guessesThisTurn).toBe(0);
  });

  it('should reset scores and eliminated teams', () => {
    const game = createGame('host', { teamCount: 2 });
    game.scores.red = { found: 5, total: 9 };
    game.scores.blue = { found: 3, total: 8 };
    game.eliminatedTeams = ['blue'];

    const regenerated = regenerateBoard(game);

    expect(regenerated.scores.red.found).toBe(0);
    expect(regenerated.scores.blue.found).toBe(0);
    expect(regenerated.eliminatedTeams).toEqual([]);
  });

  it('should preserve game code, hostId, settings, and players', () => {
    const game = createGame('host-123', { teamCount: 3 });
    game.players = [
      { id: 'p1', name: 'Player 1', team: 'red', role: 'spymaster', isHost: true },
    ];

    const regenerated = regenerateBoard(game);

    expect(regenerated.code).toBe(game.code);
    expect(regenerated.hostId).toBe('host-123');
    expect(regenerated.settings.teamCount).toBe(3);
    expect(regenerated.players).toEqual(game.players);
  });
});

