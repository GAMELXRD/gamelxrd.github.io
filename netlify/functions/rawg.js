const ALLOWED_ORIGIN = 'https://gamelxrd.space';

exports.handler = async (event) => {
  // 1. Обработка "предварительного" запроса (Preflight OPTIONS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  // 2. Основная логика
  const apiUrl = event.queryStringParameters.url;

  if (!apiUrl) {
    return { statusCode: 400, body: JSON.stringify({ error: 'URL is required' }) };
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(apiUrl);
    const data = await response.json();

    // 3. Добавляем заголовок в основной ответ
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data from RAWG API' }),
    };
  }
};