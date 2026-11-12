import React, { useState, useEffect, useRef } from 'react';
import { FighterState, SlapRating, MatchPhase } from '../types/game';
import { SLAP_COMICS } from '../data/characters';
import { Sparkles } from 'lucide-react';

interface FightArenaProps {
  fighter1: FighterState;
  fighter2: FighterState;
  currentAttacker: 1 | 2;
  phase: MatchPhase;
  lastSlapInfo: {
    rating: SlapRating;
    damage: number;
    isCrit: boolean;
    comicText: string;
    targetPlayer: 1 | 2;
  } | null;
  isScreenShaking: boolean;
  roundNumber: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export const FightArena: React.FC<FightArenaProps> = ({
  fighter1,
  fighter2,
  currentAttacker,
  phase,
  lastSlapInfo,
  isScreenShaking,
  roundNumber,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger chalk explosion particles whenever a slap lands
  useEffect(() => {
    if (phase === 'IMPACT' && lastSlapInfo) {
      const isP1Victim = lastSlapInfo.targetPlayer === 1;
      const originX = isP1Victim ? 320 : 680;
      const originY = 280;
      const count = lastSlapInfo.isCrit ? 45 : lastSlapInfo.rating === 'HARD' ? 30 : 15;

      const newParticles: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (isP1Victim ? -1 : 1) * (Math.PI * 0.1 + Math.random() * Math.PI * 0.8);
        const speed = 4 + Math.random() * (lastSlapInfo.isCrit ? 14 : 9);
        newParticles.push({
          id: Math.random(),
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: 3 + Math.random() * (lastSlapInfo.isCrit ? 8 : 5),
          alpha: 1,
          color: Math.random() > 0.4 ? '#ffffff' : lastSlapInfo.isCrit ? '#fef08a' : '#e2e8f0',
        });
      }
      setParticles(newParticles);
    }
  }, [phase, lastSlapInfo]);

  // Particle animation loop
  useEffect(() => {
    if (particles.length === 0) return;
    let animId: number;
    const update = () => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.35, // Gravity
            alpha: p.alpha - 0.025,
            size: Math.max(0.5, p.size * 0.98),
          }))
          .filter(p => p.alpha > 0.05)
      );
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [particles]);

  const p1IsAttacking = currentAttacker === 1;
  const p2IsAttacking = currentAttacker === 2;

  // Determine visual pose states for fighters
  const getFighterPose = (playerNum: 1 | 2) => {
    const isAttacker = currentAttacker === playerNum;
    const isVictim = currentAttacker !== playerNum;

    if (phase === 'KNOCKOUT') {
      const isDead = (playerNum === 1 && fighter1.currentHp <= 0) || (playerNum === 2 && fighter2.currentHp <= 0);
      if (isDead) return 'ko';
      return 'victory';
    }

    if (isAttacker) {
      if (phase === 'WINDUP') return 'windup';
      if (phase === 'IMPACT') return 'swing';
      if (phase === 'REACTION') return 'recover';
      return 'idle';
    }

    if (isVictim) {
      if (phase === 'IMPACT') return 'slapped';
      if (phase === 'REACTION') return 'stagger';
      return 'braced';
    }

    return 'idle';
  };

  const p1Pose = getFighterPose(1);
  const p2Pose = getFighterPose(2);

  return (
    <div className={`relative w-full aspect-[16/9] max-h-[520px] rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-950 select-none ${
      isScreenShaking ? 'animate-slap-impact' : ''
    }`}>
      {/* Background Arena Image */}
      <img
        src="/src/assets/images/arena_slap_championship_1794476081293.jpg"
        alt="Slap Championship Arena"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105 filter brightness-75"
      />

      {/* Atmospheric lighting gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-neutral-950/30 to-neutral-950/80 pointer-events-none" />

      {/* Critical Flash Overlay */}
      {phase === 'IMPACT' && lastSlapInfo?.isCrit && (
        <div className="absolute inset-0 bg-amber-300/30 animate-flash pointer-events-none z-30 mix-blend-overlay" />
      )}

      {/* Particle Canvas Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 1000 562">
        {particles.map(p => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.size}
            fill={p.color}
            opacity={p.alpha}
          />
        ))}
      </svg>

      {/* Round / Match Status Banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-neutral-900/80 backdrop-blur-md px-5 py-1.5 rounded-full border border-neutral-700 text-xs font-semibold">
        <span className="text-amber-400 font-bold uppercase tracking-wider">Round {roundNumber}</span>
        <span className="text-neutral-500">|</span>
        <span className="text-neutral-200">
          {phase === 'COIN_TOSS' ? 'Coin Flip' : phase === 'KNOCKOUT' ? 'KNOCKOUT!' : p1IsAttacking ? `${fighter1.name}'s Strike` : `${fighter2.name}'s Strike`}
        </span>
      </div>

      {/* ===================== FIGHTERS & TABLE ===================== */}
      <div className="absolute inset-0 flex items-end justify-center pb-6 z-10 px-6 sm:px-16">
        {/* PLAYER 1 (Left Fighter) */}
        <div 
          className={`flex-1 flex flex-col items-center justify-end transition-all duration-200 ${
            p1Pose === 'windup' 
              ? '-translate-x-8 -rotate-6 scale-105' 
              : p1Pose === 'swing'
              ? 'translate-x-14 rotate-12 scale-110'
              : p1Pose === 'slapped'
              ? '-translate-x-12 -rotate-16 filter brightness-125'
              : p1Pose === 'stagger'
              ? '-translate-x-6 -rotate-6'
              : p1Pose === 'ko'
              ? 'translate-y-24 -rotate-45 opacity-50 blur-[1px]'
              : 'translate-x-0 rotate-0'
          }`}
        >
          {/* Fighter Character Card & Sprite Container */}
          <div className="relative flex flex-col items-center">
            {/* Dazed Stars Animation */}
            {(fighter1.isDazed || fighter1.currentHp < fighter1.maxHp * 0.25) && p1Pose !== 'ko' && (
              <div className="absolute -top-10 flex items-center gap-1 animate-spin duration-1000">
                <span className="text-yellow-300 text-base">💫</span>
                <span className="text-amber-400 text-sm">⭐</span>
                <span className="text-yellow-300 text-base">💫</span>
              </div>
            )}

            {/* Slap Handprint Marks on Cheek */}
            {fighter1.bruiseCount > 0 && (
              <div 
                className="absolute top-16 right-4 z-20 pointer-events-none rounded-full bg-red-600/40 mix-blend-multiply blur-[2px] transition-all"
                style={{
                  width: `${20 + fighter1.bruiseCount * 8}px`,
                  height: `${20 + fighter1.bruiseCount * 8}px`,
                  opacity: Math.min(0.9, 0.3 + fighter1.bruiseCount * 0.15)
                }}
              />
            )}

            {/* Character Visual Avatar Portrait */}
            <div className={`relative w-40 sm:w-52 aspect-square rounded-2xl overflow-hidden border-4 shadow-2xl transition-all ${
              p1IsAttacking && (phase === 'AIMING' || phase === 'WINDUP')
                ? 'border-emerald-400 ring-4 ring-emerald-400/30 scale-105'
                : 'border-neutral-700'
            }`}>
              <img
                src={fighter1.character.avatar}
                alt={fighter1.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              {/* Slap impact overlay */}
              {p1Pose === 'slapped' && (
                <div className="absolute inset-0 bg-red-600/40 animate-flash" />
              )}
            </div>

            {/* Fighter Nameplate & HP status */}
            <div className="mt-3 text-center">
              <div className="font-extrabold text-sm sm:text-base tracking-wide text-neutral-100 flex items-center justify-center gap-1.5">
                <span>{fighter1.name}</span>
                {fighter1.character.nickname && (
                  <span className="text-xs text-neutral-400 font-medium">"{fighter1.character.nickname}"</span>
                )}
              </div>
              <div className="text-[11px] font-semibold text-emerald-400">
                HP: {Math.max(0, fighter1.currentHp)} / {fighter1.maxHp}
              </div>
            </div>
          </div>
        </div>

        {/* ===================== CENTER SLAP TABLE ===================== */}
        <div className="w-44 sm:w-56 shrink-0 flex flex-col items-center justify-end pb-2 relative z-10">
          {/* Comic Impact Text Splash */}
          {phase === 'IMPACT' && lastSlapInfo && (
            <div className="absolute -top-16 z-30 flex flex-col items-center animate-comic-pop pointer-events-none">
              <div 
                className={`font-black tracking-tight text-3xl sm:text-4xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] transform -rotate-6 px-3 py-1 rounded-lg ${
                  lastSlapInfo.isCrit
                    ? 'text-yellow-300 bg-red-600/90 border-2 border-yellow-300'
                    : lastSlapInfo.rating === 'HARD'
                    ? 'text-orange-400 bg-neutral-900/90 border border-orange-500'
                    : 'text-neutral-100 bg-neutral-800/90'
                }`}
              >
                {lastSlapInfo.comicText}
              </div>
              <div className="text-base sm:text-lg font-black text-red-500 bg-neutral-950/80 px-2 py-0.5 rounded shadow mt-1">
                -{lastSlapInfo.damage} DMG!
              </div>
            </div>
          )}

          {/* Chalk Bowl & Stand on the Official Table */}
          <div className="relative flex flex-col items-center w-full">
            {/* Chalk Bowl */}
            <div className="w-12 h-5 bg-neutral-700 rounded-b-xl border border-neutral-600 flex items-center justify-center -mb-1 shadow-md z-10">
              <div className="w-9 h-2.5 bg-neutral-100 rounded-full blur-[1px] opacity-90" />
            </div>

            {/* Official Tournament Table Top */}
            <div className="w-full h-8 bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 rounded-t-md border-t-2 border-neutral-500 shadow-xl flex items-center justify-center">
              <span className="text-[10px] tracking-widest font-black text-neutral-400 uppercase">
                SLAP TABLE
              </span>
            </div>

            {/* Table Legs */}
            <div className="w-full flex justify-between px-4">
              <div className="w-3 h-16 bg-neutral-800 border-l border-neutral-600" />
              <div className="w-3 h-16 bg-neutral-800 border-r border-neutral-600" />
            </div>
          </div>
        </div>

        {/* PLAYER 2 (Right Fighter - Opponent or P2) */}
        <div 
          className={`flex-1 flex flex-col items-center justify-end transition-all duration-200 ${
            p2Pose === 'windup' 
              ? 'translate-x-8 rotate-6 scale-105' 
              : p2Pose === 'swing'
              ? '-translate-x-14 -rotate-12 scale-110'
              : p2Pose === 'slapped'
              ? 'translate-x-12 rotate-16 filter brightness-125'
              : p2Pose === 'stagger'
              ? 'translate-x-6 rotate-6'
              : p2Pose === 'ko'
              ? 'translate-y-24 rotate-45 opacity-50 blur-[1px]'
              : 'translate-x-0 rotate-0'
          }`}
        >
          {/* Fighter Character Card & Sprite Container */}
          <div className="relative flex flex-col items-center">
            {/* Dazed Stars Animation */}
            {(fighter2.isDazed || fighter2.currentHp < fighter2.maxHp * 0.25) && p2Pose !== 'ko' && (
              <div className="absolute -top-10 flex items-center gap-1 animate-spin duration-1000">
                <span className="text-yellow-300 text-base">💫</span>
                <span className="text-amber-400 text-sm">⭐</span>
                <span className="text-yellow-300 text-base">💫</span>
              </div>
            )}

            {/* Slap Handprint Marks on Cheek */}
            {fighter2.bruiseCount > 0 && (
              <div 
                className="absolute top-16 left-4 z-20 pointer-events-none rounded-full bg-red-600/40 mix-blend-multiply blur-[2px] transition-all"
                style={{
                  width: `${20 + fighter2.bruiseCount * 8}px`,
                  height: `${20 + fighter2.bruiseCount * 8}px`,
                  opacity: Math.min(0.9, 0.3 + fighter2.bruiseCount * 0.15)
                }}
              />
            )}

            {/* Character Visual Avatar Portrait (Flipped to face left) */}
            <div className={`relative w-40 sm:w-52 aspect-square rounded-2xl overflow-hidden border-4 shadow-2xl transition-all scale-x-[-1] ${
              p2IsAttacking && (phase === 'AIMING' || phase === 'WINDUP')
                ? 'border-emerald-400 ring-4 ring-emerald-400/30 scale-105'
                : 'border-neutral-700'
            }`}>
              <img
                src={fighter2.character.avatar}
                alt={fighter2.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              {/* Slap impact overlay */}
              {p2Pose === 'slapped' && (
                <div className="absolute inset-0 bg-red-600/40 animate-flash" />
              )}
            </div>

            {/* Fighter Nameplate & HP status */}
            <div className="mt-3 text-center">
              <div className="font-extrabold text-sm sm:text-base tracking-wide text-neutral-100 flex items-center justify-center gap-1.5">
                <span>{fighter2.name}</span>
                {fighter2.character.nickname && (
                  <span className="text-xs text-neutral-400 font-medium">"{fighter2.character.nickname}"</span>
                )}
              </div>
              <div className="text-[11px] font-semibold text-emerald-400">
                HP: {Math.max(0, fighter2.currentHp)} / {fighter2.maxHp}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
