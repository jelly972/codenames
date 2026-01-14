import { Redis } from '@upstash/redis';
import type { Game } from '@/types/game';

// Game TTL in seconds (24 hours)
const GAME_TTL = 60 * 60 * 24;

// In-memory store for local development and testing
interface MemoryEntry {
  value: string;
  expiresAt: number | null;
}

// Use globalThis to persist the store across hot reloads in development
const globalForMemoryStore = globalThis as unknown as {
  memoryStore: Map<string, MemoryEntry> | undefined;
  forceMemoryMode: boolean | null | undefined;
};

// Initialize or reuse the global memory store
const memoryStore = globalForMemoryStore.memoryStore ?? new Map<string, MemoryEntry>();
globalForMemoryStore.memoryStore = memoryStore;

// Store mode configuration (can be overridden for testing)
let forceMemoryMode: boolean | null = globalForMemoryStore.forceMemoryMode ?? null;

function shouldUseMemoryStore(): boolean {
  // Allow tests to force memory mode
  if (forceMemoryMode !== null) {
    return forceMemoryMode;
  }
  // Check for explicit USE_MEMORY_DB environment variable
  if (process.env.USE_MEMORY_DB === 'true') {
    return true;
  }
  // Default: use memory store when Upstash credentials are missing
  return !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN;
}

// Clean up expired entries periodically
function cleanupExpired() {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt && entry.expiresAt < now) {
      memoryStore.delete(key);
    }
  }
}

// Run cleanup every minute (only in non-test environments)
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function startCleanupInterval() {
  if (!cleanupInterval && typeof setInterval !== 'undefined') {
    cleanupInterval = setInterval(cleanupExpired, 60 * 1000);
  }
}

function stopCleanupInterval() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Start cleanup if using memory store on module load
if (shouldUseMemoryStore()) {
  startCleanupInterval();
}

// In-memory Redis-like interface
const memoryRedis = {
  async set(key: string, value: string, options?: { ex?: number }): Promise<void> {
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : null;
    memoryStore.set(key, { value, expiresAt });
  },

  async get<T>(key: string): Promise<T | null> {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    
    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return entry.value as unknown as T;
    }
  },

  async del(key: string): Promise<void> {
    memoryStore.delete(key);
  },

  async exists(key: string): Promise<number> {
    const entry = memoryStore.get(key);
    if (!entry) return 0;
    
    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      memoryStore.delete(key);
      return 0;
    }
    
    return 1;
  },
};

// Lazy-initialized Redis client (only used when Upstash is configured)
let redis: Redis | null = null;
let hasLoggedStoreType = false;

function getRedis(): typeof memoryRedis | Redis {
  if (shouldUseMemoryStore()) {
    if (!hasLoggedStoreType) {
      console.log('[Redis] Using in-memory store for local development');
      hasLoggedStoreType = true;
    }
    return memoryRedis;
  }
  
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });
    console.log('[Redis] Using Upstash Redis');
  }
  return redis;
}

// ============ Test Utilities ============

/**
 * Clear all data from the in-memory store.
 * Use this in test setup/teardown to ensure test isolation.
 */
export function clearMemoryStore(): void {
  memoryStore.clear();
}

/**
 * Force the use of in-memory store regardless of environment variables.
 * Call with `true` to force memory mode, `false` to force Upstash, or `null` to use default behavior.
 * Use this in test setup to ensure consistent test behavior.
 */
export function setMemoryStoreMode(useMemory: boolean | null): void {
  forceMemoryMode = useMemory;
  globalForMemoryStore.forceMemoryMode = useMemory; // Persist across hot reloads
  hasLoggedStoreType = false; // Reset logging
  
  if (useMemory) {
    startCleanupInterval();
  } else if (useMemory === false) {
    stopCleanupInterval();
  }
}

/**
 * Get the current size of the in-memory store (useful for test assertions).
 */
export function getMemoryStoreSize(): number {
  return memoryStore.size;
}

/**
 * Check if currently using memory store (useful for test assertions).
 */
export function isUsingMemoryStore(): boolean {
  return shouldUseMemoryStore();
}

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
