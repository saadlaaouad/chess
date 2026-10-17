import React from 'react';
import { Sparkles, X } from 'lucide-react';

export type PromotionPieceOption = 'q' | 'r' | 'b' | 'n';

interface PromotionModalProps {
  isOpen: boolean;
  color: 'white' | 'black';
  onSelectPiece: (piece: PromotionPieceOption) => void;
  onCancel?: () => void;
}

interface PieceChoice {
  code: PromotionPieceOption;
  nameEn: string;
  nameAr: string;
  symbolWhite: string;
  symbolBlack: string;
  desc: string;
}

const PIECE_CHOICES: PieceChoice[] = [
  {
    code: 'q',
    nameEn: 'Queen (Wazir)',
    nameAr: 'وزير',
    symbolWhite: '♕',
    symbolBlack: '♛',
    desc: 'Combines Rook & Bishop moves. Highest value piece.',
  },
  {
    code: 'r',
    nameEn: 'Rook (Qala)',
    nameAr: 'قلعة',
    symbolWhite: '♖',
    symbolBlack: '♜',
    desc: 'Moves orthogonally across any number of squares.',
  },
  {
    code: 'b',
    nameEn: 'Bishop (Fil)',
    nameAr: 'فيل',
    symbolWhite: '♗',
    symbolBlack: '♝',
    desc: 'Moves diagonally across squares of same color.',
  },
  {
    code: 'n',
    nameEn: 'Knight (Hisan)',
    nameAr: 'حصان',
    symbolWhite: '♘',
    symbolBlack: '♞',
    desc: 'Moves in L-shape. Can leap over other pieces.',
  },
];

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  color,
  onSelectPiece,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isWhite = color === 'white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#1e1c18] border border-[#38342e] rounded-2xl shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#312e2b]">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-white text-base tracking-wide flex items-center gap-2">
                <span>Pawn Promotion</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Select Piece
                </span>
              </h3>
              <p className="text-xs text-[#8b8885]">Choose piece to promote your pawn into</p>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 text-[#8b8885] hover:text-white hover:bg-[#312e2b] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-3">
          {PIECE_CHOICES.map((choice) => (
            <button
              key={choice.code}
              onClick={() => onSelectPiece(choice.code)}
              className="group relative p-3.5 bg-[#262421] hover:bg-[#36322b] border border-[#38342e] hover:border-[#81b64c] rounded-xl text-left transition-all duration-150 flex flex-col justify-between hover:scale-[1.02] shadow-md"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl filter drop-shadow">
                  {isWhite ? choice.symbolWhite : choice.symbolBlack}
                </span>
                <span className="text-xs font-bold text-amber-400 font-mono dir-rtl">
                  {choice.nameAr}
                </span>
              </div>

              <div>
                <div className="font-extrabold text-xs text-white group-hover:text-[#81b64c] transition-colors">
                  {choice.nameEn}
                </div>
                <div className="text-[10px] text-[#8b8885] leading-tight mt-1 line-clamp-2">
                  {choice.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center text-[11px] text-[#716e6a] font-medium pt-1">
          Click any piece option to complete the move.
        </div>
      </div>
    </div>
  );
};
