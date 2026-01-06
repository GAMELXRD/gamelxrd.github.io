
import { GoogleGenAI, Type } from "@google/genai";

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

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Server configuration error (API Key)" }) };
  }

  try {
    const { query, releaseYear } = JSON.parse(event.body || '{}');
    if (!query) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Query is required" }) };
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Official game title" },
        releaseYear: { type: Type.INTEGER, description: "Year of release" },
        posterUrl: { type: Type.STRING, description: "Direct URL to a high-quality vertical cover art/poster (Steam/IGDB/Twitch)" },
        genres: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Extensive list (10+) of genres and Steam tags (e.g., 'Psychological Horror', 'Walking Simulator', 'Interactive Movie', 'FMV', 'Visual Novel')" },
        rating: { type: Type.NUMBER, description: "Game rating on a 0-10 scale (convert Metacritic/Steam positive %)" },
        hltbTime: { type: Type.NUMBER, description: "Average 'Main Story' playtime in hours from HowLongToBeat" },
        steamPriceRub: { type: Type.INTEGER, description: "Current price on Steam. Look up the price in Kazakhstan (Tenge) and convert it to Russian Rubles. If not found or abandonware, return 0." },
        steamUrl: { type: Type.STRING, description: "Link to Steam store page. Empty string if not available." },
        description: { type: Type.STRING, description: "Short description of the game in Russian" }
      },
      required: ["title", "releaseYear", "genres", "rating", "hltbTime", "steamPriceRub"]
    };

    const yearContext = releaseYear ? ` released in ${releaseYear}` : "";
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find detailed information about the video game: "${query}"${yearContext}.
      
      Tasks:
      1. Find the **HowLongToBeat** time for "Main Story".
      2. Identify if the game is considered a **Horror** or Survival Horror.
      3. Find the current **Steam Price** in **Kazakhstan (KZT)** and convert it to **RUB**.
      4. **CRITICAL**: If the game is old, retro, "abandonware", or simply NOT available for purchase on modern digital stores (Steam/GOG) (e.g., Silent Hill 1, old Nintendo games), set 'steamPriceRub' to 0 and 'steamUrl' to "". DO NOT make up a link or price for a different game in the series.
      5. Get a rating (Metacritic or Steam user score converted to 0-10).
      6. Provide a direct link to the cover art.
      7. **IMPORTANT**: Provide a COMPREHENSIVE list of genres and Steam tags (at least 10-15 tags). 
      
      Return JSON.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from AI");

    return {
      statusCode: 200,
      headers,
      body: text,
    };

  } catch (error) {
    console.error("Gemini function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to analyze game" }),
    };
  }
};
