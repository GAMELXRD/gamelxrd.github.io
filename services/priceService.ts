
import { MovieData, GameData, CalculationResult } from "../types";

interface CalculateOptions {
  priority: boolean;
  gameCostIncluded?: boolean; // Toggle for games
  userDuration?: number; // Override for games
}

export const calculatePrice = (
  media: MovieData | GameData, 
  options: CalculateOptions
): CalculationResult => {
  const { priority, gameCostIncluded = false, userDuration } = options;
  const warnings: string[] = [];

  let basePrice = 0;
  let ratingSurcharge = 0;
  let durationSurcharge = 0;
  let discount = 0;
  let superLongSurcharge = 0;
  let isRussian = false;
  let isHorror = false;
  let gameCost = 0;

  // === GAME LOGIC ===
  if (media.type === 'game') {
    // Genres check
    const horrorKeywords = ["horror", "survival horror", "psychological horror", "ужасы", "хоррор"];
    const interactiveKeywords = ["interactive movie", "interactive story", "fmv", "интерактивное кино", "интерактивная история", "point & click", "point-and-click", "point-n-click", "visual novel", "визуальная новелла"];
    
    const hasHorror = media.genres.some(g => horrorKeywords.some(k => g.toLowerCase().includes(k)));
    const isInteractive = media.genres.some(g => interactiveKeywords.some(k => g.toLowerCase().includes(k)));

    // Interactive Movies are exempt from Horror surcharge
    isHorror = hasHorror && !isInteractive;

    // Duration: Use user input or default to 4 (Min constraint handled in UI/Logic)
    const duration = Math.max(4, userDuration || 4);

    if (isHorror) {
      // Horror: 240 RUB per hour
      basePrice = duration * 240;
    } else {
      // Standard: 
      // <= 4 hours: 150 RUB per hour (4h * 150 = 600)
      // > 4 hours (5+): 180 RUB per hour
      const hourlyRate = duration > 4 ? 180 : 150;
      basePrice = duration * hourlyRate;
    }

    // Rating Surcharge (< 6.5)
    // Formula: 20 RUB per 0.1 rating diff.
    if (media.rating < 6.5) {
      const diff = Math.max(0, 6.5 - media.rating);
      // diff is like 1.2. Round(1.2 * 10) = 12 steps. 12 * 20 = 240.
      const steps = Math.round(diff * 10);
      ratingSurcharge = steps * 20;
    }

    // Calculate Service Fee (Base + Rating) used for further adjustments
    const serviceFee = basePrice + ratingSurcharge;

    // Super Long Surcharge (> 150 hours)
    // 100% surcharge for every 100 hours
    // Priority: If Super Long applies, Discount does NOT apply.
    if (duration > 150) {
      const hundreds = Math.floor(duration / 100);
      superLongSurcharge = serviceFee * hundreds;
      discount = 0; 
    } else if (duration > 24) {
      // Discount (> 24 hours) - only if not super long
      discount = Math.round(serviceFee * 0.10); // 10% discount
    }

    // Game Cost
    if (gameCostIncluded) {
      gameCost = media.steamPriceRub;
    }
  }
  
  // === MOVIE & TV LOGIC ===
  else {
    const RUSSIAN_KEYWORDS = ["Russia", "Rossiya", "Soviet Union", "USSR", "SSSR", "Россия", "СССР", "Советский Союз"];
    isRussian = media.countries.some(c => 
      RUSSIAN_KEYWORDS.some(k => c.toLowerCase().includes(k.toLowerCase()))
    );
    
    basePrice = isRussian ? 2000 : 500;

    // Rating Surcharge (< 6.5)
    if (media.imdbRating < 6.5) {
      const diff = Math.max(0, 6.5 - media.imdbRating);
      ratingSurcharge = Math.round(basePrice * (diff * 0.20));
    }

    // Duration Surcharge (> 100 min)
    const DURATION_THRESHOLD = 100;
    if (media.runtimeMinutes > DURATION_THRESHOLD) {
      const diff = media.runtimeMinutes - DURATION_THRESHOLD;
      const blocks = Math.ceil(diff / 10);
      durationSurcharge = blocks * 20;
    }

    // Banned Studios Warning
    const BANNED_KEYWORDS = [
      "disney", "amazon", "netflix", "warner bros", "warner brothers", "wb", 
      "hbo", "pixar", "marvel", "universal pictures", "universal studios"
    ];
    const hasBannedStudio = media.productionCompanies.some(company => 
      BANNED_KEYWORDS.some(banned => company.toLowerCase().includes(banned))
    );
    if (hasBannedStudio && media.year > 2015) {
      warnings.push("Внимание: Производитель из 'черного списка'. Просмотр может быть перенесен на Boosty.");
    }
  }

  // === COMMON ===
  // Note: For Priority calculation, we use the Service Fee (Base + Rating + DurationSurcharge)
  // We exclude the discount from the Priority calculation base (Priority is expensive).
  // We exclude Game Cost from Priority.
  const baseServiceFee = basePrice + ratingSurcharge + durationSurcharge + superLongSurcharge;
  const prioritySurcharge = priority ? (basePrice + ratingSurcharge + durationSurcharge) : 0; 
  // Priority logic: Usually simply doubles the "work" cost. 
  // We don't double the "Super Long Surcharge" in priority (it's already massive), 
  // nor do we reduce priority by the discount.
  // Priority = 100% of standard service fee (Base + Rating + MovieDuration).

  const totalBeforePriority = (basePrice + ratingSurcharge + durationSurcharge + superLongSurcharge) - discount + gameCost;
  
  const finalPrice = totalBeforePriority + prioritySurcharge;

  return {
    basePrice,
    ratingSurcharge,
    durationSurcharge,
    discount,
    superLongSurcharge,
    isRussian,
    isHorror,
    gameCostIncluded: !!gameCostIncluded,
    gameCost,
    totalBeforePriority,
    prioritySurcharge,
    finalPrice,
    warnings
  };
};
