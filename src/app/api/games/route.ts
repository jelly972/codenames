import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createGame } from '@/lib/game-logic';
import { saveGame, gameExists } from '@/lib/redis';
import { GameSettings } from '@/types/game';

/**
 * POST /api/games
 * Create a new game with optional settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const settings: Partial<GameSettings> = body.settings || {};
    
    // Generate a unique host ID for the creator
    const hostId = uuidv4();
    
    // Create the game
    let game = createGame(hostId, settings);
    
    // Ensure unique room code
    let attempts = 0;
    while (await gameExists(game.code) && attempts < 10) {
      game = createGame(hostId, settings);
      attempts++;
    }
    
    if (attempts >= 10) {
      return NextResponse.json(
        { error: 'Failed to generate unique room code' },
        { status: 500 }
      );
    }
    
    // Save to Redis
    await saveGame(game);
    
    return NextResponse.json({
      code: game.code,
      hostId: game.hostId,
      settings: game.settings,
    });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}

