
import { MovieData, MovieSuggestion } from "../types";
import { getUserRating } from "./userService";
import { API_BASE_URL } from "./apiConfig";

// Поиск фильмов через Serverless Function (TMDB)
export const searchMovies = async (query: string): Promise<MovieSuggestion[]> => {
  if (!query || query.length < 2) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/search-movie?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Search Error: ${res.status}`);
    
    const data = await res.json();

    if (data.results) {
      return data.results.slice(0, 5).map((item: any) => ({
        title: item.title,
        year: item.release_date ? item.release_date.split("-")[0] : "",
        imdbID: item.id.toString(), 
        poster: item.poster_path 
          ? `https://image.tmdb.org/t/p/w92${item.poster_path}` 
          : "",
        mediaType: 'movie'
      }));
    }
    return [];
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
};

// Получение деталей фильма через Serverless Function (TMDB + OMDb logic on server)
export const fetchMovieDetails = async (tmdbID: string): Promise<MovieData> => {
  try {
    const res = await fetch(`${API_BASE_URL}/get-movie-details?id=${tmdbID}`);
    if (!res.ok) throw new Error(`Details Error: ${res.status}`);
    
    const tmdbData = await res.json();
    
    // Rating comes pre-calculated from server (TMDB or OMDb)
    const imdbRating = tmdbData.calculated_imdb_rating || tmdbData.vote_average || 0;
    
    // Check watched list locally (Database is client-side for now)
    const imdbExternalID = tmdbData.imdb_id;
    let userRating: number | undefined = undefined;
    if (imdbExternalID) {
        userRating = await getUserRating(imdbExternalID);
    }

    const runtime = tmdbData.runtime || 90;
    const year = tmdbData.release_date ? parseInt(tmdbData.release_date.split("-")[0]) : 0;
    
    const productionCompanies = tmdbData.production_companies 
        ? tmdbData.production_companies.map((c: any) => c.name) 
        : [];

    const countries = tmdbData.production_countries
        ? tmdbData.production_countries.map((c: any) => c.name)
        : [];

    return {
      type: 'movie',
      title: tmdbData.title,
      originalTitle: tmdbData.original_title,
      year: year,
      runtimeMinutes: runtime,
      imdbRating: imdbRating,
      userRating: userRating,
      posterUrl: tmdbData.poster_path 
        ? `https://image.tmdb.org/t/p/w780${tmdbData.poster_path}` 
        : undefined,
      countries: countries,
      productionCompanies: productionCompanies,
      imdbUrl: tmdbData.imdb_id ? `https://www.imdb.com/title/${tmdbData.imdb_id}/` : undefined,
      kinopoiskUrl: tmdbData.imdb_id 
        ? `https://www.kinopoisk.ru/index.php?kp_query=${tmdbData.imdb_id}`
        : `https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(tmdbData.title)}`,
      wikipediaUrl: `https://ru.wikipedia.org/w/index.php?search=${encodeURIComponent(tmdbData.title)}`,
      description: tmdbData.overview || "Описание отсутствует",
    };
  } catch (error) {
    console.error("Details fetch error:", error);
    throw error;
  }
};
