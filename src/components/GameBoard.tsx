'use client';

import { useState } from 'react';
import {
  ClientGameState,
  SpymasterGameState,
  Player,
  TeamId,
  CardType,
  TEAM_COLORS,
  BOARD_DIMENSIONS,
} from '@/types/game';
import { WordCard } from './WordCard';
import { ClueInput } from './ClueInput';
import { ScoreBoard } from './ScoreBoard';

interface GameBoardProps {
  gameState: ClientGameState | SpymasterGameState;
  currentPlayer: Player | null;
  playerId: string;
  isSpymaster: boolean;
  isMyTurn: boolean;
  onGiveClue: (word: string, count: number) => void;
  onGuessWord: (wordIndex: number) => void;
  onEndTurn: () => void;
  onLeave: () => void;
}

export function GameBoard({
  gameState,
  currentPlayer,
  playerId,
  isSpymaster,
  isMyTurn,
  onGiveClue,
  onGuessWord,
  onEndTurn,
  onLeave,
}: GameBoardProps) {
  const gridSize = BOARD_DIMENSIONS[gameState.settings.boardSize];
  const currentTeam = gameState.teams[gameState.currentTeamIndex];
  const isSpymasterState = 'keyCard' in gameState;
  const keyCard = isSpymasterState ? (gameState as SpymasterGameState).keyCard : null;

  // Can guess if: it's my turn, I'm an operative, and there's a clue given
  const canGuess = isMyTurn && !isSpymaster && gameState.currentClue !== null;
  
  // Can give clue if: it's my turn, I'm the spymaster, and no clue given yet
  const canGiveClue = isMyTurn && isSpymaster && gameState.currentClue === null;

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
            <p className="capitalize" style={{ color: TEAM_COLORS[currentPlayer?.team || 'red'] }}>
              {currentPlayer?.team} {currentPlayer?.role}
            </p>
          </div>
        </header>

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
            </div>

            {/* Clue Input for Spymaster */}
            {canGiveClue && (
              <div className="mb-4">
                <ClueInput onSubmit={onGiveClue} />
              </div>
            )}

            {/* Waiting for clue message */}
            {isMyTurn && !isSpymaster && !gameState.currentClue && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-center">
                <p className="text-[#9ca3af]">Waiting for your spymaster to give a clue...</p>
              </div>
            )}

            {/* Word Grid */}
            <div
              className="grid gap-2 lg:gap-3"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              }}
            >
              {gameState.words.map((word, index) => {
                const isRevealed = gameState.revealed[index];
                const cardType = isRevealed ? gameState.revealedCards[index] : null;
                const spymasterCardType = keyCard ? keyCard[index] : null;

                return (
                  <WordCard
                    key={index}
                    word={word}
                    index={index}
                    isRevealed={isRevealed}
                    cardType={cardType}
                    spymasterCardType={isSpymaster ? spymasterCardType : null}
                    canClick={canGuess && !isRevealed}
                    onClick={() => onGuessWord(index)}
                  />
                );
              })}
            </div>

            {/* End Turn Button - only show after at least one guess */}
            {canGuess && gameState.currentClue && gameState.guessesThisTurn > 0 && (
              <div className="mt-4 text-center">
                <button onClick={onEndTurn} className="btn btn-secondary">
                  End Turn
                </button>
              </div>
            )}

            {/* Not your turn message */}
            {!isMyTurn && (
              <div className="mt-4 text-center text-[#6b7280]">
                Waiting for{' '}
                <span className="capitalize" style={{ color: TEAM_COLORS[currentTeam] }}>
                  {currentTeam} team
                </span>{' '}
                to play...
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

