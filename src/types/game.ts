export interface Character {
  id: string;
  name: string;
  nickname: string;
  title: string;
  avatar: string;
  bio: string;
  quote: string;
  maxHp: number;
  meterSpeed: number; // multiplier: e.g. 0.85 = slower, 1.25 = faster
  sweetSpotWidth: number; // percentage width of center critical zone (e.g., 8, 10, 14)
  baseDamage: [number, number]; // [min, max]
  critMultiplier: number;
  defense: number; // % damage reduction (0 to 0.3)
  specialName: string;
  specialDesc: string;
  specialTrait: string;
  accentColor: string;
  tagline: string;
}

export type SlapRating = 'MISS' | 'WEAK' | 'SOLID' | 'HARD' | 'CRITICAL';

export interface SlapEvaluation {
  rating: SlapRating;
  accuracy: number; // 0 to 100 (100 is exact center)
  offsetMs: number; // millisecond difference from peak
  damage: number;
  isCrit: boolean;
  flavorText: string;
  comicWord: string;
}

export type GameMode = 'TOURNAMENT' | 'VERSUS_AI' | 'PASS_AND_PLAY' | 'PRACTICE';

export type GameState = 
  | 'TITLE_MENU'
  | 'CHAR_SELECT'
  | 'TOURNAMENT_MAP'
  | 'MATCH'
  | 'ROUND_OVER'
  | 'MATCH_OVER'
  | 'PRACTICE_DOJO';

export type MatchPhase = 
  | 'COIN_TOSS'
  | 'READY'
  | 'AIMING'
  | 'WINDUP'
  | 'IMPACT'
  | 'REACTION'
  | 'TURN_TRANSITION'
  | 'KNOCKOUT';

export interface FighterState {
  character: Character;
  name: string;
  isPlayer: boolean;
  playerNum: 1 | 2;
  currentHp: number;
  maxHp: number;
  rage: number; // 0 to 100
  isSuperReady: boolean;
  superActiveThisTurn: boolean;
  slapsLanded: number;
  critsLanded: number;
  highestDamage: number;
  bruiseCount: number; // 0 to 5
  isDazed: boolean;
}

export interface MatchStats {
  round: number;
  totalDamageDealtP1: number;
  totalDamageDealtP2: number;
  slapsP1: number;
  slapsP2: number;
  critsP1: number;
  critsP2: number;
  bestSlapP1: number;
  bestSlapP2: number;
  winner: 1 | 2 | null;
}
