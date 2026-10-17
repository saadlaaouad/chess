import { Chess, Square, PieceSymbol, Color } from 'chess.js';

export type BotLevel = 1 | 2 | 3 | 4 | 5;

export interface BotProfile {
  level: BotLevel;
  name: string;
  rating: string;
  title: string;
  description: string;
  avatar: string;
  color: string;
  depth: number;
  thinkingDelayMs: number;
}

export const BOT_PROFILES: Record<BotLevel, BotProfile> = {
  1: {
    level: 1,
    name: 'Pawn Bot',
    rating: '600',
    title: 'Easy',
    description: 'Makes casual moves with frequent blunders. Perfect for complete beginners.',
    avatar: '🌱',
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    depth: 1,
    thinkingDelayMs: 350,
  },
  2: {
    level: 2,
    name: 'Knight Bot',
    rating: '1100',
    title: 'Medium',
    description: 'Understands basic captures and material value, but misses tactical depth.',
    avatar: '🐴',
    color: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
    depth: 2,
    thinkingDelayMs: 500,
  },
  3: {
    level: 3,
    name: 'Bishop Bot',
    rating: '1500',
    title: 'Junior',
    description: 'Solid club player using material balance and positional square tables.',
    avatar: '♝',
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    depth: 3,
    thinkingDelayMs: 700,
  },
  4: {
    level: 4,
    name: 'Rook Bot',
    rating: '1900',
    title: 'Professional',
    description: 'Advanced minimax algorithm with alpha-beta pruning and move ordering.',
    avatar: '♜',
    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    depth: 4,
    thinkingDelayMs: 900,
  },
  5: {
    level: 5,
    name: 'Grandmaster Bot',
    rating: '2300+',
    title: 'Super Professional',
    description: 'Elite engine evaluation with deep search, positional safety, and lethal checkmate calculation.',
    avatar: '♚',
    color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    depth: 4,
    thinkingDelayMs: 1200,
  },
};

// Material Values
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Positional Tables (PST) flipped for Black / White
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_MIDGAME_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

// Helper to get square index (0 to 63)
function getSquareIndex(file: number, rank: number, color: Color): number {
  if (color === 'w') {
    return (7 - rank) * 8 + file;
  } else {
    return rank * 8 + file;
  }
}

/**
 * Evaluate current board position from White's perspective (+ values favor White, - favor Black)
 */
export function evaluateBoard(chess: Chess, level: BotLevel = 3): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -100000 : 100000;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) {
    return 0;
  }

  let totalScore = 0;
  const board = chess.board();

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (!piece) continue;

      const pieceVal = PIECE_VALUES[piece.type];
      let positionalVal = 0;
      const sqIdx = getSquareIndex(file, rank, piece.color);

      if (level >= 3) {
        switch (piece.type) {
          case 'p': positionalVal = PAWN_TABLE[sqIdx]; break;
          case 'n': positionalVal = KNIGHT_TABLE[sqIdx]; break;
          case 'b': positionalVal = BISHOP_TABLE[sqIdx]; break;
          case 'r': positionalVal = ROOK_TABLE[sqIdx]; break;
          case 'q': positionalVal = QUEEN_TABLE[sqIdx]; break;
          case 'k': positionalVal = KING_MIDGAME_TABLE[sqIdx]; break;
        }
      }

      const val = pieceVal + positionalVal;
      if (piece.color === 'w') {
        totalScore += val;
      } else {
        totalScore -= val;
      }
    }
  }

  // Extra high-level positional evaluations for Level 4 & Level 5
  if (level >= 4) {
    if (chess.inCheck()) {
      totalScore += chess.turn() === 'w' ? -50 : 50;
    }
  }

  return totalScore;
}

/**
 * Move ordering function to optimize Alpha-Beta Pruning speed
 */
function orderMoves(chess: Chess, moves: ReturnType<Chess['moves']> & any[]): any[] {
  return moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (a.captured) {
      scoreA += 10 * PIECE_VALUES[a.captured as PieceSymbol] - PIECE_VALUES[a.piece as PieceSymbol];
    }
    if (b.captured) {
      scoreB += 10 * PIECE_VALUES[b.captured as PieceSymbol] - PIECE_VALUES[b.piece as PieceSymbol];
    }

    if (a.promotion) scoreA += 800;
    if (b.promotion) scoreB += 800;

    if (a.san.includes('+')) scoreA += 50;
    if (b.san.includes('+')) scoreB += 50;

    return scoreB - scoreA;
  });
}

/**
 * Minimax with Alpha-Beta Pruning
 */
