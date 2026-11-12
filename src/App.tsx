import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Character, 
  GameMode, 
  GameState, 
  MatchPhase, 
  FighterState, 
  SlapRating 
} from './types/game';
import { CHARACTERS, SLAP_COMICS } from './data/characters';
import { TitleMenu } from './components/TitleMenu';
import { CharacterSelect } from './components/CharacterSelect';
import { FightArena } from './components/FightArena';
import { ThreeFightArena } from './components/ThreeFightArena';
import { FighterHUD } from './components/FighterHUD';
import { PowerMeter } from './components/PowerMeter';
import { PracticeDojo } from './components/PracticeDojo';
import { MatchEndModal } from './components/MatchEndModal';
import { RulesModal } from './components/RulesModal';
import { sounds } from './utils/sound';
import { ArrowLeft, Volume2, VolumeX, Shield, Zap, Sparkles, Box } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [gameMode, setGameMode] = useState<GameMode>('TOURNAMENT');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(true); // 3D Slap Animation enabled by default!

  // Tournament progress
  const [tournamentRound, setTournamentRound] = useState<number>(1);
  const [tournamentOpponents, setTournamentOpponents] = useState<Character[]>([]);

  // Selected Characters
  const [p1Character, setP1Character] = useState<Character>(CHARACTERS[0]);
  const [p2Character, setP2Character] = useState<Character>(CHARACTERS[1]);

  // Match Combatants State
  const [fighter1, setFighter1] = useState<FighterState | null>(null);
  const [fighter2, setFighter2] = useState<FighterState | null>(null);

  // Match Flow State
  const [currentAttacker, setCurrentAttacker] = useState<1 | 2>(1);
  const [phase, setPhase] = useState<MatchPhase>('COIN_TOSS');
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [isScreenShaking, setIsScreenShaking] = useState(false);
  const [coinTossWinner, setCoinTossWinner] = useState<1 | 2 | null>(null);

  // Last Slap Impact Info
  const [lastSlapInfo, setLastSlapInfo] = useState<{
    rating: SlapRating;
    damage: number;
    isCrit: boolean;
    comicText: string;
    targetPlayer: 1 | 2;
  } | null>(null);

  // Winner State for MatchEndModal
  const [winnerFighter, setWinnerFighter] = useState<FighterState | null>(null);
  const [loserFighter, setLoserFighter] = useState<FighterState | null>(null);

  // Initialize a match
  const startMatch = useCallback((char1: Character, char2: Character) => {
    sounds.playBell();

    const f1: FighterState = {
      character: char1,
      name: char1.name,
      isPlayer: true,
      playerNum: 1,
      currentHp: char1.maxHp,
      maxHp: char1.maxHp,
      rage: 0,
      isSuperReady: false,
      superActiveThisTurn: false,
      slapsLanded: 0,
      critsLanded: 0,
      highestDamage: 0,
      bruiseCount: 0,
      isDazed: false,
    };

    const f2: FighterState = {
      character: char2,
      name: char2.name,
      isPlayer: gameMode === 'PASS_AND_PLAY',
      playerNum: 2,
      currentHp: char2.maxHp,
      maxHp: char2.maxHp,
      rage: 0,
      isSuperReady: false,
      superActiveThisTurn: false,
      slapsLanded: 0,
      critsLanded: 0,
      highestDamage: 0,
      bruiseCount: 0,
      isDazed: false,
    };

    setFighter1(f1);
    setFighter2(f2);
    setWinnerFighter(null);
    setLoserFighter(null);
    setLastSlapInfo(null);
    setRoundNumber(1);

    // Coin Toss determines first slapper
    setPhase('COIN_TOSS');
    const firstSlapper: 1 | 2 = Math.random() > 0.5 ? 1 : 2;
    setCoinTossWinner(firstSlapper);
    setCurrentAttacker(firstSlapper);

    setTimeout(() => {
      setPhase('AIMING');
    }, 1800);
  }, [gameMode]);

  // Handle Character Selection Confirmation
  const handleConfirmCharacters = (c1: Character, c2: Character) => {
    setP1Character(c1);

    if (gameMode === 'TOURNAMENT') {
      // Create bracket of remaining 3 characters
      const others = CHARACTERS.filter(c => c.id !== c1.id);
      setTournamentOpponents(others);
      setTournamentRound(1);
      setP2Character(others[0]);
      setGameState('MATCH');
      startMatch(c1, others[0]);
    } else {
      setP2Character(c2);
      setGameState('MATCH');
      startMatch(c1, c2);
    }
  };

  // Turn Execution for Slap
  const executeSlap = useCallback((
    rating: SlapRating, 
    accuracy: number, 
    offsetMs: number
  ) => {
    if (!fighter1 || !fighter2 || phase !== 'AIMING') return;

    const attackerNum = currentAttacker;
    const defenderNum = attackerNum === 1 ? 2 : 1;
    const attacker = attackerNum === 1 ? fighter1 : fighter2;
    const defender = defenderNum === 1 ? fighter1 : fighter2;

    const isSuper = attacker.superActiveThisTurn;

    // 1. Enter Wind-up
    setPhase('WINDUP');
    sounds.playWhoosh();

    setTimeout(() => {
      // 2. Slap connects (Impact)
      sounds.playSlap(rating, isSuper);

      // Screen shake calculation
      if (rating === 'CRITICAL' || isSuper) {
        setIsScreenShaking(true);
        setTimeout(() => setIsScreenShaking(false), 450);
      } else if (rating === 'HARD') {
        setIsScreenShaking(true);
        setTimeout(() => setIsScreenShaking(false), 250);
      }

      // Calculate Damage
      const [minDmg, maxDmg] = attacker.character.baseDamage;
      const baseRoll = minDmg + Math.random() * (maxDmg - minDmg);

      let damageMultiplier = 1.0;
      let isCrit = false;

      if (rating === 'CRITICAL') {
        damageMultiplier = attacker.character.critMultiplier;
        isCrit = true;
      } else if (rating === 'HARD') {
        damageMultiplier = 1.45;
      } else if (rating === 'SOLID') {
        damageMultiplier = 1.0;
      } else {
        damageMultiplier = 0.35; // Weak
      }

      let totalDamage = Math.round(baseRoll * damageMultiplier);

      // Trait / Super ability adjustments
      if (isSuper) {
        if (attacker.character.id === 'helga') {
          totalDamage += 40; // Mother's fury bonus
        } else if (attacker.character.id === 'boris') {
          totalDamage = Math.round(totalDamage * 1.3);
        }
      }

      // Defender's passive defense (Kenji ignores defense during super)
      if (!(isSuper && attacker.character.id === 'kenji')) {
        totalDamage = Math.round(totalDamage * (1 - defender.character.defense));
      }

      // Minimum 5 dmg
      totalDamage = Math.max(5, totalDamage);

      // Comic text
      const comicList = SLAP_COMICS[rating] || SLAP_COMICS.SOLID;
      const comicWord = comicList[Math.floor(Math.random() * comicList.length)];

      setLastSlapInfo({
        rating,
        damage: totalDamage,
        isCrit,
        comicText: comicWord,
        targetPlayer: defenderNum,
      });

      // Apply effects to Fighter States
      const newDefenderHp = Math.max(0, defender.currentHp - totalDamage);
      const isKO = newDefenderHp <= 0;

      // Gentleman self-heal trait
      let attackerHpGain = 0;
      if (attacker.character.id === 'sterling') {
        if (isSuper) attackerHpGain = 25;
        else if (rating === 'CRITICAL' || rating === 'HARD') attackerHpGain = 15;
      }

      // Helga gains extra rage on hit taken
      const defenderRageGain = defender.character.id === 'helga' ? 40 : 25;
      const attackerRageGain = isCrit ? 20 : 10;

      // Update Defender
      const updatedDefender: FighterState = {
        ...defender,
        currentHp: newDefenderHp,
        rage: Math.min(100, defender.rage + defenderRageGain),
        bruiseCount: Math.min(5, defender.bruiseCount + (isCrit ? 2 : 1)),
        isDazed: isSuper && attacker.character.id === 'sterling' ? true : false,
      };

      // Update Attacker
      const updatedAttacker: FighterState = {
        ...attacker,
        currentHp: Math.min(attacker.maxHp, attacker.currentHp + attackerHpGain),
        rage: isSuper ? 0 : Math.min(100, attacker.rage + attackerRageGain),
        superActiveThisTurn: false,
        slapsLanded: attacker.slapsLanded + 1,
        critsLanded: attacker.critsLanded + (isCrit ? 1 : 0),
        highestDamage: Math.max(attacker.highestDamage, totalDamage),
        isDazed: false, // Dazed status wears off on slap
      };

      if (attackerNum === 1) {
        setFighter1(updatedAttacker);
        setFighter2(updatedDefender);
      } else {
        setFighter2(updatedAttacker);
        setFighter1(updatedDefender);
      }

      setPhase('IMPACT');

      // 3. Check for Knockout or Transition
      if (isKO) {
        setTimeout(() => {
          sounds.playKOGong();
          setPhase('KNOCKOUT');
          setTimeout(() => {
            setWinnerFighter(updatedAttacker);
            setLoserFighter(updatedDefender);
            setGameState('MATCH_OVER');
          }, 1600);
        }, 700);
      } else {
        // Reaction and turn transition
        setTimeout(() => {
          setPhase('REACTION');
          setTimeout(() => {
            // Next Turn
            setCurrentAttacker(defenderNum);
            setRoundNumber(prev => prev + 1);
            setLastSlapInfo(null);
            setPhase('AIMING');
          }, 900);
        }, 600);
      }
    }, 350);
  }, [fighter1, fighter2, phase, currentAttacker]);

  // AI Automatic Turn Execution
  useEffect(() => {
    if (phase !== 'AIMING' || !fighter1 || !fighter2 || gameState !== 'MATCH') return;

    const isAITurn = (currentAttacker === 2 && gameMode !== 'PASS_AND_PLAY') ||
                     (currentAttacker === 1 && !fighter1.isPlayer);

    if (isAITurn) {
      const aiFighter = currentAttacker === 1 ? fighter1 : fighter2;

      // AI considers using Super when rage is 100%
      if (aiFighter.rage >= 100 && Math.random() > 0.3) {
        sounds.playSpecialCharge();
        if (currentAttacker === 1) {
          setFighter1(prev => prev ? { ...prev, superActiveThisTurn: true } : null);
        } else {
          setFighter2(prev => prev ? { ...prev, superActiveThisTurn: true } : null);
        }
      }

      // AI timing delay (simulating human pause and timing)
      const aiDelay = 1200 + Math.random() * 900;
      const timer = setTimeout(() => {
        // AI accuracy roll
        const roll = Math.random();
        let rating: SlapRating = 'SOLID';
        let accuracy = 60;
        let offsetMs = 35;

        // Higher chance of critical if Boris or tournament final
        const critChance = tournamentRound === 3 ? 0.38 : 0.28;
        const hardChance = 0.45;

        if (roll < critChance) {
          rating = 'CRITICAL';
          accuracy = 95 + Math.floor(Math.random() * 5);
          offsetMs = Math.floor(Math.random() * 8);
        } else if (roll < critChance + hardChance) {
          rating = 'HARD';
          accuracy = 75 + Math.floor(Math.random() * 15);
          offsetMs = 15 + Math.floor(Math.random() * 15);
        } else if (roll < 0.92) {
          rating = 'SOLID';
          accuracy = 55 + Math.floor(Math.random() * 15);
          offsetMs = 35 + Math.floor(Math.random() * 20);
        } else {
          rating = 'WEAK';
          accuracy = 30 + Math.floor(Math.random() * 15);
          offsetMs = 60 + Math.floor(Math.random() * 25);
        }

        executeSlap(rating, accuracy, offsetMs);
      }, aiDelay);

      return () => clearTimeout(timer);
    }
  }, [phase, currentAttacker, fighter1, fighter2, gameMode, gameState, tournamentRound, executeSlap]);

  // Activate Super Power for Human Player
  const handleActivateSuper = () => {
    sounds.playSpecialCharge();
    if (currentAttacker === 1 && fighter1) {
      setFighter1({ ...fighter1, superActiveThisTurn: true });
    } else if (currentAttacker === 2 && fighter2) {
      setFighter2({ ...fighter2, superActiveThisTurn: true });
    }
  };

  // Advance Tournament Match
  const handleNextTournamentMatch = () => {
    const nextRound = tournamentRound + 1;
    setTournamentRound(nextRound);
    const nextOpponent = tournamentOpponents[nextRound - 1];
    if (nextOpponent) {
      setP2Character(nextOpponent);
      setGameState('MATCH');
      startMatch(p1Character, nextOpponent);
    }
  };

  // Rematch same characters
  const handleRematch = () => {
    setGameState('MATCH');
    startMatch(p1Character, p2Character);
  };

  const isTournamentComplete = tournamentRound >= 3 && winnerFighter?.playerNum === 1;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between selection:bg-amber-500 selection:text-neutral-950">
      {/* Universal Top Header */}
      <header className="border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-8 select-none z-30">
        {/* Zone 1: Wordmark */}
        <div 
          onClick={() => { sounds.playClick(); setGameState('TITLE_MENU'); }}
          className="text-lg font-black tracking-tight text-white flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
          <span>SLAP LEGENDS</span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-neutral-400">
          <button 
            onClick={() => { sounds.playClick(); setGameMode('TOURNAMENT'); setGameState('CHAR_SELECT'); }}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Tournament
          </button>
          <button 
            onClick={() => { sounds.playClick(); setGameMode('VERSUS_AI'); setGameState('CHAR_SELECT'); }}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Versus CPU
          </button>
          <button 
            onClick={() => { sounds.playClick(); setGameMode('PASS_AND_PLAY'); setGameState('CHAR_SELECT'); }}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            2-Player Local
          </button>
          <button 
            onClick={() => { sounds.playClick(); setGameState('PRACTICE_DOJO'); }}
            className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Timing Dojo
          </button>
        </nav>

        {/* Zone 3: Sound, 3D Toggle & Rules Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => { sounds.playClick(); setIs3DMode(!is3DMode); }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              is3DMode 
                ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Toggle between 3D Slap Animation and 2D Arcade Classic"
          >
            <Box className="w-3.5 h-3.5" />
            <span>{is3DMode ? '3D Arena' : '2D Classic'}</span>
          </button>

          <button
            onClick={() => setIsRulesOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Rules
          </button>

          <button
            onClick={() => { sounds.toggleMute(); setIsMuted(!isMuted); }}
            className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white cursor-pointer transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Content Router */}
      <main className="flex-1 flex flex-col justify-center py-4 px-2 sm:px-6">
        {gameState === 'TITLE_MENU' && (
          <TitleMenu
            onSelectMode={(mode) => {
              setGameMode(mode);
              if (mode === 'PRACTICE') {
                setGameState('PRACTICE_DOJO');
              } else {
                setGameState('CHAR_SELECT');
              }
            }}
            onOpenRules={() => setIsRulesOpen(true)}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
          />
        )}

        {gameState === 'CHAR_SELECT' && (
          <CharacterSelect
            gameMode={gameMode}
            onConfirmSelection={handleConfirmCharacters}
            onBack={() => setGameState('TITLE_MENU')}
          />
        )}

        {gameState === 'PRACTICE_DOJO' && (
          <PracticeDojo onBack={() => setGameState('TITLE_MENU')} />
        )}

        {gameState === 'MATCH' && fighter1 && fighter2 && (
          <div className="w-full max-w-5xl mx-auto space-y-4">
            {/* Top Match HUD with Health & Rage Bars */}
            <FighterHUD
              fighter1={fighter1}
              fighter2={fighter2}
              currentAttacker={currentAttacker}
            />

            {/* 3D Slap Fighting Arena (Three.js) or 2D Classic Arena */}
            {is3DMode ? (
              <ThreeFightArena
                fighter1={fighter1}
                fighter2={fighter2}
                currentAttacker={currentAttacker}
                phase={phase}
                lastSlapInfo={lastSlapInfo}
                roundNumber={roundNumber}
              />
            ) : (
              <FightArena
                fighter1={fighter1}
                fighter2={fighter2}
                currentAttacker={currentAttacker}
                phase={phase}
                lastSlapInfo={lastSlapInfo}
                isScreenShaking={isScreenShaking}
                roundNumber={roundNumber}
              />
            )}

            {/* Coin Toss Notification Banner */}
            {phase === 'COIN_TOSS' && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-center animate-comic-pop max-w-md mx-auto">
                <div className="text-amber-400 font-extrabold text-sm uppercase tracking-wider mb-1">
                  🪙 Coin Flip Result
                </div>
                <div className="text-neutral-100 font-bold text-base">
                  {coinTossWinner === 1 ? fighter1.name : fighter2.name} won the coin toss and strikes first!
                </div>
              </div>
            )}

            {/* The Precision Oscillating Power Meter */}
            {phase !== 'COIN_TOSS' && phase !== 'KNOCKOUT' && (
              <PowerMeter
                attacker={currentAttacker === 1 ? fighter1.character : fighter2.character}
                defender={currentAttacker === 1 ? fighter2.character : fighter1.character}
                isPlayerTurn={
                  (currentAttacker === 1 && fighter1.isPlayer) ||
                  (currentAttacker === 2 && fighter2.isPlayer)
                }
                isActive={phase === 'AIMING'}
                isSuperActive={
                  currentAttacker === 1 
                    ? fighter1.superActiveThisTurn 
                    : fighter2.superActiveThisTurn
                }
                rage={currentAttacker === 1 ? fighter1.rage : fighter2.rage}
                onActivateSuper={handleActivateSuper}
                onSlap={(rating, accuracy, offsetMs) => {
                  executeSlap(rating, accuracy, offsetMs);
                }}
                isDazed={currentAttacker === 1 ? fighter1.isDazed : fighter2.isDazed}
              />
            )}
          </div>
        )}

        {/* Match End / Victory Modal */}
        {gameState === 'MATCH_OVER' && winnerFighter && loserFighter && (
          <MatchEndModal
            winner={winnerFighter}
            loser={loserFighter}
            gameMode={gameMode}
            tournamentRound={tournamentRound}
            isTournamentComplete={isTournamentComplete}
            onNextTournamentMatch={handleNextTournamentMatch}
            onRematch={handleRematch}
            onMainMenu={() => setGameState('TITLE_MENU')}
          />
        )}
      </main>

      {/* Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-3 px-6 text-center text-xs text-neutral-500 select-none">
        <span>Slap Legends · 2D Arcade Competition · All 4 Characters & Power-Meter Active</span>
      </footer>
    </div>
  );
}
