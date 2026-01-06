
import { MovieSuggestion } from "../types";
import { API_BASE_URL } from "./apiConfig";

export const searchGames = async (query: string): Promise<MovieSuggestion[]> => {
  if (!query || query.length < 2) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/search-game?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("RAWG Error");
    const data = await res.json();

    return data.results.map((game: any) => ({
      title: game.name,
      year: game.released ? game.released.split("-")[0] : "",
      imdbID: game.slug,
      poster: game.background_image || "",
      mediaType: 'game'
    }));
  } catch (error) {
    console.error("RAWG Search error:", error);
    return [];
  }
};
