import React, { useState, useCallback, useRef } from 'react';
import { MovieData, GameData, MovieSuggestion } from './types';
import { fetchMovieDetails } from './services/movieService';
import { fetchGameData } from './services/geminiService';
import { calculatePrice } from './services/priceService';
import SearchBar from './components/SearchBar';
import MovieCard from './components/MovieCard';
import GameCard from './components/GameCard';
import PriceCalculator from './components/PriceCalculator';
import StarBackground from './components/StarBackground';

function App() {
  const [media, setMedia] = useState<MovieData | GameData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State to manage smooth exit animations
  const [isExiting, setIsExiting] = useState(false);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = () => {
    // Cancel any pending exit animation if we start a new search immediately
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }
    setIsExiting(false);
    setLoading(true);
    setError(null);
    // Don't clear media immediately here to allow cross-fade or smooth switch if needed,
    // or clear it if you prefer "blank slate" loading. 
    // For now, clearing to show loader stars clearly.
    setMedia(null); 
  };

  const handleSelectMovie = async (imdbID: string) => {
    startLoading();
    try {
      const data = await fetchMovieDetails(imdbID);
      setMedia({ ...data, type: 'movie' });
    } catch (err) {
      setError("Не удалось загрузить информацию о фильме. Проверьте соединение или API ключ.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchGame = async (query: string, year?: string, preloadedPoster?: string) => {
    startLoading();
    try {
      const data = await fetchGameData(query, year);
      
      // If we already have a correct poster from the search dropdown (RAWG), use it 
      // instead of potentially getting a wrong one (e.g. Remake cover) from Gemini.
      if (preloadedPoster) {
        data.posterUrl = preloadedPoster;
      }

      setMedia(data);
    } catch (err) {
      setError("Не удалось найти информацию об игре. Попробуйте уточнить название.");
    } finally {
      setLoading(false);
    }
  };

  const handleMediaSelect = (suggestion: MovieSuggestion) => {
     if (suggestion.mediaType === 'movie') {
        handleSelectMovie(suggestion.imdbID);
     } else {
        // For games, we pass the title AND the year to ensure specific version context
        // We also pass the poster so we don't lose the correct image
        handleSearchGame(suggestion.title, suggestion.year, suggestion.poster);
     }
  };

  // Handle smooth clearing
  const handleClear = useCallback(() => {
    if (!media) return; // Nothing to clear

    setIsExiting(true);
    
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    
    exitTimeoutRef.current = setTimeout(() => {
      setMedia(null);
      setIsExiting(false);
      exitTimeoutRef.current = null;
    }, 500); // Duration matches the CSS transition duration
  }, [media]);

  return (
    <div className="relative min-h-screen text-zinc-100 selection:bg-purple-500/30 selection:text-white font-sans overflow-hidden">
      
      {/* Background Layers */}
      <div className="fixed inset-0 z-0 bg-[#050505]">
        
        {/* Dynamic Nebula Effect (Rendered FIRST so it's BEHIND stars) */}
        {media?.posterUrl && (
          <>
            <div 
              className={`absolute inset-0 bg-cover bg-center transition-all ease-out blur-[120px] animate-pulse-slow
                ${isExiting 
                  ? 'duration-500 opacity-0 scale-100' 
                  : 'duration-[2000ms] opacity-[0.04] scale-150'
                }`}
              style={{ backgroundImage: `url(${media.posterUrl})` }}
            />
            {/* Secondary blurred layer for depth */}
            <div 
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cover bg-center transition-all ease-out blur-[80px] mix-blend-screen
                ${isExiting 
                  ? 'duration-500 opacity-0' 
                  : 'duration-[3000ms] opacity-[0.02]'
                }`}
              style={{ backgroundImage: `url(${media.posterUrl})` }}
            />
          </>
        )}

        {/* Canvas Starfield (Transparent, rendered AFTER nebula) */}
        <StarBackground isWarpSpeed={loading} />
        
        {/* Vignette & Gradients (On top of everything in background to fade edges) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/80"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center min-h-screen">
        
        {/* Header */}
        <header className="mb-16 text-center animate-fade-in">
          <h1 className="text-sm md:text-base font-medium text-zinc-400 uppercase tracking-[0.3em] mb-3 backdrop-blur-sm inline-block px-4 py-1 rounded-full bg-white/5 border border-white/5">
            калькулятор
          </h1>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 uppercase tracking-tighter drop-shadow-2xl">
            Заказ Игр и Фильмов
          </h2>
        </header>

        {/* Search */}
        <SearchBar 
          onSelect={handleMediaSelect}
          onClear={handleClear}
          isLoading={loading}
        />

        {/* Error State */}
        {error && (
          <div className="backdrop-blur-md bg-red-500/10 border border-red-500/20 px-6 py-4 rounded-xl mb-10 max-w-xl text-center shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-fade-in">
             <p className="text-red-200 font-light">{error}</p>
          </div>
        )}

        {/* Results */}
        {media && (
          <div className={`w-full transition-all duration-500 ease-in-out transform
            ${isExiting 
              ? 'opacity-0 scale-95 blur-lg translate-y-4' 
              : 'opacity-100 scale-100 blur-0 translate-y-0 animate-fade-in-up'
            }`}>
            {media.type === 'movie' ? (
               <MovieCard 
                  movie={media as MovieData} 
                  calculation={calculatePrice(media as MovieData, { priority: false })} 
               />
            ) : (
               <GameCard 
                  game={media as GameData} 
                  calculation={calculatePrice(media as GameData, { priority: false })} 
               />
            )}
            
            <PriceCalculator media={media} />
          </div>
        )}
        
        {/* Footer - Only show when idle (no media and not fading out) */}
        {!media && !loading && !error && (
           <div className="mt-auto pt-20 text-center opacity-40 hover:opacity-100 transition-opacity duration-500">
              <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Сделано с 💖 gamelxrd
              </div>
           </div>
        )}

      </div>
    </div>
  );
}

export default App;