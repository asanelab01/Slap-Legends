import React from 'react';
import { FighterState } from '../types/game';
import { Zap, Shield } from 'lucide-react';

interface FighterHUDProps {
  fighter1: FighterState;
  fighter2: FighterState;
  currentAttacker: 1 | 2;
}

export const FighterHUD: React.FC<FighterHUDProps> = ({
  fighter1,
  fighter2,
  currentAttacker,
}) => {
  const p1HpPercent = Math.max(0, Math.min(100, (fighter1.currentHp / fighter1.maxHp) * 100));
  const p2HpPercent = Math.max(0, Math.min(100, (fighter2.currentHp / fighter2.maxHp) * 100));

  return (
    <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-4 px-2 select-none">
      {/* ===================== FIGHTER 1 (LEFT) ===================== */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
              currentAttacker === 1 ? 'bg-emerald-500 text-neutral-950 animate-pulse' : 'bg-neutral-800 text-neutral-400'
            }`}>
              {currentAttacker === 1 ? 'SLAPPING' : 'BRACING'}
            </span>
            <span className="font-extrabold text-sm sm:text-base text-neutral-100">
              {fighter1.name}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-300">
            {Math.max(0, fighter1.currentHp)} / {fighter1.maxHp} HP
          </span>
        </div>

        {/* Health Bar 1 */}
        <div className="h-4 w-full bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-neutral-700 shadow-inner">
          <div 
            style={{ width: `${p1HpPercent}%` }}
            className={`h-full rounded-full transition-all duration-300 ${
              p1HpPercent > 50
                ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                : p1HpPercent > 25
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                : 'bg-gradient-to-r from-red-600 to-rose-400 animate-pulse'
            }`}
          />
        </div>

        {/* Rage / Super Meter 1 */}
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-400 font-semibold">
          <Zap className={`w-3.5 h-3.5 ${fighter1.rage >= 100 ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-neutral-500'}`} />
          <div className="flex-1 h-1.5 bg-neutral-900 rounded-full overflow-hidden">
            <div 
              style={{ width: `${Math.min(100, fighter1.rage)}%` }}
              className={`h-full rounded-full transition-all duration-200 ${
                fighter1.rage >= 100 ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-orange-500'
              }`}
            />
          </div>
          <span className="font-mono text-[10px]">
            {fighter1.rage >= 100 ? 'SUPER READY' : `${Math.round(fighter1.rage)}%`}
          </span>
        </div>
      </div>

      {/* ===================== VS CENTER ICON ===================== */}
      <div className="shrink-0 flex flex-col items-center justify-center px-2">
        <span className="text-xs font-black text-amber-500 italic drop-shadow tracking-widest bg-neutral-900/90 border border-neutral-700 px-2.5 py-1 rounded-full">
          VS
        </span>
      </div>

      {/* ===================== FIGHTER 2 (RIGHT) ===================== */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-1.5 flex-row-reverse">
          <div className="flex items-center gap-2 flex-row-reverse">
            <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
              currentAttacker === 2 ? 'bg-emerald-500 text-neutral-950 animate-pulse' : 'bg-neutral-800 text-neutral-400'
            }`}>
              {currentAttacker === 2 ? 'SLAPPING' : 'BRACING'}
            </span>
            <span className="font-extrabold text-sm sm:text-base text-neutral-100">
              {fighter2.name}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-300">
            {Math.max(0, fighter2.currentHp)} / {fighter2.maxHp} HP
          </span>
        </div>

        {/* Health Bar 2 (Fills from right) */}
        <div className="h-4 w-full bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-neutral-700 shadow-inner flex justify-end">
          <div 
            style={{ width: `${p2HpPercent}%` }}
            className={`h-full rounded-full transition-all duration-300 ${
              p2HpPercent > 50
                ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                : p2HpPercent > 25
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                : 'bg-gradient-to-r from-red-600 to-rose-400 animate-pulse'
            }`}
          />
        </div>

        {/* Rage / Super Meter 2 */}
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-400 font-semibold flex-row-reverse">
          <Zap className={`w-3.5 h-3.5 ${fighter2.rage >= 100 ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-neutral-500'}`} />
          <div className="flex-1 h-1.5 bg-neutral-900 rounded-full overflow-hidden flex justify-end">
            <div 
              style={{ width: `${Math.min(100, fighter2.rage)}%` }}
              className={`h-full rounded-full transition-all duration-200 ${
                fighter2.rage >= 100 ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-orange-500'
              }`}
            />
          </div>
          <span className="font-mono text-[10px]">
            {fighter2.rage >= 100 ? 'SUPER READY' : `${Math.round(fighter2.rage)}%`}
          </span>
        </div>
      </div>
    </div>
  );
};
