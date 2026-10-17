import { Chess } from 'chess.js';
import { BotLevel, getBestBotMove } from './chessAiEngine';

self.onmessage = (e: MessageEvent<{ fen: string; level: BotLevel }>) => {
  const { fen, level } = e.data;
  try {
    const chess = new Chess(fen);
    const bestMove = getBestBotMove(chess, level);
    self.postMessage({ bestMove });
  } catch (err) {
    self.postMessage({ bestMove: null, error: String(err) });
  }
};
