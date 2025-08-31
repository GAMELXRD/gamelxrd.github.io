// Содержимое файла /netlify/functions/rawg.js

exports.handler = async (event) => {
  // 1. Получаем URL игрового API, который передал наш калькулятор
  const apiUrl = event.queryStringParameters.url;

  // 2. Если URL не передали, возвращаем ошибку
  if (!apiUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'URL is required' }),
    };
  }

  try {
    // 3. Динамически импортируем библиотеку для совершения запросов (нужна для серверной среды)
    const fetch = (await import('node-fetch')).default;

    // 4. Наш "помощник" делает запрос к настоящему API RAWG
    const response = await fetch(apiUrl);
    const data = await response.json();

    // 5. Отправляем полученные данные обратно в калькулятор
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Этот заголовок на всякий случай, если будешь вызывать функцию с другого домена
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    // В случае ошибки, сообщаем об этом
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data from RAWG API' }),
    };
  }
};