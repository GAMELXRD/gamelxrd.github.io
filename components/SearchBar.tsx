import React, { useState, useEffect, useRef } from 'react';
import { searchMovies } from '../services/movieService';
import { searchGames } from '../services/gameService';
import { MovieSuggestion } from '../types';

interface SearchBarProps {
  onSelect: (suggestion: MovieSuggestion) => void;
  onClear?: () => void;
  isLoading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSelect, 
  onClear, 
  isLoading,
}) => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<MovieSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipSearchRef = useRef(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (skipSearchRef.current) {
        skipSearchRef.current = false;
        return;
      }

      if (input.trim().length >= 3) {
        setIsSearching(true);
        
        try {
          const [movies, games] = await Promise.all([
            searchMovies(input),
            searchGames(input)
          ]);

          // Combine and potentially sort/limit results
          // We interleave or just concat. Concatenating puts likely movies first if searching movie titles.
          const combined = [...movies, ...games];
          
          setSuggestions(combined);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Search error", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        if (input.trim().length === 0 && onClear) {
          onClear();
        }
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [input, onClear]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: MovieSuggestion) => {
    skipSearchRef.current = true;
    setInput(item.title);
    setShowSuggestions(false);
    onSelect(item);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length < 2) return;

    // If suggestions exist, pick the first one
    if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
    } 
    // If no suggestions, we can't easily guess type for "fetchMovieDetails",
    // but we could try to default to Game search if it looks like a game?
    // For now, relying on the user picking a suggestion is safer for Movies.
  };

  return (
    <div ref={wrapperRef} className="w-full max-w-2xl mx-auto mb-16 relative z-50 flex flex-col items-center">
      
      <form onSubmit={handleSubmit} className="w-full relative group">
        <div 
          className={`
            relative transition-all duration-300 ease-out
            rounded-2xl border 
            ${showSuggestions && suggestions.length > 0
              ? 'bg-black/80 border-white/30 rounded-b-none' 
              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            }
            backdrop-blur-xl
          `}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => input.length >= 3 && setShowSuggestions(true)}
            placeholder="Поиск фильмов и игр..."
            className="w-full bg-transparent text-white text-xl md:text-2xl py-5 pl-6 pr-16 focus:outline-none placeholder-zinc-500 font-light tracking-wide rounded-2xl"
            disabled={isLoading}
          />
          <div className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center text-zinc-400">
            {isLoading || isSearching ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <button type="submit" className="p-2 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-black/90 backdrop-blur-xl border-x border-b border-white/30 rounded-b-2xl overflow-hidden shadow-2xl animate-fade-in z-50">
            <ul className="max-h-[60vh] overflow-y-auto">
              {suggestions.map((item) => (
                <li 
                  key={`${item.mediaType}-${item.imdbID}`}
                  onClick={() => handleSelect(item)}
                  className="flex items-center gap-4 p-4 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                >
                  <div className="w-10 h-14 bg-zinc-800 rounded overflow-hidden flex-shrink-0 relative">
                    {item.poster ? (
                      <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">No img</div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                       {item.mediaType === 'movie' ? (
                          <span className="text-[10px] uppercase font-bold tracking-wider bg-purple-500/20 text-purple-200 px-1.5 py-0.5 rounded border border-purple-500/20 flex items-center gap-1">
                             🎬 Фильм
                          </span>
                       ) : (
                          <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-blue-200 px-1.5 py-0.5 rounded border border-blue-500/20 flex items-center gap-1">
                             🎮 Игра
                          </span>
                       )}
                    </div>
                    <span className="text-white font-medium text-lg leading-tight truncate">{item.title}</span>
                    <span className="text-zinc-500 text-sm font-mono">{item.year}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
      <p className="text-center text-zinc-600 text-xs mt-3">
         Поиск по базам TMDB и RAWG
      </p>
    </div>
  );
};

export default SearchBar;