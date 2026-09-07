// Прозрачный прокси: пробрасывает запросы фронтенда на Netlify Functions и обратно.
// Нужен для пользователей из РФ, где netlify.app бывает заблокирован —
// они обращаются к воркеру на *.workers.dev, а он уже сам ходит на Netlify.

const NETLIFY_ORIGIN = "https://gamelxrd.netlify.app";

// Постеры/обложки грузятся браузером напрямую с этих CDN, которые в РФ
// бывают заблокированы отдельно от netlify.app. /img проксирует их через воркер.
const ALLOWED_IMAGE_HOSTS = new Set(["image.tmdb.org", "media.rawg.io"]);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function handleImageProxy(url) {
  const src = url.searchParams.get("src");
  if (!src) {
    return new Response("Missing src", { status: 400, headers: CORS_HEADERS });
  }

  let target;
  try {
    target = new URL(src);
  } catch {
    return new Response("Invalid src", { status: 400, headers: CORS_HEADERS });
  }

  if (!ALLOWED_IMAGE_HOSTS.has(target.hostname)) {
    return new Response("Host not allowed", { status: 403, headers: CORS_HEADERS });
  }

  let upstream;
  try {
    upstream = await fetch(target.toString(), { cf: { cacheTtl: 86400, cacheEverything: true } });
  } catch {
    return new Response("Upstream unreachable", { status: 502, headers: CORS_HEADERS });
  }

  const headers = new Headers(upstream.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Cache-Control", "public, max-age=86400");

  return new Response(upstream.body, { status: upstream.status, headers });
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/img") {
      return handleImageProxy(url);
    }

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
