import React, { useEffect } from 'react';
import { RoomState, GameOverReason } from '../types';
import { Trophy, Swords, RotateCcw, Home, Flag, Check, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  roomState: RoomState;
  userColor: 'white' | 'black' | 'spectator';
  onRequestRematch: () => void;
  onRespondRematch: (accept: boolean) => void;
  onLeaveRoom: () => void;
}

function getReasonLabel(reason: GameOverReason | null): string {
  switch (reason) {
    case 'checkmate':
      return 'by checkmate';
    case 'timeout':
      return 'on time (clock expired)';
    case 'resignation':
      return 'by resignation';
    case 'stalemate':
      return 'by stalemate (no legal moves)';
    case 'threefold':
      return 'by 3-fold repetition';
    case 'insufficient':
      return 'due to insufficient material';
    case '50-move':
      return 'by 50-move rule';
    case 'draw_agreed':
      return 'by mutual agreement';
    default:
      return 'game ended';
  }
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  roomState,
  userColor,
  onRequestRematch,
  onRespondRematch,
  onLeaveRoom,
}) => {
  const winner = roomState.winner; // 'white' | 'black' | 'draw' | null
  const isDraw = winner === 'draw';
  const isWinner = winner === userColor;

  const rematchRequestedBy = roomState.rematchRequestedBy;
  const isOpponentRematchRequest = rematchRequestedBy && rematchRequestedBy !== userColor;
  const isUserRematchRequest = rematchRequestedBy && rematchRequestedBy === userColor;

  useEffect(() => {
    if (isWinner) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti effect catch
      }
    }
  }, [isWinner]);

  let title = 'Game Over';
  if (isDraw) {
    title = 'Game Drawn!';
  } else if (isWinner) {
    title = 'Victory!';
  } else if (userColor !== 'spectator') {
    title = 'Defeat!';
  } else {
    title = `${winner?.toUpperCase()} Wins!`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-[#262421] w-[400px] max-w-full rounded-xl border border-[#312e2b] shadow-2xl overflow-hidden">
        {/* Banner */}
        <div className="bg-[#81b64c] p-5 text-center text-[#161512]">
          <h2 className="text-2xl font-black italic uppercase tracking-tight">{title}</h2>
          <p className="font-bold text-xs uppercase tracking-wider">{getReasonLabel(roomState.gameOverReason)}</p>
        </div>

        <div className="p-5 space-y-5">
          {/* Scoreboard summary */}
          <div className="grid grid-cols-2 gap-2 bg-[#161512] p-3 rounded-md border border-[#312e2b]">
            <div className="text-center border-r border-[#312e2b] pr-2">
              <div className="text-[10px] uppercase text-[#7d7b78] font-bold">White</div>
              <div className="text-sm font-bold text-white truncate">{roomState.players.white?.name || 'Player 1'}</div>
              <div className="text-xs text-[#81b64c] font-bold font-mono">Score: {roomState.players.white?.score || 0}</div>
            </div>
            <div className="text-center pl-2">
              <div className="text-[10px] uppercase text-[#7d7b78] font-bold">Black</div>
              <div className="text-sm font-bold text-white truncate">{roomState.players.black?.name || 'Player 2'}</div>
              <div className="text-xs text-[#81b64c] font-bold font-mono">Score: {roomState.players.black?.score || 0}</div>
            </div>
          </div>

          {/* Rematch Controls */}
          <div className="flex flex-col gap-2">
            {isOpponentRematchRequest ? (
              <div className="bg-[#2d3a20] border border-[#81b64c]/40 rounded-lg p-3 text-center space-y-2">
                <p className="text-xs font-bold text-[#81b64c]">
                  Opponent requested a rematch!
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onRespondRematch(true)}
                    className="flex-1 py-2 bg-[#81b64c] hover:bg-[#a3d16e] text-[#161512] font-black text-xs uppercase rounded"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onRespondRematch(false)}
                    className="flex-1 py-2 bg-[#3c3a38] hover:bg-[#4d4b48] text-white font-bold text-xs uppercase rounded"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ) : isUserRematchRequest ? (
              <div className="p-3 bg-[#161512] border border-[#81b64c]/40 rounded-lg text-xs text-[#81b64c] font-bold text-center flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Rematch request sent...</span>
              </div>
            ) : userColor !== 'spectator' ? (
              <button
                onClick={onRequestRematch}
                className="w-full bg-[#81b64c] text-[#161512] font-black py-3 rounded-lg text-sm uppercase tracking-wider hover:bg-[#a3d16e] transition-colors shadow-lg"
              >
                OFFER REMATCH
              </button>
            ) : null}

            <button
              onClick={onLeaveRoom}
              className="w-full bg-[#3c3a38] text-white py-2.5 rounded-lg font-bold text-xs uppercase hover:bg-[#4d4b48] transition-colors"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
