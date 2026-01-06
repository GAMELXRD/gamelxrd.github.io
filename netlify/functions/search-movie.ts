
export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const query = event.queryStringParameters?.query;
  const TMDB_API_KEY = process.env.TMDB_API_KEY;

  if (!query) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Query parameter required" }) };
  }

  if (!TMDB_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server configuration error (API Key)" }) };
  }

  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=ru-RU&query=${encodeURIComponent(query)}&include_adult=false`;
    const response = await fetch(url);
    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to fetch from TMDB" }),
    };
  }
};
