
export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const tmdbID = event.queryStringParameters?.id;
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  const OMDB_API_KEY = process.env.OMDB_API_KEY;

  if (!tmdbID) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "ID parameter required" }) };
  }

  try {
    // 1. Fetch TMDB Data
    const tmdbUrl = `https://api.themoviedb.org/3/movie/${tmdbID}?api_key=${TMDB_API_KEY}&language=ru-RU`;
    const tmdbRes = await fetch(tmdbUrl);
    
    if (!tmdbRes.ok) {
        throw new Error(`TMDB Error: ${tmdbRes.status}`);
    }
    const tmdbData = await tmdbRes.json();

    // 2. Fetch OMDb Rating (Optional)
    let imdbRating = tmdbData.vote_average || 0;
    const imdbExternalID = tmdbData.imdb_id;

    if (imdbExternalID && OMDB_API_KEY) {
      try {
        const omdbUrl = `https://www.omdbapi.com/?i=${imdbExternalID}&apikey=${OMDB_API_KEY}`;
        const omdbRes = await fetch(omdbUrl);
        const omdbData = await omdbRes.json();
        
        if (omdbData.Response === "True" && omdbData.imdbRating && omdbData.imdbRating !== "N/A") {
          imdbRating = parseFloat(omdbData.imdbRating);
        }
      } catch (e) {
        console.warn("OMDb fetch failed, using TMDB rating");
      }
    }

    // Combine data
    const result = {
        ...tmdbData,
        calculated_imdb_rating: imdbRating
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to fetch movie details" }),
    };
  }
};
