/**
 * Input validation and sanitization utilities for server-side security
 */

// Maximum allowed lengths for user inputs
export const MAX_LENGTHS = {
  nickname: 256,
  clue: 256,
  gameCode: 10,
  playerId: 64,
} as const;

export interface ValidationResult {
  valid: boolean;
  sanitized: string;
  error?: string;
}

/**
 * Sanitize a string by trimming whitespace and removing control characters
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove control characters (except newlines/tabs which we'll also strip for single-line inputs)
  // This removes characters like null bytes, escape sequences, etc.
  // eslint-disable-next-line no-control-regex
  const sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');
  
  return sanitized.trim();
}

/**
 * Validate and sanitize a nickname (player name)
 */
export function validateNickname(input: unknown): ValidationResult {
  const sanitized = sanitizeString(input);
  
  if (!sanitized) {
    return {
      valid: false,
      sanitized: '',
      error: 'Nickname cannot be empty',
    };
  }
  
  if (sanitized.length > MAX_LENGTHS.nickname) {
    return {
      valid: false,
      sanitized: sanitized.slice(0, MAX_LENGTHS.nickname),
      error: `Nickname cannot exceed ${MAX_LENGTHS.nickname} characters`,
    };
  }
  
  return {
    valid: true,
    sanitized,
  };
}

/**
 * Validate and sanitize a clue word
 */
export function validateClue(input: unknown): ValidationResult {
  const sanitized = sanitizeString(input);
  
  if (!sanitized) {
    return {
      valid: false,
      sanitized: '',
      error: 'Clue cannot be empty',
    };
  }
  
  if (sanitized.length > MAX_LENGTHS.clue) {
    return {
      valid: false,
      sanitized: sanitized.slice(0, MAX_LENGTHS.clue),
      error: `Clue cannot exceed ${MAX_LENGTHS.clue} characters`,
    };
  }
  
  return {
    valid: true,
    sanitized,
  };
}

/**
 * Validate a game code format
 */
export function validateGameCode(input: unknown): ValidationResult {
  const sanitized = sanitizeString(input).toUpperCase();
  
  if (!sanitized) {
    return {
      valid: false,
      sanitized: '',
      error: 'Game code cannot be empty',
    };
  }
  
  if (sanitized.length > MAX_LENGTHS.gameCode) {
    return {
      valid: false,
      sanitized: sanitized.slice(0, MAX_LENGTHS.gameCode),
      error: `Game code cannot exceed ${MAX_LENGTHS.gameCode} characters`,
    };
  }
  
  // Only allow alphanumeric characters
  if (!/^[A-Z0-9]+$/.test(sanitized)) {
    return {
      valid: false,
      sanitized: sanitized.replace(/[^A-Z0-9]/g, ''),
      error: 'Game code can only contain letters and numbers',
    };
  }
  
  return {
    valid: true,
    sanitized,
  };
}

/**
 * Validate a player ID format
 */
export function validatePlayerId(input: unknown): ValidationResult {
  const sanitized = sanitizeString(input);
  
  if (!sanitized) {
    return {
      valid: false,
      sanitized: '',
      error: 'Player ID cannot be empty',
    };
  }
  
  if (sanitized.length > MAX_LENGTHS.playerId) {
    return {
      valid: false,
      sanitized: sanitized.slice(0, MAX_LENGTHS.playerId),
      error: `Player ID cannot exceed ${MAX_LENGTHS.playerId} characters`,
    };
  }
  
  return {
    valid: true,
    sanitized,
  };
}

/**
 * Validate clue count is a reasonable number
 */
export function validateClueCount(input: unknown): { valid: boolean; value: number; error?: string } {
  // Reject null/undefined explicitly (Number(null) = 0 which would pass)
  if (input === null || input === undefined) {
    return {
      valid: false,
      value: 0,
      error: 'Clue count must be a whole number',
    };
  }
  
  const num = Number(input);
  
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return {
      valid: false,
      value: 0,
      error: 'Clue count must be a whole number',
    };
  }
  
  if (num < 0) {
    return {
      valid: false,
      value: 0,
      error: 'Clue count cannot be negative',
    };
  }
  
  // Reasonable upper bound (no game has more than 36 cards)
  if (num > 50) {
    return {
      valid: false,
      value: 50,
      error: 'Clue count is too large',
    };
  }
  
  return {
    valid: true,
    value: num,
  };
}

