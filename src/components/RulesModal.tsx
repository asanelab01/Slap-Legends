import React from 'react';
import { X, Target, Zap, Shield, Sparkles } from 'lucide-react';
import { sounds } from '../utils/sound';
import { CHARACTERS } from '../data/characters';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={() => { sounds.playClick(); onClose(); }}
          className="absolute top-4 right-4 p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-black text-neutral-100">
            Rules of the Slap Table
          </h2>
        </div>

        <div className="space-y-5 text-xs text-neutral-300 leading-relaxed">
          {/* Section 1: The Power Meter */}
          <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
            <h3 className="font-extrabold text-amber-400 text-sm flex items-center gap-1.5">
              <span>1. The Precision Timing Meter</span>
            </h3>
            <p>
              When it's your turn, the power needle oscillates across the meter. Stop it as close to the <strong>DEAD CENTER (Bullseye Zone)</strong> as possible!
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center font-bold">
              <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/40 text-red-300">
                Outer Red: WEAK
                <div className="text-[10px] text-neutral-400 font-normal">10-25% dmg</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-300">
                Orange: SOLID
                <div className="text-[10px] text-neutral-400 font-normal">35-55% dmg</div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-300">
                Green: HARD
                <div className="text-[10px] text-neutral-400 font-normal">70-85% dmg</div>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/20 border border-yellow-400/60 text-yellow-300">
                Center: CRITICAL!
                <div className="text-[10px] text-amber-300 font-normal">Up to 3.1x Multiplier</div>
              </div>
            </div>
          </div>

          {/* Section 2: Character Traits */}
          <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-3">
            <h3 className="font-extrabold text-amber-400 text-sm flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>2. Unique Character Traits</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CHARACTERS.map(c => (
                <div key={c.id} className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                  <div className="font-bold text-neutral-100 flex items-center justify-between mb-0.5">
                    <span>{c.name} "{c.nickname}"</span>
                    <span className="text-[10px] text-amber-400 font-mono">{c.maxHp} HP</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">{c.specialTrait}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Super Moves & Rage */}
          <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2">
            <h3 className="font-extrabold text-amber-400 text-sm flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>3. Super Rage Ability</span>
            </h3>
            <p>
              Landing hits and absorbing slaps fills your <strong>RAGE METER</strong> up to 100%. Once ready, press the Super button to activate character-exclusive powers like <em>Matrix Slow-Mo</em>, <em>Expanded Bullseye</em>, <em>Self-Heals</em>, or <em>Berserk Damage</em>!
            </p>
          </div>

          {/* Section 4: Hotkeys & Controls */}
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-neutral-300 font-medium">
            <span>Stop Needle / Slap:</span>
            <span className="font-mono bg-neutral-800 px-2 py-1 rounded text-amber-400 font-bold">SPACEBAR or Click</span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider cursor-pointer transition-all"
          >
            Got It, Let's Slap!
          </button>
        </div>
      </div>
    </div>
  );
};
