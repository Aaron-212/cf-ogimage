import { parseCard } from "./card";
import { withCors } from "./cors";
import { renderImage, type ImageFormat } from "./image";

const imageFormats = new Map<string, ImageFormat>([
  ["/og.png", "png"],
  ["/og.webp", "webp"],
  ["/og.jpeg", "jpeg"],
]);

interface Env {
  IMAGE_CACHE_ENABLED: string;
}

async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD, OPTIONS" } });
  }
  if (url.pathname === "/") {
    url.pathname = "/og.png";
    return Response.redirect(url.toString(), 302);
  }
  const format = imageFormats.get(url.pathname);
  if (!format) {
    return new Response("Not found", { status: 404 });
  }

  let card;
  try {
    card = parseCard(url.searchParams);
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Invalid parameters", {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  url.search = new URLSearchParams({ ...card }).toString();
  const cacheKey = new Request(url.toString());
  const cache = env.IMAGE_CACHE_ENABLED === "false" ? undefined : caches.default;
  const cached = await cache?.match(cacheKey);
  if (cached) {
    const response = new Response(request.method === "HEAD" ? null : cached.body, cached);
    response.headers.set("X-Image-Cache", "HIT");
    return response;
  }

  try {
    const image = await renderImage(card, format);
    const response = new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": `image/${format}`,
        "Cache-Control": cache ? "public, max-age=3600" : "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
    if (cache) {
      ctx.waitUntil(cache.put(cacheKey, response.clone()).catch(console.error));
    }
    response.headers.set("X-Image-Cache", cache ? "MISS" : "BYPASS");
    return request.method === "HEAD" ? new Response(null, response) : response;
  } catch (error) {
    console.error("Image generation failed", error);
    return new Response("Image generation failed", { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export default {
  fetch(request, env, ctx) {
    return withCors(request, () => handleRequest(request, env, ctx));
  },
} satisfies ExportedHandler<Env>;
