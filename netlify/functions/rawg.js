const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// --- Безопасно получаем наши API ключи из настроек Netlify ---
const ITAD_API_KEY = process.env.ITAD_API_KEY;
const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY;
const ALLOWED_ORIGIN = 'https://gamelxrd.space';

exports.handler = async (event) => {
  // Обработка CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': 'GET, OPTIONS' } };
  }
  
  const headers = { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' };
  const { url, steamAppId } = event.queryStringParameters;

  // Логика для RAWG API (без изменений)
  if (url) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch RAWG data' }) };
    }
  }

  // --- НОВАЯ СУПЕР-НАДЕЖНАЯ ЛОГИКА ПОЛУЧЕНИЯ ЦЕНЫ ---
  if (steamAppId) {
    if (!ITAD_API_KEY || !EXCHANGERATE_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'API keys are not configured' }) };
    }

    try {
      // 1. Найти "plain" игры по ее Steam App ID. Это самый надежный метод.
      const plainResponse = await fetch(`https://api.isthereanydeal.com/v02/game/plain/?key=${ITAD_API_KEY}&shop=steam&game_id=app%2F${steamAppId}`);
      const plainData = await plainResponse.json();
      if (!plainData.data || !plainData.data.plain) {
        return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }
      const gamePlain = plainData.data.plain;

      // 2. Получить цены для Казахстана (KZ)
      const pricesResponse = await fetch(`https://api.isthereanydeal.com/v01/game/prices/?key=${ITAD_API_KEY}&plains=${gamePlain}&country=KZ`);
      const pricesData = await pricesResponse.json();
      const gameData = pricesData.data[gamePlain];
      if (!gameData || !gameData.list || gameData.list.length === 0) {
        return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }
      const priceInKZT = gameData.list[0].price_new;

      // 3. Получить курс валют и конвертировать KZT в RUB
      const ratesResponse = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/KZT`);
      const ratesData = await ratesResponse.json();
      const kztToRubRate = ratesData.conversion_rates.RUB;
      const priceInRUB = priceInKZT * kztToRubRate;

      // Возвращаем итоговую, сконвертированную цену
      return { statusCode: 200, headers, body: JSON.stringify({ price: Math.round(priceInRUB) }) };

    } catch (error) {
      console.error('Error during price fetching:', error);
      return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
    }
  }

  return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing parameter' }) };
};