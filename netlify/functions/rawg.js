const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Указываем твой основной домен, с которого разрешены запросы
const ALLOWED_ORIGIN = 'https://gamelxrd.space';

// Безопасно получаем API ключ из настроек Netlify
const ITAD_API_KEY = process.env.ITAD_API_KEY;

exports.handler = async (event) => {
  // Обработка CORS для безопасности
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': 'GET, OPTIONS' } };
  }
  
  const headers = { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' };
  const { url, gameName } = event.queryStringParameters;

  // Эта часть для получения ДЕТАЛЕЙ ИГРЫ из RAWG (остается без изменений)
  if (url) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch (error) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch RAWG data' }) };
    }
  }

  // Эта часть для получения ЦЕНЫ ИГРЫ из IsThereAnyDeal
  if (gameName) {
    if (!ITAD_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'ITAD API key is not configured on Netlify' }) };
    }

    try {
      // 1. Находим внутреннее имя игры ("plain") по ее названию
      const plainResponse = await fetch(`https://api.isthereanydeal.com/v02/game/plain/?key=${ITAD_API_KEY}&title=${encodeURIComponent(gameName)}`);
      const plainData = await plainResponse.json();
      
      if (!plainData.data || !plainData.data.plain) {
        return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }
      const gamePlain = plainData.data.plain;

      // 2. Зная "plain", получаем цены для региона Казахстан (KZ)
      const pricesResponse = await fetch(`https://api.isthereanydeal.com/v01/game/prices/?key=${ITAD_API_KEY}&plains=${gamePlain}&country=KZ`);
      const pricesData = await pricesResponse.json();
      
      const gameData = pricesData.data[gamePlain];
      if (!gameData || !gameData.list || gameData.list.length === 0) {
        return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }

      // Берем самую низкую актуальную цену (price_new - это цена со скидкой, если есть)
      const bestPrice = gameData.list[0].price_new;
      
      return { statusCode: 200, headers, body: JSON.stringify({ price: bestPrice }) };

    } catch (error) {
      return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) }; // В случае ошибки вернем 0
    }
  }

  return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required parameter' }) };
};