import { NextRequest, NextResponse } from 'next/server';
import { getGame } from '@/lib/redis';
import { ClientGameState, CardType } from '@/types/game';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/games/[code]
 * Get the current state of a game (without revealing the key card)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const game = await getGame(code.toUpperCase());
    
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }
    
    // Convert to client-safe state (hide unrevealed key card entries)
    const revealedCards: (CardType | null)[] = game.keyCard.map((type, i) =>
      game.revealed[i] ? type : null
    );
    
    const clientState: ClientGameState = {
      code: game.code,
      hostId: game.hostId,
      status: game.status,
      settings: game.settings,
      words: game.words,
      revealed: game.revealed,
      revealedCards,
      teams: game.teams,
      currentTeamIndex: game.currentTeamIndex,
      currentClue: game.currentClue,
      guessesRemaining: game.guessesRemaining,
      guessesThisTurn: game.guessesThisTurn,
      players: game.players,
      scores: game.scores,
      eliminatedTeams: game.eliminatedTeams,
      winner: game.winner,
    };
    
    return NextResponse.json(clientState);
  } catch (error) {
    console.error('Error getting game:', error);
    return NextResponse.json(
      { error: 'Failed to get game' },
      { status: 500 }
    );
  }
}

