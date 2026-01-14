import { describe, it, expect } from 'vitest';
import { getDefaultSettings, getNeutralCount, BOARD_DIMENSIONS, GameSettings } from './game';

describe('getDefaultSettings', () => {
  it('should return default settings for standard 2-team game', () => {
    const settings = getDefaultSettings('standard', 2);

    expect(settings.boardSize).toBe('standard');
    expect(settings.teamCount).toBe(2);
    expect(settings.wordsPerTeam).toBe(8);
    expect(settings.assassinCount).toBe(1);
  });

  it('should return default settings for small 2-team game', () => {
    const settings = getDefaultSettings('small', 2);

    expect(settings.boardSize).toBe('small');
    expect(settings.teamCount).toBe(2);
    expect(settings.wordsPerTeam).toBe(6);
    expect(settings.assassinCount).toBe(1);
  });

  it('should return default settings for large 4-team game', () => {
    const settings = getDefaultSettings('large', 4);

    expect(settings.boardSize).toBe('large');
    expect(settings.teamCount).toBe(4);
    expect(settings.wordsPerTeam).toBe(7);
    expect(settings.assassinCount).toBe(2); // Large boards have 2 assassins
  });

  it('should return default settings for standard 3-team game', () => {
    const settings = getDefaultSettings('standard', 3);

    expect(settings.boardSize).toBe('standard');
    expect(settings.teamCount).toBe(3);
    expect(settings.wordsPerTeam).toBe(6);
    expect(settings.assassinCount).toBe(1);
  });

  it('should use defaults when no arguments provided', () => {
    const settings = getDefaultSettings();

    expect(settings.boardSize).toBe('standard');
    expect(settings.teamCount).toBe(2);
    expect(settings.wordsPerTeam).toBe(8);
  });
});

describe('getNeutralCount', () => {
  it('should calculate neutral count for standard 2-team game', () => {
    const settings: GameSettings = {
      boardSize: 'standard',
      teamCount: 2,
      wordsPerTeam: 8,
      assassinCount: 1,
    };
    // Total: 25, Team cards: 8*2 = 16, First team bonus: 1, Assassin: 1
    // Neutral: 25 - 16 - 1 - 1 = 7
    expect(getNeutralCount(settings)).toBe(7);
  });

  it('should calculate neutral count for small 2-team game', () => {
    const settings: GameSettings = {
      boardSize: 'small',
      teamCount: 2,
      wordsPerTeam: 6,
      assassinCount: 1,
    };
    // Total: 16, Team cards: 6*2 = 12, First team bonus: 1, Assassin: 1
    // Neutral: 16 - 12 - 1 - 1 = 2
    expect(getNeutralCount(settings)).toBe(2);
  });

  it('should calculate neutral count for large 4-team game', () => {
    const settings: GameSettings = {
      boardSize: 'large',
      teamCount: 4,
      wordsPerTeam: 7,
      assassinCount: 2,
    };
    // Total: 36, Team cards: 7*4 = 28, First team bonus: 1, Assassin: 2
    // Neutral: 36 - 28 - 1 - 2 = 5
    expect(getNeutralCount(settings)).toBe(5);
  });

  it('should calculate neutral count for standard 3-team game', () => {
    const settings: GameSettings = {
      boardSize: 'standard',
      teamCount: 3,
      wordsPerTeam: 6,
      assassinCount: 1,
    };
    // Total: 25, Team cards: 6*3 = 18, First team bonus: 1, Assassin: 1
    // Neutral: 25 - 18 - 1 - 1 = 5
    expect(getNeutralCount(settings)).toBe(5);
  });
});

