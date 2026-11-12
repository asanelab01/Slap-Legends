import React from 'react';
import { FighterState, GameMode } from '../types/game';
import { Trophy, RotateCcw, ArrowRight, Award, Zap, Target } from 'lucide-react';
import { sounds } from '../utils/sound';

interface MatchEndModalProps {
  winner: FighterState;
  loser: FighterState;
  gameMode: GameMode;
  tournamentRound: number; // 1, 2, or 3
  isTournamentComplete: boolean;
  onNextTournamentMatch?: () => void;
  onRematch: () => void;
  onMainMenu: () => void;
}

export const MatchEndModal: React.FC<MatchEndModalProps> = ({
  winner,
  loser,
  gameMode,
  tournamentRound,
  isTournamentComplete,
  onNextTournamentMatch,
  onRematch,
  onMainMenu,
}) => {
  const isP1Winner = winner.playerNum === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md select-none animate-comic-pop">
      <div className="relative w-full max-w-lg bg-neutral-900 border-2 border-amber-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Trophy / Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
          <Trophy className="w-8 h-8" />
        </div>

        {/* Victory Headline */}
        <div className="text-xs uppercase tracking-widest font-extrabold text-amber-500 mb-1">
          {gameMode === 'TOURNAMENT' && isTournamentComplete
            ? '★ WORLD SLAP CHAMPION ★'
            : gameMode === 'TOURNAMENT'
            ? `Tournament Match ${tournamentRound} Cleared!`
            : 'Knockout Victory!'}
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-neutral-100 tracking-tight mb-2">
          {winner.name} Wins!
        </h2>

        <p className="text-xs text-neutral-400 mb-6 italic">
          "{winner.character.quote}"
        </p>

        {/* Winner Avatar Showcase */}
        <div className="relative w-28 h-28 mx-auto rounded-2xl overflow-hidden border-4 border-amber-400 shadow-xl mb-6">
          <img
            src={winner.character.avatar}
            alt={winner.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Match Performance Statistics */}
        <div className="grid grid-cols-3 gap-2.5 bg-neutral-950/80 p-3.5 rounded-2xl border border-neutral-800 mb-6 text-xs">
          <div>
            <div className="text-neutral-500 font-semibold text-[10px] uppercase">Best Slap</div>
            <div className="text-lg font-black text-amber-400">{winner.highestDamage} DMG</div>
          </div>
          <div>
            <div className="text-neutral-500 font-semibold text-[10px] uppercase">Bullseyes</div>
            <div className="text-lg font-black text-emerald-400">{winner.critsLanded} Crits</div>
          </div>
          <div>
            <div className="text-neutral-500 font-semibold text-[10px] uppercase">Slaps Landed</div>
            <div className="text-lg font-black text-neutral-200">{winner.slapsLanded}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {gameMode === 'TOURNAMENT' && !isTournamentComplete && isP1Winner && onNextTournamentMatch && (
            <button
              onClick={() => { sounds.playBell(); onNextTournamentMatch(); }}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
            >
              <span>Advance to Next Contender</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => { sounds.playClick(); onRematch(); }}
              className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rematch</span>
            </button>

            <button
              onClick={() => { sounds.playClick(); onMainMenu(); }}
              className="flex-1 py-3 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-neutral-300 font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
            >
              Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
