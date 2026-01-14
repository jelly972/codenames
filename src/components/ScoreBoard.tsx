'use client';

import {
  ClientGameState,
  SpymasterGameState,
  TeamId,
  TEAM_COLORS,
  TEAM_ORDER,
} from '@/types/game';

interface ScoreBoardProps {
  gameState: ClientGameState | SpymasterGameState;
  currentTeam: TeamId;
}

export function ScoreBoard({ gameState, currentTeam }: ScoreBoardProps) {
  const activeTeams = TEAM_ORDER.slice(0, gameState.settings.teamCount);

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 sm:p-4">
      <h2 className="text-xs sm:text-sm font-medium text-[#9ca3af] mb-2 sm:mb-4 uppercase tracking-wide">
        Scores
      </h2>

      {/* Mobile: horizontal layout, Desktop: vertical */}
      <div className="flex flex-row lg:flex-col gap-2 sm:gap-3 overflow-x-auto lg:overflow-visible">
        {activeTeams.map((team) => {
          const score = gameState.scores[team];
          const isEliminated = gameState.eliminatedTeams.includes(team);
          const isCurrent = team === currentTeam;
          const progress = score.total > 0 ? (score.found / score.total) * 100 : 0;

          return (
            <div
              key={team}
              className={`flex-1 lg:flex-none min-w-[80px] p-2 sm:p-3 rounded-lg transition-all ${
                isEliminated ? 'opacity-50' : ''
              }`}
              style={{
                backgroundColor: TEAM_COLORS[team] + '10',
                borderLeft: isCurrent ? `4px solid ${TEAM_COLORS[team]}` : '4px solid transparent',
              }}
            >
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <span
                  className="font-semibold capitalize flex items-center gap-1 sm:gap-2 text-xs sm:text-base"
                  style={{ color: TEAM_COLORS[team] }}
                >
                  {team}
                  {isCurrent && !isEliminated && (
                    <span className="text-[10px] sm:text-xs animate-pulse">●</span>
                  )}
                  {isEliminated && (
                    <span className="text-[10px] sm:text-xs">💀</span>
                  )}
                </span>
                <span className="font-mono text-xs sm:text-sm">
                  {score.found}/{score.total}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 sm:h-2 bg-[var(--background)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: TEAM_COLORS[team],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Players list - hidden on mobile, shown on desktop */}
      <div className="hidden lg:block mt-6">
        <h3 className="text-xs font-medium text-[#6b7280] mb-2 uppercase tracking-wide">
          Players
        </h3>
        <div className="space-y-2 text-sm">
          {activeTeams.map((team) => {
            const teamPlayers = gameState.players.filter((p) => p.team === team);
            if (teamPlayers.length === 0) return null;

            return (
              <div key={team}>
                <div
                  className="text-xs font-medium capitalize mb-1"
                  style={{ color: TEAM_COLORS[team] }}
                >
                  {team}
                </div>
                <div className="flex flex-wrap gap-1">
                  {teamPlayers.map((player) => (
                    <span
                      key={player.id}
                      className="px-2 py-0.5 rounded text-xs"
                      style={{
                        backgroundColor: TEAM_COLORS[team] + '20',
                        color: TEAM_COLORS[team],
                      }}
                    >
                      {player.role === 'spymaster' ? '🕵️ ' : ''}
                      {player.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

