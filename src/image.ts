import inter from "@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2";
import init, { Renderer } from "@takumi-rs/wasm";
import wasm from "@takumi-rs/wasm/auto";
import { createCard, type Card } from "./card";

export type ImageFormat = "png" | "webp" | "jpeg";

let renderer: Promise<Renderer> | undefined;

function getRenderer(): Promise<Renderer> {
  renderer ??= init({ module_or_path: wasm }).then(async () => {
    const instance = new Renderer();
    await instance.registerFont({ name: "Inter", data: inter });
    return instance;
  });
  return renderer;
}

export async function renderImage(card: Card, format: ImageFormat): Promise<Uint8Array> {
  const instance = await getRenderer();
  return instance.render(createCard(card), { width: 1200, height: 630, format });
}
