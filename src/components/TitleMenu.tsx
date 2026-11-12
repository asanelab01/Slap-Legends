import React, { useState } from 'react';
import { GameMode } from '../types/game';
import { CHARACTERS } from '../data/characters';
import { Trophy, Swords, Users, Target, Info, Volume2, VolumeX, Shield, Zap } from 'lucide-react';
import { sounds } from '../utils/sound';

interface TitleMenuProps {
  onSelectMode: (mode: GameMode) => void;
  onOpenRules: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  onSelectMode,
  onOpenRules,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="relative min-h-[85vh] w-full flex flex-col items-center justify-between py-8 px-4 select-none">
      {/* Background Arena Subtle Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <img
          src="/src/assets/images/arena_slap_championship_1794476081293.jpg"
          alt="Arena"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-20 filter blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-950/80 to-neutral-950" />
      </div>

      {/* Top Bar with Audio & Rules */}
      <div className="w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
            2D Slap Championship
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { sounds.playClick(); onOpenRules(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>How to Slap</span>
          </button>

          <button
            onClick={() => { sounds.toggleMute(); onToggleMute(); }}
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white cursor-pointer transition-colors"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Center Hero Logo & Tagline */}
      <div className="text-center my-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-widest">
          <Trophy className="w-3.5 h-3.5" />
          <span>The Official Table Face-Off</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          SLAP <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500">LEGENDS</span>
        </h1>

        <p className="max-w-lg mx-auto text-xs sm:text-sm text-neutral-400 leading-relaxed">
          Master the oscillating power meter, hit the center Bullseye for brutal critical slaps, and unleash unique character abilities!
        </p>
      </div>

      {/* Character Roster Preview Cards */}
      <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        {CHARACTERS.map(c => (
          <div 
            key={c.id}
            className="group relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900/60 p-2 text-center transition-all hover:border-neutral-600 hover:bg-neutral-800/80"
          >
            <div className="aspect-square w-full rounded-lg overflow-hidden bg-neutral-950 mb-2 relative">
              <img
                src={c.avatar}
                alt={c.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
              />
              <span className="absolute bottom-1 right-1 text-[9px] font-extrabold uppercase bg-neutral-950/80 text-amber-400 px-1.5 py-0.5 rounded">
                {c.nickname}
              </span>
            </div>
            <div className="font-extrabold text-xs text-neutral-100">{c.name}</div>
            <div className="text-[10px] text-neutral-400 truncate">{c.specialTrait.split(':')[0]}</div>
          </div>
        ))}
      </div>

      {/* Mode Selection Action Grid */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        {/* Tournament Mode */}
        <button
          onClick={() => { sounds.playBell(); onSelectMode('TOURNAMENT'); }}
          className="group relative p-5 rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 border-amber-500/40 hover:border-amber-400 transition-all text-left shadow-lg hover:scale-[1.02] cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3 text-amber-400 group-hover:scale-110 transition-transform">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="text-base font-black text-neutral-100 mb-1">
            Tournament Mode
          </div>
          <div className="text-xs text-neutral-400 leading-snug">
            Battle through 3 contenders to win the Slap Championship belt!
          </div>
        </button>

        {/* Versus Mode */}
        <button
          onClick={() => { sounds.playClick(); onSelectMode('VERSUS_AI'); }}
          className="group relative p-5 rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 border-neutral-800 hover:border-neutral-600 transition-all text-left shadow-lg hover:scale-[1.02] cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mb-3 text-sky-400 group-hover:scale-110 transition-transform">
            <Swords className="w-5 h-5" />
          </div>
          <div className="text-base font-black text-neutral-100 mb-1">
            Versus CPU
          </div>
          <div className="text-xs text-neutral-400 leading-snug">
            Single exhibition match against any AI contender of your choice.
          </div>
        </button>

        {/* 2-Player Local Pass & Play */}
        <button
          onClick={() => { sounds.playClick(); onSelectMode('PASS_AND_PLAY'); }}
          className="group relative p-5 rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 border-neutral-800 hover:border-neutral-600 transition-all text-left shadow-lg hover:scale-[1.02] cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3 text-emerald-400 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-base font-black text-neutral-100 mb-1">
            2-Player Local
          </div>
          <div className="text-xs text-neutral-400 leading-snug">
            Pass & Play face-off with a friend on the same screen or keyboard!
          </div>
        </button>
      </div>

      {/* Practice Mode Link */}
      <div className="mt-4">
        <button
          onClick={() => { sounds.playClick(); onSelectMode('PRACTICE'); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold hover:bg-neutral-800 cursor-pointer transition-colors"
        >
          <Target className="w-4 h-4 text-purple-400" />
          <span>Timing Dojo (Practice Bullseye Accuracy)</span>
        </button>
      </div>
    </div>
  );
};
