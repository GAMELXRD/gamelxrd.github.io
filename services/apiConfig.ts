// В режиме разработки (npm run dev) используем локальный прокси (/.netlify/functions -> localhost:8888).
// В продакшене (GitHub Pages) обращаемся к Cloudflare Worker, который сам проксирует запросы
// на Netlify Functions. Это нужно, чтобы сайт работал у пользователей из РФ, где netlify.app
// периодически блокируется — Worker-прокси ходит на Netlify со своей стороны, минуя блокировку
// на стороне клиента. Сам воркер: cloudflare-worker/src/index.js.
const PROD_BACKEND_URL = 'https://gamelxrd-proxy.mzp-simson-sav.workers.dev';

// Определяем, являемся ли мы в режиме разработки Vite
const isDev = (import.meta as any).env?.DEV;

export const API_BASE_URL = isDev
  ? '/.netlify/functions'
  : PROD_BACKEND_URL;

// Постеры (TMDB) и обложки игр (RAWG) браузер обычно грузил бы напрямую с их CDN,
// которые в РФ блокируются отдельно от netlify.app. Пускаем их тоже через воркер.
export const proxyImage = (url: string): string =>
  `${PROD_BACKEND_URL}/img?src=${encodeURIComponent(url)}`;

// Оборачивает fetch таймаутом: если сеть блокирует воркер (DPI и т.п.), запрос
// не будет висеть вечно, а завершится ошибкой — и UI сможет её показать,
// вместо бесконечного спиннера.
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const externalSignal = options.signal;
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};