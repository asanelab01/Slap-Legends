import React, { useState } from 'react';
import { Character, SlapRating } from '../types/game';
import { CHARACTERS } from '../data/characters';
import { PowerMeter } from './PowerMeter';
import { sounds } from '../utils/sound';
import { Target, ArrowLeft, RotateCcw, Trophy, Sparkles } from 'lucide-react';

interface PracticeDojoProps {
  onBack: () => void;
}

export const PracticeDojo: React.FC<PracticeDojoProps> = ({ onBack }) => {
  const [selectedChar, setSelectedChar] = useState<Character>(CHARACTERS[0]);
  const [isSuperActive, setIsSuperActive] = useState(false);
  const [rage, setRage] = useState(100);
  const [stats, setStats] = useState({
    totalSlaps: 0,
    criticalCount: 0,
    hardCount: 0,
    solidCount: 0,
    weakCount: 0,
    bestAccuracy: 0,
    currentStreak: 0,
    highestStreak: 0,
    lastOffsetMs: 0,
  });
  const [dummyReaction, setDummyReaction] = useState<'idle' | 'hit' | 'crit'>('idle');

  const handleSlap = (rating: SlapRating, accuracy: number, offsetMs: number) => {
    sounds.playWhoosh();
    setTimeout(() => {
      sounds.playSlap(rating, isSuperActive);
      setDummyReaction(rating === 'CRITICAL' ? 'crit' : 'hit');
      setTimeout(() => setDummyReaction('idle'), 600);
    }, 120);

    setStats(prev => {
      const isCrit = rating === 'CRITICAL';
      const newStreak = isCrit ? prev.currentStreak + 1 : 0;
      return {
        totalSlaps: prev.totalSlaps + 1,
        criticalCount: prev.criticalCount + (isCrit ? 1 : 0),
        hardCount: prev.hardCount + (rating === 'HARD' ? 1 : 0),
        solidCount: prev.solidCount + (rating === 'SOLID' ? 1 : 0),
        weakCount: prev.weakCount + (rating === 'WEAK' ? 1 : 0),
        bestAccuracy: Math.max(prev.bestAccuracy, accuracy),
        currentStreak: newStreak,
        highestStreak: Math.max(prev.highestStreak, newStreak),
        lastOffsetMs: offsetMs,
      };
    });

    if (isSuperActive) {
      setIsSuperActive(false);
      setRage(0);
    } else {
      setRage(prev => Math.min(100, prev + 25));
    }
  };

  const resetStats = () => {
    sounds.playClick();
    setStats({
      totalSlaps: 0,
      criticalCount: 0,
      hardCount: 0,
      solidCount: 0,
      weakCount: 0,
      bestAccuracy: 0,
      currentStreak: 0,
      highestStreak: 0,
      lastOffsetMs: 0,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => { sounds.playClick(); onBack(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>

        <div className="text-center">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
            Training Ground
          </span>
          <h2 className="text-xl font-black text-neutral-100">
            Timing Dojo
          </h2>
        </div>

        <button
          onClick={resetStats}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Stats</span>
        </button>
      </div>

      {/* Fighter Selector for Testing Different Meter Speeds */}
      <div className="mb-6 bg-neutral-900/80 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider pl-2">
          Test Fighter Trait:
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {CHARACTERS.map(c => (
            <button
              key={c.id}
              onClick={() => { sounds.playClick(); setSelectedChar(c); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedChar.id === c.id
                  ? 'bg-amber-500 text-neutral-950 shadow'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white'
              }`}
            >
              {c.name} ({c.meterSpeed < 1 ? 'Slow' : c.meterSpeed > 1 ? 'Fast' : 'Mid'})
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Training Dummy Table */}
      <div className="relative aspect-[16/8] max-h-72 w-full rounded-2xl bg-neutral-950 border border-neutral-800 overflow-hidden mb-6 flex items-center justify-center">
        <div className="absolute inset-0 bg-radial from-neutral-900 via-neutral-950 to-neutral-950 opacity-80" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Training Dummy Head / Target */}
          <div className={`w-28 h-28 rounded-3xl border-4 flex flex-col items-center justify-center transition-all duration-150 ${
            dummyReaction === 'crit'
              ? 'border-red-500 bg-red-950/80 scale-95 rotate-12 filter brightness-125'
              : dummyReaction === 'hit'
              ? 'border-amber-500 bg-amber-950/60 rotate-6'
              : 'border-neutral-700 bg-neutral-900'
          }`}>
            <span className="text-4xl">
              {dummyReaction === 'crit' ? '😵' : dummyReaction === 'hit' ? '😣' : '🎯'}
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mt-1">
              SLAP TARGET
            </span>
          </div>

          <div className="w-48 h-4 bg-neutral-800 rounded-full mt-3 border border-neutral-700 shadow" />
        </div>
      </div>

      {/* Real-time Telemetry Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-center">
          <div className="text-[10px] font-bold text-neutral-400 uppercase">Bullseyes / Total</div>
          <div className="text-xl font-black text-amber-400">
            {stats.criticalCount} / {stats.totalSlaps}
          </div>
          <div className="text-[10px] text-neutral-500">
            {stats.totalSlaps > 0 ? Math.round((stats.criticalCount / stats.totalSlaps) * 100) : 0}% Crit Rate
          </div>
        </div>

        <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-center">
          <div className="text-[10px] font-bold text-neutral-400 uppercase">Current Streak</div>
          <div className="text-xl font-black text-emerald-400">
            {stats.currentStreak} 🔥
          </div>
          <div className="text-[10px] text-neutral-500">
            Best Streak: {stats.highestStreak}
          </div>
        </div>

        <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-center">
          <div className="text-[10px] font-bold text-neutral-400 uppercase">Peak Accuracy</div>
          <div className="text-xl font-black text-sky-400">
            {stats.bestAccuracy}%
          </div>
          <div className="text-[10px] text-neutral-500">
            Target: 100% Dead Center
          </div>
        </div>

        <div className="bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-center">
          <div className="text-[10px] font-bold text-neutral-400 uppercase">Timing Offset</div>
          <div className="text-xl font-black text-purple-400">
            {stats.lastOffsetMs > 0 ? `+${stats.lastOffsetMs}ms` : `${stats.lastOffsetMs}ms`}
          </div>
          <div className="text-[10px] text-neutral-500">
            {Math.abs(stats.lastOffsetMs) < 15 ? 'Near Flawless' : stats.lastOffsetMs < 0 ? 'Too Early' : 'Too Late'}
          </div>
        </div>
      </div>

      {/* The Oscillating Power Meter for Training */}
      <PowerMeter
        attacker={selectedChar}
        defender={CHARACTERS[1]}
        isPlayerTurn={true}
        isActive={true}
        isSuperActive={isSuperActive}
        rage={rage}
        onActivateSuper={() => {
          sounds.playSpecialCharge();
          setIsSuperActive(true);
        }}
        onSlap={handleSlap}
      />
    </div>
  );
};
