
import { MovieData, MovieSuggestion } from "../types";
import { getUserRating } from "./userService";
import { API_BASE_URL } from "./apiConfig";

// Поиск фильмов (через Netlify Function)
export const searchMovies = async (query: string, signal?: AbortSignal): Promise<MovieSuggestion[]> => {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/search-movie?query=${encodeURIComponent(query)}`, { signal });
    if (!response.ok) throw new Error(`Server Error: ${response.status}`);
    
    const data = await response.json();

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
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message === 'Failed to fetch') return []; 
    console.warn("Movie Search skipped:", error.message);
    return [];
  }
};

// Поиск сериалов (через Netlify Function)
export const searchTv = async (query: string, signal?: AbortSignal): Promise<MovieSuggestion[]> => {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/search-tv?query=${encodeURIComponent(query)}`, { signal });
    if (!response.ok) throw new Error(`Server Error: ${response.status}`);
    
    const data = await response.json();

    if (data.results) {
      return data.results.slice(0, 5).map((item: any) => ({
        title: item.name, // TMDB returns 'name' for TV shows
        year: item.first_air_date ? item.first_air_date.split("-")[0] : "",
        imdbID: item.id.toString(), 
        poster: item.poster_path 
          ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
          : "",
        mediaType: 'tv'
      }));
    }
    return [];
  } catch (error: any) {
    if (error.name === 'AbortError' || error.message === 'Failed to fetch') return []; 
    console.warn("TV Search skipped:", error.message);
    return [];
  }
};

// Получение деталей фильма (через Netlify Function)
export const fetchMovieDetails = async (tmdbID: string): Promise<MovieData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/get-movie-details?id=${tmdbID}`);
    
    if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
    }
    const tmdbData = await response.json();

    let userRating: number | undefined = undefined;
    if (tmdbData.imdb_id) {
        userRating = await getUserRating(tmdbData.imdb_id);
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
      imdbRating: tmdbData.calculated_imdb_rating || tmdbData.vote_average || 0,
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

// Получение деталей сериала (через Netlify Function)
export const fetchTvDetails = async (tmdbID: string): Promise<MovieData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/get-tv-details?id=${tmdbID}`);
    
    if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
    }
    const tmdbData = await response.json();

    const year = tmdbData.first_air_date ? parseInt(tmdbData.first_air_date.split("-")[0]) : 0;
    
    const productionCompanies = tmdbData.production_companies 
        ? tmdbData.production_companies.map((c: any) => c.name) 
        : [];

    const countries = tmdbData.production_countries
        ? tmdbData.production_countries.map((c: any) => c.name)
        : [];

    // Map detailed seasons info
    const seasons = tmdbData.seasons_data 
        ? tmdbData.seasons_data.map((s: any) => ({
            season_number: s.season_number,
            episode_count: s.episode_count
          }))
        : [];

    return {
      type: 'tv',
      title: tmdbData.name,
      originalTitle: tmdbData.original_name,
      year: year,
      runtimeMinutes: tmdbData.calculated_runtime || 0,
      averageRuntime: tmdbData.average_runtime || 45, // Map average runtime
      imdbRating: tmdbData.vote_average || 0,
      // No standard IMDB ID mapping easily available for TV in this flow without external calls
      userRating: undefined, 
      posterUrl: tmdbData.poster_path 
        ? `https://image.tmdb.org/t/p/w780${tmdbData.poster_path}`
        : undefined,
      countries: countries,
      productionCompanies: productionCompanies,
      kinopoiskUrl: `https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(tmdbData.name)}`,
      wikipediaUrl: `https://ru.wikipedia.org/w/index.php?search=${encodeURIComponent(tmdbData.name)}`,
      description: tmdbData.overview || "Описание отсутствует",
      totalSeasons: tmdbData.number_of_seasons,
      totalEpisodes: tmdbData.number_of_episodes,
      seasons: seasons
    };
  } catch (error) {
    console.error("TV Details fetch error:", error);
    throw error;
  }
};
