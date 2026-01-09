
import React from 'react';
import { GameData, CalculationResult } from '../types';

interface GameCardProps {
  game: GameData;
  calculation: CalculationResult;
}

const GameCard: React.FC<GameCardProps> = ({ game, calculation }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 w-full max-w-5xl mx-auto mb-10 items-stretch">
      {/* Poster Section */}
      <div className="md:col-span-5 lg:col-span-4 flex justify-center md:justify-start h-full">
        {/* Changed aspect ratio from aspect-[2/3] to aspect-[3/4] for better game cover fit */}
        <div className="relative group w-full max-w-[280px] aspect-[3/4] rounded-lg overflow-hidden shadow-2xl shadow-black/80 ring-1 ring-white/10 transition-transform duration-500 hover:scale-[1.02]">
           <img
            src={game.posterUrl || `https://placehold.co/600x800/18181b/FFF?text=${encodeURIComponent(game.title)}`}
            alt={game.title}
            className="w-full h-full object-cover transition-all duration-700"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('placehold.co')) {
                  target.src = `https://placehold.co/600x800/18181b/FFF?text=${encodeURIComponent(game.title)}`;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
          
          {/* Ratings Container */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
              <div className={`
                  flex flex-col items-center justify-center w-12 h-12 rounded-lg backdrop-blur-md border border-white/20 shadow-lg
                  ${game.rating < 6.5 ? 'bg-red-500/80 text-white' : 'bg-green-600/80 text-white'}
              `}>
                  <span className="text-[8px] font-bold uppercase opacity-80">RATING</span>
                  <span className="text-sm font-bold">{game.rating.toFixed(1)}</span>
              </div>
          </div>

          {/* Horror Banner */}
          {calculation.isHorror && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-900/90 via-red-900/60 to-transparent pt-12 pb-4 flex justify-center items-end animate-fade-in-up">
                  <span className="text-red-100 font-black tracking-[0.2em] text-lg uppercase drop-shadow-md">
                      HORROR
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
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 uppercase leading-[0.9] drop-shadow-lg">{game.title}</h1>
                
                <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-mono text-zinc-300 mb-6 mt-4">
                    <span className="bg-white/10 px-3 py-1 rounded-full border border-white/5">{game.releaseYear}</span>
                    <span className="text-zinc-600">•</span>
                    <div className="flex gap-2 flex-wrap">
                      {/* Only display the first 5 genres/tags for aesthetics */}
                      {game.genres.slice(0, 5).map((g, i) => (
                        <span key={i} className="bg-purple-500/10 text-purple-200 px-2 py-1 rounded border border-purple-500/20">{g}</span>
                      ))}
                    </div>
                </div>

                <div className="flex items-center gap-6 mb-8 p-4 rounded-xl bg-white/5 border border-white/5">
                   <div className="flex flex-col">
                      <span className="text-zinc-500 text-xs uppercase tracking-wider mb-1">HLTB (Main)</span>
                      <span className="text-xl font-bold text-white flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-zinc-400">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                         </svg>
                         {game.hltbTime && game.hltbTime > 0 ? `${game.hltbTime} ч` : "-"}
                      </span>
                   </div>
                   <div className="w-px h-10 bg-white/10"></div>
                   <div className="flex flex-col">
                      <span className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Цена (Steam KZ)</span>
                      <span className="text-xl font-bold text-white">
                         {game.steamPriceRub > 0 ? `~${game.steamPriceRub} ₽` : "N/A"}
                      </span>
                   </div>
                </div>

                {game.description && (
                    <p className="text-zinc-300 font-light leading-relaxed mb-8 text-base md:text-lg border-l-2 border-white/10 pl-5 line-clamp-[6]">
                        {game.description}
                    </p>
                )}
            </div>
            
            <div className="flex flex-wrap gap-3 mt-auto pt-4 border-t border-white/5">
                {game.steamUrl && game.steamPriceRub > 0 && (
                    <a href={game.steamUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-[#1b2838] text-white border border-white/20 hover:border-blue-400 hover:text-blue-300 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                      <svg viewBox="0 0 32 32" fill="currentColor" className="w-5 h-5">
                        <path d="M 16 3 C 8.832 3 3 8.832 3 16 C 3 23.168 8.832 29 16 29 C 23.168 29 29 23.168 29 16 C 29 8.832 23.168 3 16 3 z M 16 5 C 22.065 5 27 9.935 27 16 C 27 22.065 22.065 27 16 27 C 10.891494 27 6.5985638 23.494211 5.3671875 18.765625 L 9.0332031 20.335938 C 9.2019466 21.832895 10.457908 23 12 23 C 13.657 23 15 21.657 15 20 C 15 19.968 14.991234 19.93725 14.990234 19.90625 L 19.167969 16.984375 C 21.297969 16.894375 23 15.152 23 13 C 23 10.791 21.209 9 19 9 C 16.848 9 15.106578 10.702031 15.017578 12.832031 L 12.09375 17.009766 C 12.06175 17.008766 12.032 17 12 17 C 11.336696 17 10.729087 17.22153 10.232422 17.585938 L 5.0332031 15.357422 C 5.3688686 9.5919516 10.151903 5 16 5 z M 19 10 C 20.657 10 22 11.343 22 13 C 22 14.657 20.657 16 19 16 C 17.343 16 16 14.657 16 13 C 16 11.343 17.343 10 19 10 z M 19 11 A 2 2 0 0 0 19 15 A 2 2 0 0 0 19 11 z M 12 18 C 13.105 18 14 18.895 14 20 C 14 21.105 13.105 22 12 22 C 11.191213 22 10.498775 21.518477 10.183594 20.828125 L 10.966797 21.164062 C 11.158797 21.247062 11.359641 21.287109 11.556641 21.287109 C 12.138641 21.287109 12.6935 20.945953 12.9375 20.376953 C 13.2635 19.615953 12.910438 18.734203 12.148438 18.408203 L 11.419922 18.095703 C 11.604729 18.039385 11.796712 18 12 18 z"/>
                      </svg>
                      Steam
                    </a>
                )}
                <a href={`https://howlongtobeat.com/?q=${encodeURIComponent(game.title)}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-[#283143] text-white border border-white/20 hover:border-blue-400 hover:text-blue-300 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    HLTB
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
