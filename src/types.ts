export type PlayerColor = 'white' | 'black' | 'random';

export type TimeControlOption = '1+0' | '3+0' | '3+2' | '5+0' | '5+3' | '10+0' | '15+10' | 'unlimited';

export interface Player {
  id: string;
  name: string;
  color: 'white' | 'black';
  connected: boolean;
  timeLeft: number; // in milliseconds
  score: number; // for rematch series
  isReadyForRematch?: boolean;
}

export interface GameMove {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  fen: string;
  piece: string;
  color: 'w' | 'b';
  captured?: string;
  timeRemaining?: {
    white: number;
    black: number;
  };
}

export type GameOverReason =
  | 'checkmate'
  | 'stalemate'
  | 'threefold'
  | 'insufficient'
  | '50-move'
  | 'timeout'
  | 'resignation'
  | 'draw_agreed'
  | 'abandoned';

export interface RoomState {
  roomId: string;
  status: 'waiting' | 'active' | 'ended';
  fen: string;
  pgn: string;
  turn: 'white' | 'black';
  timeControl: TimeControlOption;
  initialTimeMs: number; // e.g. 300000 for 5 min
  incrementMs: number; // e.g. 3000 for 3 sec increment
  players: {
    white: Player | null;
    black: Player | null;
  };
  spectatorCount: number;
  history: GameMove[];
  capturedPieces: {
    white: string[]; // pieces captured by white (black pieces)
    black: string[]; // pieces captured by black (white pieces)
  };
  winner: 'white' | 'black' | 'draw' | null;
  gameOverReason: GameOverReason | null;
  lastMove: { from: string; to: string } | null;
  inCheck: boolean;
  drawOfferedBy: 'white' | 'black' | null;
  rematchRequestedBy: 'white' | 'black' | null;
  lastTurnTimestamp: number | null;
}

export interface ChatMessage {
  id: string;
  sender: string;
  color?: 'white' | 'black' | 'spectator' | 'system';
  role?: 'player' | 'spectator' | 'system';
  text: string;
  timestamp: number;
}

// Server to Client Events
export interface ServerToClientEvents {
  'room-state': (state: RoomState) => void;
  'move-made': (data: { move: GameMove; state: RoomState }) => void;
  'timer-tick': (data: { whiteTime: number; blackTime: number; turn: 'white' | 'black' }) => void;
  'game-over': (data: { winner: 'white' | 'black' | 'draw' | null; reason: GameOverReason; state: RoomState }) => void;
  'chat-message': (message: ChatMessage) => void;
  'rematch-offered': (data: { requestedBy: 'white' | 'black' }) => void;
  'rematch-declined': () => void;
  'draw-offered': (data: { requestedBy: 'white' | 'black' }) => void;
  'draw-declined': () => void;
  'error-message': (message: string) => void;
  'player-joined': (data: { player: Player; state: RoomState }) => void;
  'player-left': (data: { color: 'white' | 'black'; state: RoomState }) => void;
  'opponent-disconnected': (data: { disconnectedColor: 'white' | 'black'; disconnectedName: string; winner: 'white' | 'black' }) => void;
  'matchmaking-status': (data: { status: 'queued' | 'cancelled' | 'matched'; queueSize?: number }) => void;
  'match-found': (data: { roomId: string; color: 'white' | 'black'; state: RoomState }) => void;
  'webrtc-offer': (data: { senderId: string; offer: any }) => void;
  'webrtc-answer': (data: { senderId: string; answer: any }) => void;
  'webrtc-ice-candidate': (data: { senderId: string; candidate: any }) => void;
  'webrtc-mic-status': (data: { senderId: string; isMuted: boolean; isSpeaking?: boolean }) => void;
}

// Client to Server Events
export interface ClientToServerEvents {
  'create-room': (
    data: {
      name: string;
      colorPreference: PlayerColor;
      timeControl: TimeControlOption;
      customCode?: string;
    },
    callback: (response: { success: boolean; roomId?: string; error?: string }) => void
  ) => void;

  'join-room': (
    data: { roomId: string; name: string },
    callback: (response: { success: boolean; state?: RoomState; playerColor?: 'white' | 'black' | 'spectator'; error?: string }) => void
  ) => void;

  'join-matchmaking': (
    data: { name: string; timeControl: TimeControlOption },
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;

  'cancel-matchmaking': (
    callback?: (response: { success: boolean }) => void
  ) => void;

  'make-move': (
    data: { roomId: string; from: string; to: string; promotion?: string },
    callback?: (response: { success: boolean; error?: string }) => void
  ) => void;

  'resign': (data: { roomId: string }) => void;
  'offer-draw': (data: { roomId: string }) => void;
  'respond-draw': (data: { roomId: string; accept: boolean }) => void;
  'request-rematch': (data: { roomId: string }) => void;
  'respond-rematch': (data: { roomId: string; accept: boolean }) => void;
  'send-chat': (data: { roomId: string; text: string; senderName?: string }) => void;
  'leave-room': (data: { roomId: string }) => void;
  'webrtc-offer': (data: { roomId: string; offer: any }) => void;
  'webrtc-answer': (data: { roomId: string; answer: any }) => void;
  'webrtc-ice-candidate': (data: { roomId: string; candidate: any }) => void;
  'webrtc-mic-status': (data: { roomId: string; isMuted: boolean; isSpeaking?: boolean }) => void;
}
