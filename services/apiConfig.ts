// В режиме разработки (npm run dev) используем локальный прокси (/.netlify/functions -> localhost:8888).
// В продакшене (GitHub Pages) обращаемся напрямую к вашему бэкенду на Netlify.

// Убедитесь, что ваш сайт на Netlify действительно доступен по этому адресу.
const PROD_BACKEND_URL = 'https://gamelxrd.netlify.app';

// Определяем, являемся ли мы в режиме разработки Vite
const isDev = (import.meta as any).env?.DEV;

export const API_BASE_URL = isDev
  ? '/.netlify/functions'
  : `${PROD_BACKEND_URL}/.netlify/functions`;