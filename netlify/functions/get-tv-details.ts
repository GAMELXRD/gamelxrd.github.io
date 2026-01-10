
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
    // 1. Fetch TMDB details INCLUDING external_ids
    const tmdbUrl = `https://api.themoviedb.org/3/tv/${tmdbID}?api_key=${TMDB_API_KEY}&language=ru-RU&append_to_response=external_ids`;
    const tmdbRes = await fetch(tmdbUrl);
    
    if (!tmdbRes.ok) {
        throw new Error(`TMDB Error: ${tmdbRes.status}`);
    }
    const tmdbData = await tmdbRes.json();

    let exactRuntime = 0;

    // 2. Try fetching from TVMaze (via IMDb ID) for accurate runtime
    // TVMaze usually has better single-value runtime data
    const imdbId = tmdbData.external_ids?.imdb_id;
    if (imdbId) {
        try {
            // TVMaze lookup redirects to the show endpoint, fetch follows it automatically
            const tvmazeRes = await fetch(`https://api.tvmaze.com/lookup/shows?imdb=${imdbId}`);
            if (tvmazeRes.ok) {
                const tvmazeData = await tvmazeRes.json();
                // Prefer 'runtime' (schedule), fallback to 'averageRuntime'
                if (tvmazeData.runtime) {
                    exactRuntime = tvmazeData.runtime;
                } else if (tvmazeData.averageRuntime) {
                    exactRuntime = tvmazeData.averageRuntime;
                }
            }
        } catch (e) {
            console.warn("TVMaze fetch failed, falling back to TMDB");
        }
    }

    // 3. Fallback to TMDB data if TVMaze didn't return a valid runtime
    if (!exactRuntime) {
        if (tmdbData.episode_run_time && tmdbData.episode_run_time.length > 0) {
            const sum = tmdbData.episode_run_time.reduce((a: number, b: number) => a + b, 0);
            exactRuntime = Math.round(sum / tmdbData.episode_run_time.length);
        } else if (tmdbData.last_episode_to_air && tmdbData.last_episode_to_air.runtime) {
            exactRuntime = tmdbData.last_episode_to_air.runtime;
        } else {
            exactRuntime = 45; // Hard fallback
        }
    }

    const totalEpisodes = tmdbData.number_of_episodes || 1;
    const totalRuntime = totalEpisodes * exactRuntime;

    // Pass detailed seasons data for frontend calculations
    const seasonsData = tmdbData.seasons || [];

    const result = {
        ...tmdbData,
        calculated_runtime: totalRuntime,
        average_runtime: exactRuntime,
        seasons_data: seasonsData
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
