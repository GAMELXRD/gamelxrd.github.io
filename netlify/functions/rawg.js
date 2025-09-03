// Файл: /netlify/functions/rawg.js

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const ITAD_API_KEY = process.env.ITAD_API_KEY;
const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY;
const ALLOWED_ORIGIN = 'https://gamelxrd.space';

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Access-Control-Allow-Methods': 'GET, OPTIONS' } };
  }
  
  const headers = { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, 'Content-Type': 'application/json' };
  const { url, gameName } = event.queryStringParameters;

  if (url) { /* ... код для RAWG ... */ return; }

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

      if (steamData.total === 0 || !steamData.items || steamData.items.length === 0) {
        console.log(`[Функция]: ПРОВАЛ! Steam API не нашел игру. Возвращаю цену 0.`);
        return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }
      const steamAppId = steamData.items[0].id;
      console.log(`[Функция]: УСПЕХ! Найден Steam App ID: ${steamAppId}`);

      // --- Этап 2: Ищем "plain" в ITAD ---
      console.log(`[Функция]: Шаг 2.1 - Ищу "plain" для app/${steamAppId}`);
      const plainResponse = await fetch(`https://api.isthereanydeal.com/v02/game/plain/?key=${ITAD_API_KEY}&shop=steam&game_id=app%2F${steamAppId}`);
      const plainData = await plainResponse.json();
      if (!plainData.data || !plainData.data.plain) {
        console.log(`[Функция]: ПРОВАЛ! ITAD не нашел "plain". Возвращаю цену 0.`);
        return { statusCode: 200, headers, body: JSON.stringify({ price: 0 }) };
      }
      const gamePlain = plainData.data.plain;
      console.log(`[Функция]: УСПЕХ! Найден "plain": ${gamePlain}`);

      // --- Этап 3: Получаем цену и конвертируем ---
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