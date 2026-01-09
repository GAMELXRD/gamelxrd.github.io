
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
  const RAWG_API_KEY = process.env.RAWG_API_KEY;

  if (!query) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Query parameter required" }) };
  }

  if (!RAWG_API_KEY) {
     return { statusCode: 500, headers, body: JSON.stringify({ error: "Server configuration error (API Key)" }) };
  }

  try {
    const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=5`;
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
      body: JSON.stringify({ error: "Failed to fetch from RAWG" }),
    };
  }
};
