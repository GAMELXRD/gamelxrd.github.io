
import React, { useState, useEffect } from 'react';
import { MovieData, GameData, CalculationResult } from '../types';
import { calculatePrice } from '../services/priceService';

interface PriceCalculatorProps {
  media: MovieData | GameData;
}

const PriceCalculator: React.FC<PriceCalculatorProps> = ({ media }) => {
  const [priority, setPriority] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Game specific states
  const [gameDuration, setGameDuration] = useState(4);
  const [includeGameCost, setIncludeGameCost] = useState(false);

  // TV specific states
  const [tvEpisodes, setTvEpisodes] = useState(1);
  const [seasonOneCount, setSeasonOneCount] = useState<number | null>(null);

  // Reset states when media changes
  useEffect(() => {
    setPriority(false);
    if (media.type === 'game') {
      setGameDuration(Math.max(4, Math.round(media.hltbTime || 4)));
      setIncludeGameCost(false);
    } else if (media.type === 'tv') {
      setTvEpisodes(1);
      
      // Determine Season 1 count for the button
      let s1 = 0;
      if (media.seasons && media.seasons.length > 0) {
        // Try to find Season 1
        const found = media.seasons.find(s => s.season_number === 1);
        if (found && found.episode_count > 0) {
          s1 = found.episode_count;
        } else {
          // If Season 1 missing or 0, find first season > 0 (skip Season 0 specials if possible)
          const firstReal = media.seasons.find(s => s.season_number > 0 && s.episode_count > 0);
          if (firstReal) s1 = firstReal.episode_count;
        }
      }
      
      // Fallback if no detailed season data
      if (s1 === 0 && media.totalEpisodes && media.totalSeasons) {
         s1 = Math.ceil(media.totalEpisodes / media.totalSeasons);
      }
      
      setSeasonOneCount(s1 > 0 ? s1 : null);
    }
  }, [media]);

  const result = calculatePrice(media, { 
    priority, 
    gameCostIncluded: includeGameCost,
    userDuration: gameDuration,
    userEpisodes: tvEpisodes
  });

  // Copy Text Generation
  let copyText = `${media.title}`;
  if (media.type === 'game') {
     // Ensure we show the calculated duration (min 4) in copy text
     copyText += ` | ${Math.max(4, gameDuration)}ч`;
  } else if (media.type === 'tv') {
     copyText += ` | ${tvEpisodes} сер.`;
  }
  if (priority) copyText += ` | Вне очереди`;

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOrder = () => {
    window.open('https://donatty.com/gamelxrd', '_blank');
  };

  // Determine button text
  const orderButtonText = media.type === 'game' ? "Заказать игру" : "Заказать просмотр";

  // Helpers for TV buttons
  const handleTvSeason = () => {
    if (seasonOneCount) {
      setTvEpisodes(seasonOneCount);
    }
  };

  const handleTvAll = () => {
    if (media.type === 'tv' && media.totalEpisodes) {
      setTvEpisodes(media.totalEpisodes);
    }
  };

  // Slider limits
  const gameSliderMax = Math.max(50, gameDuration + 10);
  const tvSliderMax = media.type === 'tv' ? (media.totalEpisodes || 24) : 1;

  // Helper check for purchasable games
  const isGamePurchasable = media.type === 'game' && media.steamPriceRub > 0;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* UPDATED GLASS EFFECT: Higher opacity (bg-black/60) and Stronger Blur (backdrop-blur-3xl) */}
      <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow inside card */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Left Column: Breakdown */}
        <div className="space-y-6">
          <h3 className="text-zinc-400 font-mono text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-zinc-500 rounded-full"></span>
            Калькуляция: {media.type === 'game' ? 'Игра' : (media.type === 'tv' ? 'Сериал' : 'Фильм')}
          </h3>
          
          <div className="space-y-4 font-mono text-sm">
            
            {/* Base Price Row */}
            <div className="flex justify-between items-center p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
              <span className="text-zinc-300 flex flex-col">
                <span>Базовая стоимость</span>
                
                {/* MOVIE Subtext */}
                {media.type === 'movie' && result.isRussian && <span className="text-[10px] text-zinc-500 font-bold">(RU/USSR)</span>}
                
                {/* GAME Subtext */}
                {media.type === 'game' && result.isHorror && <span className="text-[10px] text-red-500 font-bold">(HORROR: {Math.max(4, gameDuration)}ч × 240₽)</span>}
                {media.type === 'game' && !result.isHorror && <span className="text-[10px] text-zinc-500 font-bold">(Стандарт: {Math.max(4, gameDuration)}ч × 150₽)</span>}
                
                {/* TV Subtext */}
                {media.type === 'tv' && result.tvDetails && (
                   <span className="text-[10px] text-zinc-500 font-bold">
                     {result.tvDetails.episodeCount} сер. × {result.tvDetails.pricePerEpisode}₽ 
                     {result.isRussian ? ' (RU)' : ''}
                     {media.averageRuntime ? ` • ${media.averageRuntime} мин/сер.` : ''}
                   </span>
                )}
              </span>
              <span className="text-white font-bold">{result.basePrice} ₽</span>
            </div>

            {/* TV Episodes Input (Visible only for TV) */}
            {media.type === 'tv' && (
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-400 text-xs uppercase">Количество серий</label>
                  <span className="text-xs text-zinc-500 bg-black/40 px-2 py-1 rounded">
                    Всего: {media.totalEpisodes || "?"}
                  </span>
                </div>
                
                {/* Slider and Input */}
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="1" 
                    max={tvSliderMax}
                    value={tvEpisodes} 
                    onChange={(e) => setTvEpisodes(parseInt(e.target.value))}
                    className="w-full accent-blue-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    min="1"
                    max={media.totalEpisodes || 999}
                    value={tvEpisodes}
                    onChange={(e) => setTvEpisodes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-black/40 border border-white/10 px-2 py-1 rounded w-20 text-center font-bold text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Quick Buttons */}
                <div className="grid grid-cols-2 gap-2">
                   <button 
                     onClick={handleTvSeason}
                     className="py-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] uppercase font-bold tracking-wider transition-colors"
                   >
                     1 Сезон {seasonOneCount ? `(${seasonOneCount})` : ''}
                   </button>
                   <button 
                     onClick={handleTvAll}
                     className="py-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] uppercase font-bold tracking-wider transition-colors"
                   >
                     Весь сериал
                   </button>
                </div>
              </div>
            )}

            {/* Game Duration Input (Visible only for Games) */}
            {media.type === 'game' && (
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-zinc-400 text-xs uppercase">Длительность заказа (ч)</label>
                  <span className="text-xs text-zinc-500 bg-black/40 px-2 py-1 rounded">
                    Min: 4ч | HLTB: {media.hltbTime && media.hltbTime > 0 ? `${media.hltbTime}ч` : "-"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="4" 
                    max={gameSliderMax}
                    value={Math.max(4, gameDuration)} // Slider stays valid 
                    onChange={(e) => setGameDuration(parseInt(e.target.value))}
                    className="w-full accent-purple-500 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    min="1"
                    value={gameDuration}
                    // Allow free typing, but priceService uses Math.max(4, ...) for calc
                    onChange={(e) => setGameDuration(parseInt(e.target.value) || 0)}
                    // On Blur (loss of focus), clamp the value to 4 in the UI
                    onBlur={() => setGameDuration(Math.max(4, gameDuration))}
                    className="bg-black/40 border border-white/10 px-2 py-1 rounded w-20 text-center font-bold text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Rating Row (Restored for TV as well) */}
            <div className={`flex justify-between items-center p-3 rounded-lg transition-colors border ${result.ratingSurcharge > 0 ? 'bg-red-500/10 border-red-500/20' : 'hover:bg-white/5 border-transparent hover:border-white/5'}`}>
               <span className={result.ratingSurcharge > 0 ? "text-red-300" : "text-zinc-300"}>
                  Рейтинг <span className="opacity-70">({media.type === 'game' ? media.rating : media.imdbRating})</span>
               </span>
               <span className={result.ratingSurcharge > 0 ? "text-red-300 font-bold" : "text-zinc-500"}>
                  +{result.ratingSurcharge} ₽
               </span>
            </div>

            {/* Duration Row (Movies only) */}
            {media.type === 'movie' && (
              <div className={`flex justify-between items-center p-3 rounded-lg transition-colors border ${result.durationSurcharge > 0 ? 'bg-orange-500/10 border-orange-500/20' : 'hover:bg-white/5 border-transparent hover:border-white/5'}`}>
                 <span className={result.durationSurcharge > 0 ? "text-orange-300" : "text-zinc-300"}>
                  Длительность <span className="opacity-70">({media.runtimeMinutes} мин)</span>
                </span>
                 <span className={result.durationSurcharge > 0 ? "text-orange-300 font-bold" : "text-zinc-500"}>
                  +{result.durationSurcharge} ₽
                </span>
              </div>
            )}

            {/* Discount Row (Games > 24h OR TV > 20eps) */}
            {result.discount > 0 && (
               <div className="flex justify-between items-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                 <span className="text-green-300 flex items-center gap-2">
                  Скидка 
                  <span className="opacity-70 text-[10px] border border-green-500/30 px-1 rounded flex items-center gap-1">
                    {media.type === 'tv' ? 'Many episodes' : 'Long Game'}
                    <span className="font-bold text-white/90">10%</span>
                  </span>
                 </span>
                 <span className="text-green-300 font-bold">
                  -{result.discount} ₽
                 </span>
               </div>
            )}

            {/* Super Long Surcharge Row (Games only) */}
            {result.superLongSurcharge > 0 && (
               <div className="flex justify-between items-center p-3 rounded-lg bg-red-600/10 border border-red-600/30">
                 <span className="text-red-300">
                  Наценка (Super Long) <span className="opacity-70 text-xs">(&gt;150h)</span>
                 </span>
                 <span className="text-red-300 font-bold">
                  +{result.superLongSurcharge} ₽
                 </span>
               </div>
            )}
            
            {/* Game Cost Toggle (Games only) */}
            {media.type === 'game' && (
              <div className={`flex justify-between items-center p-3 rounded-lg transition-all border ${
                  isGamePurchasable 
                    ? (includeGameCost ? 'bg-blue-500/10 border-blue-500/20' : 'hover:bg-white/5 border-transparent hover:border-white/5')
                    : 'bg-white/5 border-white/5 opacity-70 cursor-not-allowed'
                }`}>
                  <div className="flex flex-col">
                     <span className={includeGameCost ? "text-blue-300 font-bold" : "text-zinc-300"}>Покупка игры</span>
                     {isGamePurchasable ? (
                         <span className="text-xs opacity-50 mt-1">Цена Steam KZ ({media.steamPriceRub} ₽)</span>
                     ) : (
                         <span className="text-xs text-orange-400 mt-1 font-medium">Недоступна в лиценз. магазинах</span>
                     )}
                  </div>
                  {isGamePurchasable ? (
                      <button 
                        onClick={() => setIncludeGameCost(!includeGameCost)}
                        className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${includeGameCost ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-zinc-700'}`}
                      >
                        <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${includeGameCost ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                  ) : (
                      <div className="text-xs text-zinc-500 font-mono px-2">N/A</div>
                  )}
              </div>
            )}

            {/* Priority Toggle */}
             <div className={`flex justify-between items-center p-3 rounded-lg transition-all border ${priority ? 'bg-purple-500/10 border-purple-500/20' : 'hover:bg-white/5 border-transparent hover:border-white/5'}`}>
                <div className="flex flex-col">
                   <span className={priority ? "text-purple-300 font-bold" : "text-zinc-300"}>Вне очереди</span>
                   <span className="text-xs opacity-50 mt-1">Приоритетный заказ (+100%)</span>
                </div>
                <button 
                  onClick={() => setPriority(!priority)}
                  className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${priority ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-zinc-700'}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${priority ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>
          </div>

        </div>

        {/* Right Column: Total & Action */}
        <div className="flex flex-col justify-start">
           <div className="bg-black/40 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden group">
               
               <div className="relative z-10 mb-8">
                  <span className="block text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Итоговая стоимость</span>
                  <div className="flex items-baseline gap-2">
                    <span className="block text-7xl font-black text-white tracking-tighter drop-shadow-xl">{result.finalPrice}</span>
                    <span className="text-2xl font-light text-zinc-500">₽</span>
                  </div>
               </div>

               <div className="space-y-4">
                  
                  {/* Copy Area with Instruction */}
                  <div className="space-y-2">
                    <p className="text-zinc-500 text-[10px] md:text-xs text-center tracking-wide opacity-80">
                        Пожалуйста, скопируйте текст ниже и укажите его в донате
                    </p>
                    <div 
                        onClick={handleCopy}
                        className="cursor-pointer bg-white/5 hover:bg-white/10 p-4 rounded-xl flex items-center justify-between border border-white/10 hover:border-white/20 transition-all group/copy"
                    >
                        <code className="text-zinc-300 text-sm truncate mr-4 font-mono group-hover/copy:text-white transition-colors">{copyText}</code>
                        <div className="text-zinc-500 group-hover/copy:text-white transition-colors">
                        {copied ? (
                            <div className="flex items-center gap-2 text-green-400">
                                <span className="text-xs font-bold uppercase">Скопировано</span>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .207 1.012l-7.5 13.25a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-15.013a.75.75 0 0 1 1.012-.207Z" clipRule="evenodd" />
                                </svg>
                            </div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5" />
                            </svg>
                        )}
                        </div>
                    </div>
                  </div>

                  {/* Order Button */}
                  <button 
                    onClick={handleOrder}
                    className="w-full relative overflow-hidden group bg-white text-black font-black py-5 px-6 rounded-xl uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {orderButtonText}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                    </span>
                  </button>

                  {/* Warnings placed below the button */}
                  {result.warnings.length > 0 && (
                      <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-fade-in">
                         {result.warnings.map((w, i) => (
                            <p key={i} className="text-red-400 text-xs leading-relaxed font-medium text-center">
                               {w}
                            </p>
                         ))}
                      </div>
                  )}

               </div>
           </div>
        </div>

        </div>
      </div>
    </div>
  );
};

export default PriceCalculator;
