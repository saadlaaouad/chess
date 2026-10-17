import React, { useState, useEffect, useRef } from 'react';
import { X, Bot, Send, Sparkles, AlertCircle, ShoppingBag, RefreshCw, Lightbulb, Zap, ShieldAlert } from 'lucide-react';
import { getCredits, deductCredit, subscribeCredits } from '../lib/credits';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

interface AiCoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  fen: string;
  movesHistory: string[];
  userColor: 'white' | 'black' | 'spectator';
  onOpenStore: () => void;
}

const QUICK_PROMPTS = [
  '🔍 Analyze current board position',
  '🎯 What is my best candidate move?',
  '⚠️ Are there any hidden threats or blunders?',
  '📖 What strategic plan should I follow?',
];

export const AiCoachDrawer: React.FC<AiCoachDrawerProps> = ({
  isOpen,
  onClose,
  fen,
  movesHistory,
  userColor,
  onOpenStore,
}) => {
  const [credits, setCredits] = useState(getCredits());
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Greetings Grandmaster! I am your AI Chess Coach powered by Gemini. Ask me for move evaluations, tactical threats, or strategic advice anytime during your game!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeCredits(setCredits);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isLoading]);

  const handleSendPrompt = async (promptToSend?: string) => {
    const promptText = (promptToSend || inputPrompt).trim();
    if (!promptText || isLoading) return;

    if (credits < 1) {
      // Out of credits alert message from coach
      setMessages((prev) => [
        ...prev,
        {
          id: `no-credits-${Date.now()}`,
          sender: 'ai',
          text: "⚠️ You are out of AI Credits! Win a match to earn +3 credits automatically, or top-up your credits in the store.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      return;
    }

    // Deduct 1 credit
    const success = deductCredit();
    if (!success) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chess-coach', {
        method: 'POST',
        headers: { 'Content-[#Type]': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen,
          movesHistory,
          prompt: promptText,
          playerColor: userColor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch AI advice');
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.advice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ Coach Error: ${err.message || 'Unable to connect to AI server. Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#191715] border-l border-[#312e2b] shadow-2xl flex flex-col animate-slideLeft">
      {/* Drawer Header */}
      <div className="p-4 bg-[#211f1c] border-b border-[#312e2b] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>Grandmaster AI Coach</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Gemini Pro
              </span>
            </h2>
            <p className="text-xs text-[#8b8885]">Real-time board analysis & tactics</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Credits Counter Pill */}
          <button
            onClick={onOpenStore}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-black transition-all"
            title="Buy More Credits"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{credits}</span>
            <span className="text-[10px] opacity-75">Credits</span>
            <ShoppingBag className="w-3 h-3 text-amber-400 ml-0.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8b8885] hover:text-white hover:bg-[#312e2b] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Chat Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-[#8b8885]">
              {msg.sender === 'ai' ? (
                <>
                  <Bot className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">GM Coach</span>
                </>
              ) : (
                <span>You</span>
              )}
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            <div
              className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#81b64c] text-[#161512] font-semibold rounded-br-none shadow-md'
                  : 'bg-[#262421] border border-[#36322b] text-[#e8e6e3] rounded-bl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-[#262421] border border-[#36322b] rounded-2xl rounded-bl-none text-xs text-amber-300 w-fit">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>Coach is analyzing current FEN position...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-3 bg-[#1e1c18] border-t border-[#312e2b] space-y-2">
        <div className="text-[10px] font-bold text-[#8b8885] uppercase tracking-wider flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-400" />
          <span>Quick Analysis Actions (-1 Credit)</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(qp)}
              disabled={isLoading || credits < 1}
              className="px-2.5 py-1.5 bg-[#282520] hover:bg-[#36322b] border border-[#3a3630] text-[#dedcd9] rounded-lg text-[11px] font-medium transition-all text-left disabled:opacity-50"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box Area */}
      <div className="p-3 bg-[#161512] border-t border-[#2d2a26] space-y-2">
        {credits < 1 && (
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-300 flex items-center justify-between">
            <span>0 Credits remaining. Get more credits to ask AI.</span>
            <button
              onClick={onOpenStore}
              className="px-2 py-0.5 bg-amber-500 text-[#161512] font-black rounded uppercase text-[10px]"
            >
              Top Up
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={credits > 0 ? "Ask AI Coach about this position..." : "Top-up credits to ask AI..."}
            disabled={isLoading || credits < 1}
            className="flex-1 bg-[#22201c] border border-[#3a3630] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#7d7a76] focus:outline-none focus:border-[#81b64c] transition-colors disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim() || credits < 1}
            className="p-2.5 bg-[#81b64c] hover:bg-[#93cb5a] disabled:opacity-40 text-[#161512] rounded-xl font-bold transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
