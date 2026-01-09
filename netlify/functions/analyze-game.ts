
export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  // --- LOG COLLECTOR START ---
  const debugLogs: string[] = [];
  const log = (message: string, data?: any) => {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1); // HH:MM:SS.mmm
      let logLine = `[SERVER ${timestamp}] ${message}`;
      if (data !== undefined) {
          try {
            // Если объект слишком большой, можно сократить, но пока логируем как есть для дебага
            const json = JSON.stringify(data);
            logLine += ` | ${json}`;
          } catch (e) {
            logLine += ` | [Circular/Unserializable]`;
          }
      }
      console.log(logLine); // Log to Netlify function console
      debugLogs.push(logLine); // Store for client response
  };
  // --- LOG COLLECTOR END ---

  const RAWG_API_KEY = process.env.RAWG_API_KEY;
  const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!RAWG_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Missing RAWG_API_KEY" }) };
  }
  
  if (!GROQ_API_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Missing GROQ_API_KEY" }) };
  }

  const fetchWithTimeout = async (url: string, options: any = {}, timeoutMs = 4500) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  try {
      const bodyParsed = JSON.parse(event.body || '{}');
      const { query } = bodyParsed;

      if (!query) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: "Query required" }) };
      }

      log(`🔍 Processing request for slug: "${query}"`);

      // 1. ПОИСК ИГРЫ В RAWG
      let gameDetails = null;
      let rawgUrl = `https://api.rawg.io/api/games/${query}?key=${RAWG_API_KEY}`;
      
      try {
          log(`Step 1: Fetching RAWG details...`);
          let detailsRes = await fetchWithTimeout(rawgUrl);
          
          if (detailsRes.ok) {
              gameDetails = await detailsRes.json();
              log(`✅ RAWG Direct hit: "${gameDetails.name}" (ID: ${gameDetails.id})`);
          } else {
              log(`⚠️ Direct fetch failed (${detailsRes.status}). Trying search fallback...`);
              const searchUrl = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=1`;
              const searchRes = await fetchWithTimeout(searchUrl);
              const searchData = await searchRes.json();
              
              if (searchData.results && searchData.results.length > 0) {
                  const slug = searchData.results[0].slug;
                  log(`Found via search: ${slug}. Fetching details...`);
                  const detailsRes2 = await fetchWithTimeout(`https://api.rawg.io/api/games/${slug}?key=${RAWG_API_KEY}`);
                  if (detailsRes2.ok) {
                      gameDetails = await detailsRes2.json();
                  }
              } else {
                  log(`❌ RAWG Search returned no results.`);
              }
          }
      } catch (e: any) {
          log(`❌ RAWG Error: ${e.message}`);
          return { statusCode: 502, headers, body: JSON.stringify({ error: "Failed to communicate with game database" }) };
      }

      if (!gameDetails) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: "Game not found in RAWG database" }) };
      }

      // 2. СБОР ДАННЫХ
      const title = gameDetails.name;
      const releaseYear = gameDetails.released ? parseInt(gameDetails.released.split('-')[0]) : 0;
      const posterUrl = gameDetails.background_image;
      const genres = gameDetails.genres ? gameDetails.genres.map((g: any) => g.name) : [];
      
      if (gameDetails.tags) {
          const importantTags = ["Survival Horror", "Horror", "Psychological Horror", "Zombies", "Visual Novel", "FMV", "Interactive Movie"];
          gameDetails.tags.forEach((t: any) => {
              if (importantTags.includes(t.name)) {
                  genres.push(t.name);
              }
          });
      }

      let rating = 0;
      if (gameDetails.metacritic) {
          rating = gameDetails.metacritic / 10;
      } else {
          rating = (gameDetails.rating || 0) * 2;
      }

      const descriptionRaw = gameDetails.description_raw || gameDetails.description || "";
      const description = descriptionRaw.replace(/<[^>]*>?/gm, '').slice(0, 500) + "...";

      // --- PARALLEL EXECUTION ---
      
      // A. Groq AI (HLTB)
      const groqPromise = (async () => {
          const GROQ_MODEL = "llama3-70b-8192";
          try {
              log(`🚀 Starting Groq Request for: "${title}" (${releaseYear})`);
              log(`🤖 Model: ${GROQ_MODEL}`);
              
              const systemPrompt = `You are an expert on video game completion times, specifically data from HowLongToBeat.com.
              Your ONLY task is to provide the estimated "Main Story" completion time in hours for the given game.
              
              Rules:
              1. Return ONLY a valid JSON object: { "hours": number }.
              2. Do not include any explanations or other text.
              3. If the game is endless (e.g., multiplayer only), return { "hours": 0 }.
              4. If data is unavailable, estimate based on genre standards but prefer accuracy.
              `;

              const userPrompt = `Game: "${title}" (${releaseYear}). Main Story completion time in hours?`;

              const requestPayload = {
                  messages: [
                      { role: "system", content: systemPrompt },
                      { role: "user", content: userPrompt }
                  ],
                  model: GROQ_MODEL,
                  temperature: 0,
                  response_format: { type: "json_object" }
              };

              log(`📨 Sending Request to Groq API`, requestPayload);

              const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                  method: "POST",
                  headers: {
                      "Authorization": `Bearer ${GROQ_API_KEY}`,
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify(requestPayload)
              });

              if (!groqResponse.ok) {
                  const errText = await groqResponse.text();
                  log(`❌ Groq API Error: ${groqResponse.status}`, errText);
                  throw new Error(`Groq Status: ${groqResponse.status}`);
              }

              const groqData = await groqResponse.json();
              log(`📥 Received Groq Response`, groqData);

              const content = groqData.choices[0]?.message?.content;
              log(`📦 Extracted Content`, content);

              if (content) {
                  const parsed = JSON.parse(content);
                  if (typeof parsed.hours === 'number') {
                      log(`✅ Groq Validated Time: ${parsed.hours}h`);
                      return parsed.hours;
                  }
              }
          } catch (e: any) {
              log(`⚠️ Groq Exception: ${e.message}`);
          }
          return null;
      })();

      // B. Steam Price
      const steamPromise = (async () => {
          let steamPriceRub = 0;
          let steamUrl = "";
          let steamAppId = null;

          try {
              // Strategy A
              log(`Step 3: Checking RAWG Stores...`);
              const storesUrl = `https://api.rawg.io/api/games/${gameDetails.id}/stores?key=${RAWG_API_KEY}`;
              const storesRes = await fetchWithTimeout(storesUrl, {}, 3000); 
              const storesData = await storesRes.json();

              if (storesData.results) {
                  const steamStore = storesData.results.find((s: any) => s.store_id === 1 || s.url.includes("steampowered.com"));
                  if (steamStore) {
                      steamUrl = steamStore.url;
                      const match = steamUrl.match(/app\/(\d+)/);
                      if (match) steamAppId = match[1];
                      log(`✅ Found Steam AppID via RAWG: ${steamAppId}`);
                  }
              }
          } catch (e: any) {
              log(`⚠️ Steam Strategy A failed: ${e.message}`);
          }

          // Strategy B
          if (!steamAppId) {
              try {
                  log(`Step 3b: Searching Steam Store directly...`);
                  const steamSearchUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=russian&cc=kz&category1=998`;
                  const searchRes = await fetchWithTimeout(steamSearchUrl, {}, 3000);
                  const searchData = await searchRes.json();

                  if (searchData.total > 0 && searchData.items && searchData.items.length > 0) {
                      steamAppId = searchData.items[0].id;
                      steamUrl = `https://store.steampowered.com/app/${steamAppId}/`;
                      log(`✅ Found Steam AppID via Search: ${steamAppId}`);
                  }
              } catch (e: any) {
                   log(`⚠️ Steam Strategy B failed: ${e.message}`);
              }
          }

          // Get Price
          if (steamAppId) {
              try {
                  const steamApiUrl = `https://store.steampowered.com/api/appdetails?appids=${steamAppId}&cc=kz&filters=price_overview`;
                  const steamRes = await fetchWithTimeout(steamApiUrl, {}, 3000);
                  
                  if (steamRes.ok) {
                      const steamData = await steamRes.json();
                      if (steamData[steamAppId] && steamData[steamAppId].success && steamData[steamAppId].data.price_overview) {
                          const priceKzt = steamData[steamAppId].data.price_overview.final / 100;
                          
                          let exchangeRate = 0.2; 
                          if (EXCHANGERATE_API_KEY) {
                              try {
                                  const rateUrl = `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/pair/KZT/RUB`;
                                  const rateRes = await fetchWithTimeout(rateUrl, {}, 2000);
                                  const rateData = await rateRes.json();
                                  if (rateData.result === "success") {
                                      exchangeRate = rateData.conversion_rate;
                                  }
                              } catch (e) {
                                  // ignore
                              }
                          }
                          steamPriceRub = Math.ceil(priceKzt * exchangeRate);
                          log(`💰 Price found: ${priceKzt} KZT -> ~${steamPriceRub} RUB`);
                      } else if (steamData[steamAppId].success && steamData[steamAppId].data.is_free) {
                          steamPriceRub = 0;
                          log(`💰 Game is Free`);
                      }
                  }
              } catch (e: any) {
                  log(`❌ Steam Details Fetch Error: ${e.message}`);
              }
          } else {
              log(`⚠️ No Steam AppID found, price will be 0`);
          }
          
          return { steamPriceRub, steamUrl };
      })();

      const AUX_TIMEOUT = 6000;
      
      const safeGroqPromise = Promise.race([
          groqPromise,
          new Promise<null>((resolve) => setTimeout(() => {
              log(`⚠️ Groq Request Timed Out (${AUX_TIMEOUT}ms)`);
              resolve(null);
          }, AUX_TIMEOUT))
      ]);

      const safeSteamPromise = Promise.race([
          steamPromise,
          new Promise<{steamPriceRub: number, steamUrl: string}>((resolve) => setTimeout(() => resolve({steamPriceRub: 0, steamUrl: ""}), AUX_TIMEOUT))
      ]);

      log(`⏳ Waiting for parallel tasks...`);
      const [groqResult, steamResult] = await Promise.all([safeGroqPromise, safeSteamPromise]);

      // STRICT LOGIC
      let hltbTime = 0;
      if (groqResult !== null) {
          hltbTime = groqResult;
          log(`🏆 FINAL TIME: Using Groq result: ${hltbTime}h`);
      } else {
          log(`⚠️ FINAL TIME: Groq failed or empty. Setting to 0 (Display as "-").`);
      }

      const { steamPriceRub, steamUrl } = steamResult;

      const result = {
          title,
          releaseYear,
          posterUrl,
          genres,
          rating,
          hltbTime,
          steamPriceRub,
          steamUrl,
          description,
          debugLogs // Возвращаем логи на клиент
      };

      log(`🏁 Analysis complete. Sending response.`);

      return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result)
      };

  } catch (error: any) {
    console.error("CRITICAL ERROR:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `Internal Server Error: ${error.message}` })
    };
  }
};
    