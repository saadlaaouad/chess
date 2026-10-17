import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { playMoveSound, playCaptureSound, playCheckSound } from '../lib/sound';
import { AppSettings, BOARD_THEMES } from '../lib/settings';
import { PromotionModal, PromotionPieceOption } from './PromotionModal';

interface ChessBoardContainerProps {
  fen: string;
  userColor: 'white' | 'black' | 'spectator';
  boardOrientation: 'white' | 'black';
  isTurnToMove: boolean;
  onMakeMove: (move: { from: string; to: string; promotion?: string }) => void;
  lastMove: { from: string; to: string } | null;
  inCheck: boolean;
  disabled?: boolean;
  settings?: AppSettings;
}

export const ChessBoardContainer: React.FC<ChessBoardContainerProps> = ({
  fen,
  userColor,
  boardOrientation,
  isTurnToMove,
  onMakeMove,
  lastMove,
  inCheck,
  disabled,
  settings,
}) => {
  const [chess] = useState(() => new Chess(fen));
  const [moveFrom, setMoveFrom] = useState<Square | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  // Synchronize local chess engine state with FEN prop
  useEffect(() => {
    try {
      chess.load(fen);
    } catch (e) {
      console.error('Failed to load FEN:', e);
    }
  }, [fen, chess]);

  // Handle piece drop (drag and drop)
  const handlePieceDrop = (sourceSquare: string, targetSquare: string | null, pieceType: string): boolean => {
    if (!targetSquare || disabled || !isTurnToMove) return false;

    const source = sourceSquare as Square;
    const target = targetSquare as Square;

    // Check piece color vs assigned player color
    const pieceColor = pieceType[0]; // 'w' or 'b'
    if (userColor === 'white' && pieceColor !== 'w') return false;
    if (userColor === 'black' && pieceColor !== 'b') return false;

    // Validate move in local chess.js
    try {
      const moves = chess.moves({ square: source, verbose: true });
      const foundMove = moves.find((m) => m.to === target);
      if (!foundMove) return false;

      const isPromotion = foundMove.flags.includes('p');
      if (isPromotion) {
        setPendingPromotion({ from: source, to: target });
        return false;
      }

      const moveObj = {
        from: source,
        to: target,
      };

      const possibleMove = chess.move(moveObj);
      if (!possibleMove) return false;

      // Revert local move since server is authoritative source
      chess.undo();

      // Trigger sound feedback
      if (possibleMove.captured) {
        playCaptureSound();
      } else {
        playMoveSound();
      }

      if (chess.inCheck()) {
        playCheckSound();
      }

      // Send to server socket
      onMakeMove(moveObj);

      setMoveFrom(null);
      setOptionSquares({});
      return true;
    } catch {
      return false;
    }
  };

  // Click-to-move square click handler
  const handleSquareClick = (squareStr: string) => {
    if (disabled || !isTurnToMove) return;
    const square = squareStr as Square;

    if (!moveFrom) {
      const piece = chess.get(square);
      if (!piece) return;

      if (userColor === 'white' && piece.color !== 'w') return;
      if (userColor === 'black' && piece.color !== 'b') return;

      // Show legal destination squares
      const moves = chess.moves({ square, verbose: true });
      if (moves.length === 0) return;

      const newSquares: Record<string, React.CSSProperties> = {
        [square]: { background: 'rgba(255, 255, 0, 0.4)' },
      };

      if (settings?.highlightLegalMoves !== false) {
        moves.forEach((move) => {
          const dest = move.to;
          const targetPiece = chess.get(dest as Square);
          newSquares[dest] = {
            background: targetPiece
              ? 'radial-gradient(circle, rgba(239, 68, 68, 0.8) 85%, transparent 85%)'
              : 'radial-gradient(circle, rgba(16, 185, 129, 0.6) 25%, transparent 25%)',
            borderRadius: '50%',
          };
        });
      }

      setMoveFrom(square);
      setOptionSquares(newSquares);
      return;
    }

    // Try executing move from moveFrom to clicked square
    const moves = chess.moves({ square: moveFrom, verbose: true });
    const foundMove = moves.find((m) => m.to === square);

    if (foundMove) {
      const isPromotion = foundMove.flags.includes('p');
      if (isPromotion) {
        setPendingPromotion({ from: moveFrom, to: square });
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }

      onMakeMove({
        from: moveFrom,
        to: square,
      });

      if (foundMove.captured) {
        playCaptureSound();
      } else {
        playMoveSound();
      }

      setMoveFrom(null);
      setOptionSquares({});
    } else {
      // Re-select if clicking another piece of same color
      const newPiece = chess.get(square);
      if (
        newPiece &&
        ((userColor === 'white' && newPiece.color === 'w') ||
          (userColor === 'black' && newPiece.color === 'b'))
      ) {
        setMoveFrom(null);
        handleSquareClick(squareStr);
      } else {
        setMoveFrom(null);
        setOptionSquares({});
      }
    }
  };

  const handleSelectPromotion = (pieceOption: PromotionPieceOption) => {
    if (!pendingPromotion) return;

    const moveObj = {
      from: pendingPromotion.from,
      to: pendingPromotion.to,
      promotion: pieceOption,
    };

    try {
      const possibleMove = chess.move(moveObj);
      if (possibleMove) {
        chess.undo(); // undo local move test since server is authoritative source

        if (possibleMove.captured) {
          playCaptureSound();
        } else {
          playMoveSound();
        }

        if (chess.inCheck()) {
          playCheckSound();
        }

        onMakeMove(moveObj);
      }
    } catch (e) {
      console.error('Promotion move execution error:', e);
    } finally {
      setPendingPromotion(null);
      setMoveFrom(null);
      setOptionSquares({});
    }
  };

  // Active Board Theme Colors
  const activeThemeId = settings?.boardTheme || 'classic';
  const activeTheme = BOARD_THEMES[activeThemeId] || BOARD_THEMES.classic;

  // Compute square styles for last move & check
  const customSquareStyles: Record<string, React.CSSProperties> = { ...optionSquares };

  if (lastMove) {
    customSquareStyles[lastMove.from] = {
      backgroundColor: 'rgba(251, 191, 36, 0.35)',
    };
    customSquareStyles[lastMove.to] = {
      backgroundColor: 'rgba(251, 191, 36, 0.45)',
    };
  }

  // Highlight King in check
  if (inCheck) {
    const board = chess.board();
    const currentTurnColor = chess.turn(); // 'w' or 'b'
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === currentTurnColor) {
          const file = String.fromCharCode(97 + c);
          const rank = 8 - r;
          const square = `${file}${rank}`;
          customSquareStyles[square] = {
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            boxShadow: 'inset 0 0 10px 3px rgba(185, 28, 28, 1)',
          };
        }
      }
    }
  }

  return (
    <div className="w-full max-w-[560px] mx-auto aspect-square rounded-none overflow-hidden border-4 border-[#262421] bg-[#262421] shadow-2xl relative">
      <Chessboard
        options={{
          position: fen,
          boardOrientation,
          allowDragging: !disabled && isTurnToMove && userColor !== 'spectator',
          onPieceDrop: ({ piece, sourceSquare, targetSquare }) => {
            return handlePieceDrop(sourceSquare, targetSquare, piece.pieceType);
          },
          onSquareClick: ({ square }) => {
            handleSquareClick(square);
          },
          squareStyles: customSquareStyles,
          darkSquareStyle: { backgroundColor: activeTheme.darkSquare },
          lightSquareStyle: { backgroundColor: activeTheme.lightSquare },
        }}
      />

      <PromotionModal
        isOpen={!!pendingPromotion}
        color={userColor === 'black' ? 'black' : 'white'}
        onSelectPiece={handleSelectPromotion}
        onCancel={() => setPendingPromotion(null)}
      />
    </div>
  );
};
