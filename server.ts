import express from 'express';
import http from 'http';
import path from 'path';
import { Server, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { Chess } from 'chess.js';
import { GoogleGenAI } from '@google/genai';
import {
  RoomState,
  Player,
  GameMove,
  TimeControlOption,
  PlayerColor,
  GameOverReason,
  ChatMessage,
  ServerToClientEvents,
  ClientToServerEvents,
} from './src/types.js';

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = 3000;

// Google Search Console Verification Endpoint
app.get('/googlebf313ffac64607e4.html', (req, res) => {
  res.type('text/html');
  res.send('google-site-verification: googlebf313ffac64607e4.html');
});

// SEO Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Sitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`);
});

// SEO Sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
});

// AI Chess Coach Endpoint (Powered by Gemini)
app.post('/api/chess-coach', async (req, res) => {
  try {
    const { fen, movesHistory, prompt, playerColor } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY environment variable is not configured on the server.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `You are Grandmaster AI, an elite, friendly, and expert International Chess Coach & Master.
Your goal is to provide insightful, accurate, and encouraging chess guidance to players during or after their games.
Analyze the provided FEN board position, move history, and user question.

Context provided:
- Board FEN: ${fen || 'Standard Starting Position'}
- Moves played so far: ${movesHistory?.length ? movesHistory.join(', ') : 'None'}
- Player Color: ${playerColor || 'white'}

Guidelines:
1. Break down key strategic concepts (center control, king safety, piece activity, weak pawn structure).
2. Recommend 2-3 strong candidate moves when requested with brief tactical explanations.
3. Keep your response clear, concise (2-4 short paragraphs), and formatted with markdown bullet points for key takeaways.
4. Keep the tone inspiring and instructional, like a professional grandmaster coach sitting right beside the player.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const advice =
      response.text ||
      "I've analyzed your position. Focus on controlling key central squares, protecting your king, and coordinating active piece attacks!";
    return res.json({ advice });
  } catch (err: any) {
    console.error('Chess Coach API Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate AI chess advice.' });
  }
});

interface ActiveRoom {
  state: RoomState;
  chess: Chess;
  timerInterval?: NodeJS.Timeout;
}

const rooms = new Map<string, ActiveRoom>();

// Matchmaking Queue Structure
interface QueueEntry {
  socketId: string;
  socket: Socket<ClientToServerEvents, ServerToClientEvents>;
  name: string;
  timeControl: TimeControlOption;
  joinedAt: number;
}

const matchmakingQueue: QueueEntry[] = [];

function removeFromQueue(socketId: string) {
  const index = matchmakingQueue.findIndex((entry) => entry.socketId === socketId);
  if (index !== -1) {
    matchmakingQueue.splice(index, 1);
  }
}

// Automatic Matchmaking Queue Pairing Logic
function processMatchmakingQueue() {
  if (matchmakingQueue.length < 2) return;

  for (let i = 0; i < matchmakingQueue.length; i++) {
    for (let j = i + 1; j < matchmakingQueue.length; j++) {
      const p1 = matchmakingQueue[i];
      const p2 = matchmakingQueue[j];

      // Match condition: same time control preferred, OR waiting > 3 seconds
      const sameTc = p1.timeControl === p2.timeControl;
      const waitingTime = Date.now() - Math.min(p1.joinedAt, p2.joinedAt);
      const flexibleMatch = waitingTime > 3000;

      if (sameTc || flexibleMatch) {
        // Remove higher index first to maintain correct index shifting
        matchmakingQueue.splice(j, 1);
        matchmakingQueue.splice(i, 1);

        const roomCode = 'quick-' + generateRoomCode();
        const selectedTc = sameTc ? p1.timeControl : p1.timeControl;
        const { initialMs, incrementMs } = parseTimeControl(selectedTc);

        // Random color assignment
        const p1IsWhite = Math.random() < 0.5;

        const playerWhite: Player = {
          id: p1IsWhite ? p1.socketId : p2.socketId,
          name: p1IsWhite ? p1.name : p2.name,
          color: 'white',
          connected: true,
          timeLeft: initialMs,
          score: 0,
        };

        const playerBlack: Player = {
          id: p1IsWhite ? p2.socketId : p1.socketId,
          name: p1IsWhite ? p2.name : p1.name,
          color: 'black',
          connected: true,
          timeLeft: initialMs,
          score: 0,
        };

        const chess = new Chess();
        const initialState: RoomState = {
          roomId: roomCode,
          status: 'active',
          fen: chess.fen(),
          pgn: chess.pgn(),
          turn: 'white',
          timeControl: selectedTc,
          initialTimeMs: initialMs,
          incrementMs,
          players: {
            white: playerWhite,
            black: playerBlack,
          },
          spectatorCount: 0,
          history: [],
          capturedPieces: { white: [], black: [] },
          winner: null,
          gameOverReason: null,
          lastMove: null,
          inCheck: false,
          drawOfferedBy: null,
          rematchRequestedBy: null,
          lastTurnTimestamp: Date.now(),
        };

        rooms.set(roomCode, { state: initialState, chess });

        p1.socket.join(roomCode);
        p2.socket.join(roomCode);

        if (selectedTc !== 'unlimited') {
          startRoomTimer(roomCode);
        }

        // Notify both players of match found and room assignment
        p1.socket.emit('match-found', {
          roomId: roomCode,
          color: p1IsWhite ? 'white' : 'black',
          state: initialState,
        });

        p2.socket.emit('match-found', {
          roomId: roomCode,
          color: p1IsWhite ? 'black' : 'white',
          state: initialState,
        });

        io.to(roomCode).emit('room-state', initialState);

        const startMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender: 'System',
          color: 'system',
          text: `⚡ Quick Play Match found! ${playerWhite.name} (White) vs ${playerBlack.name} (Black). Good luck!`,
          timestamp: Date.now(),
        };
        io.to(roomCode).emit('chat-message', startMsg);

        console.log(`Matched players ${p1.name} and ${p2.name} into quick room ${roomCode}`);

        // Recursively check if remaining queue can form more matches
        processMatchmakingQueue();
        return;
      }
    }
  }
}

// Helper to calculate time in ms from control string
function parseTimeControl(option: TimeControlOption): { initialMs: number; incrementMs: number } {
  switch (option) {
    case '1+0':
      return { initialMs: 60 * 1000, incrementMs: 0 };
    case '3+0':
      return { initialMs: 3 * 60 * 1000, incrementMs: 0 };
    case '3+2':
      return { initialMs: 3 * 60 * 1000, incrementMs: 2000 };
    case '5+0':
      return { initialMs: 5 * 60 * 1000, incrementMs: 0 };
    case '5+3':
      return { initialMs: 5 * 60 * 1000, incrementMs: 3000 };
    case '10+0':
      return { initialMs: 10 * 60 * 1000, incrementMs: 0 };
    case '15+10':
      return { initialMs: 15 * 60 * 1000, incrementMs: 10000 };
    case 'unlimited':
    default:
      return { initialMs: 0, incrementMs: 0 };
  }
}

// Helper to generate a friendly unique room code
function generateRoomCode(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Calculate captured pieces
function computeCapturedPieces(chess: Chess) {
  const board = chess.board();
  const currentCount: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0, P: 0, N: 0, B: 0, R: 0, Q: 0, K: 0 };
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const key = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
        currentCount[key] = (currentCount[key] || 0) + 1;
      }
    }
  }

  const initialCount: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1, P: 8, N: 2, B: 2, R: 2, Q: 1, K: 1 };
  const capturedByWhite: string[] = []; // Black pieces missing
  const capturedByBlack: string[] = []; // White pieces missing

  ['p', 'n', 'b', 'r', 'q'].forEach((type) => {
    const missingBlack = (initialCount[type] || 0) - (currentCount[type] || 0);
    for (let i = 0; i < missingBlack; i++) capturedByWhite.push(type);

    const upperType = type.toUpperCase();
    const missingWhite = (initialCount[upperType] || 0) - (currentCount[upperType] || 0);
    for (let i = 0; i < missingWhite; i++) capturedByBlack.push(upperType);
  });

  return { white: capturedByWhite, black: capturedByBlack };
}

// Start timer for a room
function startRoomTimer(roomId: string) {
  const activeRoom = rooms.get(roomId);
  if (!activeRoom) return;

  if (activeRoom.timerInterval) {
    clearInterval(activeRoom.timerInterval);
  }

  activeRoom.state.lastTurnTimestamp = Date.now();

  activeRoom.timerInterval = setInterval(() => {
    const room = rooms.get(roomId);
    if (!room || room.state.status !== 'active' || room.state.timeControl === 'unlimited') {
      if (activeRoom.timerInterval) clearInterval(activeRoom.timerInterval);
      return;
    }

    const now = Date.now();
    const elapsed = now - (room.state.lastTurnTimestamp || now);
    room.state.lastTurnTimestamp = now;

    const currentTurn = room.state.turn;
    const activePlayer = room.state.players[currentTurn];

    if (activePlayer && activePlayer.timeLeft > 0) {
      activePlayer.timeLeft = Math.max(0, activePlayer.timeLeft - elapsed);

      // Broadcast timer tick to room
      io.to(roomId).emit('timer-tick', {
        whiteTime: room.state.players.white?.timeLeft || 0,
        blackTime: room.state.players.black?.timeLeft || 0,
        turn: room.state.turn,
      });

      if (activePlayer.timeLeft <= 0) {
        // Timeout game over!
        const winner = currentTurn === 'white' ? 'black' : 'white';
        room.state.status = 'ended';
        room.state.winner = winner;
        room.state.gameOverReason = 'timeout';

        if (room.timerInterval) clearInterval(room.timerInterval);

        io.to(roomId).emit('game-over', {
          winner,
          reason: 'timeout',
          state: room.state,
        });

        // Add system chat message
        const sysMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender: 'System',
          color: 'system',
          text: `⏰ Game over! ${winner.toUpperCase()} wins on time.`,
          timestamp: Date.now(),
        };
        io.to(roomId).emit('chat-message', sysMsg);
      }
    }
  }, 250);
}

// Socket.io connection logic
io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log(`Socket connected: ${socket.id}`);

  // 1. Create Room
  socket.on('create-room', (data, callback) => {
    try {
      const code = data.customCode?.trim().toLowerCase() || generateRoomCode();
      const existing = rooms.get(code);

      if (existing && existing.state.status !== 'ended') {
        return callback({ success: false, error: 'Room code already exists. Try another code.' });
      }

      const { initialMs, incrementMs } = parseTimeControl(data.timeControl);

      let assignedColor: 'white' | 'black' = 'white';
      if (data.colorPreference === 'black') {
        assignedColor = 'black';
      } else if (data.colorPreference === 'random') {
        assignedColor = Math.random() < 0.5 ? 'white' : 'black';
      }

      const creatorPlayer: Player = {
        id: socket.id,
        name: data.name.trim() || 'Player 1',
        color: assignedColor,
        connected: true,
        timeLeft: initialMs,
        score: 0,
      };

      const chess = new Chess();

      const initialState: RoomState = {
        roomId: code,
        status: 'waiting',
        fen: chess.fen(),
        pgn: chess.pgn(),
        turn: 'white',
        timeControl: data.timeControl,
        initialTimeMs: initialMs,
        incrementMs,
        players: {
          white: assignedColor === 'white' ? creatorPlayer : null,
          black: assignedColor === 'black' ? creatorPlayer : null,
        },
        spectatorCount: 0,
        history: [],
        capturedPieces: { white: [], black: [] },
        winner: null,
        gameOverReason: null,
        lastMove: null,
        inCheck: false,
        drawOfferedBy: null,
        rematchRequestedBy: null,
        lastTurnTimestamp: null,
      };

      rooms.set(code, { state: initialState, chess });
      socket.join(code);

      callback({ success: true, roomId: code });
      socket.emit('room-state', initialState);

      console.log(`Room created: ${code} by ${creatorPlayer.name} (${assignedColor})`);
    } catch (err) {
      console.error('Error creating room:', err);
      callback({ success: false, error: 'Failed to create room.' });
    }
  });

  // 2. Join Room
  socket.on('join-room', (data, callback) => {
    try {
      const code = data.roomId.trim().toLowerCase();
      const room = rooms.get(code);

      if (!room) {
        return callback({ success: false, error: 'Room not found. Please check the code.' });
      }

      const state = room.state;
      let playerColor: 'white' | 'black' | 'spectator' = 'spectator';

      // Check if socket is already a registered player (reconnect case)
      if (state.players.white?.id === socket.id) {
        state.players.white.connected = true;
        playerColor = 'white';
      } else if (state.players.black?.id === socket.id) {
        state.players.black.connected = true;
        playerColor = 'black';
      } else {
        // New joiner - place in open slot or spectator
        if (!state.players.white) {
          playerColor = 'white';
          state.players.white = {
            id: socket.id,
            name: data.name.trim() || 'Player (White)',
            color: 'white',
            connected: true,
            timeLeft: state.initialTimeMs,
            score: 0,
          };
        } else if (!state.players.black) {
          playerColor = 'black';
          state.players.black = {
            id: socket.id,
            name: data.name.trim() || 'Player (Black)',
            color: 'black',
            connected: true,
            timeLeft: state.initialTimeMs,
            score: 0,
          };
        } else {
          // Both slots filled -> Spectator
          playerColor = 'spectator';
          state.spectatorCount += 1;
        }
      }

      socket.join(code);

      // If both players are present and status was 'waiting', activate game!
      if (state.players.white && state.players.black && state.status === 'waiting') {
        state.status = 'active';
        state.lastTurnTimestamp = Date.now();
        if (state.timeControl !== 'unlimited') {
          startRoomTimer(code);
        }

        const startMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender: 'System',
          color: 'system',
          text: `⚔️ Game started! ${state.players.white.name} (White) vs ${state.players.black.name} (Black). Good luck!`,
          timestamp: Date.now(),
        };
        io.to(code).emit('chat-message', startMsg);
      }

      callback({ success: true, state, playerColor });
      io.to(code).emit('room-state', state);

      console.log(`User ${data.name} joined room ${code} as ${playerColor}`);
    } catch (err) {
      console.error('Error joining room:', err);
      callback({ success: false, error: 'Failed to join room.' });
    }
  });

  // 3. Make Move
  socket.on('make-move', (data, callback) => {
    try {
      const code = data.roomId.trim().toLowerCase();
      const room = rooms.get(code);

      if (!room) {
        if (callback) callback({ success: false, error: 'Room not found.' });
        return;
      }

      const { state, chess } = room;

      if (state.status !== 'active') {
        if (callback) callback({ success: false, error: 'Game is not active.' });
        return;
      }

      // Check player color assignment
      const currentTurnColor = state.turn; // 'white' or 'black'
      const expectedPlayerSocketId = state.players[currentTurnColor]?.id;

      if (socket.id !== expectedPlayerSocketId) {
        if (callback) callback({ success: false, error: "It's not your turn!" });
        return;
      }

      // Attempt move in chess.js engine
      const moveResult = chess.move({
        from: data.from,
        to: data.to,
        promotion: data.promotion || 'q',
      });

      if (!moveResult) {
        if (callback) callback({ success: false, error: 'Invalid chess move.' });
        return;
      }

      // Add time increment to player who just moved
      if (state.incrementMs > 0 && state.players[currentTurnColor]) {
        state.players[currentTurnColor]!.timeLeft += state.incrementMs;
      }

      // Update state
      state.fen = chess.fen();
      state.pgn = chess.pgn();
      state.turn = chess.turn() === 'w' ? 'white' : 'black';
      state.lastTurnTimestamp = Date.now();
      state.lastMove = { from: data.from, to: data.to };
      state.inCheck = chess.inCheck();
      state.capturedPieces = computeCapturedPieces(chess);

      const moveLog: GameMove = {
        from: data.from,
        to: data.to,
        promotion: data.promotion,
        san: moveResult.san,
        fen: chess.fen(),
        piece: moveResult.piece,
        color: moveResult.color,
        captured: moveResult.captured,
        timeRemaining: {
          white: state.players.white?.timeLeft || 0,
          black: state.players.black?.timeLeft || 0,
        },
      };

      state.history.push(moveLog);

      // Check Game Over conditions
      if (chess.isGameOver()) {
        state.status = 'ended';
        if (room.timerInterval) clearInterval(room.timerInterval);

        let reason: GameOverReason = 'draw_agreed';
        let winner: 'white' | 'black' | 'draw' | null = null;

        if (chess.isCheckmate()) {
          reason = 'checkmate';
          winner = currentTurnColor; // The player who just made the checkmating move wins
          if (state.players[winner]) {
            state.players[winner]!.score += 1;
          }
        } else if (chess.isStalemate()) {
          reason = 'stalemate';
          winner = 'draw';
        } else if (chess.isThreefoldRepetition()) {
          reason = 'threefold';
          winner = 'draw';
        } else if (chess.isInsufficientMaterial()) {
          reason = 'insufficient';
          winner = 'draw';
        } else {
          reason = '50-move';
          winner = 'draw';
        }

        state.winner = winner;
        state.gameOverReason = reason;

        io.to(code).emit('game-over', { winner, reason, state });

        const endText = winner === 'draw' 
          ? `🤝 Game drawn by ${reason.replace('_', ' ')}.` 
          : `🏆 Game over! ${winner?.toUpperCase()} wins by ${reason}!`;

        io.to(code).emit('chat-message', {
          id: `msg-${Date.now()}`,
          sender: 'System',
          color: 'system',
          text: endText,
          timestamp: Date.now(),
        });
      }

      if (callback) callback({ success: true });

      // Broadcast move to all room clients
      io.to(code).emit('move-made', { move: moveLog, state });
      io.to(code).emit('room-state', state);
    } catch (err) {
      console.error('Error making move:', err);
      if (callback) callback({ success: false, error: 'Failed to process move.' });
    }
  });

  // 4. Resign
  socket.on('resign', (data) => {
    const code = data.roomId.trim().toLowerCase();
    const room = rooms.get(code);
    if (!room || room.state.status !== 'active') return;

    const { state } = room;
    let resigningColor: 'white' | 'black' | null = null;
    if (state.players.white?.id === socket.id) resigningColor = 'white';
    if (state.players.black?.id === socket.id) resigningColor = 'black';

    if (!resigningColor) return;

    const winner = resigningColor === 'white' ? 'black' : 'white';
    state.status = 'ended';
    state.winner = winner;
    state.gameOverReason = 'resignation';

    if (state.players[winner]) state.players[winner]!.score += 1;
    if (room.timerInterval) clearInterval(room.timerInterval);

    io.to(code).emit('game-over', { winner, reason: 'resignation', state });
    io.to(code).emit('room-state', state);

    io.to(code).emit('chat-message', {
      id: `msg-${Date.now()}`,
      sender: 'System',
      color: 'system',
      text: `🏳️ ${resigningColor.toUpperCase()} resigned. ${winner.toUpperCase()} wins!`,
      timestamp: Date.now(),
    });
  });

  // 5. Offer Draw & Respond
  socket.on('offer-draw', (data) => {
    const code = data.roomId.trim().toLowerCase();
    const room = rooms.get(code);
    if (!room || room.state.status !== 'active') return;

    let offeringColor: 'white' | 'black' | null = null;
    if (room.state.players.white?.id === socket.id) offeringColor = 'white';
    if (room.state.players.black?.id === socket.id) offeringColor = 'black';

    if (!offeringColor) return;

    room.state.drawOfferedBy = offeringColor;
    io.to(code).emit('draw-offered', { requestedBy: offeringColor });
    io.to(code).emit('room-state', room.state);
  });

  socket.on('respond-draw', (data) => {
    const code = data.roomId.trim().toLowerCase();
    const room = rooms.get(code);
    if (!room || room.state.status !== 'active') return;

    const { state } = room;
    state.drawOfferedBy = null;

    if (data.accept) {
      state.status = 'ended';
      state.winner = 'draw';
      state.gameOverReason = 'draw_agreed';
      if (room.timerInterval) clearInterval(room.timerInterval);

      io.to(code).emit('game-over', { winner: 'draw', reason: 'draw_agreed', state });
      io.to(code).emit('room-state', state);

      io.to(code).emit('chat-message', {
        id: `msg-${Date.now()}`,
        sender: 'System',
        color: 'system',
        text: `🤝 Draw offer accepted! Game ends in a draw.`,
        timestamp: Date.now(),
      });
    } else {
      io.to(code).emit('draw-declined');
      io.to(code).emit('room-state', state);
    }
  });

  // 6. Request & Accept Rematch
  socket.on('request-rematch', (data) => {
    const code = data.roomId.trim().toLowerCase();
    const room = rooms.get(code);
    if (!room) return;

    let requestingColor: 'white' | 'black' | null = null;
    if (room.state.players.white?.id === socket.id) requestingColor = 'white';
    if (room.state.players.black?.id === socket.id) requestingColor = 'black';

    if (!requestingColor) return;

    room.state.rematchRequestedBy = requestingColor;
    io.to(code).emit('rematch-offered', { requestedBy: requestingColor });
    io.to(code).emit('room-state', room.state);
  });

  socket.on('respond-rematch', (data) => {
    const code = data.roomId.trim().toLowerCase();
    const room = rooms.get(code);
    if (!room) return;

    const { state } = room;

    if (!data.accept) {
      state.rematchRequestedBy = null;
      io.to(code).emit('rematch-declined');
      io.to(code).emit('room-state', state);
      return;
    }

    // Rematch Accepted! Reset game state & swap player colors for fairness!
    const oldWhite = state.players.white;
    const oldBlack = state.players.black;

    // Reset chess engine
    room.chess = new Chess();

    // Swap player color assignments
    const newWhite = oldBlack ? { ...oldBlack, color: 'white' as const, timeLeft: state.initialTimeMs } : null;
    const newBlack = oldWhite ? { ...oldWhite, color: 'black' as const, timeLeft: state.initialTimeMs } : null;

    state.status = 'active';
    state.fen = room.chess.fen();
    state.pgn = room.chess.pgn();
    state.turn = 'white';
    state.players.white = newWhite;
    state.players.black = newBlack;
    state.history = [];
    state.capturedPieces = { white: [], black: [] };
    state.winner = null;
    state.gameOverReason = null;
    state.lastMove = null;
    state.inCheck = false;
    state.drawOfferedBy = null;
    state.rematchRequestedBy = null;
    state.lastTurnTimestamp = Date.now();

    if (state.timeControl !== 'unlimited') {
      startRoomTimer(code);
    }

    io.to(code).emit('room-state', state);

    io.to(code).emit('chat-message', {
      id: `msg-${Date.now()}`,
      sender: 'System',
      color: 'system',
      text: `🔄 Rematch started! Colors have been swapped. Good luck!`,
      timestamp: Date.now(),
    });
  });

  // 7. Send Chat Message
  socket.on('send-chat', (data) => {
    const code = data.roomId?.trim().toLowerCase();
    const room = rooms.get(code);
    if (!room) return;

    let color: 'white' | 'black' | 'spectator' | 'system' = 'spectator';
    let role: 'player' | 'spectator' | 'system' = 'spectator';
    let senderName = 'Spectator';

    if (room.state.players.white?.id === socket.id) {
      color = 'white';
      role = 'player';
      senderName = room.state.players.white.name;
    } else if (room.state.players.black?.id === socket.id) {
      color = 'black';
      role = 'player';
      senderName = room.state.players.black.name;
    } else {
      color = 'spectator';
      role = 'spectator';
      senderName = data.senderName?.trim() || 'Spectator';
    }

    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: senderName,
      color,
      role,
      text: data.text.trim().substring(0, 300),
      timestamp: Date.now(),
    };

    io.to(code).emit('chat-message', message);
  });

  // 8. WebRTC Live Voice Chat Signaling
  socket.on('webrtc-offer', (data) => {
    const code = data.roomId?.trim().toLowerCase();
    if (!code) return;
    socket.to(code).emit('webrtc-offer', { senderId: socket.id, offer: data.offer });
  });

  socket.on('webrtc-answer', (data) => {
    const code = data.roomId?.trim().toLowerCase();
    if (!code) return;
    socket.to(code).emit('webrtc-answer', { senderId: socket.id, answer: data.answer });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const code = data.roomId?.trim().toLowerCase();
    if (!code) return;
    socket.to(code).emit('webrtc-ice-candidate', { senderId: socket.id, candidate: data.candidate });
  });

  socket.on('webrtc-mic-status', (data) => {
    const code = data.roomId?.trim().toLowerCase();
    if (!code) return;
    socket.to(code).emit('webrtc-mic-status', {
      senderId: socket.id,
      isMuted: data.isMuted,
      isSpeaking: data.isSpeaking,
    });
  });

  // 9. Matchmaking Queue Listeners
  socket.on('join-matchmaking', (data, callback) => {
    try {
      removeFromQueue(socket.id);

      const entry: QueueEntry = {
        socketId: socket.id,
        socket,
        name: data.name?.trim() || 'Player',
        timeControl: data.timeControl || '5+3',
        joinedAt: Date.now(),
      };

      matchmakingQueue.push(entry);

      if (callback) callback({ success: true });
      socket.emit('matchmaking-status', { status: 'queued', queueSize: matchmakingQueue.length });

      console.log(`Player ${entry.name} joined matchmaking queue (${entry.timeControl})`);

      processMatchmakingQueue();
    } catch (err) {
      console.error('Error joining matchmaking queue:', err);
      if (callback) callback({ success: false, error: 'Failed to join queue.' });
    }
  });

  socket.on('cancel-matchmaking', (callback) => {
    removeFromQueue(socket.id);
    socket.emit('matchmaking-status', { status: 'cancelled' });
    if (callback) callback({ success: true });
    console.log(`Socket ${socket.id} cancelled matchmaking`);
  });

  // 10. Leave Room (Voluntary Quit)
  socket.on('leave-room', (data) => {
    const code = data?.roomId?.trim().toLowerCase();
    if (!code) return;
    const room = rooms.get(code);
    socket.leave(code);
    if (!room) return;

    let changed = false;
    let disconnectedPlayerColor: 'white' | 'black' | null = null;
    let disconnectedPlayerName = '';

    if (room.state.players.white?.id === socket.id) {
      room.state.players.white.connected = false;
      disconnectedPlayerColor = 'white';
      disconnectedPlayerName = room.state.players.white.name;
      changed = true;
    }
    if (room.state.players.black?.id === socket.id) {
      room.state.players.black.connected = false;
      disconnectedPlayerColor = 'black';
      disconnectedPlayerName = room.state.players.black.name;
      changed = true;
    }

    if (changed) {
      if (room.state.status === 'active' && disconnectedPlayerColor) {
        const winner = disconnectedPlayerColor === 'white' ? 'black' : 'white';
        room.state.status = 'ended';
        room.state.winner = winner;
        room.state.gameOverReason = 'abandoned';
        if (room.state.players[winner]) room.state.players[winner]!.score += 1;
        if (room.timerInterval) clearInterval(room.timerInterval);

        io.to(code).emit('game-over', { winner, reason: 'abandoned', state: room.state });
        io.to(code).emit('opponent-disconnected', {
          disconnectedColor: disconnectedPlayerColor,
          disconnectedName: disconnectedPlayerName,
          winner,
        });
      }

      io.to(code).emit('room-state', room.state);
      io.to(code).emit('chat-message', {
        id: `msg-${Date.now()}`,
        sender: 'System',
        color: 'system',
        text: `⚠️ Player ${disconnectedPlayerName || 'Opponent'} left the game session.`,
        timestamp: Date.now(),
      });
    }
  });

  // 11. Disconnect (Browser close / refresh / connection drop)
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    removeFromQueue(socket.id);

    rooms.forEach((room, code) => {
      let changed = false;
      let disconnectedPlayerColor: 'white' | 'black' | null = null;
      let disconnectedPlayerName = '';

      if (room.state.players.white?.id === socket.id) {
        room.state.players.white.connected = false;
        disconnectedPlayerColor = 'white';
        disconnectedPlayerName = room.state.players.white.name;
        changed = true;
      }
      if (room.state.players.black?.id === socket.id) {
        room.state.players.black.connected = false;
        disconnectedPlayerColor = 'black';
        disconnectedPlayerName = room.state.players.black.name;
        changed = true;
      }

      if (changed) {
        if (room.state.status === 'active' && disconnectedPlayerColor) {
          const winner = disconnectedPlayerColor === 'white' ? 'black' : 'white';
          room.state.status = 'ended';
          room.state.winner = winner;
          room.state.gameOverReason = 'abandoned';
          if (room.state.players[winner]) room.state.players[winner]!.score += 1;
          if (room.timerInterval) clearInterval(room.timerInterval);

          io.to(code).emit('game-over', { winner, reason: 'abandoned', state: room.state });
          io.to(code).emit('opponent-disconnected', {
            disconnectedColor: disconnectedPlayerColor,
            disconnectedName: disconnectedPlayerName,
            winner,
          });
        }

        io.to(code).emit('room-state', room.state);
        io.to(code).emit('chat-message', {
          id: `msg-${Date.now()}`,
          sender: 'System',
          color: 'system',
          text: `⚠️ Player ${disconnectedPlayerName || 'Opponent'} disconnected. Game ended by default.`,
          timestamp: Date.now(),
        });
      }
    });
  });
});

// Start Express + Vite Middleware
async function startServer() {
  // API routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', activeRooms: rooms.size });
  });

  // SEO: Robots.txt
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    const host = req.get('host') || 'localhost';
    const protocol = req.protocol || 'https';
    res.send(`User-agent: *\nAllow: /\n\nSitemap: ${protocol}://${host}/sitemap.xml`);
  });

  // SEO: Sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    const host = req.get('host') || 'localhost';
    const protocol = req.protocol || 'https';
    const baseUrl = `${protocol}://${host}`;
    const today = new Date().toISOString().split('T')[0];
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    res.send(sitemap);
  });

  // Vite development vs production static handling
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Chess Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
