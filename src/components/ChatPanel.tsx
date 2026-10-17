import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { MessageSquare, Send, Crown, Eye } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, disabled }) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || disabled) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="bg-[#262421] border border-[#312e2b] rounded-lg flex flex-col h-full overflow-hidden shadow-md">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#312e2b] bg-[#2d2b28] flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#7d7b78] font-bold text-xs uppercase tracking-wider">
          <MessageSquare className="w-4 h-4 text-[#81b64c]" />
          <span>Room Chat</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2.5 space-y-2 text-xs md:text-sm">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#7d7b78] italic text-xs">
            Say hello to your opponent or spectators!
          </div>
        ) : (
          messages.map((msg) => {
            const isSystem = msg.color === 'system' || msg.role === 'system';
            const isWhite = msg.color === 'white';
            const isBlack = msg.color === 'black';
            const isSpectator =
              msg.color === 'spectator' ||
              msg.role === 'spectator' ||
              (!isSystem && !isWhite && !isBlack);

            return (
              <div
                key={msg.id}
                className={`p-2.5 rounded-lg leading-relaxed shadow-sm transition-all ${
                  isSystem
                    ? 'bg-[#2d3a20] text-[#81b64c] border border-[#81b64c]/30 text-xs italic'
                    : isWhite
                    ? 'bg-[#2d2924] text-white border border-amber-500/20'
                    : isBlack
                    ? 'bg-[#1e1b26] text-[#e0d6f2] border border-purple-500/20'
                    : 'bg-[#151f28] text-[#c7e0f2] border border-sky-500/20'
                }`}
              >
                {!isSystem && (
                  <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-white/5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`font-extrabold text-[11px] truncate ${
                          isWhite
                            ? 'text-amber-200'
                            : isBlack
                            ? 'text-purple-200'
                            : 'text-sky-200'
                        }`}
                      >
                        {msg.sender}
                      </span>

                      {/* Distinctive Role/Color Badges */}
                      {isWhite && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                          <Crown className="w-2.5 h-2.5 text-amber-300" />
                          <span>White</span>
                        </span>
                      )}

                      {isBlack && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 shrink-0">
                          <Crown className="w-2.5 h-2.5 text-purple-300" />
                          <span>Black</span>
                        </span>
                      )}

                      {isSpectator && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1 shrink-0">
                          <Eye className="w-2.5 h-2.5 text-sky-300" />
                          <span>Spectator</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-[#7d7b78] shrink-0 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                <p className="break-words text-xs">{msg.text}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-[#312e2b] bg-[#161512] flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={disabled ? 'Chat disabled' : 'Type a message...'}
          disabled={disabled}
          className="flex-1 bg-[#262421] text-white placeholder-[#7d7b78] text-xs px-3 py-2 rounded border border-[#312e2b] focus:outline-none focus:border-[#81b64c] transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || disabled}
          className="p-2 rounded bg-[#81b64c] hover:bg-[#a3d16e] text-[#161512] font-bold disabled:opacity-40 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
