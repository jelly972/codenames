'use client';

import {
  ClientGameState,
  SpymasterGameState,
  TEAM_COLORS,
  TEAM_ORDER,
} from '@/types/game';

interface GameOverProps {
  gameState: ClientGameState | SpymasterGameState;
  onLeave: () => void;
}

export function GameOver({ gameState, onLeave }: GameOverProps) {
  const winner = gameState.winner;
  const activeTeams = TEAM_ORDER.slice(0, gameState.settings.teamCount);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        {/* Winner announcement */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Game Over!</h1>
          {winner && (
            <div
              className="text-6xl font-bold uppercase mb-4 animate-pulse-glow"
              style={{ color: TEAM_COLORS[winner] }}
            >
              {winner} Wins!
            </div>
          )}
        </div>

        {/* Final Scores */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Final Scores</h2>
          <div className="space-y-3">
            {activeTeams.map((team) => {
              const score = gameState.scores[team];
              const isWinner = team === winner;
              const isEliminated = gameState.eliminatedTeams.includes(team);

              return (
                <div
                  key={team}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isWinner ? 'ring-2 ring-current' : ''
                  }`}
                  style={{
                    backgroundColor: TEAM_COLORS[team] + '15',
                    color: TEAM_COLORS[team],
                    opacity: isEliminated ? 0.5 : 1,
                  }}
                >
                  <span
                    className="font-semibold capitalize flex items-center gap-2"
                    style={{ color: TEAM_COLORS[team] }}
                  >
                    {team}
                    {isWinner && <span>🏆</span>}
                    {isEliminated && <span>💀</span>}
                  </span>
                  <span className="font-mono">
                    {score.found} / {score.total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revealed Board Summary */}
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Final Board</h2>
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${Math.sqrt(gameState.words.length)}, 1fr)`,
            }}
          >
            {gameState.words.map((word, index) => {
              const cardType = gameState.revealedCards[index];
              const wasRevealed = gameState.revealed[index];

              return (
                <div
                  key={index}
                  className={`p-1 rounded text-xs truncate ${
                    wasRevealed ? 'opacity-60 line-through' : ''
                  }`}
                  style={{
                    backgroundColor: cardType
                      ? TEAM_COLORS[cardType as keyof typeof TEAM_COLORS] || 'var(--team-neutral)'
                      : 'var(--card-border)',
                    color: cardType === 'neutral' ? '#000' : '#fff',
                  }}
                  title={word}
                >
                  {word}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button onClick={onLeave} className="btn btn-primary">
            Return to Home
          </button>
        </div>
      </div>
    </main>
  );
}

