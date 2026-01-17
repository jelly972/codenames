// Language options
export type Language = 'en' | 'he';

// Board size presets
export type BoardSize = 'small' | 'standard' | 'large';

export const BOARD_DIMENSIONS: Record<BoardSize, number> = {
  small: 4,
  standard: 5,
  large: 6,
};

// Dynamic team identifiers (supports 2-4 teams)
export type TeamId = 'red' | 'blue' | 'green' | 'yellow';

export const TEAM_COLORS: Record<TeamId, string> = {
  red: '#DC2626',
  blue: '#2563EB',
  green: '#16A34A',
  yellow: '#CA8A04',
};

export const TEAM_ORDER: TeamId[] = ['red', 'blue', 'green', 'yellow'];

// Card types for the key card
export type CardType = TeamId | 'neutral' | 'assassin';

export interface GameSettings {
  boardSize: BoardSize;
  teamCount: 2 | 3 | 4;
  wordsPerTeam: number;
  assassinCount: number;
  language: Language;
}

export interface Clue {
  word: string;
  count: number;
}

export interface TeamScore {
  found: number;
  total: number;
}

export interface Game {
  code: string;
  hostId: string;
  status: 'lobby' | 'playing' | 'finished';
  settings: GameSettings;

  // Board state
  words: string[];
  keyCard: CardType[];
  revealed: boolean[];

  // Turn state
  teams: TeamId[];
  currentTeamIndex: number;
  currentClue: Clue | null;
  guessesRemaining: number;
  guessesThisTurn: number;

  // Players & scoring
  players: Player[];
  scores: Record<TeamId, TeamScore>;
  eliminatedTeams: TeamId[];
  winner: TeamId | null;

  createdAt: number;
}

export type PlayerRole = 'spymaster' | 'operative' | 'spectator';

export interface Player {
  id: string;
  name: string;
  team: TeamId | null;
  role: PlayerRole | null;
  isHost: boolean;
}

// Default settings based on board size and team count
export function getDefaultSettings(
  boardSize: BoardSize = 'standard',
  teamCount: 2 | 3 | 4 = 2,
  language: Language = 'en'
): GameSettings {
  const totalCards = BOARD_DIMENSIONS[boardSize] ** 2;

  // Calculate words per team based on board size and team count
  const wordsPerTeamDefaults: Record<BoardSize, Record<2 | 3 | 4, number>> = {
    small: { 2: 6, 3: 4, 4: 3 },
    standard: { 2: 8, 3: 6, 4: 5 },
    large: { 2: 12, 3: 9, 4: 7 },
  };

  return {
    boardSize,
    teamCount,
    wordsPerTeam: wordsPerTeamDefaults[boardSize][teamCount],
    assassinCount: boardSize === 'large' ? 2 : 1,
    language,
  };
}

// Calculate neutral cards based on settings
export function getNeutralCount(settings: GameSettings): number {
  const totalCards = BOARD_DIMENSIONS[settings.boardSize] ** 2;
  const teamCards = settings.wordsPerTeam * settings.teamCount;
  // First team gets one extra card
  const firstTeamBonus = 1;
  return totalCards - teamCards - firstTeamBonus - settings.assassinCount;
}

// Client-side game state (hides key card for non-spymasters)
export interface ClientGameState {
  code: string;
  hostId: string;
  status: 'lobby' | 'playing' | 'finished';
  settings: GameSettings;
  words: string[];
  revealed: boolean[];
  revealedCards: (CardType | null)[]; // Only shows revealed card types
  teams: TeamId[];
  currentTeamIndex: number;
  currentClue: Clue | null;
  guessesRemaining: number;
  guessesThisTurn: number;
  players: Player[];
  scores: Record<TeamId, TeamScore>;
  eliminatedTeams: TeamId[];
  winner: TeamId | null;
}

// Spymaster view includes the full key card
export interface SpymasterGameState extends ClientGameState {
  keyCard: CardType[];
}

