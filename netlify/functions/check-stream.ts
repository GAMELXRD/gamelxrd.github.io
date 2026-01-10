
export const handler = async (event: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
  const CHANNEL_NAME = 'gamelxrd'; // Hardcoded channel name

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("Missing Twitch Credentials");
    // Return false instead of error to keep UI working gracefully
    return { statusCode: 200, headers, body: JSON.stringify({ isOnline: false }) };
  }

  try {
    // 1. Get App Access Token (Client Credentials Flow)
    const tokenUrl = `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`;
    const tokenRes = await fetch(tokenUrl, { method: 'POST' });
    
    if (!tokenRes.ok) {
        throw new Error(`Twitch Token Error: ${tokenRes.status}`);
    }
    
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Check Stream Status
    const streamUrl = `https://api.twitch.tv/helix/streams?user_login=${CHANNEL_NAME}`;
    const streamRes = await fetch(streamUrl, {
        headers: {
            'Client-ID': CLIENT_ID,
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!streamRes.ok) {
        throw new Error(`Twitch API Error: ${streamRes.status}`);
    }

    const streamData = await streamRes.json();
    
    // If data array is not empty, the stream is live
    const isOnline = streamData.data && streamData.data.length > 0;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ isOnline }),
    };

  } catch (error) {
    console.error("Stream Check Error:", error);
    return {
      statusCode: 200, // Return 200 even on error to prevent frontend crash
      headers,
      body: JSON.stringify({ isOnline: false }),
    };
  }
};
