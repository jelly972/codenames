import { Server as SocketIOServer, Socket } from 'socket.io';
import { getGame, saveGame } from './redis';
import {
  Game,
  Player,
  TeamId,
  GameSettings,
  ClientGameState,
  SpymasterGameState,
  CardType,
} from '@/types/game';

// Track which socket is in which room
const socketRooms = new Map<string, string>();
const socketPlayers = new Map<string, { gameCode: string; playerId: string }>();

/**
 * Convert full game state to client-safe state (hides key card)
 */
function toClientState(game: Game): ClientGameState {
  const revealedCards: (CardType | null)[] = game.keyCard.map((type, i) =>
    game.revealed[i] ? type : null
  );

  return {
    code: game.code,
    hostId: game.hostId,
    status: game.status,
    settings: game.settings,
    words: game.words,
    revealed: game.revealed,
    revealedCards,
    teams: game.teams,
    currentTeamIndex: game.currentTeamIndex,
    currentClue: game.currentClue,
    guessesRemaining: game.guessesRemaining,
    guessesThisTurn: game.guessesThisTurn,
    players: game.players,
    scores: game.scores,
    eliminatedTeams: game.eliminatedTeams,
    winner: game.winner,
  };
}

/**
 * Convert full game state to spymaster state (includes key card)
 */
function toSpymasterState(game: Game): SpymasterGameState {
  return {
    ...toClientState(game),
    keyCard: game.keyCard,
  };
}

/**
 * Get appropriate game state for a player
 */
function getStateForPlayer(game: Game, playerId: string): ClientGameState | SpymasterGameState {
  const player = game.players.find((p) => p.id === playerId);
  if (player?.role === 'spymaster') {
    return toSpymasterState(game);
  }
  return toClientState(game);
}

/**
 * Broadcast game state to all players in a room
 */
async function broadcastGameState(io: SocketIOServer, game: Game) {
  const room = game.code;
  const sockets = await io.in(room).fetchSockets();

  for (const socket of sockets) {
    const playerInfo = socketPlayers.get(socket.id);
    if (playerInfo) {
      const state = getStateForPlayer(game, playerInfo.playerId);
      socket.emit('game_state', state);
    }
  }
}

/**
 * Set up all socket event handlers
 */
