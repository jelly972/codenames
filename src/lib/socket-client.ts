'use client';

import { io, Socket } from 'socket.io-client';
import { ClientGameState, SpymasterGameState, GameSettings, TeamId, Player } from '@/types/game';

// Socket instance (singleton)
let socket: Socket | null = null;

/**
 * Get or create socket connection
 */
export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || '';
    socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socket;
}

/**
 * Connect to the socket server
 */
export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

/**
 * Disconnect from the socket server
 */
export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

// Event types for type safety
export interface SocketEvents {
  // Client -> Server
  join_room: (data: { gameCode: string; playerId: string; playerName: string }) => void;
  leave_room: () => void;
  update_settings: (data: { settings: Partial<GameSettings> }) => void;
  select_team: (data: { team: TeamId | null; role: 'spymaster' | 'operative' | 'spectator' | null }) => void;
  start_game: () => void;
  give_clue: (data: { word: string; count: number }) => void;
  guess_word: (data: { wordIndex: number }) => void;
  end_turn: () => void;

  // Server -> Client
  game_state: (state: ClientGameState | SpymasterGameState) => void;
  player_joined: (data: { player: Player }) => void;
  player_left: (data: { playerId: string; playerName: string }) => void;
  settings_updated: (data: { settings: GameSettings }) => void;
  error: (data: { message: string }) => void;
}

