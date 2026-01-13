import { Redis } from '@upstash/redis';
import type { Game } from '@/types/game';

// Lazy-initialized Redis client
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });
  }
  return redis;
}

// Game TTL in seconds (24 hours)
const GAME_TTL = 60 * 60 * 24;

/**
 * Get the Redis key for a game
 */
function getGameKey(code: string): string {
  return `game:${code.toUpperCase()}`;
}

/**
 * Save a game to Redis
 */
export async function saveGame(game: Game): Promise<void> {
  const key = getGameKey(game.code);
  await getRedis().set(key, JSON.stringify(game), { ex: GAME_TTL });
}

/**
 * Get a game from Redis
 */
export async function getGame(code: string): Promise<Game | null> {
  const key = getGameKey(code);
  const data = await getRedis().get<string>(key);
  if (!data) return null;
  
  // Handle case where Redis returns parsed object or string
  if (typeof data === 'object') {
    return data as unknown as Game;
  }
  
  return JSON.parse(data) as Game;
}

/**
 * Delete a game from Redis
 */
export async function deleteGame(code: string): Promise<void> {
  const key = getGameKey(code);
  await getRedis().del(key);
}

/**
 * Check if a game code exists
 */
export async function gameExists(code: string): Promise<boolean> {
  const key = getGameKey(code);
  const exists = await getRedis().exists(key);
  return exists === 1;
}

/**
 * Update specific fields of a game
 */
export async function updateGame(
  code: string,
  updates: Partial<Game>
): Promise<Game | null> {
  const game = await getGame(code);
  if (!game) return null;

  const updatedGame = { ...game, ...updates };
  await saveGame(updatedGame);
  return updatedGame;
}

export { getRedis as redis };
