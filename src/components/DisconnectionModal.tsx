import React, { useEffect, useState } from 'react';
import { UserX, Trophy, Home, Swords } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DisconnectionModalProps {
  disconnectedPlayerName: string;
  winnerColor: 'white' | 'black';
  userColor: 'white' | 'black' | 'spectator';
  onReturnToLobby: () => void;
  onFindNewMatch?: () => void;
}

export const DisconnectionModal: React.FC<DisconnectionModalProps> = ({
  disconnectedPlayerName,
  winnerColor,
  userColor,
  onReturnToLobby,
  onFindNewMatch,
}) => {
  const isWinner = winnerColor === userColor;
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (isWinner) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti effect error catch
      }
    }
  }, [isWinner]);

  // Auto-redirect timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onReturnToLobby();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onReturnToLobby]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#262421] border border-[#312e2b] rounded-xl p-6 max-w-md w-full shadow-2xl space-y-6 text-center relative overflow-hidden">
        {/* Top Accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg text-amber-500 bg-amber-500" />

        {/* Icon & Title */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg">
            <UserX className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
              Opponent Left Match
            </span>
            <h3 className="text-xl font-black text-white uppercase tracking-tight mt-1">
              Game Ended by Forfeit
            </h3>
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-[#161512] border border-[#312e2b] rounded-lg p-4 space-y-2 text-left">
          <div className="text-xs text-[#bababa]">
            Player <strong className="text-white">{disconnectedPlayerName || 'Opponent'}</strong> disconnected or left the game session.
          </div>

          <div className="pt-2 border-t border-[#312e2b] flex items-center justify-between text-xs font-bold">
            <span className="text-[#7d7b78] uppercase text-[10px]">Match Result:</span>
            <span className="text-[#81b64c] flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              {isWinner ? 'You win by default!' : `${winnerColor.toUpperCase()} won by forfeit`}
            </span>
          </div>
        </div>

        {/* Auto Return Countdown Bar */}
        <div className="text-[11px] text-[#7d7b78] flex items-center justify-between font-mono px-1">
          <span>Auto returning to lobby in:</span>
          <span className="font-bold text-amber-400">{countdown}s</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {onFindNewMatch && (
            <button
              onClick={onFindNewMatch}
              className="w-full py-3 bg-[#81b64c] hover:bg-[#a3d16e] text-[#161512] font-black text-xs uppercase tracking-wider rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2 border-b-2 border-[#5a8035]"
            >
              <Swords className="w-4 h-4" />
              <span>Find Next Opponent</span>
            </button>
          )}

          <button
            onClick={onReturnToLobby}
            className="w-full py-2.5 bg-[#3c3a38] hover:bg-[#4d4b48] text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 border border-[#4d4b48]"
          >
            <Home className="w-4 h-4" />
            <span>Return to Lobby Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
