
// ВНИМАНИЕ:
// 1. Задеплойте этот проект на Netlify (чтобы работали функции backend'а).
// 2. Скопируйте полученный домен (например, https://my-project.netlify.app).
// 3. Вставьте его ниже в переменную NETLIFY_LIVE_URL.

// Если вы запускаете локально (npm start), будет использоваться локальный прокси.
// Если вы зальете это на GitHub Pages, будет использоваться адрес ниже.

const NETLIFY_LIVE_URL = 'https://YOUR_NETLIFY_SITE_URL.netlify.app'; 

export const API_BASE_URL = window.location.hostname === 'localhost' 
  ? '/.netlify/functions' 
  : `${NETLIFY_LIVE_URL}/.netlify/functions`;
