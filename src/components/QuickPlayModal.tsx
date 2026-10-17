import React, { useState, useEffect } from 'react';
import { TimeControlOption } from '../types';
import { Swords, X, Loader2, Clock, Shield } from 'lucide-react';

interface QuickPlayModalProps {
  playerName: string;
  timeControl: TimeControlOption;
  onCancel: () => void;
}

export const QuickPlayModal: React.FC<QuickPlayModalProps> = ({
  playerName,
  timeControl,
  onCancel,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#262421] border border-[#312e2b] rounded-xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center space-y-6">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#81b64c] animate-pulse" />

        {/* Animated Radar Pulse Container */}
        <div className="relative flex items-center justify-center py-4">
          <div className="absolute w-28 h-28 rounded-full bg-[#81b64c]/10 animate-ping pointer-events-none" />
          <div className="absolute w-20 h-20 rounded-full bg-[#81b64c]/20 animate-pulse pointer-events-none" />
          <div className="w-16 h-16 rounded-full bg-[#81b64c] text-[#161512] flex items-center justify-center shadow-lg relative z-10">
            <Swords className="w-8 h-8 animate-bounce text-[#161512]" />
          </div>
        </div>

        {/* Status Text */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2d3a20] text-[#81b64c] font-bold text-xs uppercase tracking-wider border border-[#81b64c]/30">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Searching for Opponent</span>
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">
            Quick Match Queue
          </h3>
          <p className="text-xs text-[#7d7b78]">
            Pairing you with a live online chess player worldwide...
          </p>
        </div>

        {/* Search Info Card */}
        <div className="bg-[#161512] rounded-lg border border-[#312e2b] p-4 grid grid-cols-2 gap-3 text-left">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#7d7b78] flex items-center gap-1">
              <Shield className="w-3 h-3 text-[#81b64c]" /> Player Name
            </span>
            <div className="font-bold text-xs text-white truncate">{playerName}</div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#7d7b78] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#81b64c]" /> Time Control
            </span>
            <div className="font-bold text-xs text-[#81b64c]">{timeControl}</div>
          </div>

          <div className="col-span-2 pt-2 border-t border-[#312e2b] flex items-center justify-between text-xs font-mono">
            <span className="text-[#7d7b78]">Search Duration:</span>
            <span className="font-bold text-white tracking-wider">{formatSeconds(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="w-full py-3 rounded-lg bg-[#3c3a38] hover:bg-[#4d4b48] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border border-[#4d4b48]"
        >
          <X className="w-4 h-4 text-red-400" />
          <span>Cancel Search</span>
        </button>
      </div>
    </div>
  );
};
