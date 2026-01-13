# Codenames - Multiplayer Word Game

A real-time multiplayer implementation of the popular Codenames board game, built with Next.js, Socket.io, and Upstash Redis.

## Features

- **2-4 Team Support**: Play with 2, 3, or 4 teams
- **Dynamic Board Sizes**: Choose from Small (4×4), Standard (5×5), or Large (6×6) grids
- **Real-time Multiplayer**: WebSocket-based communication for instant updates
- **Role-based Views**: Spymasters see the key card, operatives see only revealed cards
- **Flexible Team Composition**: 1 spymaster per team, unlimited operatives
- **Anonymous Play**: No accounts required - just enter a nickname and play

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS
- **Real-time**: Socket.io
- **Storage**: Upstash Redis
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Upstash Redis account (free tier available at https://upstash.com)

### Environment Setup

1. Create a `.env.local` file in the project root:

```env
# Upstash Redis (required)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Optional: Socket server URL for production
NEXT_PUBLIC_SOCKET_URL=
```

2. Get your Redis credentials from [Upstash Console](https://console.upstash.com/)

### Installation

```bash
# Install dependencies
npm install

# Run development server with Socket.io
npm run dev

# Or run Next.js only (without WebSocket support)
npm run dev:next
```

The app will be available at http://localhost:3000

### Building for Production

```bash
npm run build
npm start
```

## How to Play

1. **Create a Game**: Click "Create Game", enter your nickname, and configure settings
2. **Share the Code**: Give the 6-character room code to your friends
3. **Join Teams**: Each player selects a team (Red, Blue, Green, or Yellow) and role (Spymaster or Operative)
4. **Start the Game**: The host starts the game once all teams have a spymaster and at least one operative

### Gameplay

1. **Spymaster's Turn**: Give a one-word clue and a number indicating how many cards relate to that clue
2. **Operatives' Turn**: Discuss and click on cards you think match the clue
3. **Scoring**:
   - Correct guess: Your team earns a point, continue guessing
   - Wrong team's card: That team gets a point, turn ends
   - Neutral card: Turn ends
   - Assassin: Your team is eliminated!

4. **Winning**: First team to find all their cards wins!

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home page (create/join)
│   ├── room/[code]/page.tsx  # Game room
│   └── api/
│       └── games/            # REST API routes
├── components/
│   ├── Lobby.tsx             # Pre-game lobby
│   ├── GameBoard.tsx         # Main game board
│   ├── WordCard.tsx          # Individual word cards
│   ├── ClueInput.tsx         # Spymaster clue input
│   ├── ScoreBoard.tsx        # Team scores
│   └── GameOver.tsx          # End game screen
├── hooks/
│   └── useGame.ts            # Game state management
├── lib/
│   ├── game-logic.ts         # Core game rules
│   ├── redis.ts              # Redis client
│   ├── socket-handlers.ts    # Socket.io event handlers
│   ├── socket-client.ts      # Client-side socket
│   └── words.ts              # Word list
└── types/
    └── game.ts               # TypeScript types
```

## Deployment

### Vercel + External Socket Server

Since Vercel serverless functions don't support persistent WebSocket connections, you'll need to deploy the Socket.io server separately:

1. Deploy the Next.js app to Vercel
2. Deploy `server.ts` to a platform that supports WebSockets (Railway, Render, Fly.io)
3. Set `NEXT_PUBLIC_SOCKET_URL` to point to your Socket server

### Self-Hosted

Run the custom server which includes both Next.js and Socket.io:

```bash
npm run build
npm start
```

## License

Based on the Codenames board game by Vlaada Chvátil, published by Czech Games Edition.
