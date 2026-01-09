
import React from 'react';
import { MovieData, CalculationResult } from '../types';

interface MovieCardProps {
  movie: MovieData;
  calculation: CalculationResult;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, calculation }) => {
  const isWatched = movie.userRating !== undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 w-full max-w-5xl mx-auto mb-10 items-stretch">
      {/* Poster Section */}
      <div className="md:col-span-5 lg:col-span-4 flex justify-center md:justify-start h-full">
        {/* Strict 2:3 Aspect Ratio Container */}
        <div className="relative group w-full max-w-[280px] aspect-[2/3] rounded-lg overflow-hidden shadow-2xl shadow-black/80 ring-1 ring-white/10 transition-transform duration-500 hover:scale-[1.02]">
           <img
            src={movie.posterUrl || `https://placehold.co/400x600/18181b/FFF?text=${encodeURIComponent(movie.title)}`}
            alt={movie.title}
            className={`w-full h-full object-cover transition-all duration-700 ${isWatched ? 'grayscale-[0.5]' : ''}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              // Prevent infinite loop if placeholder fails
              if (!target.src.includes('placehold.co')) {
                  target.src = `https://placehold.co/400x600/18181b/FFF?text=${encodeURIComponent(movie.title)}`;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
          
          {/* Ratings Container */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
              {/* IMDb Rating */}
              {movie.imdbRating > 0 && (
                  <div className={`
                      flex flex-col items-center justify-center w-12 h-12 rounded-lg backdrop-blur-md border border-white/20 shadow-lg
                      ${movie.imdbRating < 6.5 ? 'bg-red-500/80 text-white' : 'bg-black/60 text-white'}
                  `}>
                      <span className="text-[10px] font-bold uppercase opacity-80">IMDb</span>
                      <span className="text-sm font-bold">{movie.imdbRating.toFixed(1)}</span>
                  </div>
              )}

              {/* User Rating (Watched) */}
              {isWatched && (
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg backdrop-blur-md border border-purple-400/30 shadow-lg bg-purple-600/90 text-white animate-fade-in">
                      <span className="text-[10px] font-bold uppercase opacity-80">MY</span>
                      <span className="text-sm font-bold">{movie.userRating}</span>
                  </div>
              )}
          </div>

          {/* Watched Banner */}
          {isWatched && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-900/90 via-purple-900/60 to-transparent pt-12 pb-4 flex justify-center items-end animate-fade-in-up">
                  <span className="text-purple-100 font-black tracking-[0.2em] text-lg uppercase drop-shadow-md">
                      Просмотрено
                  </span>
              </div>
          )}
        </div>
      </div>

      {/* Details Section */}
      <div className="md:col-span-7 lg:col-span-8 flex flex-col">
        {/* UPDATED GLASS EFFECT: Higher opacity (bg-black/60) and Stronger Blur (backdrop-blur-3xl) */}
        <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl h-full flex flex-col">
            <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 uppercase leading-[0.9] drop-shadow-lg">{movie.title}</h1>
                
                {movie.originalTitle && movie.originalTitle !== movie.title && (
                    <h2 className="text-xl text-zinc-400 font-light mb-6 tracking-wide">{movie.originalTitle}</h2>
                )}
                
                <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-mono text-zinc-300 mb-8">
                    <span className="bg-white/10 px-3 py-1 rounded-full border border-white/5">{movie.year}</span>
                    <span className="text-zinc-600">•</span>
                    <span className="bg-white/10 px-3 py-1 rounded-full border border-white/5">{movie.runtimeMinutes} мин</span>
                    <span className="text-zinc-600">•</span>
                    <span className="uppercase tracking-wider">{movie.countries.join(", ")}</span>
                </div>

                {movie.description && (
                    // Description with line clamp to fit layout nicely
                    <p className="text-zinc-300 font-light leading-relaxed mb-8 text-base md:text-lg border-l-2 border-white/10 pl-5 line-clamp-[8]">
                        {movie.description}
                    </p>
                )}
            </div>
            
            {/* Links aligned to bottom */}
            <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-white/5">
                {movie.imdbUrl && (
                    <a href={movie.imdbUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-[#F5C518]/10 text-[#F5C518] border border-[#F5C518]/20 hover:bg-[#F5C518] hover:text-black transition-all text-xs font-bold uppercase tracking-widest">IMDb</a>
                )}
                {movie.wikipediaUrl && (
                     <a href={movie.wikipediaUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white hover:text-black transition-all text-xs font-bold uppercase tracking-widest">Wiki</a>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
