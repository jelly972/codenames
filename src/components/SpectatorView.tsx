'use client';

import {
  ClientGameState,
  SpymasterGameState,
  Player,
  TEAM_COLORS,
  BOARD_DIMENSIONS,
} from '@/types/game';
import { WordCard } from './WordCard';
import { ScoreBoard } from './ScoreBoard';

interface SpectatorViewProps {
  gameState: ClientGameState | SpymasterGameState;
  currentPlayer: Player | null;
  onLeave: () => void;
}

export function SpectatorView({
  gameState,
  currentPlayer,
  onLeave,
}: SpectatorViewProps) {
  const gridSize = BOARD_DIMENSIONS[gameState.settings.boardSize];
  const currentTeam = gameState.teams[gameState.currentTeamIndex];

  return (
    <main className="min-h-screen min-h-dvh p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-2 sm:mb-4">
          <button onClick={onLeave} className="btn btn-secondary text-xs sm:text-sm py-1.5 px-2 sm:py-2 sm:px-4">
            ← Leave
          </button>

          <div className="text-center">
            <h1 className="text-lg sm:text-xl font-bold">
              <span className="text-[var(--team-red)]">CODE</span>
              <span className="text-[var(--team-blue)]">NAMES</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-[#6b7280]">Room: {gameState.code}</p>
          </div>

          <div className="text-right text-xs sm:text-sm">
            <p className="text-[#6b7280] truncate max-w-[60px] sm:max-w-none">{currentPlayer?.name}</p>
            <p className="text-[#9ca3af] flex items-center gap-1 justify-end">
              👁 <span className="hidden sm:inline">Spectating</span>
            </p>
          </div>
        </header>

        {/* Spectator Banner */}
        <div className="mb-2 sm:mb-4 p-2 sm:p-3 rounded-lg bg-[#1f2937] border border-[#374151] text-center text-xs sm:text-base">
          <span className="text-[#9ca3af]">
            👁 <span className="hidden sm:inline">You are watching this game as a </span>Spectator
          </span>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4">
          {/* Scoreboard - below board on mobile, left side on desktop */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <ScoreBoard
              gameState={gameState}
              currentTeam={currentTeam}
            />
          </div>

          {/* Game Board - first on mobile, right side on desktop */}
          <div className="lg:col-span-3 order-1 lg:order-2 min-w-0">
            {/* Turn Indicator */}
            <div
              className="mb-2 sm:mb-4 p-2 sm:p-3 rounded-lg text-center font-medium text-xs sm:text-base"
              style={{
                backgroundColor: TEAM_COLORS[currentTeam] + '20',
                borderLeft: `4px solid ${TEAM_COLORS[currentTeam]}`,
              }}
            >
              <span className="capitalize" style={{ color: TEAM_COLORS[currentTeam] }}>
                {currentTeam}&apos;s Turn
              </span>
              {gameState.currentClue && (
                <span className="ml-2 sm:ml-4 text-white">
                  <strong>{gameState.currentClue.word}</strong> ({gameState.currentClue.count})
                  {gameState.guessesRemaining < Infinity && (
                    <span className="ml-1 sm:ml-2 text-[#9ca3af]">
                      ({gameState.guessesRemaining} left)
                    </span>
                  )}
                </span>
              )}
              {!gameState.currentClue && (
                <span className="ml-2 sm:ml-4 text-[#9ca3af]">
                  Waiting...
                </span>
              )}
            </div>

            {/* Word Grid - View Only */}
            <div
              className="grid gap-0.5 sm:gap-2 lg:gap-3"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              }}
            >
              {gameState.words.map((word, index) => {
                const isRevealed = gameState.revealed[index];
                const cardType = isRevealed ? gameState.revealedCards[index] : null;

                return (
                  <WordCard
                    key={index}
                    word={word}
                    index={index}
                    isRevealed={isRevealed}
                    cardType={cardType}
                    spymasterCardType={null}
                    canClick={false}
                    onClick={() => {}}
                  />
                );
              })}
            </div>

            {/* Spectator Info */}
            <div className="mt-3 sm:mt-6 text-center text-[#6b7280] text-xs sm:text-sm">
              <p>Spectators can only watch. Join a team to play!</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

