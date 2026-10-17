import React from 'react';
import { Mic, MicOff, PhoneCall, PhoneOff, Volume2, VolumeX, AlertTriangle, Radio } from 'lucide-react';

interface VoiceChatControlsProps {
  isVoiceActive: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  remoteMuted: boolean;
  remoteSpeaking: boolean;
  isPeerConnected: boolean;
  micPermissionError: string | null;
  onStartVoice: () => void;
  onStopVoice: () => void;
  onToggleMute: () => void;
  isSpectator: boolean;
}

export const VoiceChatControls: React.FC<VoiceChatControlsProps> = ({
  isVoiceActive,
  isMuted,
  isSpeaking,
  remoteMuted,
  remoteSpeaking,
  isPeerConnected,
  micPermissionError,
  onStartVoice,
  onStopVoice,
  onToggleMute,
  isSpectator,
}) => {
  if (isSpectator) return null;

  return (
    <div className="bg-[#262421] border border-[#312e2b] rounded-xl p-3 space-y-2.5 shadow-md">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isVoiceActive
                ? isPeerConnected
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-500 animate-ping'
                : 'bg-neutral-600'
            }`}
          />
          <span className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#81b64c]" />
            Live Voice Chat
          </span>
        </div>

        {/* Status Pill */}
        {isVoiceActive && (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
              isPeerConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {isPeerConnected ? 'Connected P2P' : 'Connecting...'}
          </span>
        )}
      </div>

      {/* Main Controls Row */}
      <div className="flex items-center gap-2">
        {!isVoiceActive ? (
          <button
            onClick={onStartVoice}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#81b64c] hover:bg-[#a3d16e] text-[#161512] font-black text-xs uppercase tracking-wide rounded-lg transition-all shadow-sm"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Join Live Voice</span>
          </button>
        ) : (
          <>
            {/* Mic Toggle Button */}
            <button
              onClick={onToggleMute}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wide transition-all shadow-sm border ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                  : isSpeaking
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 ring-2 ring-emerald-500/40'
                  : 'bg-[#3c3a38] text-white border-[#4d4b48] hover:bg-[#4d4b48]'
              }`}
            >
              {isMuted ? (
                <>
                  <MicOff className="w-4 h-4 text-rose-400" />
                  <span>Unmute Mic</span>
                </>
              ) : (
                <>
                  <Mic className={`w-4 h-4 ${isSpeaking ? 'text-emerald-400 animate-bounce' : 'text-emerald-400'}`} />
                  <span>{isSpeaking ? 'Speaking...' : 'Mic Active'}</span>
                </>
              )}
            </button>

            {/* Leave Voice Button */}
            <button
              onClick={onStopVoice}
              title="Leave Voice Chat"
              className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </>
        )}
      </div>

      {/* Opponent Voice State Banner */}
      {isVoiceActive && (
        <div className="bg-[#161512] border border-[#312e2b] rounded-lg p-2 flex items-center justify-between text-xs">
          <span className="text-[#7d7b78] font-semibold text-[11px]">Opponent Voice:</span>
          <div className="flex items-center gap-1.5 font-bold">
            {remoteMuted ? (
              <span className="text-rose-400 flex items-center gap-1">
                <VolumeX className="w-3.5 h-3.5" />
                <span>Muted</span>
              </span>
            ) : remoteSpeaking ? (
              <span className="text-emerald-400 flex items-center gap-1 animate-pulse">
                <Volume2 className="w-3.5 h-3.5" />
                <span>Talking...</span>
              </span>
            ) : (
              <span className="text-[#bababa] flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-[#7d7b78]" />
                <span>Listening</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Permission Error Message */}
      {micPermissionError && (
        <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{micPermissionError} Please allow microphone permissions in your browser.</span>
        </div>
      )}
    </div>
  );
};
