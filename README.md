# cf-ogimage

Generate 1200 × 630 Open Graph preview images in PNG, WebP, or JPEG from text on Cloudflare Workers.
This starter uses Takumi WebAssembly without a browser or remote asset fetches.

## Run locally

Install [mise](https://mise.jdx.dev/getting-started.html), then run these commands from the project directory:

```sh
mise trust
mise install
mise exec -- pnpm install
mise exec -- pnpm dev
```

Open `http://localhost:8787/og.png?title=Hello%20world` and confirm that you see a PNG card.
The root URL redirects to `/og.png`.
Use `/og.webp` with the same query parameters to get a lossless WebP image instead.
Use `/og.jpeg` for JPEG with Takumi's default quality.

## Customize the image

Use these optional query parameters:

- `title`: 1–100 Unicode code points. Defaults to `cf-ogimage`.
- `description`: 1–220 Unicode code points. Defaults to `Generate Open Graph images on Cloudflare Workers.`
- `site`: 1–48 Unicode code points. Defaults to `Aaron-212 / cf-ogimage`.

Values are trimmed. Empty values, duplicate parameters, and unknown parameters return HTTP 400.
The endpoint accepts GET and HEAD requests. HEAD follows the same render/cache path but returns no body.

Browser CORS requests are allowed from HTTP or HTTPS origins on `aaron212.com`, its subdomains, `localhost`, and `127.0.0.1`,
on any port. Other `Origin` values, including `null`, return HTTP 403.
Requests without an `Origin` header remain available for direct links and social preview crawlers.
OPTIONS preflights allow GET and HEAD with the `Content-Type` request header.

For example, request a card with a title and site label:

```text
http://localhost:8787/og.png?title=Hello%20world&site=example.com
```

Edit `src/card.ts` to change the fixed light template. Image requests have no device color-scheme information.
One Inter Latin variable font is bundled through Fontsource and registered once per Worker isolate.
Its weight axis supplies regular body text (400) and bold titles (700). Workers has no installed system fonts.
Chinese, other scripts, and emoji require additional bundled fonts or assets.
Long text wraps within a fixed content area; text beyond that area is clipped.

## Caching and performance

`pnpm dev` sets `IMAGE_CACHE_ENABLED=false`, bypasses Cache API reads and writes, and sends `Cache-Control: no-store`.
If your browser already cached an image, force a reload once after restarting the dev server.

Production images use a one-hour browser cache lifetime and the Workers Cache API.
Equivalent requests share a canonical cache key, including omitted defaults and reordered parameters.
Each image format has separate cache entries.
`X-Image-Cache` reports `HIT`, `MISS`, or `BYPASS`. Cache storage is local to each Cloudflare data center.
Cache writes run after the response and can fail without failing the image request.

The initialized Takumi renderer and its registered font are reused within each Worker isolate.
The endpoints return PNG (`/og.png`), lossless WebP (`/og.webp`), or JPEG (`/og.jpeg`).

Generation latency has not been benchmarked. Measure cold renders, warm renders, and cache hits on a deployed Worker
before choosing a latency budget. PNG rendering can exceed the Workers Free CPU allowance; use a paid plan if needed.

## Check the project

Run formatting, linting, and type checking:

```sh
mise exec -- pnpm check
```

To apply formatting, run `mise exec -- pnpm format`.
There is no separate build command; Wrangler bundles the Worker during development and deployment.

## Deploy

Authenticate Wrangler with your Cloudflare account:

```sh
mise exec -- pnpm exec wrangler login
```

Deploy to production:

```sh
mise exec -- pnpm deploy
```

To deploy a preview, run the following command and follow Wrangler's preview configuration prompts:

```sh
mise exec -- pnpm preview
```

The scripts run `wrangler deploy` and `wrangler preview`, respectively.
Use the returned URL with `/og.png?title=Hello%20world` to verify the deployment.

## License

Project code is MIT licensed. Inter is distributed under the SIL Open Font License through `@fontsource-variable/inter`.
Takumi retains its own dependency licenses.
