
import { MovieSuggestion, GameData } from "../types";
import { API_BASE_URL } from "./apiConfig";

// --- SEARCH GAMES ---
export const searchGames = async (query: string, signal?: AbortSignal): Promise<MovieSuggestion[]> => {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/search-game?query=${encodeURIComponent(query)}`, { signal });
    if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
    }
    const data = await response.json();

    if (!data.results) return [];

    return data.results.map((game: any) => ({
      title: game.name,
      year: game.released ? game.released.split("-")[0] : "",
      imdbID: game.slug, // RAWG uses slugs as IDs usually
      poster: game.background_image ? game.background_image : "",
      mediaType: 'game'
    }));
  } catch (error: any) {
    // Silent exit on abort or network glitches during typing
    if (error.name === 'AbortError' || error.message === 'Failed to fetch') return []; 
    
    console.warn("RAWG Search skipped:", error.message);
    return [];
  }
};

// --- GET GAME DETAILS (Analyze via Backend) ---
export const fetchGameData = async (query: string, releaseYear?: string): Promise<GameData> => {
  console.group(`🎮 [GameService] Fetching Data for: "${query}"`);
  console.time("Total Fetch Time");
  
  try {
      console.log(`📡 Sending POST request to ${API_BASE_URL}/analyze-game`);
      console.log(`📦 Payload:`, { query });

      const response = await fetch(`${API_BASE_URL}/analyze-game`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query })
      });

      if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          console.error(`❌ HTTP Error: ${response.status}`, errData);
          throw new Error(errData.error || `Server Error: ${response.status}`);
      }

      const gameDetails = await response.json();

      // --- DISPLAY SERVER LOGS ---
      if (gameDetails.debugLogs && Array.isArray(gameDetails.debugLogs)) {
          console.groupCollapsed("🖥️ Server-Side Execution Trace (Netlify)");
          gameDetails.debugLogs.forEach((log: string) => {
              // Color coding based on log content
              let style = 'color: #888';
              if (log.includes('Groq')) style = 'color: #0ff';
              if (log.includes('Steam')) style = 'color: #4f8';
              if (log.includes('RAWG')) style = 'color: #f0f';
              if (log.includes('❌') || log.includes('⚠️')) style = 'color: #f55; font-weight: bold';
              if (log.includes('✅') || log.includes('🏆')) style = 'color: #afa; font-weight: bold';
              
              console.log(`%c${log}`, style);
          });
          console.groupEnd();
      }
      // ---------------------------

      console.log(`✅ Final Parsed Data:`, gameDetails);
      console.timeEnd("Total Fetch Time");
      console.groupEnd();

      return {
        type: 'game',
        ...gameDetails,
        userDuration: Math.max(4, gameDetails.hltbTime || 4)
      };

  } catch (error: any) {
    console.timeEnd("Total Fetch Time");
    console.error("❌ Error fetching game data:", error);
    console.groupEnd();
    throw new Error(error.message || "Unknown error fetching game");
  }
};
