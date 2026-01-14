import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  validateNickname,
  validateClue,
  validateGameCode,
  validatePlayerId,
  validateClueCount,
  MAX_LENGTHS,
} from './validation';

describe('sanitizeString', () => {
  it('should return empty string for non-string input', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
    expect(sanitizeString(123)).toBe('');
    expect(sanitizeString({})).toBe('');
    expect(sanitizeString([])).toBe('');
  });

  it('should trim whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
    expect(sanitizeString('\t\nhello\t\n')).toBe('hello');
  });

  it('should remove control characters', () => {
    expect(sanitizeString('hello\x00world')).toBe('helloworld');
    expect(sanitizeString('test\x1Fvalue')).toBe('testvalue');
    expect(sanitizeString('\x7Fhidden')).toBe('hidden');
  });

  it('should remove null bytes', () => {
    expect(sanitizeString('hello\0world')).toBe('helloworld');
  });

  it('should handle normal strings', () => {
    expect(sanitizeString('John Doe')).toBe('John Doe');
    expect(sanitizeString('Player_123')).toBe('Player_123');
  });

  it('should preserve unicode characters', () => {
    expect(sanitizeString('日本語')).toBe('日本語');
    expect(sanitizeString('émoji 🎮')).toBe('émoji 🎮');
  });
});

describe('validateNickname', () => {
  it('should accept valid nicknames', () => {
    const result = validateNickname('John');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('John');
    expect(result.error).toBeUndefined();
  });

  it('should reject empty nicknames', () => {
    expect(validateNickname('').valid).toBe(false);
    expect(validateNickname('').error).toBe('Nickname cannot be empty');
    
    expect(validateNickname('   ').valid).toBe(false);
    expect(validateNickname('   ').error).toBe('Nickname cannot be empty');
  });

  it('should reject nicknames exceeding max length', () => {
    const longName = 'a'.repeat(257);
    const result = validateNickname(longName);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe(`Nickname cannot exceed ${MAX_LENGTHS.nickname} characters`);
    expect(result.sanitized).toHaveLength(MAX_LENGTHS.nickname);
  });

  it('should accept nicknames at exactly max length', () => {
    const maxName = 'a'.repeat(256);
    const result = validateNickname(maxName);
    
    expect(result.valid).toBe(true);
    expect(result.sanitized).toHaveLength(256);
  });

  it('should sanitize control characters before validation', () => {
    const result = validateNickname('John\x00Doe');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('JohnDoe');
  });

  it('should reject non-string input', () => {
    expect(validateNickname(null).valid).toBe(false);
    expect(validateNickname(undefined).valid).toBe(false);
    expect(validateNickname(123).valid).toBe(false);
  });
});

describe('validateClue', () => {
  it('should accept valid clues', () => {
    const result = validateClue('animals');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('animals');
  });

  it('should reject empty clues', () => {
    expect(validateClue('').valid).toBe(false);
    expect(validateClue('').error).toBe('Clue cannot be empty');
  });

  it('should reject clues exceeding max length', () => {
    const longClue = 'x'.repeat(257);
    const result = validateClue(longClue);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe(`Clue cannot exceed ${MAX_LENGTHS.clue} characters`);
    expect(result.sanitized).toHaveLength(MAX_LENGTHS.clue);
  });

  it('should accept clues at exactly max length', () => {
    const maxClue = 'x'.repeat(256);
    const result = validateClue(maxClue);
    
    expect(result.valid).toBe(true);
    expect(result.sanitized).toHaveLength(256);
  });

  it('should trim and sanitize clues', () => {
    const result = validateClue('  animals  ');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('animals');
  });
});

describe('validateGameCode', () => {
  it('should accept valid game codes', () => {
    const result = validateGameCode('ABC123');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('ABC123');
  });

  it('should convert to uppercase', () => {
    const result = validateGameCode('abc123');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('ABC123');
  });

  it('should reject empty game codes', () => {
    expect(validateGameCode('').valid).toBe(false);
    expect(validateGameCode('').error).toBe('Game code cannot be empty');
  });

  it('should reject game codes exceeding max length', () => {
    const longCode = 'A'.repeat(11);
    const result = validateGameCode(longCode);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe(`Game code cannot exceed ${MAX_LENGTHS.gameCode} characters`);
  });

  it('should reject non-alphanumeric characters', () => {
    const result = validateGameCode('ABC-123');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Game code can only contain letters and numbers');
    expect(result.sanitized).toBe('ABC123');
  });

  it('should reject special characters', () => {
    expect(validateGameCode('ABC@123').valid).toBe(false);
    expect(validateGameCode('AB!C').valid).toBe(false);
    expect(validateGameCode('A B C').valid).toBe(false);
  });
});

