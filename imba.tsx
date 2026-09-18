/// <reference types="vite/client" />
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import StarBackground from './components/StarBackground';
import imbaText from './imba.txt?raw';

// === КОНТЕНТ ИВЕНТА ===
// Весь контент берётся из imba.txt при сборке. Формат:
//   ## Донаты
//   ### Категория    (стиль категории — CATEGORY_STYLES ниже)
//   - **30 ₽** — Название — описание      (или **от 2501 ₽**)
//   ## Команды чата
//   - **!cmd** — описание - кд 30 сек
// Донаты с одинаковой суммой внутри категории — пул, из которого выпадает одно случайное.

const EVENT_DATE = '18.09.2026';

interface ChatCommand {
  cmd: string;
  desc: string;
  cd: string;
}

interface Donation {
  name: string;
  desc: string;
}

interface DonationTier {
  price: number;
  from: boolean; // "от N ₽"
  events: Donation[];
}

interface DonationCategory {
  name: string;
  tiers: DonationTier[];
}

function parseImba(text: string) {
  const commands: ChatCommand[] = [];
  const categories: { name: string; tiers: Map<string, DonationTier> }[] = [];
  let section = '';

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('### ')) {
      categories.push({ name: line.slice(4).trim(), tiers: new Map() });
      continue;
    }
    if (line.startsWith('## ')) {
      section = line.slice(3).toLowerCase();
      continue;
    }
    if (!line.startsWith('- ')) continue;

    if (section.includes('донат')) {
      const m = line.match(/^- \*\*(от\s+)?(\d+)\s*₽\*\*\s+—\s+(.+?)\s+—\s+(.+)$/);
      if (!m) { console.warn('imba.txt: не разобрал строку доната:', line); continue; }
      const [, from, price, name, desc] = m;
      if (!categories.length) categories.push({ name: 'Донаты', tiers: new Map() });
      const tiers = categories[categories.length - 1].tiers;
      const key = `${from ? 'от' : ''}${price}`;
      if (!tiers.has(key)) tiers.set(key, { price: Number(price), from: !!from, events: [] });
      tiers.get(key)!.events.push({ name, desc });
    } else if (section.includes('чат')) {
      const m = line.match(/^- \*\*(.+?)\*\*\s+—\s+(.+?)\s+-\s+кд\s+(.+)$/);
      if (!m) { console.warn('imba.txt: не разобрал строку команды:', line); continue; }
      const [, cmd, desc, cd] = m;
      commands.push({ cmd, desc, cd });
    }
  }

  const donationCategories: DonationCategory[] = categories.map(c => ({
    name: c.name,
    tiers: [...c.tiers.values()].sort((a, b) => a.price - b.price || Number(a.from) - Number(b.from)),
  }));
  return { commands, donationCategories };
}

const { commands: CHAT_COMMANDS, donationCategories: DONATION_CATEGORIES } = parseImba(imbaText);

// === СТИЛИ КАТЕГОРИЙ ===
// Цветом выделяется только заголовок категории

const CATEGORY_STYLES: Record<string, { icon: string; title: string }> = {
  'Дебаффы': { icon: '🧪', title: 'text-sky-300' },
  'Мобы':    { icon: '🧟', title: 'text-emerald-300' },
  'Ловушки': { icon: '🕳️', title: 'text-orange-300' },
  'Жёсткие': { icon: '🔥', title: 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]' },
  'Боссы':   { icon: '👑', title: 'text-fuchsia-300 drop-shadow-[0_0_12px_rgba(217,70,239,0.7)]' },
  'Особые':  { icon: '✨', title: 'text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]' },
};

const styleFor = (category: string) => CATEGORY_STYLES[category] ?? { icon: '•', title: 'text-zinc-300' };

// === UI ===

const CommandTag: React.FC<{ cmd: string }> = ({ cmd }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }).catch(err => console.error('Не удалось скопировать текст: ', err));
  };

  return (
    <button
      onClick={copy}
      title="Скопировать"
      className={`font-mono font-bold text-sm px-2.5 py-1 rounded-lg border transition-all duration-200 whitespace-nowrap
        ${copied
          ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
          : 'bg-purple-500/10 border-purple-400/30 text-purple-200 hover:bg-purple-500/20 hover:border-purple-400/60'
        }`}
    >
      {copied ? 'скопировано' : cmd}
    </button>
  );
};

const SectionTitle: React.FC<{ title: string; note?: string; className?: string }> = ({ title, note, className = 'text-zinc-400' }) => (
  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3 px-1">
    <h2 className={`text-xs uppercase tracking-widest font-bold ${className}`}>{title}</h2>
    {note && <span className="text-[11px] font-mono text-zinc-500">{note}</span>}
  </div>
);