function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  level: BotLevel
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess, level);
  }

  const rawMoves = chess.moves({ verbose: true });
  if (rawMoves.length === 0) return evaluateBoard(chess, level);

  const moves = level >= 4 ? orderMoves(chess, rawMoves) : rawMoves;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalVal = minimax(chess, depth - 1, alpha, beta, false, level);
      chess.undo();

      maxEval = Math.max(maxEval, evalVal);
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) break; // Alpha-beta cutoff
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evalVal = minimax(chess, depth - 1, alpha, beta, true, level);
      chess.undo();

      minEval = Math.min(minEval, evalVal);
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) break; // Alpha-beta cutoff
    }
    return minEval;
  }
}

/**
 * Calculate the best move for given Bot Level
 */
export function getBestBotMove(chess: Chess, level: BotLevel): any | null {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  const profile = BOT_PROFILES[level];
  const isBotWhite = chess.turn() === 'w';

  // --- LEVEL 1: Easy (~600 ELO) ---
  // 70% random move, 30% basic capture or checkmate if available
  if (level === 1) {
    const checkmates = moves.filter((m) => {
      chess.move(m);
      const isMate = chess.isCheckmate();
      chess.undo();
      return isMate;
    });
    if (checkmates.length > 0) return checkmates[0];

    if (Math.random() < 0.70) {
      return moves[Math.floor(Math.random() * moves.length)];
    }
    const captures = moves.filter((m) => m.captured);
    if (captures.length > 0) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // --- LEVEL 2: Medium (~1100 ELO) ---
  // 1-Ply evaluation with 30% chance of making a suboptimal move
  if (level === 2) {
    const scoredMoves = moves.map((m) => {
      chess.move(m);
      const score = evaluateBoard(chess, level);
      chess.undo();
      return { move: m, score };
    });

    scoredMoves.sort((a, b) => (isBotWhite ? b.score - a.score : a.score - b.score));

    // 30% chance to pick among top 3-4 moves for human imperfection
    if (Math.random() < 0.30 && scoredMoves.length > 1) {
      const maxRange = Math.min(scoredMoves.length, 4);
      const randomIndex = Math.floor(Math.random() * maxRange);
      return scoredMoves[randomIndex].move;
    }
    return scoredMoves[0].move;
  }

  // --- LEVEL 3: Junior (~1500 ELO) ---
  // Minimax Depth 3 with basic Alpha-Beta and Material/Position evaluation
  if (level === 3) {
    let bestMove = moves[0];
    let bestScore = isBotWhite ? -Infinity : Infinity;

    // Small mistake factor (10% chance to pick 2nd best move)
    const sortedMoves: { move: any; score: number }[] = [];

    for (const move of moves) {
      chess.move(move);
      const score = minimax(chess, profile.depth - 1, -Infinity, Infinity, !isBotWhite, level);
      chess.undo();

      sortedMoves.push({ move, score });

      if (isBotWhite) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    if (Math.random() < 0.10 && sortedMoves.length > 1) {
      sortedMoves.sort((a, b) => (isBotWhite ? b.score - a.score : a.score - b.score));
      return sortedMoves[1].move;
    }

    return bestMove;
  }

  // --- LEVEL 4: Professional (~1900 ELO) & LEVEL 5: Super Professional (~2300+ ELO) ---
  // Iterative Deepening Minimax with Alpha-Beta Pruning, Move Ordering, and positional evaluation
  let bestMove = moves[0];
  const maxDepth = profile.depth;
  const startTime = Date.now();
  const timeLimitMs = level === 5 ? 1200 : 800; // Hard time budget per move

  for (let currentDepth = 1; currentDepth <= maxDepth; currentDepth++) {
    let currentBestMove = bestMove;
    let bestScore = isBotWhite ? -Infinity : Infinity;
    const orderedList = orderMoves(chess, moves);

    for (const move of orderedList) {
      chess.move(move);
      const score = minimax(
        chess,
        currentDepth - 1,
        -Infinity,
        Infinity,
        !isBotWhite,
        level
      );
      chess.undo();

      if (isBotWhite) {
        if (score > bestScore) {
          bestScore = score;
          currentBestMove = move;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          currentBestMove = move;
        }
      }

      // Check time limit during search
      if (Date.now() - startTime > timeLimitMs) {
        break;
      }
    }

    bestMove = currentBestMove;

    // Cut off iterative deepening if time limit exceeded
    if (Date.now() - startTime > timeLimitMs) {
      break;
    }
  }

  return bestMove;
}