describe('validatePlayerId', () => {
  it('should accept valid player IDs', () => {
    const result = validatePlayerId('player-123-abc');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('player-123-abc');
  });

  it('should accept UUIDs', () => {
    const result = validatePlayerId('550e8400-e29b-41d4-a716-446655440000');
    expect(result.valid).toBe(true);
  });

  it('should reject empty player IDs', () => {
    expect(validatePlayerId('').valid).toBe(false);
    expect(validatePlayerId('').error).toBe('Player ID cannot be empty');
  });

  it('should reject player IDs exceeding max length', () => {
    const longId = 'x'.repeat(65);
    const result = validatePlayerId(longId);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe(`Player ID cannot exceed ${MAX_LENGTHS.playerId} characters`);
  });

  it('should sanitize control characters', () => {
    const result = validatePlayerId('player\x00id');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('playerid');
  });
});

describe('validateClueCount', () => {
  it('should accept valid counts', () => {
    expect(validateClueCount(0).valid).toBe(true);
    expect(validateClueCount(0).value).toBe(0);
    
    expect(validateClueCount(5).valid).toBe(true);
    expect(validateClueCount(5).value).toBe(5);
  });

  it('should accept zero (unlimited guesses)', () => {
    const result = validateClueCount(0);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(0);
  });

  it('should reject negative numbers', () => {
    const result = validateClueCount(-1);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Clue count cannot be negative');
  });

  it('should reject non-integers', () => {
    expect(validateClueCount(2.5).valid).toBe(false);
    expect(validateClueCount(2.5).error).toBe('Clue count must be a whole number');
  });

  it('should reject non-numbers', () => {
    expect(validateClueCount('five').valid).toBe(false);
    expect(validateClueCount(null).valid).toBe(false);
    expect(validateClueCount(undefined).valid).toBe(false);
  });

  it('should reject excessively large counts', () => {
    const result = validateClueCount(100);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Clue count is too large');
  });

  it('should accept counts up to 50', () => {
    expect(validateClueCount(50).valid).toBe(true);
    expect(validateClueCount(50).value).toBe(50);
  });

  it('should reject Infinity and NaN', () => {
    expect(validateClueCount(Infinity).valid).toBe(false);
    expect(validateClueCount(NaN).valid).toBe(false);
  });

  it('should coerce string numbers', () => {
    const result = validateClueCount('3');
    expect(result.valid).toBe(true);
    expect(result.value).toBe(3);
  });
});

describe('security edge cases', () => {
  it('should handle extremely long strings gracefully', () => {
    const megaString = 'x'.repeat(10000);
    
    const nicknameResult = validateNickname(megaString);
    expect(nicknameResult.valid).toBe(false);
    expect(nicknameResult.sanitized.length).toBeLessThanOrEqual(MAX_LENGTHS.nickname);
    
    const clueResult = validateClue(megaString);
    expect(clueResult.valid).toBe(false);
    expect(clueResult.sanitized.length).toBeLessThanOrEqual(MAX_LENGTHS.clue);
  });

  it('should handle strings with only control characters', () => {
    const result = validateNickname('\x00\x01\x02');
    expect(result.valid).toBe(false);
    expect(result.sanitized).toBe('');
  });

  it('should handle mixed valid and invalid content', () => {
    const result = validateNickname('Valid\x00Name');
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('ValidName');
  });

  it('should handle potential XSS in nickname', () => {
    const result = validateNickname('<script>alert("xss")</script>');
    expect(result.valid).toBe(true);
    // The string is preserved (sanitization removes control chars, not HTML)
    // HTML escaping should happen at display time
    expect(result.sanitized).toBe('<script>alert("xss")</script>');
  });

  it('should handle SQL injection attempts in nickname', () => {
    const result = validateNickname("'; DROP TABLE users; --");
    expect(result.valid).toBe(true);
    // SQL injection is prevented by parameterized queries, not input sanitization
    expect(result.sanitized).toBe("'; DROP TABLE users; --");
  });
});

