
import React, { useState, useEffect, useRef } from 'react';
import { searchMovies, searchTv } from '../services/movieService';
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
  const [movieSuggestions, setMovieSuggestions] = useState<MovieSuggestion[]>([]);
  const [tvSuggestions, setTvSuggestions] = useState<MovieSuggestion[]>([]);
  const [gameSuggestions, setGameSuggestions] = useState<MovieSuggestion[]>([]);
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [loadingTv, setLoadingTv] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipSearchRef = useRef(false);
  
  const movieAbortRef = useRef<AbortController | null>(null);
  const tvAbortRef = useRef<AbortController | null>(null);
  const gameAbortRef = useRef<AbortController | null>(null);

  // Debounce search
  useEffect(() => {
    if (movieAbortRef.current) movieAbortRef.current.abort();
    if (tvAbortRef.current) tvAbortRef.current.abort();
    if (gameAbortRef.current) gameAbortRef.current.abort();

    if (skipSearchRef.current) return;

    const timer = setTimeout(async () => {
      const query = input.trim();

      if (skipSearchRef.current) return;

      if (query.length >= 3) {
        setShowSuggestions(true);
        
        movieAbortRef.current = new AbortController();
        tvAbortRef.current = new AbortController();
        gameAbortRef.current = new AbortController();
        
        // --- MOVIE SEARCH ---
        setLoadingMovies(true);
        searchMovies(query, movieAbortRef.current.signal)
          .then(results => {
            if (input.trim() === query && !skipSearchRef.current) setMovieSuggestions(results);
          })
          .catch(e => { if (e.name !== 'AbortError') console.error(e); })
          .finally(() => { if (!skipSearchRef.current) setLoadingMovies(false); });

        // --- TV SEARCH ---
        setLoadingTv(true);
        searchTv(query, tvAbortRef.current.signal)
          .then(results => {
            if (input.trim() === query && !skipSearchRef.current) setTvSuggestions(results);
          })
          .catch(e => { if (e.name !== 'AbortError') console.error(e); })
          .finally(() => { if (!skipSearchRef.current) setLoadingTv(false); });

        // --- GAME SEARCH ---
        setLoadingGames(true);
        searchGames(query, gameAbortRef.current.signal)
          .then(results => {
             if (input.trim() === query && !skipSearchRef.current) setGameSuggestions(results);
          })
          .catch(e => { if (e.name !== 'AbortError') console.error(e); })
          .finally(() => { if (!skipSearchRef.current) setLoadingGames(false); });

      } else {
        setMovieSuggestions([]);
        setTvSuggestions([]);
        setGameSuggestions([]);
        setShowSuggestions(false);
        setLoadingMovies(false);
        setLoadingTv(false);
        setLoadingGames(false);
        
        if (query.length === 0 && onClear) onClear();
      }
    }, 500);

    return () => {
       clearTimeout(timer);
       if (movieAbortRef.current) movieAbortRef.current.abort();
       if (tvAbortRef.current) tvAbortRef.current.abort();
       if (gameAbortRef.current) gameAbortRef.current.abort();
    };
  }, [input, onClear]);

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
    if (movieAbortRef.current) movieAbortRef.current.abort();
    if (tvAbortRef.current) tvAbortRef.current.abort();
    if (gameAbortRef.current) gameAbortRef.current.abort();

    setInput(item.title);
    setMovieSuggestions([]);
    setTvSuggestions([]);
    setGameSuggestions([]);
    setShowSuggestions(false);
    setLoadingMovies(false);
    setLoadingTv(false);
    setLoadingGames(false);
    inputRef.current?.blur();
    onSelect(item);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length < 2) return;

    if (movieSuggestions.length > 0) handleSelect(movieSuggestions[0]);
    else if (tvSuggestions.length > 0) handleSelect(tvSuggestions[0]);
    else if (gameSuggestions.length > 0) handleSelect(gameSuggestions[0]);
  };

  const hasResults = movieSuggestions.length > 0 || tvSuggestions.length > 0 || gameSuggestions.length > 0;
  const isSearching = (loadingMovies || loadingTv || loadingGames) && !skipSearchRef.current;
  const showSpinner = isLoading || isSearching;

  return (
    <div ref={wrapperRef} className="w-full max-w-2xl mx-auto mb-16 relative z-50 flex flex-col items-center">
      
      <form onSubmit={handleSubmit} className="w-full relative group">
        <div 
          className={`
            relative transition-all duration-300 ease-out
            rounded-2xl border 
            ${showSuggestions && hasResults
              ? 'bg-black/90 border-white/30 rounded-b-none' 
              : 'bg-black/60 border-white/10 hover:bg-black/80 hover:border-white/20'
            }
            backdrop-blur-2xl shadow-2xl
          `}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
                skipSearchRef.current = false;
                setInput(e.target.value);
            }}
            onFocus={() => {
                if (input.length >= 3 && hasResults) setShowSuggestions(true);
            }}
            placeholder="Поиск фильмов, сериалов и игр..."
            className="w-full bg-transparent text-white text-xl md:text-2xl py-5 pl-6 pr-16 focus:outline-none placeholder-zinc-500 font-light tracking-wide rounded-2xl"
            disabled={isLoading}
          />
          <div className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center text-zinc-400">
            {showSpinner ? (
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
        {showSuggestions && hasResults && (
          <div className="absolute top-full left-0 right-0 bg-black/90 backdrop-blur-2xl border-x border-b border-white/30 rounded-b-2xl overflow-hidden shadow-2xl animate-fade-in z-50 max-h-[60vh] overflow-y-auto custom-scrollbar">
            
            {/* Movies Section */}
            {(movieSuggestions.length > 0) && (
              <div className="border-b border-white/10 last:border-0">
                 <div className="px-4 py-2 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex justify-between items-center">
                    <span>Фильмы</span>
                    {loadingMovies && <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>}
                 </div>
                 <ul>
                    {movieSuggestions.map((item) => (
                      <SuggestionItem key={`m-${item.imdbID}`} item={item} onClick={() => handleSelect(item)} />
                    ))}
                 </ul>
              </div>
            )}

            {/* TV Section */}
            {(tvSuggestions.length > 0) && (
              <div className="border-b border-white/10 last:border-0">
                 <div className="px-4 py-2 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex justify-between items-center">
                    <span>Сериалы</span>
                    {loadingTv && <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>}
                 </div>
                 <ul>
                    {tvSuggestions.map((item) => (
                      <SuggestionItem key={`t-${item.imdbID}`} item={item} onClick={() => handleSelect(item)} />
                    ))}
                 </ul>
              </div>
            )}

            {/* Games Section */}
            {(gameSuggestions.length > 0) && (
              <div>
                 <div className="px-4 py-2 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex justify-between items-center">
                    <span>Игры</span>
                    {loadingGames && <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>}
                 </div>
                 <ul>
                    {gameSuggestions.map((item) => (
                      <SuggestionItem key={`g-${item.imdbID}`} item={item} onClick={() => handleSelect(item)} />
                    ))}
                 </ul>
              </div>
            )}
            
            {!hasResults && !isSearching && input.length >= 3 && (
               <div className="p-4 text-center text-zinc-500 text-sm">Ничего не найдено</div>
            )}
          </div>
        )}
      </form>
      <p className="text-center text-zinc-600 text-xs mt-3">
         Поиск по базам TMDB и RAWG
      </p>
    </div>
  );
};

// Helper component for list items
const SuggestionItem: React.FC<{ item: MovieSuggestion; onClick: () => void }> = ({ item, onClick }) => (
  <li 
    onClick={(e) => {
        e.stopPropagation(); 
        onClick();
    }}
    className="flex items-center gap-4 p-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-0"
  >
    <div className="w-8 h-12 bg-zinc-800 rounded overflow-hidden flex-shrink-0 relative">
      {item.poster ? (
        <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-500">No img</div>
      )}
    </div>
    <div className="flex flex-col flex-1 min-w-0">
      <span className="text-zinc-200 font-medium text-sm leading-tight truncate">{item.title}</span>
      <span className="text-zinc-500 text-xs font-mono">{item.year}</span>
    </div>
  </li>
);

export default SearchBar;
