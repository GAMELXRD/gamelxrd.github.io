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

  // Часть 2: Получение цены по названию игры (НОВАЯ УЛУЧШЕННАЯ ЛОГИКА)
  if (gameName) {
    console.log(`[Функция]: Получен заказ на поиск цены для "${gameName}"`);
    if (!ITAD_API_KEY || !EXCHANGERATE_API_KEY) {
      console.error('[Функция]: Ошибка! API ключи не настроены в Netlify.');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'API keys are not configured' }) };
    }

    try {
      // --- Этап 1: Ищем App ID через Steam Store API ---
      const steamSearchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(gameName)}&l=russian&cc=kz`;
      console.log(`[Функция]: Шаг 1.1 - Отправляю запрос в Steam: ${steamSearchUrl}`);
      const steamResponse = await fetch(steamSearchUrl);
      const steamData = await steamResponse.json();
      console.log('[Функция]: Шаг 1.2 - Получен ответ от Steam:', steamData);

      // Если Steam ничего не нашел, выходим
      if (steamData.total === 0 || !steamData.items || steamData.items.length === 0) {
        console.log(`[Функция]: ПРОВАЛ! Steam API не нашел игру. Возвращаю цену 0.`);
        return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }
      const steamAppId = steamData.items[0].id; // Берем ID самой первой игры в результатах
      console.log(`[Функция]: УСПЕХ! Найден Steam App ID: ${steamAppId}`);

      // --- Этап 2: Используем найденный App ID для поиска в ITAD (самый надежный способ) ---
      console.log(`[Функция]: Шаг 2.1 - Ищу данные для app/${steamAppId}`);
      const itadId = `steam/app/${steamAppId}`;
      const encodedItadId = encodeURIComponent(itadId);
      const overviewResponse = await fetch(`https://api.isthereanydeal.com/v01/game/overview/?key=${ITAD_API_KEY}&ids=${encodedItadId}`);
      const overviewData = await overviewResponse.json();

      // Проверяем, что ответ содержит данные и "plain"
      if (!overviewData.data || !overviewData.data[itadId] || !overviewData.data[itadId].plain) {
          return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }
      const gamePlain = overviewData.data[itadId].plain;
      console.log(`[Функция]: УСПЕХ! : ${gamePlain}`);

      // --- Этап 3: Получаем цену в KZT и конвертируем в RUB ---
      console.log(`[Функция]: Шаг 3.1 - Запрашиваю цены для "${gamePlain}" в регионе KZ.`);
      const pricesResponse = await fetch(`https://api.isthereanydeal.com/v01/game/prices/?key=${ITAD_API_KEY}&plains=${gamePlain}&country=KZ`);
      const pricesData = await pricesResponse.json();
      const gameData = pricesData.data[gamePlain];
      if (!gameData || !gameData.list || gameData.list.length === 0) {
        console.log(`[Функция]: ПРОВАЛ! У ITAD нет цен для этой игры в KZ. Возвращаю цену 0.`);
        return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }
      const priceInKZT = gameData.list[0].price_new;
      console.log(`[Функция]: УСПЕХ! Найдена цена в тенге: ${priceInKZT}`);

      console.log('[Функция]: Шаг 3.2 - Запрашиваю курс валют.');
      const ratesResponse = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/KZT`);
      const ratesData = await ratesResponse.json();
      const kztToRubRate = ratesData.conversion_rates.RUB;
      const priceInRUB = priceInKZT * kztToRubRate;
      console.log(`[Функция]: УСПЕХ! Цена в рублях: ${Math.round(priceInRUB)}. Отправляю клиенту.`);

      return { statusCode: 200, headers, body: JSON.stringify({ price: Math.round(priceInRUB) }) };

    } catch (error) {
      console.error('[Функция]: КРИТИЧЕСКАЯ ОШИБКА!', error);
      return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
    }
  }

  return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing parameter' }) };
};