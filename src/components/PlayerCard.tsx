import React from 'react';
import { Player } from '../types';
import { Clock, User, Mic, MicOff, Volume2 } from 'lucide-react';

interface PlayerCardProps {
  player: Player | null;
  color: 'white' | 'black';
  isCurrentTurn: boolean;
  capturedPieces: string[]; // pieces captured by this player
  materialDiff: number; // e.g. +3 if material advantage
  isUser: boolean;
  isVoiceConnected?: boolean;
  isMuted?: boolean;
  isSpeaking?: boolean;
}

// Convert piece letter to SVG icon symbol or unicode
const PIECE_SYMBOLS: Record<string, string> = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
  P: '♙',
  N: '♘',
  B: '♗',
  R: '♖',
  Q: '♕',
};

// Format milliseconds to MM:SS
function formatTime(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  color,
  isCurrentTurn,
  capturedPieces,
  materialDiff,
  isUser,
  isVoiceConnected,
  isMuted,
  isSpeaking,
}) => {
  const isWhite = color === 'white';
  const isLowTime = player && player.timeLeft > 0 && player.timeLeft < 30000;

  return (
    <div
      className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200 ${
        isCurrentTurn
          ? 'bg-[#262421] border-[#81b64c] shadow-md ring-1 ring-[#81b64c]'
          : 'bg-[#262421] border-[#312e2b]'
      }`}
    >
      {/* Left: Avatar & Player Info */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className={`w-8 h-8 rounded-sm flex items-center justify-center font-bold text-sm shadow-sm ${
              isSpeaking ? 'ring-2 ring-emerald-400 animate-pulse' : ''
            } ${
              isWhite
                ? 'bg-[#ebecd0] text-[#161512]'
                : 'bg-[#3c3a38] text-white'
            }`}
          >
            {isWhite ? '♔' : '♚'}
          </div>
          {player && (
            <span
              className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-[#161512] ${
                player.connected ? 'bg-[#81b64c]' : 'bg-amber-500'
              }`}
              title={player.connected ? 'Online' : 'Disconnected'}
            />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm flex items-center gap-1.5 uppercase">
              {player ? player.name : 'Waiting for player...'}
              {isUser && (
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#81b64c]/20 text-[#81b64c] font-bold border border-[#81b64c]/30">
                  You
                </span>
              )}
              {isVoiceConnected && (
                <span
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                    isMuted
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : isSpeaking
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  }`}
                >
                  {isMuted ? (
                    <MicOff className="w-2.5 h-2.5 text-rose-300" />
                  ) : isSpeaking ? (
                    <Volume2 className="w-2.5 h-2.5 text-emerald-300" />
                  ) : (
                    <Mic className="w-2.5 h-2.5 text-sky-300" />
                  )}
                  <span>{isMuted ? 'Muted' : isSpeaking ? 'Talking' : 'Voice'}</span>
                </span>
              )}
            </span>
          </div>

          {/* Captured Pieces & Material */}
          <div className="flex items-center gap-1.5 mt-0.5 min-h-[18px]">
            <div className="flex items-center -space-x-1 text-sm text-[#bababa] select-none">
              {capturedPieces.map((p, idx) => (
                <span key={idx} className="hover:z-10 transition-transform">
                  {PIECE_SYMBOLS[p] || p}
                </span>
              ))}
            </div>
            {materialDiff > 0 && (
              <span className="text-xs font-semibold px-1 py-0.2 rounded bg-[#3c3a38] text-[#81b64c] border border-[#312e2b]">
                +{materialDiff}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Timer Clock & Match Score */}
      <div className="flex items-center gap-3">
        {player && player.score > 0 && (
          <div className="text-xs font-bold px-2 py-1 bg-[#2d3a20] text-[#81b64c] border border-[#81b64c]/30 rounded-md">
            Score: {player.score}
          </div>
        )}

        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-mono font-bold text-lg md:text-xl transition-colors ${
            isLowTime
              ? 'bg-red-950 text-red-400 border border-red-500/50 animate-pulse'
              : isCurrentTurn
              ? 'bg-white text-[#161512] border border-white'
              : 'bg-[#161512] text-white border border-[#312e2b]'
          }`}
        >
          <Clock className="w-4 h-4 opacity-75" />
          <span>{player ? formatTime(player.timeLeft) : '00:00'}</span>
        </div>
      </div>
    </div>
  );
};
