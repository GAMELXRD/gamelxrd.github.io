// Файл: /netlify/functions/rawg.js

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// --- API ключи и разрешенный домен ---
const ITAD_API_KEY = process.env.ITAD_API_KEY;
const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY;
const ALLOWED_ORIGIN = 'https://gamelxrd.space';

exports.handler = async (event) => {
  // Обработка CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': 'GET, OPTIONS' } };
  }
  
  const headers = { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' };
  const { url, steamAppId, gameName } = event.queryStringParameters;

  // --- Часть 1: Получение деталей игры из RAWG (без изменений) ---
  if (url) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch RAWG data' }) };
    }
  }

  // --- Часть 2: Получение цены. Обрабатываем ОБА варианта: по ID и по имени ---
  let gamePlain = null;
  
  if (!ITAD_API_KEY || !EXCHANGERATE_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API keys are not configured' }) };
  }

  try {
    // --- План А: Ищем игру по Steam App ID (самый надежный) ---
    if (steamAppId) {
      const plainResponse = await fetch(`https://api.isthereanydeal.com/v02/game/plain/?key=${ITAD_API_KEY}&shop=steam&game_id=app%2F${steamAppId}`);
      const plainData = await plainResponse.json();
      if (plainData.data && plainData.data.plain) {
        gamePlain = plainData.data.plain;
      }
    }

    // --- План Б: Если по ID не нашли, ищем по названию (запасной вариант) ---
    if (!gamePlain && gameName) {
      const plainResponse = await fetch(`https://api.isthereanydeal.com/v02/game/plain/?key=${ITAD_API_KEY}&title=${encodeURIComponent(gameName)}`);
      const plainData = await plainResponse.json();
      if (plainData.data && plainData.data.plain) {
        gamePlain = plainData.data.plain;
      }
    }

    // Если ни одним из способов игру не нашли, возвращаем 0
    if (!gamePlain) {
      return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
    }

    // --- Теперь, когда у нас есть `gamePlain`, получаем цену и конвертируем валюту ---
    const pricesResponse = await fetch(`https://api.isthereanydeal.com/v01/game/prices/?key=${ITAD_API_KEY}&plains=${gamePlain}&country=KZ`);
    const pricesData = await pricesResponse.json();
    const gameData = pricesData.data[gamePlain];
    if (!gameData || !gameData.list || gameData.list.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
    }
    const priceInKZT = gameData.list[0].price_new;

    const ratesResponse = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/KZT`);
    const ratesData = await ratesResponse.json();
    const kztToRubRate = ratesData.conversion_rates.RUB;
    const priceInRUB = priceInKZT * kztToRubRate;

    return { statusCode: 200, headers, body: JSON.stringify({ price: Math.round(priceInRUB) }) };

  } catch (error) {
    console.error('Error during price fetching:', error);
    return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
  }
};