import type { Node } from "@takumi-rs/wasm";

export interface Card {
  title: string;
  description: string;
  site: string;
}

export const defaults: Card = {
  title: "Hello cf-ogimage",
  description: "Generate Open Graph images on Cloudflare Workers.",
  site: "Aaron212 / cf-ogimage",
};

export const limits: Record<keyof Card, number> = { title: 100, description: 220, site: 48 };

export function parseCard(params: URLSearchParams): Card {
  for (const key of params.keys()) {
    if (!Object.hasOwn(defaults, key)) {
      throw new Error(`Unknown parameter: ${key}`);
    }
  }

  const card = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof Card)[]) {
    const values = params.getAll(key);
    if (values.length > 1) {
      throw new Error(`Parameter ${key} must appear only once.`);
    }
    const value = values[0]?.trim() ?? defaults[key];
    if (!value || Array.from(value).length > limits[key]) {
      throw new Error(`Parameter ${key} must contain 1–${limits[key]} characters.`);
    }
    card[key] = value;
  }
  return card;
}

function block(style: NonNullable<Node["style"]>, children: Node[] | string): Node {
  return typeof children === "string"
    ? { type: "text", text: children, style }
    : { type: "container", style: { display: "flex", ...style }, children };
}

export function createCard(card: Card): Node {
  return block(
    {
      width: "100%",
      height: "100%",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: 64,
      backgroundColor: "oklch(0.2279 0.0102 259.81)",
      backgroundImage: "linear-gradient(180deg in oklch, oklch(0.2279 0.0102 259.81), oklch(62.3% 0.214 259.815))",
      color: "#fff",
      fontFamily: "Inter, Noto Sans SC",
      fontOpticalSizing: "auto",
      fontWeight: 400,
    },
    [
      block({ fontSize: 24, color: "#bbb" }, card.site),
      block({ flexDirection: "column", gap: 24, overflow: "hidden", flex: 1, justifyContent: "center" }, [
        block(
          {
            fontSize: card.title.length > 60 ? 48 : 64,
            fontWeight: 600,
            lineHeight: 1.12,
            wordBreak: "break-word",
          },
          card.title,
        ),
        block({ fontSize: 28, lineHeight: 1.4, color: "#fff", wordBreak: "break-word" }, card.description),
      ]),
    ],
  );
}
