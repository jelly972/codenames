'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGame } from '@/hooks/useGame';
import { Lobby } from '@/components/Lobby';
import { GameBoard } from '@/components/GameBoard';
import { GameOver } from '@/components/GameOver';
import { SpectatorView } from '@/components/SpectatorView';

function getPlayerInfoSnapshot(): { playerId: string; playerName: string } | null {
  const storedPlayerId = sessionStorage.getItem('playerId');
  const storedPlayerName = sessionStorage.getItem('playerName');
  if (!storedPlayerId || !storedPlayerName) return null;
  return { playerId: storedPlayerId, playerName: storedPlayerName };
}

function getServerSnapshot(): { playerId: string; playerName: string } | null {
  return null;
}

function subscribe(): () => void {
  // sessionStorage doesn't fire events in the same tab, so no subscription needed
  // This is just for initial hydration
  return () => {};
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string)?.toUpperCase();
  
  // Use useSyncExternalStore to safely read from sessionStorage
  const playerInfo = useSyncExternalStore(subscribe, getPlayerInfoSnapshot, getServerSnapshot);

  // Redirect if no player info
  useEffect(() => {
    if (playerInfo === null) {
      router.push('/');
    }
  }, [playerInfo, router]);

  const playerId = playerInfo?.playerId ?? '';
  const playerName = playerInfo?.playerName ?? '';
  const isReady = playerInfo !== null;

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

