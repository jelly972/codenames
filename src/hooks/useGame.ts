'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { connectSocket, disconnectSocket } from '@/lib/socket-client';
import {
  ClientGameState,
  SpymasterGameState,
  GameSettings,
  TeamId,
  Player,
} from '@/types/game';

interface UseGameOptions {
  gameCode: string;
  playerId: string;
  playerName: string;
}

interface UseGameReturn {
  gameState: ClientGameState | SpymasterGameState | null;
  isConnected: boolean;
  isReconnecting: boolean;
  error: string | null;
  currentPlayer: Player | null;
  isSpymaster: boolean;
  isSpectator: boolean;
  isMyTurn: boolean;
  
  // Actions
  selectTeam: (team: TeamId | null, role: 'spymaster' | 'operative' | 'spectator' | null) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  startGame: () => void;
  giveClue: (word: string, count: number) => void;
  guessWord: (wordIndex: number) => void;
  endTurn: () => void;
  leaveRoom: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;

export function useGame({ gameCode, playerId, playerName }: UseGameOptions): UseGameReturn {
  const [gameState, setGameState] = useState<ClientGameState | SpymasterGameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const hasJoined = useRef(false);
  const reconnectAttempts = useRef(0);

  // Connect to socket and join room
  useEffect(() => {
    if (!gameCode || !playerId || !playerName) return;
    if (hasJoined.current) return;

    const socket = connectSocket();
    socketRef.current = socket;

    const joinRoom = () => {
      socket.emit('join_room', {
        gameCode: gameCode.toUpperCase(),
        playerId,
        playerName,
      });
    };

    socket.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      setError(null);
      reconnectAttempts.current = 0;
      
      // Join the room
      joinRoom();
      hasJoined.current = true;
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      
      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'transport close') {
        setIsReconnecting(true);
      }
    });

    socket.on('connect_error', () => {
      reconnectAttempts.current++;
      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        setError('Connection failed. Please refresh the page.');
        setIsReconnecting(false);
      } else {
        setIsReconnecting(true);
      }
    });

    socket.on('game_state', (state: ClientGameState | SpymasterGameState) => {
      setGameState(state);
      setError(null);
    });

    socket.on('player_joined', ({ player }: { player: Player }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        const exists = prev.players.some((p) => p.id === player.id);
        if (exists) return prev;
        return { ...prev, players: [...prev.players, player] };
      });
    });

    socket.on('player_left', ({ playerId: leftPlayerId }: { playerId: string }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.filter((p) => p.id !== leftPlayerId),
        };
      });
    });

    socket.on('settings_updated', ({ settings }: { settings: GameSettings }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return { ...prev, settings };
      });
    });

    socket.on('error', ({ message }: { message: string }) => {
      setError(message);
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_room');
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('game_state');
        socketRef.current.off('player_joined');
        socketRef.current.off('player_left');
        socketRef.current.off('settings_updated');
        socketRef.current.off('error');
      }
      hasJoined.current = false;
      reconnectAttempts.current = 0;
    };
  }, [gameCode, playerId, playerName]);

  // Derived state
  const currentPlayer = gameState?.players.find((p) => p.id === playerId) || null;
  const isSpymaster = currentPlayer?.role === 'spymaster';
  const isSpectator = currentPlayer?.role === 'spectator';
  const currentTeam = gameState ? gameState.teams[gameState.currentTeamIndex] : null;
  const isMyTurn = currentPlayer?.team === currentTeam && !isSpectator;

  // Actions
  const selectTeam = useCallback((team: TeamId | null, role: 'spymaster' | 'operative' | 'spectator' | null) => {
    socketRef.current?.emit('select_team', { team, role });
  }, []);

  const updateSettings = useCallback((settings: Partial<GameSettings>) => {
    socketRef.current?.emit('update_settings', { settings });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit('start_game');
  }, []);

  const giveClue = useCallback((word: string, count: number) => {
    socketRef.current?.emit('give_clue', { word, count });
  }, []);

  const guessWord = useCallback((wordIndex: number) => {
    socketRef.current?.emit('guess_word', { wordIndex });
  }, []);

  const endTurn = useCallback(() => {
    socketRef.current?.emit('end_turn');
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('leave_room');
    disconnectSocket();
  }, []);

  return {
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
  };
}

