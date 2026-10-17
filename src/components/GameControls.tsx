import React, { useState } from 'react';
import { RoomState } from '../types';
import { Flag, Handshake, RotateCcw, Share2, Copy, Check, Volume2, VolumeX, Eye } from 'lucide-react';
import { setSoundMuted, getSoundMuted } from '../lib/sound';

interface GameControlsProps {
  roomState: RoomState;
  userColor: 'white' | 'black' | 'spectator';
  onResign: () => void;
  onOfferDraw: () => void;
  onRequestRematch: () => void;
  onFlipBoard: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  roomState,
  userColor,
  onResign,
  onOfferDraw,
  onRequestRematch,
  onFlipBoard,
}) => {
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(getSoundMuted());
  const [showShareModal, setShowShareModal] = useState(false);

  const isPlayer = userColor === 'white' || userColor === 'black';
  const isActive = roomState.status === 'active';
  const isEnded = roomState.status === 'ended';

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}?room=${roomState.roomId}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  };

  return (
    <div className="bg-[#262421] border border-[#312e2b] rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 shadow-md">
      {/* Left Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Flip Board */}
        <button
          onClick={onFlipBoard}
          className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#3c3a38] hover:bg-[#4d4b48] text-white text-xs font-bold uppercase transition-colors"
          title="Flip Chess Board View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Flip</span>
        </button>

        {/* Toggle Sound */}
        <button
          onClick={toggleSound}
          className="p-2 rounded bg-[#3c3a38] hover:bg-[#4d4b48] text-white text-xs transition-colors"
          title={muted ? 'Unmute Sounds' : 'Mute Sounds'}
        >
          {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#81b64c]" />}
        </button>

        {/* Share Invite Link */}
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#2d3a20] hover:bg-[#3d4d2e] text-[#81b64c] text-xs font-bold uppercase border border-[#81b64c]/30 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Invite</span>
        </button>
      </div>

      {/* Right In-Game Action Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {isPlayer && isActive && (
          <>
            <button
              onClick={onOfferDraw}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-[#3c3a38] hover:bg-[#4d4b48] text-white text-xs font-bold uppercase transition-colors"
            >
              <Handshake className="w-3.5 h-3.5 text-[#81b64c]" />
              <span>Draw</span>
            </button>

            <button
              onClick={onResign}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#3c3a38] hover:bg-[#4d4b48] text-white text-xs font-bold uppercase transition-colors border-b-2 border-[#2b2926] active:border-b-0"
            >
              <Flag className="w-3.5 h-3.5 text-red-400" />
              <span>Resign</span>
            </button>
          </>
        )}

        {isPlayer && isEnded && (
          <button
            onClick={onRequestRematch}
            className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#81b64c] hover:bg-[#a3d16e] text-[#161512] font-black text-xs uppercase shadow transition-all border-b-2 border-[#5a8035] active:border-b-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rematch</span>
          </button>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#262421] border border-[#312e2b] rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#81b64c]" />
                Share Room Link
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-[#7d7b78] hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#7d7b78] leading-relaxed">
              Share this unique room code or invite link with your friend to start playing instantly.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-[#7d7b78]">Room Code</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#161512] border border-[#312e2b] rounded px-3 py-2 font-mono text-center font-bold text-lg text-[#81b64c] tracking-wider">
                  {roomState.roomId}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-[#7d7b78]">Invite Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-[#161512] border border-[#312e2b] text-white text-xs rounded px-2 font-mono outline-none py-2"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 bg-[#3c3a38] text-white text-xs rounded hover:bg-[#4d4b48] transition-colors font-bold flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4 text-[#81b64c]" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2 bg-[#3c3a38] hover:bg-[#4d4b48] text-white rounded font-bold text-xs uppercase transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
