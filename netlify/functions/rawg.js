// Файл: /netlify/functions/rawg.js

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// --- API ключи и разрешенный домен ---
const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY; // ITAD ключ больше не нужен
const ALLOWED_ORIGIN = 'https://gamelxrd.space';

exports.handler = async (event) => {
  // Обработка CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': 'GET, OPTIONS' } };
  }
  
  const headers = { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' };
  const { url, gameName } = event.queryStringParameters;

  // Часть 1: Получение деталей игры из RAWG (без изменений)
  if (url) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch RAWG data' }) };
    }
  }

  // Часть 2: Получение цены напрямую из Steam
  if (gameName) {
    if (!EXCHANGERATE_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'ExchangeRate API key is not configured' }) };
    }

    try {
      // --- Этап 1: Ищем App ID через Steam Store API ---
      const steamSearchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=russian&cc=kz&category1=998`;
      const steamResponse = await fetch(steamSearchUrl);
      const steamData = await steamResponse.json();

      if (steamData.total === 0 || !steamData.items || steamData.items.length === 0) {
        return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }
      const steamAppId = steamData.items[0].id;

      // --- !!! ГЛАВНОЕ ИЗМЕНЕНИЕ: ПОЛУЧАЕМ ДЕТАЛИ И ЦЕНУ НАПРЯМУЮ ИЗ STEAM !!! ---
      const detailsUrl = `https://store.steampowered.com/api/appdetails?appids=${steamAppId}&cc=kz`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      
      const gameData = detailsData[steamAppId];

      // Проверяем, что запрос успешен и у игры есть цена
      if (!gameData || !gameData.success || !gameData.data.price_overview) {
        // Если price_overview отсутствует, игра бесплатна или у нее нет цены
        return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }
      
      // ВАЖНО: Steam API отдает цену в наименьших единицах (как копейки/тиыны)
      // Чтобы получить цену в тенге, нужно разделить на 100
      const priceInKZT = gameData.data.price_overview.final / 100;

      // --- Этап 3: Конвертируем KZT в RUB ---
      const ratesResponse = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/KZT`);
      const ratesData = await ratesResponse.json();
      const kztToRubRate = ratesData.conversion_rates.RUB;
      const priceInRUB = priceInKZT * kztToRubRate;

      return { statusCode: 200, headers, body: JSON.stringify({ price: Math.round(priceInRUB) }) };

    } catch (error)
    {
      console.error('Error during price fetching:', error);
      return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
    }
  }

  return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing parameter' }) };
};