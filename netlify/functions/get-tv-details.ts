
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

  if (!tmdbID) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "ID parameter required" }) };
  }

  try {
    const tmdbUrl = `https://api.themoviedb.org/3/tv/${tmdbID}?api_key=${TMDB_API_KEY}&language=ru-RU`;
    const tmdbRes = await fetch(tmdbUrl);
    
    if (!tmdbRes.ok) {
        throw new Error(`TMDB Error: ${tmdbRes.status}`);
    }
    const tmdbData = await tmdbRes.json();

    // Calculate total runtime
    // Series usually provide `episode_run_time` array. We take average or default to 45.
    let avgRuntime = 45;
    if (tmdbData.episode_run_time && tmdbData.episode_run_time.length > 0) {
        const sum = tmdbData.episode_run_time.reduce((a: number, b: number) => a + b, 0);
        avgRuntime = Math.round(sum / tmdbData.episode_run_time.length);
    } else if (tmdbData.last_episode_to_air && tmdbData.last_episode_to_air.runtime) {
        // Fallback to last episode runtime
        avgRuntime = tmdbData.last_episode_to_air.runtime;
    }

    const totalEpisodes = tmdbData.number_of_episodes || 1;
    const totalRuntime = totalEpisodes * avgRuntime;

    const result = {
        ...tmdbData,
        calculated_runtime: totalRuntime
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
      body: JSON.stringify({ error: "Failed to fetch TV details" }),
    };
  }
};
