
export type MediaType = 'movie' | 'game';

export interface MovieData {
  type: 'movie';
  title: string;
  originalTitle?: string;
  year: number;
  runtimeMinutes: number;
  imdbRating: number;
  userRating?: number;
  posterUrl?: string;
  countries: string[];
  productionCompanies: string[];
  imdbUrl?: string;
  kinopoiskUrl?: string;
  wikipediaUrl?: string;
  description?: string;
}

export interface GameData {
  type: 'game';
  title: string;
  releaseYear: number;
  posterUrl?: string;
  genres: string[]; // Horror, FPS, RPG, etc.
  rating: number; // 0-10 scale (Metacritic or Steam converted)
  hltbTime: number; // Main Story in hours
  steamPriceRub: number; // Price in RUB (converted from KZ or direct)
  steamUrl?: string;
  description?: string;
  userDuration?: number; // User input for duration
  debugLogs?: string[]; // Server-side logs for debugging
}

export interface MovieSuggestion {
  title: string;
  year: string;
  imdbID: string;
  poster: string;
  mediaType: MediaType;
}

export interface CalculationResult {
  basePrice: number;
  ratingSurcharge: number;
  durationSurcharge: number;
  discount: number; // New: 10% discount for > 24h games
  superLongSurcharge: number; // New: 100% surcharge per 100h for > 150h games
  isRussian: boolean; // Only for movies
  isHorror: boolean; // Only for games
  gameCostIncluded: boolean; // Only for games
  gameCost: number; // Only for games
  totalBeforePriority: number;
  prioritySurcharge: number;
  finalPrice: number;
  warnings: string[];
}