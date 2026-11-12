import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SlapRating, Character } from '../types/game';
import { Zap, Target, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../utils/sound';

interface PowerMeterProps {
  attacker: Character;
  defender: Character;
  isPlayerTurn: boolean;
  isActive: boolean;
  isSuperActive: boolean;
  rage: number;
  onActivateSuper: () => void;
  onSlap: (rating: SlapRating, accuracy: number, offsetMs: number) => void;
  isDazed?: boolean;
}

export const PowerMeter: React.FC<PowerMeterProps> = ({
  attacker,
  defender,
  isPlayerTurn,
  isActive,
  isSuperActive,
  rage,
  onActivateSuper,
  onSlap,
  isDazed = false,
}) => {
  // needle position from 0 to 100
  const [needlePos, setNeedlePos] = useState<number>(10);
  const [hasStopped, setHasStopped] = useState<boolean>(false);
  const [lastFeedback, setLastFeedback] = useState<{
    rating: SlapRating;
    accuracy: number;
    text: string;
  } | null>(null);

  const animFrameRef = useRef<number | null>(null);
  const posRef = useRef<number>(10);
  const dirRef = useRef<number>(1); // 1 = moving right, -1 = moving left
  const startTimeRef = useRef<number>(performance.now());

  // Calculate dynamic sweet spot width based on character and super mode
  let sweetWidth = attacker.sweetSpotWidth;
  if (isSuperActive) {
    sweetWidth *= 1.7; // Super slap widens sweet spot
  }
  // Base speed factor
  let speedMultiplier = attacker.meterSpeed;
  if (isDazed) {
    speedMultiplier *= 1.4; // Opponent dazed this player
  }
  if (isSuperActive && attacker.id === 'kenji') {
    speedMultiplier *= 0.55; // Kenji Matrix slow-mo
  }

  const sweetStart = 50 - sweetWidth / 2;
  const sweetEnd = 50 + sweetWidth / 2;
  const hardStart = 50 - sweetWidth * 1.6;
  const hardEnd = 50 + sweetWidth * 1.6;
  const solidStart = 50 - sweetWidth * 2.8;
  const solidEnd = 50 + sweetWidth * 2.8;

  // Animation Loop for the needle
  useEffect(() => {
    if (!isActive || hasStopped) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();
    // Oscillation frequency: full sweep back and forth in ~1.0-1.4s based on speedMultiplier
    const baseSpeed = 80 * speedMultiplier; // percentage units per second

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      let nextPos = posRef.current + dirRef.current * baseSpeed * delta;
      if (nextPos >= 98) {
        nextPos = 98;
        dirRef.current = -1;
      } else if (nextPos <= 2) {
        nextPos = 2;
        dirRef.current = 1;
      }

      posRef.current = nextPos;
      setNeedlePos(nextPos);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, hasStopped, speedMultiplier]);

  // Handle Stop / Slap Trigger
  const handleTriggerSlap = useCallback(() => {
    if (!isActive || hasStopped || !isPlayerTurn) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setHasStopped(true);

    const pos = posRef.current;
    const distFromCenter = Math.abs(pos - 50);
    // Accuracy percentage 0 - 100
    const accuracy = Math.round(Math.max(0, 100 - (distFromCenter / 50) * 100));

    let rating: SlapRating = 'WEAK';
    let text = 'Weak Tap';

    if (pos >= sweetStart && pos <= sweetEnd) {
      rating = 'CRITICAL';
      text = '⚡ BULLSEYE CRITICAL! ⚡';
    } else if (pos >= hardStart && pos <= hardEnd) {
      rating = 'HARD';
      text = '💥 HARD SLAP!';
    } else if (pos >= solidStart && pos <= solidEnd) {
      rating = 'SOLID';
      text = '👍 SOLID HIT!';
    } else {
      rating = 'WEAK';
      text = '💨 GRAZED / WEAK!';
    }

    // Offset in milliseconds relative to center sweet spot
    const offsetMs = Math.round((pos - 50) * 8);

    setLastFeedback({ rating, accuracy, text });

    // Inform parent
    onSlap(rating, accuracy, offsetMs);
  }, [isActive, hasStopped, isPlayerTurn, sweetStart, sweetEnd, hardStart, hardEnd, solidStart, solidEnd, onSlap]);

  // Spacebar hotkey listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleTriggerSlap();
      } else if (e.code === 'KeyS' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (rage >= 100 && !isSuperActive) {
          onActivateSuper();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTriggerSlap, rage, isSuperActive, onActivateSuper]);

  // Reset stopped state when turned active
  useEffect(() => {
    if (isActive) {
      setHasStopped(false);
      setLastFeedback(null);
    }
  }, [isActive]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-neutral-900/90 backdrop-blur-md rounded-2xl border border-neutral-800 p-5 shadow-2xl relative select-none">
      {/* Header bar of Meter */}
      <div className="flex items-center justify-between mb-3 text-xs tracking-wider uppercase">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-neutral-300">
            {isPlayerTurn ? 'Your Turn: Time the Sweet Spot!' : `${defender.name} is Slapping...`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isDazed && (
            <span className="text-amber-400 font-bold animate-pulse text-[11px] bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
              DAZED (FASTER METER)
            </span>
          )}
          {isSuperActive && (
            <span className="text-red-400 font-bold animate-bounce text-[11px] bg-red-950/80 px-2 py-0.5 rounded border border-red-700">
              🔥 SUPER SLAP CHARGED 🔥
            </span>
          )}
        </div>
      </div>

      {/* The Dynamic Meter Track */}
      <div 
        onClick={handleTriggerSlap}
        className={`relative h-14 w-full rounded-xl overflow-hidden bg-neutral-950 border-2 transition-all cursor-pointer ${
          isSuperActive 
            ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35)]' 
            : 'border-neutral-700 hover:border-neutral-500'
        }`}
      >
        {/* Background gradient zones */}
        <div className="absolute inset-0 flex items-stretch">
          {/* Left Weak Zone */}
          <div 
            style={{ width: `${solidStart}%` }} 
            className="bg-red-950/50 border-r border-red-900/30 flex items-center justify-center text-[10px] text-red-400/60 font-semibold"
          >
            WEAK
          </div>

          {/* Left Solid Zone */}
          <div 
            style={{ width: `${hardStart - solidStart}%` }} 
            className="bg-amber-950/50 border-r border-amber-900/30 flex items-center justify-center text-[10px] text-amber-400/70 font-semibold"
          >
            SOLID
          </div>

          {/* Left Hard Zone */}
          <div 
            style={{ width: `${sweetStart - hardStart}%` }} 
            className="bg-emerald-950/60 border-r border-emerald-800/40 flex items-center justify-center text-[10px] text-emerald-400/80 font-bold"
          >
            HARD
          </div>

          {/* CENTER BULLSEYE / SWEET SPOT ZONE */}
          <div 
            style={{ width: `${sweetWidth}%` }} 
            className={`relative flex items-center justify-center font-black tracking-widest text-[11px] ${
              isSuperActive
                ? 'bg-gradient-to-r from-red-600 via-amber-400 to-red-600 text-neutral-950 animate-pulse shadow-[0_0_25px_rgba(245,158,11,0.8)]'
                : 'bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 text-neutral-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
            }`}
          >
            <span className="drop-shadow-sm whitespace-nowrap">
              {isSuperActive ? '★ SUPER ★' : 'CRIT'}
            </span>
            {/* Center target crosshair line */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-neutral-950/70" />
          </div>

          {/* Right Hard Zone */}
          <div 
            style={{ width: `${hardEnd - sweetEnd}%` }} 
            className="bg-emerald-950/60 border-l border-emerald-800/40 flex items-center justify-center text-[10px] text-emerald-400/80 font-bold"
          >
            HARD
          </div>

          {/* Right Solid Zone */}
          <div 
            style={{ width: `${solidEnd - hardEnd}%` }} 
            className="bg-amber-950/50 border-l border-amber-900/30 flex items-center justify-center text-[10px] text-amber-400/70 font-semibold"
          >
            SOLID
          </div>

          {/* Right Weak Zone */}
          <div 
            style={{ width: `${100 - solidEnd}%` }} 
            className="bg-red-950/50 border-l border-red-900/30 flex items-center justify-center text-[10px] text-red-400/60 font-semibold"
          >
            WEAK
          </div>
        </div>

        {/* The Moving Needle / Indicator */}
        <div 
          style={{ left: `${needlePos}%` }} 
          className="absolute top-0 bottom-0 w-2.5 -translate-x-1/2 z-20 pointer-events-none transition-transform"
        >
          {/* Needle visual */}
          <div className="w-full h-full bg-white rounded shadow-[0_0_10px_#ffffff] border border-neutral-950 flex flex-col justify-between items-center">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-[6px] border-l-transparent border-r-transparent border-t-red-500" />
            <div className="w-0.5 h-6 bg-red-600" />
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-[6px] border-l-transparent border-r-transparent border-b-red-500" />
          </div>
        </div>
      </div>

      {/* Meter subtext / Instructions */}
      <div className="flex items-center justify-between mt-3 text-xs text-neutral-400">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-lime-400" />
          <span>Bullseye = <strong>Maximum Damage (up to {attacker.critMultiplier}x)</strong></span>
        </div>
        <span className="hidden sm:inline text-neutral-500">
          Press <strong>SPACEBAR</strong> or tap anywhere
        </span>
      </div>

      {/* Control Actions (Super Move Button + Big Slap Trigger) */}
      <div className="mt-4 flex items-center gap-3">
        {/* Special Ability Button */}
        <button
          type="button"
          disabled={rage < 100 || isSuperActive || !isPlayerTurn || hasStopped}
          onClick={onActivateSuper}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            rage >= 100 && !isSuperActive
              ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:scale-[1.02] active:scale-95 cursor-pointer animate-pulse'
              : isSuperActive
              ? 'bg-red-600 text-white shadow-inner cursor-default'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60'
          }`}
        >
          <Zap className={`w-4 h-4 ${rage >= 100 ? 'text-yellow-200 animate-bounce' : ''}`} />
          <span>
            {isSuperActive 
              ? `${attacker.specialName} ACTIVE!` 
              : rage >= 100 
              ? `TRIGGER ${attacker.specialName}` 
              : `RAGE: ${Math.round(rage)}%`}
          </span>
        </button>

        {/* Big Interactive Slap Button */}
        <button
          type="button"
          disabled={!isActive || hasStopped || !isPlayerTurn}
          onClick={handleTriggerSlap}
          className={`flex-[2] py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg transition-all ${
            isActive && !hasStopped && isPlayerTurn
              ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 cursor-pointer ring-2 ring-emerald-300'
              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60'
          }`}
        >
          {hasStopped ? (
            lastFeedback ? lastFeedback.text : 'Landed!'
          ) : isPlayerTurn ? (
            'SLAP NOW! [SPACE]'
          ) : (
            'BRACE FOR IMPACT...'
          )}
        </button>
      </div>

      {/* Real-time Feedback Toast */}
      {lastFeedback && (
        <div 
          className={`mt-3 py-1.5 px-3 rounded-lg text-center font-bold text-xs animate-comic-pop ${
            lastFeedback.rating === 'CRITICAL'
              ? 'bg-amber-400/20 border border-amber-500/40 text-amber-300'
              : lastFeedback.rating === 'HARD'
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
              : lastFeedback.rating === 'SOLID'
              ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300'
              : 'bg-neutral-800 border border-neutral-700 text-neutral-400'
          }`}
        >
          Accuracy: {lastFeedback.accuracy}% · {lastFeedback.text}
        </div>
      )}
    </div>
  );
};
