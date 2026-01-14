'use client';

import { useState } from 'react';
import {
  ClientGameState,
  SpymasterGameState,
  Player,
  TeamId,
  GameSettings,
  BoardSize,
  TEAM_COLORS,
  TEAM_ORDER,
  BOARD_DIMENSIONS,
  getDefaultSettings,
} from '@/types/game';

interface LobbyProps {
  gameState: ClientGameState | SpymasterGameState;
  currentPlayer: Player | null;
  playerId: string;
  onSelectTeam: (team: TeamId | null, role: 'spymaster' | 'operative' | 'spectator' | null) => void;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onStartGame: () => void;
  onLeave: () => void;
}

export function Lobby({
  gameState,
  currentPlayer,
  playerId,
  onSelectTeam,
  onUpdateSettings,
  onStartGame,
  onLeave,
}: LobbyProps) {
  const [copied, setCopied] = useState(false);
  const isHost = currentPlayer?.isHost;
  const activeTeams = TEAM_ORDER.slice(0, gameState.settings.teamCount);

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(gameState.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBoardSizeChange = (size: BoardSize) => {
    const newSettings = getDefaultSettings(size, gameState.settings.teamCount);
    onUpdateSettings(newSettings);
  };

  const handleTeamCountChange = (count: 2 | 3 | 4) => {
    const newSettings = getDefaultSettings(gameState.settings.boardSize, count);
    onUpdateSettings(newSettings);
  };

  // Check if all teams have spymasters
  const allTeamsReady = activeTeams.every((team) =>
    gameState.players.some((p) => p.team === team && p.role === 'spymaster')
  );

  // Check if all teams have at least one operative
  const allTeamsHaveOperatives = activeTeams.every((team) =>
    gameState.players.some((p) => p.team === team && p.role === 'operative')
  );

  const canStart = isHost && allTeamsReady && allTeamsHaveOperatives;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <button onClick={onLeave} className="btn btn-secondary">
            ← Leave
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              <span className="text-[var(--team-red)]">CODE</span>
              <span className="text-[var(--team-blue)]">NAMES</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#6b7280] text-sm">Room:</span>
            <button
              onClick={copyRoomCode}
              className="font-mono text-xl font-bold bg-[var(--card-bg)] border border-[var(--card-border)] px-4 py-2 rounded-lg hover:border-[var(--accent)] transition-colors"
            >
              {gameState.code}
            </button>
            {copied && <span className="text-[var(--team-green)] text-sm">Copied!</span>}
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Settings Panel (Host only) */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Game Settings</h2>
              
              {isHost ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#9ca3af] mb-2">Board Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['small', 'standard', 'large'] as BoardSize[]).map((size) => (
                        <button
                          key={size}
                          onClick={() => handleBoardSizeChange(size)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            gameState.settings.boardSize === size
                              ? 'bg-[var(--accent)] text-white'
                              : 'bg-[var(--background)] border border-[var(--card-border)] hover:border-[var(--accent)]'
                          }`}
                        >
                          {size === 'small' ? '4×4' : size === 'standard' ? '5×5' : '6×6'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#9ca3af] mb-2">Teams</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([2, 3, 4] as const).map((count) => (
                        <button
                          key={count}
                          onClick={() => handleTeamCountChange(count)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            gameState.settings.teamCount === count
                              ? 'bg-[var(--accent)] text-white'
                              : 'bg-[var(--background)] border border-[var(--card-border)] hover:border-[var(--accent)]'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--card-border)]">
                    <div className="text-sm text-[#6b7280] space-y-1">
                      <p>Cards: {BOARD_DIMENSIONS[gameState.settings.boardSize] ** 2}</p>
                      <p>Per team: {gameState.settings.wordsPerTeam} (+1 for first team)</p>
                      <p>Assassins: {gameState.settings.assassinCount}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[#6b7280] space-y-2">
                  <p>Board: {gameState.settings.boardSize} ({BOARD_DIMENSIONS[gameState.settings.boardSize]}×{BOARD_DIMENSIONS[gameState.settings.boardSize]})</p>
                  <p>Teams: {gameState.settings.teamCount}</p>
                  <p>Cards per team: {gameState.settings.wordsPerTeam}</p>
                  <p className="text-[#4b5563] italic mt-4">Only the host can change settings</p>
                </div>
              )}
            </div>

            {/* Start Game Button */}
            {isHost && (
              <button
                onClick={onStartGame}
                disabled={!canStart}
                className="btn btn-primary w-full mt-4 py-4 text-lg"
              >
                {canStart ? 'Start Game' : 'Waiting for players...'}
              </button>
            )}

            {!isHost && (
              <p className="text-center text-[#6b7280] mt-4 text-sm">
                Waiting for host to start the game...
              </p>
            )}
          </div>

          {/* Team Selection */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTeams.map((team) => (
                <TeamPanel
                  key={team}
                  team={team}
                  players={gameState.players.filter((p) => p.team === team)}
                  currentPlayer={currentPlayer}
                  onSelectRole={(role) => onSelectTeam(team, role)}
                  onLeaveTeam={() => onSelectTeam(null, null)}
                />
              ))}
            </div>

            {/* Unassigned Players */}
            <div className="mt-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
              <h3 className="text-sm font-medium text-[#9ca3af] mb-3">Unassigned Players</h3>
              <div className="flex flex-wrap gap-2">
                {gameState.players
                  .filter((p) => !p.team && p.role !== 'spectator')
                  .map((player) => (
                    <span
                      key={player.id}
                      className={`px-3 py-1 rounded-full text-sm ${
                        player.id === playerId
                          ? 'bg-[var(--accent)] text-white'
                          : 'bg-[var(--background)] border border-[var(--card-border)]'
                      }`}
                    >
                      {player.name}
                      {player.isHost && ' 👑'}
                    </span>
                  ))}
                {gameState.players.filter((p) => !p.team && p.role !== 'spectator').length === 0 && (
                  <span className="text-[#4b5563] text-sm">All players have joined teams or are spectating</span>
                )}
              </div>
            </div>

            {/* Spectators */}
            <div className="mt-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[#9ca3af]">
                  Spectators ({gameState.players.filter((p) => p.role === 'spectator').length})
                </h3>
                {currentPlayer?.role !== 'spectator' && (
                  <button
                    onClick={() => onSelectTeam(null, 'spectator')}
                    className="text-xs text-[#6b7280] hover:text-white transition-colors px-2 py-1 rounded border border-[var(--card-border)] hover:border-[var(--accent)]"
                  >
                    👁 Watch as Spectator
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {gameState.players
                  .filter((p) => p.role === 'spectator')
                  .map((player) => (
                    <span
                      key={player.id}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                        player.id === playerId
                          ? 'bg-[#6b7280] text-white'
                          : 'bg-[var(--background)] border border-[var(--card-border)] text-[#9ca3af]'
                      }`}
                    >
                      👁 {player.name}
                      {player.isHost && ' 👑'}
                    </span>
                  ))}
                {gameState.players.filter((p) => p.role === 'spectator').length === 0 && (
                  <span className="text-[#4b5563] text-sm">No spectators</span>
                )}
              </div>
              {currentPlayer?.role === 'spectator' && (
                <button
                  onClick={() => onSelectTeam(null, null)}
                  className="mt-3 text-sm text-[#6b7280] hover:text-white transition-colors"
                >
                  Leave spectator mode
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

interface TeamPanelProps {
  team: TeamId;
  players: Player[];
  currentPlayer: Player | null;
  onSelectRole: (role: 'spymaster' | 'operative') => void;
  onLeaveTeam: () => void;
}

function TeamPanel({ team, players, currentPlayer, onSelectRole, onLeaveTeam }: TeamPanelProps) {
  const spymaster = players.find((p) => p.role === 'spymaster');
  const operatives = players.filter((p) => p.role === 'operative');
  const isOnThisTeam = currentPlayer?.team === team;
  const hasSpymaster = !!spymaster;

  const teamColor = TEAM_COLORS[team];

  return (
    <div
      className="bg-[var(--card-bg)] border-2 rounded-xl p-4 transition-all"
      style={{ borderColor: teamColor + '40' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg capitalize" style={{ color: teamColor }}>
          {team} Team
        </h3>
        {isOnThisTeam && (
          <button
            onClick={onLeaveTeam}
            className="text-sm text-[#6b7280] hover:text-white transition-colors"
          >
            Leave
          </button>
        )}
      </div>

      {/* Spymaster slot */}
      <div className="mb-4">
        <p className="text-xs text-[#6b7280] uppercase tracking-wide mb-2">Spymaster</p>
        {spymaster ? (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ backgroundColor: teamColor + '20' }}
          >
            <span className="text-lg">🕵️</span>
            <span className="font-medium" style={{ color: teamColor }}>
              {spymaster.name}
              {spymaster.isHost && ' 👑'}
            </span>
          </div>
        ) : (
          <button
            onClick={() => onSelectRole('spymaster')}
            disabled={isOnThisTeam && currentPlayer?.role === 'spymaster'}
            className="w-full py-2 px-3 rounded-lg border-2 border-dashed text-sm transition-all hover:border-solid"
            style={{ borderColor: teamColor + '60', color: teamColor }}
          >
            + Join as Spymaster
          </button>
        )}
      </div>

      {/* Operatives */}
      <div>
        <p className="text-xs text-[#6b7280] uppercase tracking-wide mb-2">
          Operatives ({operatives.length})
        </p>
        <div className="space-y-2">
          {operatives.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ backgroundColor: teamColor + '10' }}
            >
              <span className="font-medium text-sm">
                {player.name}
                {player.isHost && ' 👑'}
              </span>
            </div>
          ))}
          {!isOnThisTeam && (
            <button
              onClick={() => onSelectRole('operative')}
              className="w-full py-2 px-3 rounded-lg border-2 border-dashed text-sm transition-all hover:border-solid"
              style={{ borderColor: teamColor + '40', color: teamColor + 'cc' }}
            >
              + Join as Operative
            </button>
          )}
          {isOnThisTeam && currentPlayer?.role !== 'operative' && (
            <button
              onClick={() => onSelectRole('operative')}
              className="w-full py-2 px-3 rounded-lg border-2 border-dashed text-sm transition-all hover:border-solid"
              style={{ borderColor: teamColor + '40', color: teamColor + 'cc' }}
            >
              Switch to Operative
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

