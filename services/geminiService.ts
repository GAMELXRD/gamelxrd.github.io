
import { GameData } from "../types";
import { API_BASE_URL } from "./apiConfig";

// --- MOVIE FETCHING (Legacy) ---
export const fetchMovieData = async (query: string): Promise<any> => {
   throw new Error("Use movieService for movies");
};

// --- GAME FETCHING (Via Netlify Function) ---
export const fetchGameData = async (query: string, releaseYear?: string): Promise<GameData> => {
  
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-game`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, releaseYear })
    });

    if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    
    // LOGGING FOR DEBUGGING
    console.group("🕹️ Game Data Fetched (Server)");
    console.log("Query:", query, releaseYear);
    console.log("Result Title:", data.title);
    console.log("Price:", data.steamPriceRub);
    console.groupEnd();

    return {
      type: 'game',
      ...data,
      userDuration: Math.max(4, data.hltbTime)
    };
  } catch (error) {
    console.error("Error fetching game data:", error);
    throw error;
  }
};
