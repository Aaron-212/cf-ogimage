function isAllowedOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return (
      origin === url.origin &&
      (url.protocol === "http:" || url.protocol === "https:") &&
      (url.hostname === "aaron212.com" ||
        url.hostname.endsWith(".aaron212.com") ||
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

export async function withCors(request: Request, handle: () => Promise<Response>): Promise<Response> {
  const origin = request.headers.get("Origin");
  if (origin !== null && !isAllowedOrigin(origin)) {
    return new Response("Origin not allowed", {
      status: 403,
      headers: { "Cache-Control": "no-store", Vary: "Origin" },
    });
  }

  let response: Response;
  if (request.method === "OPTIONS" && origin !== null) {
    const method = request.headers.get("Access-Control-Request-Method");
    if (method !== "GET" && method !== "HEAD") {
      response = new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD, OPTIONS", "Cache-Control": "no-store" },
      });
    } else {
      response = new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "no-store",
        },
      });
    }
  } else {
    response = await handle();
  }

  const result = new Response(response.body, response);
  result.headers.append("Vary", "Origin");
  if (origin !== null) {
    result.headers.set("Access-Control-Allow-Origin", origin);
    result.headers.set("Access-Control-Expose-Headers", "X-Image-Cache");
  }
  return result;
}
