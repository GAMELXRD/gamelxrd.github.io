const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// --- API ключи и разрешенный домен ---
const ITAD_API_KEY = process.env.ITAD_API_KEY;
const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY;
const ALLOWED_ORIGIN = 'https://gamelxrd.space';

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' };

  // Проверка API-ключей
  if (!ITAD_API_KEY || !EXCHANGERATE_API_KEY) {
    console.error('[Функция]: Ошибка! API ключи не настроены в Netlify.');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API keys are not configured' }) };
  }

  // Обработка CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': 'GET, OPTIONS' } };
  }

  const { url, gameName } = event.queryStringParameters;

  // Часть 1: Получение деталей игры из RAWG
  if (url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`RAWG API error: ${response.status}`);
      const data = await response.json();
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    } catch (error) {
      console.error('[Функция]: Ошибка RAWG:', error.message);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch RAWG data', details: error.message }) };
    }
  }

  // Часть 2: Получение цены по названию игры
  if (gameName) {
    console.log(`[Функция]: Получен заказ на поиск цены для "${gameName}"`);
    try {
      // Этап 1: Ищем App ID через Steam Store API
      const normalizedGameName = gameName.trim().replace(/\s+/g, ' ');
      const steamSearchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(normalizedGameName)}&l=russian&cc=kz`;
      console.log(`[Функция]: Шаг 1.1 - Отправляю запрос в Steam: ${steamSearchUrl}`);
      const steamResponse = await fetch(steamSearchUrl, {
        headers: { 'User-Agent': 'GameLXRD/1.0[](https://gamelxrd.space)' }
      });
      if (!steamResponse.ok) {
        console.error('[Функция]: Ошибка Steam API:', steamResponse.status);
        return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }
      const steamData = await steamResponse.json();
      console.log('[Функция]: Шаг 1.2 - Получен ответ от Steam:', steamData);

      if (!steamData.items || steamData.items.length === 0) {
        console.log(`[Функция]: ПРОВАЛ! Steam API не нашел игру. Возвращаю цену 0.`);
        return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }
      const bestMatch = steamData.items.find(item => item.name.toLowerCase() === normalizedGameName.toLowerCase()) || steamData.items[0];
      const steamAppId = bestMatch.id;
      console.log(`[Функция]: УСПЕХ! Найден Steam App ID: ${steamAppId}`);

      // Этап 2: Используем App ID для поиска в ITAD
      console.log(`[Функция]: Шаг 2.1 - Ищу данные для app/${steamAppId}`);
      const gameIdForItad = `app/${steamAppId}`;
      const plainResponse = await fetch(`https://api.isthereanydeal.com/v02/game/plain/?key=${ITAD_API_KEY}&shop=steam&game_id=${encodeURIComponent(gameIdForItad)}`);
      if (!plainResponse.ok) {
        console.error('[Функция]: Ошибка ITAD API:', plainResponse.status);
        return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }
      const plainData = await plainResponse.json();
      if (!plainData.data || !plainData.data.plain) {
        console.log(`[Функция]: ПРОВАЛ! ITAD не вернул plain для app/${steamAppId}.`);
        return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }
      const gamePlain = plainData.data.plain;
      console.log(`[Функция]: УСПЕХ! Plain: ${gamePlain}`);

      // Этап 3: Получаем цену в KZT и конвертируем в RUB
      console.log(`[Функция]: Шаг 3.1 - Запрашиваю цены для "${gamePlain}" в регионе KZ.`);
      const pricesResponse = await fetch(`https://api.isthereanydeal.com/v01/game/prices/?key=${ITAD_API_KEY}&plains=${gamePlain}&country=KZ`);
      if (!pricesResponse.ok) {
        console.error('[Функция]: Ошибка ITAD цен:', pricesResponse.status);
        return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }
      const pricesData = await pricesResponse.json();
      const gameData = pricesData.data[gamePlain];
      if (!gameData || !gameData.list || gameData.list.length === 0) {
        console.log(`[Функция]: ПРОВАЛ! У ITAD нет цен для "${gamePlain}" в KZ. Пробую регион US.`);
        const pricesResponseUS = await fetch(`https://api.isthereanydeal.com/v01/game/prices/?key=${ITAD_API_KEY}&plains=${gamePlain}&country=US`);
        const pricesDataUS = await pricesResponseUS.json();
        const gameDataUS = pricesDataUS.data[gamePlain];
        if (!gameDataUS || !gameDataUS.list || gameDataUS.list.length === 0) {
          console.log(`[Функция]: ПРОВАЛ! У ITAD нет цен и в US. Возвращаю цену 0.`);
          return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
        }
        const priceInUSD = gameDataUS.list[0].price_new;
        const ratesResponse = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/USD`);
        if (!ratesResponse.ok || !ratesData.conversion_rates || !ratesData.conversion_rates.RUB) {
          console.error('[Функция]: Ошибка ExchangeRate API или нет курса RUB:', ratesData);
          return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
        }
        const ratesData = await ratesResponse.json();
        const usdToRubRate = ratesData.conversion_rates.RUB;
        const priceInRUB = priceInUSD * usdToRubRate;
        return { statusCode: 200, headers, body: JSON.stringify({ price: Math.round(priceInRUB) }) };
      }
      const priceInKZT = gameData.list[0].price_new;
      console.log(`[Функция]: УСПЕХ! Найдена цена в тенге: ${priceInKZT}`);

      console.log('[Функция]: Шаг 3.2 - Запрашиваю курс валют.');
      const ratesResponse = await fetch(`https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/KZT`);
      const ratesData = await ratesResponse.json();
      if (!ratesResponse.ok || !ratesData.conversion_rates || !ratesData.conversion_rates.RUB) {
        console.error('[Функция]: Ошибка ExchangeRate API или нет курса RUB:', ratesData);
        return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }
      const kztToRubRate = ratesData.conversion_rates.RUB;
      const priceInRUB = priceInKZT * kztToRubRate;
      console.log(`[Функция]: УСПЕХ! Цена в рублях: ${Math.round(priceInRUB)}. Отправляю клиенту.`);

      return { statusCode: 200, headers, body: JSON.stringify({ price: Math.round(priceInRUB) }) };
    } catch (error) {
      console.error('[Функция]: КРИТИЧЕСКАЯ ОШИБКА!', error.message);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', details: error.message }) };
    }
  }

  return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing parameter' }) };
};