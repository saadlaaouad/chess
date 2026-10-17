import React, { useState, useEffect } from 'react';
import { Swords, Volume2, VolumeX, LogOut, Users, Settings, Bot, Sparkles, ShoppingBag } from 'lucide-react';
import { getCredits, subscribeCredits } from '../lib/credits';

interface NavbarProps {
  roomId?: string;
  connected: boolean;
  spectatorCount?: number;
  onLeaveRoom?: () => void;
  onToggleSound?: () => void;
  onOpenSettings?: () => void;
  onOpenAiCoach?: () => void;
  onOpenStore?: () => void;
  isMuted?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomId,
  connected,
  spectatorCount = 0,
  onLeaveRoom,
  onToggleSound,
  onOpenSettings,
  onOpenAiCoach,
  onOpenStore,
  isMuted,
}) => {
  const [credits, setCredits] = useState(getCredits());

  useEffect(() => {
    const unsubscribe = subscribeCredits(setCredits);
    return () => unsubscribe();
  }, []);

  return (
    <header className="bg-[#262421] border-b border-[#312e2b] sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#81b64c] flex items-center justify-center text-[#161512] font-bold shadow-sm">
            <Swords className="w-4 h-4 text-[#161512]" />
          </div>
          <div>
            <div className="font-bold text-white text-base leading-none tracking-tight flex items-center gap-1.5">
              <span>Grandmaster<span className="text-[#81b64c]">Multi</span></span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#2d3a20] text-[#81b64c] border border-[#81b64c]/30">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-[#81b64c] animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className="text-[11px] text-[#7d7b78] font-medium">
                {connected ? 'Live Multi-User' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Room Code Info */}
        {roomId && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded bg-[#161512] border border-[#312e2b]">
            <span className="text-xs text-[#7d7b78] font-medium uppercase text-[10px] font-bold">Room:</span>
            <span className="font-mono font-bold text-xs text-[#81b64c] tracking-wider uppercase">
              {roomId}
            </span>
            {spectatorCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-[#7d7b78] pl-2 border-l border-[#312e2b]">
                <Users className="w-3 h-3 text-[#7d7b78]" />
                <span>{spectatorCount}</span>
              </span>
            )}
          </div>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* AI Coach Button */}
          {onOpenAiCoach && (
            <button
              onClick={onOpenAiCoach}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40 transition-all shadow-sm"
              title="Open AI Chess Coach"
            >
              <Bot className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">AI Coach</span>
            </button>
          )}

          {/* Credits Store Badge */}
          {onOpenStore && (
            <button
              onClick={onOpenStore}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#3c3a38] hover:bg-[#4d4b48] border border-[#4d4b48] text-white text-xs font-black transition-all"
              title="Buy Credits Store"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-black">{credits}</span>
              <span className="hidden xs:inline text-[10px] text-[#bababa] uppercase">Credits</span>
              <ShoppingBag className="w-3 h-3 text-amber-400 ml-0.5" />
            </button>
          )}

          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="p-1.5 rounded bg-[#3c3a38] hover:bg-[#4d4b48] text-[#bababa] transition-colors border border-[#312e2b]"
              title={isMuted ? 'Unmute Sounds' : 'Mute Sounds'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#81b64c]" />}
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded bg-[#3c3a38] hover:bg-[#4d4b48] text-[#bababa] hover:text-white transition-colors border border-[#312e2b]"
              title="Application Settings / الإعدادات"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {roomId && onLeaveRoom && (
            <button
              onClick={onLeaveRoom}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#3c3a38] hover:bg-[#4d4b48] text-white text-xs font-bold transition-colors border border-[#312e2b]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Leave Room</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