const ChatCommands: React.FC = () => (
  <section className="w-full animate-fade-in-up" style={{ animationFillMode: 'both' }}>
    <SectionTitle title="💬 Команды чата" note="бесплатно · кд общий на весь чат" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {CHAT_COMMANDS.map(c => (
        <div key={c.cmd} className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2.5 hover:border-white/20 transition-colors">
          <div className="flex items-center justify-between gap-3">
            <CommandTag cmd={c.cmd} />
            <span className="font-mono text-xs text-sky-300/80 whitespace-nowrap">⏱ {c.cd}</span>
          </div>
          <p className="text-zinc-400 text-xs md:text-sm mt-1.5 leading-snug">{c.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

// Строка прайса: цена | название(я). Клик раскрывает описания под строкой.
const TierRow: React.FC<{ tier: DonationTier }> = ({ tier }) => {
  const [open, setOpen] = useState(false);
  const count = tier.events.length;

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-start gap-3 md:gap-4 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.04] ${open ? 'bg-white/[0.04]' : ''}`}
      >
        <span className="w-[4.5rem] md:w-20 flex-shrink-0 text-right font-mono font-bold text-base md:text-lg leading-6 text-amber-300 whitespace-nowrap">
          {tier.from && <span className="block text-[10px] leading-3 font-normal text-zinc-500">от</span>}
          {tier.price} ₽
        </span>

        <span className="flex-1 min-w-0 leading-6">
          <span className="text-zinc-100 font-semibold text-sm md:text-base">
            {tier.events.map((e, i) => (
              <React.Fragment key={e.name}>
                <span className="whitespace-nowrap">
                  {e.name}
                  {i < count - 1 && <span className="text-zinc-600 font-normal ml-1.5 mr-1">·</span>}
                </span>{' '}
              </React.Fragment>
            ))}
          </span>
        </span>

        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          className={`w-4 h-4 mt-1 flex-shrink-0 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <ul className="pl-4 md:pl-[7rem] pr-4 pb-3 pt-1 space-y-1.5">
            {tier.events.map(e => (
              <li key={e.name} className="text-sm leading-snug">
                <span className="text-zinc-200 font-semibold">{e.name}</span>
                <span className="text-zinc-400"> — {e.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const CategoryCard: React.FC<{ category: DonationCategory }> = ({ category }) => {
  const style = styleFor(category.name);
  const total = category.tiers.reduce((n, t) => n + t.events.length, 0);

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2 px-1">
        <h3 className={`text-sm font-black uppercase tracking-widest ${style.title}`}>
          {style.icon} {category.name}
        </h3>
        <span className="text-[11px] font-mono text-zinc-600">{total}</span>
      </div>
      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {category.tiers.map(tier => <TierRow key={`${tier.from}-${tier.price}`} tier={tier} />)}
      </div>
    </div>
  );
};

const Donations: React.FC = () => (
  <section className="w-full animate-fade-in-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
    <SectionTitle title="💸 Донаты" note="нажми на строку — покажет описание" />
    <p className="text-zinc-400 text-xs md:text-sm mb-5 px-1">
      🎲 Если у суммы несколько событий — выпадает <span className="text-purple-300 font-semibold">одно случайное</span>, шансы у всех равные
    </p>
    <div className="space-y-8">
      {DONATION_CATEGORIES.map(c => <CategoryCard key={c.name} category={c} />)}
    </div>
  </section>
);

function Imba() {
  return (
    <div className="relative min-h-screen text-zinc-100 selection:bg-purple-500/30 selection:text-white font-sans overflow-x-hidden">

      <div className="fixed inset-0 z-0 bg-[#050505]">
        <StarBackground />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/80"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]"></div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 md:py-12 min-h-screen flex flex-col items-center animate-fade-in">

        <header className="mb-8 text-center">
          <h1 className="inline-block text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500 uppercase tracking-tighter drop-shadow-2xl px-4 py-2">
            IMBA
          </h1>
          <p className="text-zinc-400 text-xs md:text-sm font-mono tracking-wide mt-1">
            ⭐️ Interactive Minecraft Birthday Adventure ⭐️
          </p>
        </header>

        <div className="w-full space-y-12">
          <ChatCommands />
          <Donations />
        </div>

        <div className="mt-20 text-center opacity-40 hover:opacity-100 transition-opacity duration-500">
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            Сделано с 💖 gamelxrd
          </div>
          <div className="text-[10px] font-mono text-zinc-600 mt-1">
            ({EVENT_DATE})
          </div>
        </div>

      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Imba />
  </React.StrictMode>
);
