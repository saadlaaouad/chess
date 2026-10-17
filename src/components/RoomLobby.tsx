import React, { useState, useEffect } from 'react';
import { PlayerColor, TimeControlOption } from '../types';
import { Swords, PlusCircle, LogIn, Clock, Crown, Sparkles, User, Bot, Zap } from 'lucide-react';

interface RoomLobbyProps {
  onCreateRoom: (data: {
    name: string;
    colorPreference: PlayerColor;
    timeControl: TimeControlOption;
    customCode?: string;
  }) => void;
  onJoinRoom: (roomId: string, name: string) => void;
  onFindQuickMatch?: (name: string, timeControl: TimeControlOption) => void;
  onStartSoloBot?: (name: string, timeControl: TimeControlOption) => void;
  error?: string | null;
  initialRoomCode?: string;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  onCreateRoom,
  onJoinRoom,
  onFindQuickMatch,
  onStartSoloBot,
  error,
  initialRoomCode = '',
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chess_player_name') || 'Grandmaster';
    }
    return 'Grandmaster';
  });

  // Create Form State
  const [colorPreference, setColorPreference] = useState<PlayerColor>('random');
  const [timeControl, setTimeControl] = useState<TimeControlOption>('5+3');
  const [quickTimeControl, setQuickTimeControl] = useState<TimeControlOption>('5+3');
  const [customCode, setCustomCode] = useState('');

  // Join Form State
  const [joinCode, setJoinCode] = useState(initialRoomCode);

  useEffect(() => {
    if (initialRoomCode) {
      setJoinCode(initialRoomCode);
      setActiveTab('join');
    }
  }, [initialRoomCode]);

  const handleNameChange = (val: string) => {
    setPlayerName(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chess_player_name', val);
    }
  };

  const handleQuickMatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !onFindQuickMatch) return;
    onFindQuickMatch(playerName.trim(), quickTimeControl);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    onCreateRoom({
      name: playerName.trim(),
      colorPreference,
      timeControl,
      customCode: customCode.trim() || undefined,
    });
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !playerName.trim()) return;
    onJoinRoom(joinCode.trim().toLowerCase(), playerName.trim());
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-[#262421] border border-[#312e2b] rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#81b64c]" />

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-[#81b64c] text-[#161512] shadow-md mb-2">
            <Swords className="w-7 h-7 text-[#161512]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Grandmaster<span className="text-[#81b64c]">Multi</span> Arena
          </h1>
          <p className="text-xs md:text-sm text-[#7d7b78] max-w-sm mx-auto font-medium">
            Real-time online chess arena with quick matchmaking, room creation, clock controls, and instant rematches.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-950/80 border border-red-500/50 text-red-300 text-xs md:text-sm font-semibold text-center">
            ⚠️ {error}
          </div>
        )}

        {/* User Display Name Input */}
        <div className="mb-6 space-y-1.5">
          <label className="text-xs font-bold text-[#7d7b78] uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-[#81b64c]" />
            Your Player Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Enter your username"
            maxLength={25}
            className="w-full bg-[#161512] text-white px-4 py-2.5 rounded-md border border-[#312e2b] focus:border-[#81b64c] focus:outline-none font-semibold text-sm"
          />
        </div>

        {/* QUICK MATCH HERO CARD */}
        {onFindQuickMatch && (
          <div className="mb-6 p-4 rounded-xl bg-[#2d3a20] border border-[#81b64c]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#81b64c] fill-[#81b64c]" />
                <span className="font-extrabold text-sm text-white uppercase tracking-wider">Quick Play Matchmaking</span>
              </div>
              <span className="text-[10px] bg-[#81b64c]/20 text-[#81b64c] px-2 py-0.5 rounded font-bold uppercase border border-[#81b64c]/30">
                Random Opponent
              </span>
            </div>

            <p className="text-xs text-[#bababa]">
              Click below to automatically search and pair with an active online chess player in real time.
            </p>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase text-[#7d7b78] whitespace-nowrap">Mode:</span>
              <div className="grid grid-cols-4 gap-1.5 flex-1">
                {[
                  { id: '3+0', label: '3 min' },
                  { id: '5+0', label: '5 min' },
                  { id: '5+3', label: '5 + 3s' },
                  { id: '10+0', label: '10 min' },
                ].map((tc) => (
                  <button
                    key={tc.id}
                    type="button"
                    onClick={() => setQuickTimeControl(tc.id as TimeControlOption)}
                    className={`py-1 rounded text-center text-xs font-bold transition-all ${
                      quickTimeControl === tc.id
                        ? 'bg-[#81b64c] text-[#161512]'
                        : 'bg-[#161512] text-[#bababa] border border-[#312e2b] hover:border-[#81b64c]/50'
                    }`}
                  >
                    {tc.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickMatchSubmit}
              disabled={!playerName.trim()}
              className="w-full py-3 rounded-lg bg-[#81b64c] hover:bg-[#a3d16e] text-[#161512] font-black text-sm uppercase tracking-wider transition-colors border-b-4 border-[#5a8035] active:border-b-0 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-[#161512]" />
              <span>Find Random Match</span>
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#161512] rounded-lg border border-[#312e2b] mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`py-2 rounded-md font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'create'
                ? 'bg-[#81b64c] text-[#161512] shadow'
                : 'text-[#7d7b78] hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Match</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`py-2 rounded-md font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'join'
                ? 'bg-[#81b64c] text-[#161512] shadow'
                : 'text-[#7d7b78] hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Join via Code</span>
          </button>
        </div>

        {/* CREATE MATCH TAB */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="space-y-6">
            {/* Preferred Color */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#7d7b78] uppercase tracking-wider">Play As</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setColorPreference('white')}
                  className={`p-3 rounded-lg border font-bold text-xs md:text-sm flex flex-col items-center gap-1 transition-all ${
                    colorPreference === 'white'
                      ? 'bg-[#ebecd0] text-[#161512] border-white ring-2 ring-[#81b64c]'
                      : 'bg-[#161512] text-[#bababa] border-[#312e2b] hover:border-[#3c3a38]'
                  }`}
                >
                  <span className="text-xl">♔</span>
                  <span>White</span>
                </button>

                <button
                  type="button"
                  onClick={() => setColorPreference('random')}
                  className={`p-3 rounded-lg border font-bold text-xs md:text-sm flex flex-col items-center gap-1 transition-all ${
                    colorPreference === 'random'
                      ? 'bg-[#2d3a20] text-[#81b64c] border-[#81b64c] ring-2 ring-[#81b64c]'
                      : 'bg-[#161512] text-[#bababa] border-[#312e2b] hover:border-[#3c3a38]'
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-[#81b64c]" />
                  <span>Random</span>
                </button>

                <button
                  type="button"
                  onClick={() => setColorPreference('black')}
                  className={`p-3 rounded-lg border font-bold text-xs md:text-sm flex flex-col items-center gap-1 transition-all ${
                    colorPreference === 'black'
                      ? 'bg-[#3c3a38] text-white border-[#4d4b48] ring-2 ring-[#81b64c]'
                      : 'bg-[#161512] text-[#bababa] border-[#312e2b] hover:border-[#3c3a38]'
                  }`}
                >
                  <span className="text-xl">♚</span>
                  <span>Black</span>
                </button>
              </div>
            </div>

            {/* Time Control Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#7d7b78] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#81b64c]" />
                Time Control
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: '1+0', label: '1 min', desc: 'Bullet' },
                  { id: '3+0', label: '3 min', desc: 'Blitz' },
                  { id: '3+2', label: '3 + 2s', desc: 'Blitz' },
                  { id: '5+0', label: '5 min', desc: 'Blitz' },
                  { id: '5+3', label: '5 + 3s', desc: 'Blitz' },
                  { id: '10+0', label: '10 min', desc: 'Rapid' },
                  { id: '15+10', label: '15 + 10s', desc: 'Rapid' },
                  { id: 'unlimited', label: 'Unlimited', desc: 'Casual' },
                ].map((tc) => (
                  <button
                    key={tc.id}
                    type="button"
                    onClick={() => setTimeControl(tc.id as TimeControlOption)}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      timeControl === tc.id
                        ? 'bg-[#2d3a20] border-[#81b64c] text-[#81b64c] ring-1 ring-[#81b64c]'
                        : 'bg-[#161512] text-[#7d7b78] border-[#312e2b] hover:border-[#3c3a38]'
                    }`}
                  >
                    <div className="font-bold text-xs md:text-sm">{tc.label}</div>
                    <div className="text-[10px] text-[#7d7b78]">{tc.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Code Option */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#7d7b78] flex items-center justify-between">
                <span>Custom Room Code (Optional)</span>
                <span className="text-[10px] text-[#7d7b78]">Leave blank for auto-code</span>
              </label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="e.g. my-chess-room"
                maxLength={20}
                className="w-full bg-[#161512] text-white px-4 py-2 rounded-md border border-[#312e2b] focus:border-[#81b64c] font-mono text-xs focus:outline-none"
              />
            </div>

            {/* Submit Create */}
            <button
              type="submit"
              disabled={!playerName.trim()}
              className="w-full py-3.5 rounded-md bg-[#81b64c] hover:bg-[#a3d16e] text-[#161512] font-black text-sm uppercase tracking-wider transition-colors border-b-4 border-[#5a8035] active:border-b-0 disabled:opacity-50"
            >
              Create Game Room
            </button>
          </form>
        )}

        {/* JOIN MATCH TAB */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#7d7b78] uppercase tracking-wider">Room Code or Invite Link</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Paste room code (e.g. rk2-x91)"
                className="w-full bg-[#161512] text-white px-4 py-3 rounded-md border border-[#312e2b] focus:border-[#81b64c] font-mono text-center text-lg tracking-widest uppercase focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!joinCode.trim() || !playerName.trim()}
              className="w-full py-3.5 rounded-md bg-[#81b64c] hover:bg-[#a3d16e] text-[#161512] font-black text-sm uppercase tracking-wider transition-colors border-b-4 border-[#5a8035] active:border-b-0 disabled:opacity-50"
            >
              Join Room Now
            </button>
          </form>
        )}

        {/* Optional AI Practice Mode Footer */}
        {onStartSoloBot && (
          <div className="mt-8 pt-6 border-t border-[#312e2b] text-center">
            <button
              type="button"
              onClick={() => onStartSoloBot(playerName || 'Grandmaster', timeControl)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#161512] hover:bg-[#3c3a38] text-white text-xs font-bold border border-[#312e2b] transition-colors"
            >
              <Bot className="w-4 h-4 text-[#81b64c]" />
              <span>Practice Solo vs Chess Engine Bot</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