export function setupSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join a game room
    socket.on('join_room', async (data: { gameCode: string; playerId: string; playerName: string }) => {
      const { gameCode, playerId, playerName } = data;
      const code = gameCode.toUpperCase();

      try {
        const game = await getGame(code);
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Check if player already exists in game
        let player = game.players.find((p) => p.id === playerId);
        
        if (!player) {
          // Add new player
          player = {
            id: playerId,
            name: playerName,
            team: null,
            role: null,
            isHost: game.players.length === 0,
          };
          game.players.push(player);
          await saveGame(game);
        } else {
          // Update player name if reconnecting
          player.name = playerName;
          await saveGame(game);
        }

        // Join the socket room
        socket.join(code);
        socketRooms.set(socket.id, code);
        socketPlayers.set(socket.id, { gameCode: code, playerId });

        // Notify others
        socket.to(code).emit('player_joined', { player });

        // Send current state to joining player
        const state = getStateForPlayer(game, playerId);
        socket.emit('game_state', state);

        console.log(`Player ${playerName} joined room ${code}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    // Leave room
    socket.on('leave_room', async () => {
      const playerInfo = socketPlayers.get(socket.id);
      if (!playerInfo) return;

      const { gameCode, playerId } = playerInfo;
      
      try {
        const game = await getGame(gameCode);
        if (game) {
          // Remove player from game
          const playerIndex = game.players.findIndex((p) => p.id === playerId);
          if (playerIndex !== -1) {
            const player = game.players[playerIndex];
            game.players.splice(playerIndex, 1);

            // If host left, assign new host
            if (player.isHost && game.players.length > 0) {
              game.players[0].isHost = true;
            }

            await saveGame(game);
            socket.to(gameCode).emit('player_left', { playerId, playerName: player.name });
            await broadcastGameState(io, game);
          }
        }
      } catch (error) {
        console.error('Error leaving room:', error);
      }

      socket.leave(gameCode);
      socketRooms.delete(socket.id);
      socketPlayers.delete(socket.id);
    });

    // Update game settings (host only)
    socket.on('update_settings', async (data: { settings: Partial<GameSettings> }) => {
      const playerInfo = socketPlayers.get(socket.id);
      if (!playerInfo) return;

      const { gameCode, playerId } = playerInfo;

      try {
        const game = await getGame(gameCode);
        if (!game) return;

        // Check if player is host
        const player = game.players.find((p) => p.id === playerId);
        if (!player?.isHost) {
          socket.emit('error', { message: 'Only the host can change settings' });
          return;
        }

        // Only allow settings changes in lobby
        if (game.status !== 'lobby') {
          socket.emit('error', { message: 'Cannot change settings after game started' });
          return;
        }

        // Update settings
        game.settings = { ...game.settings, ...data.settings };
        await saveGame(game);

        io.to(gameCode).emit('settings_updated', { settings: game.settings });
      } catch (error) {
        console.error('Error updating settings:', error);
        socket.emit('error', { message: 'Failed to update settings' });
      }
    });

    // Select team and role (including spectator)
    socket.on('select_team', async (data: { team: TeamId | null; role: 'spymaster' | 'operative' | 'spectator' | null }) => {
      const playerInfo = socketPlayers.get(socket.id);
      if (!playerInfo) return;

      const { gameCode, playerId } = playerInfo;

      try {
        const game = await getGame(gameCode);
        if (!game) return;

        const player = game.players.find((p) => p.id === playerId);
        if (!player) return;

        // Spectators don't need a team
        if (data.role === 'spectator') {
          player.team = null;
          player.role = 'spectator';
          await saveGame(game);
          await broadcastGameState(io, game);
          return;
        }

        // Check if spymaster role is already taken for this team
        if (data.role === 'spymaster' && data.team) {
          const existingSpymaster = game.players.find(
            (p) => p.id !== playerId && p.team === data.team && p.role === 'spymaster'
          );
          if (existingSpymaster) {
            socket.emit('error', { message: `Spymaster role is already taken for ${data.team} team` });
            return;
          }
        }

        player.team = data.team;
        player.role = data.role;
        await saveGame(game);

        await broadcastGameState(io, game);
      } catch (error) {
        console.error('Error selecting team:', error);
        socket.emit('error', { message: 'Failed to select team' });
      }
    });

    // Start the game (host only)
    socket.on('start_game', async () => {
      const playerInfo = socketPlayers.get(socket.id);
      if (!playerInfo) return;

      const { gameCode, playerId } = playerInfo;

      try {
        const game = await getGame(gameCode);
        if (!game) return;

        const player = game.players.find((p) => p.id === playerId);
        if (!player?.isHost) {
          socket.emit('error', { message: 'Only the host can start the game' });
          return;
        }

        if (game.status !== 'lobby') {
          socket.emit('error', { message: 'Game already started' });
          return;
        }

        // Validate teams have at least one spymaster each
        const activeTeams = game.teams.slice(0, game.settings.teamCount);
        for (const team of activeTeams) {
          const hasSpymaster = game.players.some((p) => p.team === team && p.role === 'spymaster');
          if (!hasSpymaster) {
            socket.emit('error', { message: `${team} team needs a spymaster` });
            return;
          }
        }

        game.status = 'playing';
        await saveGame(game);

        await broadcastGameState(io, game);
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    // Give a clue (spymaster only)
    socket.on('give_clue', async (data: { word: string; count: number }) => {
      const playerInfo = socketPlayers.get(socket.id);
      if (!playerInfo) return;

      const { gameCode, playerId } = playerInfo;

      try {
        const game = await getGame(gameCode);
        if (!game || game.status !== 'playing') return;

        const player = game.players.find((p) => p.id === playerId);
        if (!player) return;

        // Verify it's this player's turn and they're the spymaster
        const currentTeam = game.teams[game.currentTeamIndex];
        if (player.team !== currentTeam) {
          socket.emit('error', { message: "It's not your team's turn" });
          return;
        }

        if (player.role !== 'spymaster') {
          socket.emit('error', { message: 'Only the spymaster can give clues' });
          return;
        }

        if (game.currentClue) {
          socket.emit('error', { message: 'A clue has already been given this turn' });
          return;
        }

        // Validate clue
        const clueWord = data.word.trim().toUpperCase();
        if (!clueWord || data.count < 0) {
          socket.emit('error', { message: 'Invalid clue' });
          return;
        }

        game.currentClue = { word: clueWord, count: data.count };
        // Allow count + 1 guesses (the +1 is for catching up)
        game.guessesRemaining = data.count === 0 ? Infinity : data.count + 1;
        game.guessesThisTurn = 0;
        await saveGame(game);

        await broadcastGameState(io, game);
      } catch (error) {
        console.error('Error giving clue:', error);
        socket.emit('error', { message: 'Failed to give clue' });
      }
    });

    // Guess a word (operative only)
    socket.on('guess_word', async (data: { wordIndex: number }) => {
      const playerInfo = socketPlayers.get(socket.id);
      if (!playerInfo) return;

      const { gameCode, playerId } = playerInfo;

      try {
        const game = await getGame(gameCode);
        if (!game || game.status !== 'playing') return;

        const player = game.players.find((p) => p.id === playerId);
        if (!player) return;

        const currentTeam = game.teams[game.currentTeamIndex];
        if (player.team !== currentTeam) {
          socket.emit('error', { message: "It's not your team's turn" });
          return;
        }

        if (player.role !== 'operative') {
          socket.emit('error', { message: 'Only operatives can guess' });
          return;
        }

        if (!game.currentClue) {
          socket.emit('error', { message: 'Wait for the spymaster to give a clue' });
          return;
        }

        const { wordIndex } = data;
        if (wordIndex < 0 || wordIndex >= game.words.length) {
          socket.emit('error', { message: 'Invalid word index' });
          return;
        }

        if (game.revealed[wordIndex]) {
          socket.emit('error', { message: 'This card has already been revealed' });
          return;
        }

        // Reveal the card
        game.revealed[wordIndex] = true;
        const cardType = game.keyCard[wordIndex];
        game.guessesRemaining--;
        game.guessesThisTurn++;

        // Handle the guess result
        if (cardType === 'assassin') {
          // Team is eliminated
          game.eliminatedTeams.push(currentTeam);
          
          // Check if only one team remains
          const remainingTeams = game.teams.filter((t) => !game.eliminatedTeams.includes(t));
          if (remainingTeams.length === 1) {
            game.winner = remainingTeams[0];
            game.status = 'finished';
          } else {
            // Move to next team
            advanceToNextTeam(game);
          }
        } else if (cardType === currentTeam) {
          // Correct guess - update score
          game.scores[currentTeam].found++;

          // Check for win
          if (game.scores[currentTeam].found >= game.scores[currentTeam].total) {
            game.winner = currentTeam;
            game.status = 'finished';
          } else if (game.guessesRemaining <= 0) {
            // No more guesses, move to next team
            advanceToNextTeam(game);
          }
          // Otherwise, team can continue guessing
        } else if (cardType === 'neutral') {
          // Neutral card - turn ends
          advanceToNextTeam(game);
        } else {
          // Wrong team's card - update that team's score and end turn
          // At this point, cardType must be another team's color (not neutral, assassin, or current team)
          const otherTeam = cardType as TeamId;
          game.scores[otherTeam].found++;

          // Check if that team wins
          if (game.scores[otherTeam].found >= game.scores[otherTeam].total) {
            game.winner = otherTeam;
            game.status = 'finished';
          }
          advanceToNextTeam(game);
        }

        await saveGame(game);
        await broadcastGameState(io, game);
      } catch (error) {
        console.error('Error guessing word:', error);
        socket.emit('error', { message: 'Failed to process guess' });
      }
    });

    // End turn voluntarily
    socket.on('end_turn', async () => {
      const playerInfo = socketPlayers.get(socket.id);
      if (!playerInfo) return;

      const { gameCode, playerId } = playerInfo;

      try {
        const game = await getGame(gameCode);
        if (!game || game.status !== 'playing') return;

        const player = game.players.find((p) => p.id === playerId);
        if (!player) return;

        const currentTeam = game.teams[game.currentTeamIndex];
        if (player.team !== currentTeam) {
          socket.emit('error', { message: "It's not your team's turn" });
          return;
        }

        advanceToNextTeam(game);
        await saveGame(game);
        await broadcastGameState(io, game);
      } catch (error) {
        console.error('Error ending turn:', error);
        socket.emit('error', { message: 'Failed to end turn' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`Client disconnected: ${socket.id}`);

      const playerInfo = socketPlayers.get(socket.id);
      if (playerInfo) {
        const { gameCode, playerId } = playerInfo;
        
        // Note: We don't remove the player on disconnect
        // They can reconnect with the same playerId
        // Cleanup happens via TTL on the game

        socketRooms.delete(socket.id);
        socketPlayers.delete(socket.id);
      }
    });
  });
}

/**
 * Advance to the next team's turn
 */
function advanceToNextTeam(game: Game) {
  game.currentClue = null;
  game.guessesRemaining = 0;
  game.guessesThisTurn = 0;

  // Find next non-eliminated team
  let attempts = 0;
  do {
    game.currentTeamIndex = (game.currentTeamIndex + 1) % game.teams.length;
    attempts++;
  } while (
    game.eliminatedTeams.includes(game.teams[game.currentTeamIndex]) &&
    attempts < game.teams.length
  );
}

