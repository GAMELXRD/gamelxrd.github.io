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