import { Character } from '../types/game';

export const CHARACTERS: Character[] = [
  {
    id: 'boris',
    name: 'Boris',
    nickname: 'The Anvil',
    title: 'Heavyweight Juggernaut',
    avatar: '/src/assets/images/char_boris_anvil_1794476082001.jpg',
    bio: 'Former Siberian blacksmith with forearms carved from granite. Boris does not flinch; he simply absorbs your hit and delivers an earth-shattering palm.',
    quote: '"You hit like morning breeze. Now step up and take real slap!"',
    maxHp: 220,
    meterSpeed: 0.85, // Slower meter oscillation makes it easier to track and hit sweet spot
    sweetSpotWidth: 10,
    baseDamage: [38, 52],
    critMultiplier: 2.6, // Heavyweight critical punches hard
    defense: 0.20, // 20% passive damage reduction (Iron Chin)
    specialName: 'Anvil Quake',
    specialDesc: 'Next slap expands the Critical Sweet Spot by +60% and unleashes a shockwave that deals +30% raw damage.',
    specialTrait: 'Iron Chin: Takes 20% less damage from all incoming hits. Slower, steadier meter swing.',
    accentColor: '#f97316', // Orange
    tagline: 'High HP · High Defense · Devastating Crits',
  },
  {
    id: 'kenji',
    name: 'Kenji',
    nickname: 'The Viper',
    title: 'Lightning Speed Striker',
    avatar: '/src/assets/images/char_kenji_viper_1794476083432.jpg',
    bio: 'Dojo prodigy trained in open-palm kinetic redirection. Kenji’s slaps break the sound barrier with lethal pinpoint accuracy.',
    quote: '"Don’t blink. If you see the hand coming, you’re already on the floor."',
    maxHp: 165,
    meterSpeed: 1.25, // Fast meter oscillation requires sharp reflexes
    sweetSpotWidth: 7, // Sharper target zone
    baseDamage: [32, 45],
    critMultiplier: 3.1, // Highest critical multiplier in the game
    defense: 0.05,
    specialName: 'Twin Venom Snap',
    specialDesc: 'Slows down the power meter by 50% for Matrix-like precision and guarantees a piercing slap that ignores defense.',
    specialTrait: 'Hyper Reflex: Needle moves fast, but Bullseye hits deal an unmatched 3.1x Critical multiplier.',
    accentColor: '#38bdf8', // Cyan/Sky
    tagline: 'High Speed · Pinpoint Bullseye · Massive Crits',
  },
  {
    id: 'helga',
    name: 'Helga',
    nickname: 'The Rolling Pin',
    title: 'Viking Shieldmaiden',
    avatar: '/src/assets/images/char_helga_fury_1794476082838.jpg',
    bio: 'Champion woodchopper and Highland brawler. The more you hurt Helga, the angrier and harder she strikes back.',
    quote: '"That the best you got, lamb? Here comes the mother of all slaps!"',
    maxHp: 195,
    meterSpeed: 1.0, // Balanced meter speed
    sweetSpotWidth: 12, // Wider sweet spot
    baseDamage: [36, 48],
    critMultiplier: 2.5,
    defense: 0.10,
    specialName: 'Mother\'s Fury',
    specialDesc: 'Enters Berserk frenzy: doubles the Sweet Spot zone and adds +40 flat bonus damage to the impact.',
    specialTrait: 'Vengeance Rage: Gains double Rage energy whenever hit. Becomes deadlier as HP drops.',
    accentColor: '#ef4444', // Red
    tagline: 'Balanced · Rapid Rage · Berserk Comebacks',
  },
  {
    id: 'sterling',
    name: 'Sir Reginald',
    nickname: 'The Gentleman',
    title: 'Aristocrat Pugilist',
    avatar: '/src/assets/images/char_sterling_gentleman_1794476083744.jpg',
    bio: 'Victorian aristocrat with a majestic mustache and aristocratic poise. He considers slapping an art form governed by pristine geometry.',
    quote: '"A disgraceful swing, sir! Permit me to instruct you in proper etiquette."',
    maxHp: 175,
    meterSpeed: 1.05,
    sweetSpotWidth: 9,
    baseDamage: [34, 46],
    critMultiplier: 2.7,
    defense: 0.12,
    specialName: 'Glove of Dishonour',
    specialDesc: 'Delivers a crisp royal wallop that restores 25 HP and Dazes the opponent (their next meter goes twice as fast).',
    specialTrait: 'Gentleman\'s Polish: Any hit in the Great or Perfect zone restores +15 HP through sheer composure.',
    accentColor: '#eab308', // Gold
    tagline: 'Self-Heal · Opponent Daze · Refined Technique',
  },
];

export const SLAP_COMICS = {
  MISS: ['FLIFF!', 'WHIFF!', 'GRAZED!'],
  WEAK: ['PAT!', 'TAP!', 'MEH!'],
  SOLID: ['CLAP!', 'SMACK!', 'OUCH!'],
  HARD: ['WHACK!!', 'CRACK!!', 'SLAAAAP!!'],
  CRITICAL: ['K.O. POWER!!', 'BOOOOM!!', 'SKULL-RATTLER!!', 'HOLY CHALK!!', 'EARTHQUAKE!!'],
};
