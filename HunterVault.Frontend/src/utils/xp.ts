import { GameStatus } from '../types';

export interface XpGameData {
  status: GameStatus;
  trophyPercentage?: number;
  difficultyRating?: number;
}

/**
 * Calculates XP for a single game based on HunterVault's formula.
 * Matches the logic in the backend (ProfileEndpoints.cs).
 */
export function calculateGameXp(game: XpGameData): number {
  // Experience per Trophy Percentage (10 XP per 1%)
  // If status is Platinumed, it's 100%
  const percentage = game.status === 'Platinumed' ? 100 : (game.trophyPercentage || 0);
  let gameXp = percentage * 10;

  // Status Bonuses
  if (game.status === 'Completed') gameXp += 500;
  if (game.status === 'Platinumed') gameXp += 2000;

  // Difficulty multiplier (1 + Difficulty * 0.2)
  const difficultyMultiplier = 1 + ((game.difficultyRating || 0) * 0.2);
  
  return Math.floor(gameXp * difficultyMultiplier);
}

/**
 * Sound effect URLs.
 */
export const XP_GAIN_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'; // Magic shine
export const LEVEL_UP_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'; // Success fanfare

export function playXpGainSound() {
  const audio = new Audio(XP_GAIN_SOUND);
  audio.volume = 0.4;
  audio.play().catch(err => console.error('Error playing XP sound:', err));
}

export function playLevelUpSound() {
  const audio = new Audio(LEVEL_UP_SOUND);
  audio.volume = 0.5;
  audio.play().catch(err => console.error('Error playing Level Up sound:', err));
}
