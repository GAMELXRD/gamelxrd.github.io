// Прозрачный прокси: пробрасывает запросы фронтенда на Netlify Functions и обратно.
// Нужен для пользователей из РФ, где netlify.app бывает заблокирован —
// они обращаются к воркеру на *.workers.dev, а он уже сам ходит на Netlify.

const NETLIFY_ORIGIN = "https://gamelxrd.netlify.app";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const targetUrl = new URL(
      "/.netlify/functions" + url.pathname + url.search,
      NETLIFY_ORIGIN
    );

    const forwardHeaders = new Headers();
    const contentType = request.headers.get("content-type");
    if (contentType) forwardHeaders.set("content-type", contentType);

    const init = {
      method: request.method,
      headers: forwardHeaders,
    };
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = await request.arrayBuffer();
    }

    let upstream;
    try {
      upstream = await fetch(targetUrl.toString(), init);
    } catch (err) {
      return new Response(JSON.stringify({ error: "Upstream unreachable" }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const responseHeaders = new Headers(upstream.headers);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      responseHeaders.set(key, value);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  },
};
