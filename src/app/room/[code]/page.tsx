'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGame } from '@/hooks/useGame';
import { Lobby } from '@/components/Lobby';
import { GameBoard } from '@/components/GameBoard';
import { GameOver } from '@/components/GameOver';
import { SpectatorView } from '@/components/SpectatorView';

type PlayerInfo = { playerId: string; playerName: string };

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string)?.toUpperCase();
  
  // Start with undefined to indicate "not yet loaded" (for SSR hydration safety)
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null | undefined>(undefined);

  // Read from sessionStorage on mount - this is the correct pattern for browser APIs
  // that aren't available during SSR. We need the effect to safely hydrate.
  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem('playerId');
    const storedPlayerName = sessionStorage.getItem('playerName');

    if (!storedPlayerId || !storedPlayerName) {
      router.push('/');
      return;
    }
    // Reading from sessionStorage on mount requires setting state in an effect for SSR hydration safety.
    // This is the recommended pattern for browser-only APIs.
    // eslint-disable-next-line
    setPlayerInfo({ playerId: storedPlayerId, playerName: storedPlayerName });
  }, [router]);

  const playerId = playerInfo?.playerId ?? '';
  const playerName = playerInfo?.playerName ?? '';
  const isReady = playerInfo !== undefined && playerInfo !== null;

  const {
    gameState,
    isConnected,
    isReconnecting,
    error,
    currentPlayer,
    isSpymaster,
    isSpectator,
    isMyTurn,
    selectTeam,
    updateSettings,
    startGame,
    giveClue,
    guessWord,
    endTurn,
    leaveRoom,
  } = useGame({
    gameCode: code,
    playerId,
    playerName,
  });

  const handleLeave = () => {
    leaveRoom();
    router.push('/');
  };

  // Show loading while initializing
  if (!isReady) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[#6b7280]">Loading...</p>
        </div>
      </main>
    );
  }

  // Show connecting/reconnecting state
  if (!isConnected || !gameState) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[#6b7280]">
            {isReconnecting ? 'Reconnecting...' : `Connecting to room ${code}...`}
          </p>
          {error && (
            <div className="mt-4">
              <p className="text-[var(--team-red)]">{error}</p>
              <div className="flex gap-3 justify-center mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-secondary"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="btn btn-primary"
                >
                  Go to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Render based on game status
  return (
    <>
      {/* Error toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-[var(--team-red)] text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in">
          {error}
        </div>
      )}

      {gameState.status === 'lobby' && (
        <Lobby
          gameState={gameState}
          currentPlayer={currentPlayer}
          playerId={playerId}
          onSelectTeam={selectTeam}
          onUpdateSettings={updateSettings}
          onStartGame={startGame}
          onLeave={handleLeave}
        />
      )}

      {gameState.status === 'playing' && !isSpectator && (
        <GameBoard
          gameState={gameState}
          currentPlayer={currentPlayer}
          playerId={playerId}
          isSpymaster={isSpymaster}
          isMyTurn={isMyTurn}
          onGiveClue={giveClue}
          onGuessWord={guessWord}
          onEndTurn={endTurn}
          onLeave={handleLeave}
        />
      )}

      {gameState.status === 'playing' && isSpectator && (
        <SpectatorView
          gameState={gameState}
          currentPlayer={currentPlayer}
          onLeave={handleLeave}
        />
      )}

      {gameState.status === 'finished' && (
        <GameOver
          gameState={gameState}
          onLeave={handleLeave}
        />
      )}
    </>
  );
}

