import React, { useEffect, useRef } from 'react';
import { GameMove } from '../types';
import { ScrollText, ChevronRight } from 'lucide-react';

interface MoveHistoryProps {
  history: GameMove[];
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ history }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Group moves into turns (White move + Black move)
  const turns: { turnNumber: number; white?: GameMove; black?: GameMove }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    turns.push({
      turnNumber: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  return (
    <div className="bg-[#262421] border border-[#312e2b] rounded-lg flex flex-col h-full overflow-hidden shadow-md">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#312e2b] bg-[#2d2b28] flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#7d7b78] font-bold text-xs uppercase tracking-wider">
          <ScrollText className="w-4 h-4 text-[#81b64c]" />
          <span>Move History</span>
        </div>
        <span className="text-[10px] text-[#81b64c] font-bold uppercase font-mono">
          Depth: {history.length}
        </span>
      </div>

      {/* History List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-1 space-y-0.5 font-mono text-xs md:text-sm">
        {turns.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#7d7b78] italic text-xs py-8">
            No moves played yet
          </div>
        ) : (
          turns.map((turn, idx) => (
            <div
              key={turn.turnNumber}
              className={`grid grid-cols-12 gap-1 items-center px-2 py-1 rounded text-xs font-mono ${
                idx % 2 === 0 ? 'bg-[#2d2b28]' : 'bg-transparent'
              }`}
            >
              {/* Turn Number */}
              <div className="col-span-2 text-[#7d7b78] font-bold">
                {turn.turnNumber}.
              </div>

              {/* White Move */}
              <div className="col-span-5 flex items-center gap-1 text-white font-semibold">
                <span>{turn.white?.san}</span>
              </div>

              {/* Black Move */}
              <div className="col-span-5 flex items-center gap-1 text-white font-semibold">
                {turn.black ? (
                  <span>{turn.black.san}</span>
                ) : (
                  <ChevronRight className="w-3 h-3 text-[#81b64c] animate-pulse ml-auto" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
