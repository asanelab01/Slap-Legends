import React, { useState } from 'react';
import { Character, GameMode } from '../types/game';
import { CHARACTERS } from '../data/characters';
import { Shield, Zap, Target, Gauge, Heart, Trophy, ArrowRight, Swords, Check } from 'lucide-react';
import { sounds } from '../utils/sound';

interface CharacterSelectProps {
  gameMode: GameMode;
  onConfirmSelection: (p1Char: Character, p2Char: Character) => void;
  onBack: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  gameMode,
  onConfirmSelection,
  onBack,
}) => {
  const [selectedP1, setSelectedP1] = useState<Character>(CHARACTERS[0]);
  const [selectedP2, setSelectedP2] = useState<Character>(CHARACTERS[1]);
  const [selectingFor, setSelectingFor] = useState<1 | 2>(1); // For 2-Player mode

  const handleSelect = (char: Character) => {
    sounds.playClick();
    if (gameMode === 'PASS_AND_PLAY') {
      if (selectingFor === 1) {
        setSelectedP1(char);
      } else {
        setSelectedP2(char);
      }
    } else {
      setSelectedP1(char);
      // Auto-assign distinct opponent for AI
      if (char.id === selectedP2.id) {
        const nextOpponent = CHARACTERS.find(c => c.id !== char.id) || CHARACTERS[1];
        setSelectedP2(nextOpponent);
      }
    }
  };

  const handleStart = () => {
    sounds.playBell();
    onConfirmSelection(selectedP1, selectedP2);
  };

  const activeChar = selectingFor === 1 ? selectedP1 : selectedP2;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 select-none">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-500 font-extrabold flex items-center gap-1.5 mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>Select Your Fighter · 4 Contenders</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-100 tracking-tight">
            {gameMode === 'PASS_AND_PLAY' 
              ? (selectingFor === 1 ? 'Player 1: Choose Your Champion' : 'Player 2: Choose Your Champion')
              : 'Choose Your Slap Legend'}
          </h1>
        </div>

        {gameMode === 'PASS_AND_PLAY' && (
          <div className="flex items-center gap-2 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => { sounds.playClick(); setSelectingFor(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectingFor === 1 ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              P1: {selectedP1.name}
            </button>
            <button
              onClick={() => { sounds.playClick(); setSelectingFor(2); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectingFor === 2 ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              P2: {selectedP2.name}
            </button>
          </div>
        )}
      </div>

      {/* Grid of the 4 Characters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {CHARACTERS.map(char => {
          const isSelected = activeChar.id === char.id;
          const isP1 = selectedP1.id === char.id;
          const isP2 = selectedP2.id === char.id;

          return (
            <div
              key={char.id}
              onClick={() => handleSelect(char)}
              className={`group relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer bg-neutral-900 ${
                isSelected
                  ? 'border-amber-400 ring-4 ring-amber-400/20 shadow-xl -translate-y-1'
                  : 'border-neutral-800 hover:border-neutral-600 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Character Portrait Card */}
              <div className="relative aspect-square w-full overflow-hidden bg-neutral-950">
                <img
                  src={char.avatar}
                  alt={char.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
                
                {/* Badges for selected status */}
                <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                  {isP1 && (
                    <span className="bg-emerald-500 text-neutral-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                      P1
                    </span>
                  )}
                  {isP2 && gameMode === 'PASS_AND_PLAY' && (
                    <span className="bg-sky-500 text-neutral-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">
                      P2
                    </span>
                  )}
                </div>

                {/* Nickname & Title on card */}
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    {char.nickname}
                  </div>
                  <div className="text-lg font-black text-white leading-tight">
                    {char.name}
                  </div>
                  <div className="text-[11px] text-neutral-300 truncate">
                    {char.title}
                  </div>
                </div>
              </div>

              {/* Quick Spec Strip */}
              <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                <div className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-semibold text-neutral-200">{char.maxHp} HP</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-neutral-200">{char.critMultiplier}x Crit</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Character Deep Profile Spotlight */}
      <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 shadow-2xl backdrop-blur-md mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          {/* Col 1: Bio and Catchphrase */}
          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                {activeChar.title}
              </span>
              <h2 className="text-2xl font-black text-neutral-100">
                {activeChar.name} "{activeChar.nickname}"
              </h2>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {activeChar.bio}
            </p>
            <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 text-xs text-neutral-300 italic">
              {activeChar.quote}
            </div>
          </div>

          {/* Col 2: Attribute Meters & Mechanics */}
          <div className="space-y-3 bg-neutral-950/60 p-4 rounded-xl border border-neutral-800">
            {/* HP */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-neutral-400">Health Points</span>
                <span className="text-neutral-200">{activeChar.maxHp} HP</span>
              </div>
              <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${(activeChar.maxHp / 220) * 100}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>

            {/* Base Damage */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-neutral-400">Slap Power (Base Damage)</span>
                <span className="text-neutral-200">{activeChar.baseDamage[0]} - {activeChar.baseDamage[1]}</span>
              </div>
              <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${(activeChar.baseDamage[1] / 52) * 100}%` }}
                  className="h-full bg-orange-500 rounded-full"
                />
              </div>
            </div>

            {/* Critical Multiplier */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-neutral-400">Critical Multiplier (Bullseye Hit)</span>
                <span className="text-amber-400 font-bold">{activeChar.critMultiplier}x Damage</span>
              </div>
              <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${((activeChar.critMultiplier - 2.0) / 1.5) * 100}%` }}
                  className="h-full bg-amber-400 rounded-full"
                />
              </div>
            </div>

            {/* Meter Oscillating Speed */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-neutral-400">Meter Swing Speed</span>
                <span className="text-neutral-200">
                  {activeChar.meterSpeed < 0.9 ? 'Steady / Trackable' : activeChar.meterSpeed > 1.1 ? 'Fast / Hyper-Reflex' : 'Standard'}
                </span>
              </div>
              <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${(activeChar.meterSpeed / 1.3) * 100}%` }}
                  className="h-full bg-sky-500 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Col 3: Unique Trait & Super Move */}
          <div className="space-y-3">
            <div className="p-3.5 bg-neutral-950/80 rounded-xl border border-neutral-800">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Passive Trait</span>
              </div>
              <div className="text-xs text-neutral-300 leading-relaxed">
                {activeChar.specialTrait}
              </div>
            </div>

            <div className="p-3.5 bg-neutral-950/80 rounded-xl border border-amber-900/40">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Super Ability: {activeChar.specialName}</span>
              </div>
              <div className="text-xs text-neutral-300 leading-relaxed">
                {activeChar.specialDesc}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => { sounds.playClick(); onBack(); }}
          className="px-6 py-3 rounded-xl border border-neutral-700 text-neutral-300 font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          Back to Main Menu
        </button>

        <button
          type="button"
          onClick={handleStart}
          className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>Step Up to the Table</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
