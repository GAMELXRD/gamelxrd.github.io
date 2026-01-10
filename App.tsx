
import React, { useState, useCallback, useRef } from 'react';
import { MovieData, GameData, MovieSuggestion } from './types';
import { fetchMovieDetails, fetchTvDetails } from './services/movieService';
import { fetchGameData } from './services/gameService';
import { calculatePrice } from './services/priceService';
import SearchBar from './components/SearchBar';
import MovieCard from './components/MovieCard';
import GameCard from './components/GameCard';
import PriceCalculator from './components/PriceCalculator';
import StarBackground from './components/StarBackground';
import LandingPage from './components/LandingPage';

function App() {
  const [view, setView] = useState<'landing' | 'calculator'>('landing');

  // Calculator State
  const [media, setMedia] = useState<MovieData | GameData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State to manage smooth exit animations
  const [isExiting, setIsExiting] = useState(false);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = () => {
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }
    setIsExiting(false);
    setLoading(true);
    setError(null);
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

  const handleSelectTv = async (tmdbID: string) => {
    startLoading();
    try {
      const data = await fetchTvDetails(tmdbID);
      setMedia({ ...data, type: 'tv' });
    } catch (err) {
      setError("Не удалось загрузить информацию о сериале.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchGame = async (queryId: string, year?: string, preloadedPoster?: string) => {
    startLoading();
    try {
      // queryId is now likely the RAWG Slug (e.g., "silent-hill-2") for 100% accuracy
      const data = await fetchGameData(queryId, year);
      
      if (preloadedPoster && !data.posterUrl) {
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
     } else if (suggestion.mediaType === 'tv') {
        handleSelectTv(suggestion.imdbID);
     } else {
        // For games, suggestion.imdbID holds the RAWG Slug (see services/gameService.ts)
        handleSearchGame(suggestion.imdbID, suggestion.year, suggestion.poster);
     }
  };

  const handleClear = useCallback(() => {
    if (!media) return;

    setIsExiting(true);
    
    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    
    exitTimeoutRef.current = setTimeout(() => {
      setMedia(null);
      setIsExiting(false);
      exitTimeoutRef.current = null;
    }, 500);
  }, [media]);

  // Navigation Logic
  const goHome = () => {
    setView('landing');
    handleClear(); // Reset calculator state when going home
  };

  return (
    <div className="relative min-h-screen text-zinc-100 selection:bg-purple-500/30 selection:text-white font-sans overflow-x-hidden">
      
      {/* Background Layers - Persistent across views */}
      <div className="fixed inset-0 z-0 bg-[#050505]">
        
        {/* Dynamic Nebula Effect (Only visible in Calculator when media is selected) */}
        {view === 'calculator' && media?.posterUrl && (
          <>
            <div 
              className={`absolute inset-0 bg-cover bg-center transition-all ease-out blur-[120px] animate-pulse-slow
                ${isExiting 
                  ? 'duration-500 opacity-0 scale-100' 
                  : 'duration-[2000ms] opacity-[0.04] scale-150'
                }`}
              style={{ backgroundImage: `url(${media.posterUrl})` }}
            />
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

        <StarBackground isWarpSpeed={view === 'calculator' && loading} />
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/80"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12 min-h-screen flex flex-col">
        
        {view === 'landing' ? (
          <LandingPage onOpenCalculator={() => setView('calculator')} />
        ) : (
          // CALCULATOR VIEW
          <div className="flex flex-col items-center w-full animate-fade-in">
            
            {/* Navigation Header */}
            <div className="w-full max-w-5xl flex items-center justify-between mb-8 md:mb-12">
               <button 
                 onClick={goHome}
                 className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group px-3 py-2 rounded-lg hover:bg-white/5"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:-translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                 </svg>
                 <span className="text-sm font-bold uppercase tracking-wider">Назад</span>
               </button>

               <div className="text-right hidden md:block">
                  <h1 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Калькулятор заказов</h1>
               </div>
            </div>

            <header className="mb-12 text-center">
              <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 uppercase tracking-tighter drop-shadow-2xl">
                Заказ игр и фильмов
              </h2>
            </header>

            <SearchBar 
              onSelect={handleMediaSelect}
              onClear={handleClear}
              isLoading={loading}
            />

            {error && (
              <div className="backdrop-blur-md bg-red-500/10 border border-red-500/20 px-6 py-4 rounded-xl mb-10 max-w-xl text-center shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-fade-in">
                <p className="text-red-200 font-light">{error}</p>
              </div>
            )}

            {media && (
              <div className={`w-full transition-all duration-500 ease-in-out transform
                ${isExiting 
                  ? 'opacity-0 scale-95 blur-lg translate-y-4' 
                  : 'opacity-100 scale-100 blur-0 translate-y-0 animate-fade-in-up'
                }`}>
                {media.type === 'movie' || media.type === 'tv' ? (
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
            
            {!media && !loading && !error && (
              <div className="mt-20 text-center opacity-40">
                  <div className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
                    
                  </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
