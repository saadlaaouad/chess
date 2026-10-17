import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { GameMove, TimeControlOption } from '../types';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '../lib/sound';
import { addCredits } from '../lib/credits';
import { RotateCcw, Home, Bot, Zap, Shield, Sparkles, Trophy, Award } from 'lucide-react';
import { BotLevel, BOT_PROFILES, getBestBotMove } from '../lib/chessAiEngine';
import { PromotionModal, PromotionPieceOption } from './PromotionModal';

interface SoloEngineBoardProps {
  playerName: string;
  timeControl: TimeControlOption;
  onBackToLobby: () => void;
}

export const SoloEngineBoard: React.FC<SoloEngineBoardProps> = ({
  playerName,
  onBackToLobby,
}) => {
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [history, setHistory] = useState<GameMove[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [botLevel, setBotLevel] = useState<BotLevel>(3); // Default Level 3 (Junior)
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  const currentProfile = BOT_PROFILES[botLevel];
  const workerRef = useRef<Worker | null>(null);

  // Initialize Web Worker for non-blocking off-thread AI calculations
  useEffect(() => {
    try {
      workerRef.current = new Worker(new URL('../lib/chessWorker.ts', import.meta.url), {
        type: 'module',
      });
    } catch {
      workerRef.current = null;
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Helper function to calculate bot move off-thread
  const makeBotMove = (currentLevel = botLevel) => {
    if (chess.isGameOver()) return;

    setIsBotThinking(true);
    const profile = BOT_PROFILES[currentLevel];
    const currentFen = chess.fen();

    const handleBotResult = (bestMove: any) => {
      if (!bestMove) {
        setIsBotThinking(false);
        return;
      }

      const moveResult = chess.move(bestMove);
      if (moveResult) {
        setFen(chess.fen());
        setLastMove({ from: moveResult.from, to: moveResult.to });

        if (moveResult.captured) {
          playCaptureSound();
        } else {
          playMoveSound();
        }

        if (chess.inCheck()) {
          playCheckSound();
        }

        if (chess.isGameOver()) {
          playGameOverSound();
          if (chess.isCheckmate()) setGameOver(`${profile.name} wins by Checkmate!`);
          else if (chess.isStalemate()) setGameOver('Game drawn by Stalemate!');
          else setGameOver('Game drawn!');
        }

        setHistory((prev) => [
          ...prev,
          {
            from: moveResult.from,
            to: moveResult.to,
            san: moveResult.san,
            fen: chess.fen(),
            piece: moveResult.piece,
            color: playerColor === 'white' ? 'b' : 'w',
          },
        ]);
      }

      setIsBotThinking(false);
    };

    if (workerRef.current) {
      workerRef.current.onmessage = (e) => {
        const { bestMove } = e.data;
        handleBotResult(bestMove);
      };
      workerRef.current.postMessage({ fen: currentFen, level: currentLevel });
    } else {
      // Fallback if Web Workers are restricted in environment
      setTimeout(() => {
        const bestMove = getBestBotMove(chess, currentLevel);
        handleBotResult(bestMove);
      }, profile.thinkingDelayMs);
    }
  };

  const handlePieceDrop = (sourceSquare: string, targetSquare: string | null, pieceType: string): boolean => {
    const isPlayerTurn =
      (playerColor === 'white' && chess.turn() === 'w') ||
      (playerColor === 'black' && chess.turn() === 'b');

    if (!targetSquare || !isPlayerTurn || isBotThinking || gameOver) return false;

    try {
      const source = sourceSquare as Square;
      const target = targetSquare as Square;

      const moves = chess.moves({ square: source, verbose: true });
      const foundMove = moves.find((m) => m.to === target);
      if (!foundMove) return false;

      const isPromotion = foundMove.flags.includes('p');
      if (isPromotion) {
        setPendingPromotion({ from: source, to: target });
        return false;
      }

      const moveResult = chess.move({
        from: source,
        to: target,
      });

      if (!moveResult) return false;

      setFen(chess.fen());
      setLastMove({ from: sourceSquare, to: targetSquare });

      if (moveResult.captured) {
        playCaptureSound();
      } else {
        playMoveSound();
      }

      if (chess.inCheck()) {
        playCheckSound();
      }

      setHistory((prev) => [
        ...prev,
        {
          from: sourceSquare,
          to: targetSquare,
          san: moveResult.san,
          fen: chess.fen(),
          piece: moveResult.piece,
          color: playerColor === 'white' ? 'w' : 'b',
        },
      ]);

      if (chess.isGameOver()) {
        playGameOverSound();
        if (chess.isCheckmate()) {
          setGameOver(`${playerName} wins by Checkmate! 🎉 (+3 AI Credits Earned)`);
          addCredits(3, 'Practice Bot Victory');
        } else if (chess.isStalemate()) {
          setGameOver('Game drawn by Stalemate!');
        } else {
          setGameOver('Game drawn!');
        }
      } else {
        makeBotMove();
      }

      return true;
    } catch {
      return false;
    }
  };

  const handleSelectPromotion = (pieceOption: PromotionPieceOption) => {
    if (!pendingPromotion) return;

    try {
      const moveResult = chess.move({
        from: pendingPromotion.from,
        to: pendingPromotion.to,
        promotion: pieceOption,
      });

      if (moveResult) {
        setFen(chess.fen());
        setLastMove({ from: pendingPromotion.from, to: pendingPromotion.to });

        if (moveResult.captured) {
          playCaptureSound();
        } else {
          playMoveSound();
        }

        if (chess.inCheck()) {
          playCheckSound();
        }

        setHistory((prev) => [
          ...prev,
          {
            from: pendingPromotion.from,
            to: pendingPromotion.to,
            san: moveResult.san,
            fen: chess.fen(),
            piece: moveResult.piece,
            color: playerColor === 'white' ? 'w' : 'b',
          },
        ]);

        if (chess.isGameOver()) {
          playGameOverSound();
          if (chess.isCheckmate()) {
            setGameOver(`${playerName} wins by Checkmate! 🎉 (+3 AI Credits Earned)`);
            addCredits(3, 'Practice Bot Victory');
          } else if (chess.isStalemate()) {
            setGameOver('Game drawn by Stalemate!');
          } else {
            setGameOver('Game drawn!');
          }
        } else {
          makeBotMove();
        }
      }
    } catch {
      // ignore
    } finally {
      setPendingPromotion(null);
    }
  };

  const resetGame = (newColor = playerColor) => {
    chess.reset();
    setFen(chess.fen());
    setHistory([]);
    setLastMove(null);
    setGameOver(null);
    setIsBotThinking(false);

    if (newColor === 'black') {
      // If player chooses black, bot makes first move as white
      setTimeout(() => {
        makeBotMove();
      }, 300);
    }
  };

  const handleLevelSelect = (lvl: BotLevel) => {
    setBotLevel(lvl);
  };

  const levelIcons = {
    1: <Zap className="w-3.5 h-3.5" />,
    2: <Shield className="w-3.5 h-3.5" />,
    3: <Sparkles className="w-3.5 h-3.5" />,
    4: <Trophy className="w-3.5 h-3.5" />,
    5: <Award className="w-3.5 h-3.5" />,
  };

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-4 space-y-4">
      {/* Top Header */}
      <div className="bg-[#262421] border border-[#312e2b] rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#81b64c]/20 border border-[#81b64c]/40 flex items-center justify-center text-[#81b64c]">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-white text-base sm:text-lg uppercase tracking-tight">
                AI Bot Match
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/30">
                5 Difficulty Levels
              </span>
            </div>
            <p className="text-xs text-[#7d7b78]">Select AI engine level and practice tactics offline</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => resetGame()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#3c3a38] hover:bg-[#4d4b48] text-white text-xs font-bold uppercase transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={onBackToLobby}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#81b64c] hover:bg-[#a3d16e] text-[#161512] text-xs font-bold uppercase transition-all shadow-sm"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Lobby</span>
          </button>
        </div>
      </div>

      {/* 5 Difficulty Level Selector Bar */}
      <div className="bg-[#262421] border border-[#312e2b] rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase text-[#7d7b78] tracking-wider flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#81b64c]" /> Select Engine Difficulty:
          </span>
          <span className="text-xs text-[#81b64c] font-semibold">
            Current: {currentProfile.name} ({currentProfile.rating} ELO)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {([1, 2, 3, 4, 5] as BotLevel[]).map((lvl) => {
            const prof = BOT_PROFILES[lvl];
            const isSelected = botLevel === lvl;

            return (
              <button
                key={lvl}
                onClick={() => handleLevelSelect(lvl)}
                className={`p-2.5 rounded-lg border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#3c3a38] border-[#81b64c] ring-1 ring-[#81b64c]/50 shadow-md'
                    : 'bg-[#161512] border-[#312e2b] hover:border-[#4d4b48]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{prof.avatar}</span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ${prof.color}`}
                  >
                    Level {lvl}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-xs text-white truncate">{prof.title}</div>
                  <div className="text-[11px] text-[#7d7b78] font-mono">{prof.rating} ELO</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Game Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-3">
          {/* Bot Info Card */}
          <div className="bg-[#262421] border border-[#312e2b] p-3 rounded-xl flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#3c3a38] flex items-center justify-center text-xl border border-[#4d4b48]">
                {currentProfile.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{currentProfile.name}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${currentProfile.color}`}>
                    {currentProfile.rating} ELO
                  </span>
                </div>
                <p className="text-xs text-[#7d7b78] line-clamp-1">{currentProfile.description}</p>
              </div>
            </div>

            {isBotThinking && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#81b64c]/10 border border-[#81b64c]/30 text-[#81b64c] text-xs font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-[#81b64c]" />
                <span>Thinking...</span>
              </div>
            )}
          </div>

          {/* Board Container */}
          <div className="aspect-square max-w-[520px] mx-auto rounded-xl overflow-hidden shadow-2xl border-4 border-[#262421] bg-[#262421] relative">
            <Chessboard
              options={{
                position: fen,
                boardOrientation: playerColor,
                onPieceDrop: ({ piece, sourceSquare, targetSquare }) => {
                  return handlePieceDrop(sourceSquare, targetSquare, piece.pieceType);
                },
                darkSquareStyle: { backgroundColor: '#779556' },
                lightSquareStyle: { backgroundColor: '#ebecd0' },
              }}
            />

            <PromotionModal
              isOpen={!!pendingPromotion}
              color={playerColor}
              onSelectPiece={handleSelectPromotion}
              onCancel={() => setPendingPromotion(null)}
            />
          </div>

          {/* Player Info Card */}
          <div className="bg-[#262421] border border-[#312e2b] p-3 rounded-xl flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#ebecd0] text-[#161512] flex items-center justify-center font-black text-sm border border-[#312e2b]">
                {playerColor === 'white' ? '♔' : '♚'}
              </div>
              <div>
                <span className="font-bold text-sm text-white uppercase">{playerName} (You)</span>
                <p className="text-xs text-[#7d7b78]">Playing as {playerColor}</p>
              </div>
            </div>

            {/* Side Toggle Button */}
            <div className="flex items-center gap-1.5 bg-[#161512] p-1 rounded-lg border border-[#312e2b]">
              <button
                onClick={() => {
                  setPlayerColor('white');
                  resetGame('white');
                }}
                className={`px-2.5 py-1 rounded text-xs font-bold uppercase transition-all ${
                  playerColor === 'white'
                    ? 'bg-[#ebecd0] text-[#161512] shadow'
                    : 'text-[#7d7b78] hover:text-white'
                }`}
              >
                White
              </button>
              <button
                onClick={() => {
                  setPlayerColor('black');
                  resetGame('black');
                }}
                className={`px-2.5 py-1 rounded text-xs font-bold uppercase transition-all ${
                  playerColor === 'black'
                    ? 'bg-[#3c3a38] text-white border border-[#4d4b48] shadow'
                    : 'text-[#7d7b78] hover:text-white'
                }`}
              >
                Black
              </button>
            </div>
          </div>
        </div>

        {/* Moves & Bot Info Panel */}
        <div className="bg-[#262421] border border-[#312e2b] rounded-xl p-4 flex flex-col justify-between h-[520px] shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#312e2b]">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <span>Move History</span>
                <span className="px-1.5 py-0.5 rounded bg-[#3c3a38] text-[#bababa] text-[10px]">
                  {history.length} moves
                </span>
              </h3>
            </div>

            <div className="overflow-y-auto max-h-[360px] space-y-1.5 font-mono text-xs pr-1">
              {history.length === 0 ? (
                <div className="text-center text-[#7d7b78] italic py-8 text-xs">
                  Make your first move to begin the match!
                </div>
              ) : (
                history.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-[#161512] rounded-lg border border-[#312e2b] text-[#bababa] flex items-center justify-between"
                  >
                    <span className="text-[#7d7b78] text-[11px] font-bold">
                      #{Math.floor(idx / 2) + 1}
                      {idx % 2 === 0 ? '. White' : '. Black'}
                    </span>
                    <span className="font-extrabold text-white tracking-wide">{m.san}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {gameOver ? (
            <div className="p-3 bg-[#2d3a20] border border-[#81b64c]/50 rounded-xl text-[#81b64c] font-bold text-xs text-center uppercase shadow-md animate-bounce">
              🏆 {gameOver}
            </div>
          ) : (
            <div className="p-3 bg-[#161512] border border-[#312e2b] rounded-xl text-center">
              <span className="text-xs text-[#7d7b78] block mb-1 font-semibold">Active Bot Profile:</span>
              <span className="text-xs font-bold text-white">
                Level {botLevel}: {currentProfile.title} ({currentProfile.rating} ELO)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

