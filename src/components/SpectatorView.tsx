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
    <main className="min-h-screen p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <button onClick={onLeave} className="btn btn-secondary text-sm">
            ← Leave
          </button>

          <div className="text-center">
            <h1 className="text-xl font-bold">
              <span className="text-[var(--team-red)]">CODE</span>
              <span className="text-[var(--team-blue)]">NAMES</span>
            </h1>
            <p className="text-xs text-[#6b7280]">Room: {gameState.code}</p>
          </div>

          <div className="text-right text-sm">
            <p className="text-[#6b7280]">{currentPlayer?.name}</p>
            <p className="text-[#9ca3af] flex items-center gap-1 justify-end">
              👁 Spectating
            </p>
          </div>
        </header>

        {/* Spectator Banner */}
        <div className="mb-4 p-3 rounded-lg bg-[#1f2937] border border-[#374151] text-center">
          <span className="text-[#9ca3af]">
            👁 You are watching this game as a spectator
          </span>
        </div>

        <div className="grid lg:grid-cols-4 gap-4">
          {/* Scoreboard */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <ScoreBoard
              gameState={gameState}
              currentTeam={currentTeam}
            />
          </div>

          {/* Game Board */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {/* Turn Indicator */}
            <div
              className="mb-4 p-3 rounded-lg text-center font-medium"
              style={{
                backgroundColor: TEAM_COLORS[currentTeam] + '20',
                borderLeft: `4px solid ${TEAM_COLORS[currentTeam]}`,
              }}
            >
              <span className="capitalize" style={{ color: TEAM_COLORS[currentTeam] }}>
                {currentTeam} Team&apos;s Turn
              </span>
              {gameState.currentClue && (
                <span className="ml-4 text-white">
                  Clue: <strong>{gameState.currentClue.word}</strong> ({gameState.currentClue.count})
                  {gameState.guessesRemaining < Infinity && (
                    <span className="ml-2 text-[#9ca3af]">
                      ({gameState.guessesRemaining} guesses left)
                    </span>
                  )}
                </span>
              )}
              {!gameState.currentClue && (
                <span className="ml-4 text-[#9ca3af]">
                  Waiting for spymaster...
                </span>
              )}
            </div>

            {/* Word Grid - View Only */}
            <div
              className="grid gap-2 lg:gap-3"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
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
            <div className="mt-6 text-center text-[#6b7280] text-sm">
              <p>Spectators can only watch the game. Join a team to play!</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

