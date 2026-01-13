'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { BoardSize, GameSettings, getDefaultSettings } from '@/types/game';

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Game settings for create mode
  const [boardSize, setBoardSize] = useState<BoardSize>('standard');
  const [teamCount, setTeamCount] = useState<2 | 3 | 4>(2);

  const handleCreateGame = async () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const settings = getDefaultSettings(boardSize, teamCount);
      
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error('Failed to create game');
      }

      const data = await response.json();
      
      // Store player info in session storage
      const playerId = uuidv4();
      sessionStorage.setItem('playerId', playerId);
      sessionStorage.setItem('playerName', nickname.trim());
      sessionStorage.setItem('isHost', 'true');

      // Navigate to the game room
      router.push(`/room/${data.code}`);
    } catch (err) {
      setError('Failed to create game. Please try again.');
      setIsLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Verify game exists
      const response = await fetch(`/api/games/${roomCode.toUpperCase()}`);
      
      if (!response.ok) {
        throw new Error('Game not found');
      }

      // Store player info in session storage
      const playerId = uuidv4();
      sessionStorage.setItem('playerId', playerId);
      sessionStorage.setItem('playerName', nickname.trim());
      sessionStorage.setItem('isHost', 'false');

      // Navigate to the game room
      router.push(`/room/${roomCode.toUpperCase()}`);
    } catch (err) {
      setError('Game not found. Please check the room code.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--team-red)] opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--team-blue)] opacity-5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight mb-3">
            <span className="text-[var(--team-red)]">CODE</span>
            <span className="text-[var(--team-blue)]">NAMES</span>
          </h1>
          <p className="text-[#6b7280] text-lg">The word guessing party game</p>
        </div>

        {/* Main Menu */}
        {mode === 'menu' && (
          <div className="space-y-4 animate-fade-in">
            <button
              onClick={() => setMode('create')}
              className="btn btn-primary w-full text-lg py-4"
            >
              Create Game
            </button>
            <button
              onClick={() => setMode('join')}
              className="btn btn-secondary w-full text-lg py-4"
            >
              Join Game
            </button>
          </div>
        )}

        {/* Create Game Form */}
        {mode === 'create' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#9ca3af]">
                Your Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                className="input w-full"
                maxLength={20}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[#9ca3af]">
                Board Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'standard', 'large'] as BoardSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setBoardSize(size)}
                    className={`py-3 px-4 rounded-lg font-medium transition-all ${
                      boardSize === size
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <div className="text-sm">{size.charAt(0).toUpperCase() + size.slice(1)}</div>
                    <div className="text-xs opacity-60">
                      {size === 'small' ? '4×4' : size === 'standard' ? '5×5' : '6×6'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[#9ca3af]">
                Number of Teams
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([2, 3, 4] as const).map((count) => (
                  <button
                    key={count}
                    onClick={() => setTeamCount(count)}
                    className={`py-3 px-4 rounded-lg font-medium transition-all ${
                      teamCount === count
                        ? 'bg-[var(--accent)] text-white'
                        : 'bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--accent)]'
                    }`}
                  >
                    {count} Teams
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-[var(--team-red)] text-sm">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setMode('menu')}
                className="btn btn-secondary flex-1"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                onClick={handleCreateGame}
                className="btn btn-primary flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </div>
        )}

        {/* Join Game Form */}
        {mode === 'join' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#9ca3af]">
                Your Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                className="input w-full"
                maxLength={20}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[#9ca3af]">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                className="input w-full text-center text-2xl tracking-widest font-mono"
                maxLength={6}
              />
            </div>

            {error && (
              <p className="text-[var(--team-red)] text-sm">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setMode('menu')}
                className="btn btn-secondary flex-1"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                onClick={handleJoinGame}
                className="btn btn-primary flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[#4b5563] text-sm mt-12">
          Based on the board game by Vlaada Chvátil
        </p>
      </div>
    </main>
  );
}
