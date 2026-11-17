// Shared, browser-safe site rules: link fields, URL/contract/image validation.

export const TOKEN = {
  name: "CraZyChilD",
  ticker: "CRZKD",
  network: "Solana",
} as const;

export const LINK_FIELDS = [
  { key: "telegram_url", label: "Telegram", placeholder: "https://t.me/yourgroup" },
  { key: "x_url", label: "X (Twitter)", placeholder: "https://x.com/yourhandle" },
  { key: "instagram_url", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { key: "tiktok_url", label: "TikTok", placeholder: "https://www.tiktok.com/@yourhandle" },
  { key: "dexscreener_url", label: "Dexscreener", placeholder: "https://dexscreener.com/solana/..." },
  { key: "pumpfun_url", label: "Pump.fun", placeholder: "https://pump.fun/coin/..." },
  { key: "buy_url", label: "Buy link", placeholder: "https://..." },
] as const;

export type LinkKey = (typeof LINK_FIELDS)[number]["key"];

export const MAX_URL_LENGTH = 500;
// Mirrors the database CHECK constraint on every link column.
const DB_URL_PATTERN = /^https:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(\/\S*)?$/;

export type UrlResult = { ok: true; value: string | null } | { ok: false; error: string };

/** Empty -> null (link hidden). Otherwise must be a plain https:// URL with a real domain. */
export function normalizeHttpsUrl(raw: string): UrlResult {
  const input = raw.trim();
  if (input === "") return { ok: true, value: null };
  if (/\s/.test(input)) return { ok: false, error: "Links can't contain spaces." };
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, error: "That doesn't look like a valid link." };
  }
  if (url.protocol !== "https:") return { ok: false, error: "Links must start with https://" };
  if (url.username || url.password) return { ok: false, error: "Links can't include a login." };
  if (url.port) return { ok: false, error: "Links can't include a port number." };
  const value = url.href;
  if (value.length > MAX_URL_LENGTH) return { ok: false, error: "That link is too long." };
  if (!DB_URL_PATTERN.test(value)) return { ok: false, error: "Use a full web address like https://example.com" };
  return { ok: true, value };
}

/** True only for links safe to render publicly. */
export function isSafeHttpsUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  const r = normalizeHttpsUrl(value);
  return r.ok && r.value !== null;
}

const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export type ContractResult = { ok: true; value: string | null } | { ok: false; error: string };

export function normalizeContract(raw: string): ContractResult {
  const v = raw.trim();
  if (v === "") return { ok: true, value: null };
  if (!SOLANA_ADDRESS.test(v)) {
    return { ok: false, error: "Enter a valid Solana address (32–44 letters/numbers, base58)." };
  }
  return { ok: true, value: v };
}

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ImageCheck = { ok: true; ext: string } | { ok: false; error: string };

export function checkImageFile(file: { type: string; size: number }): ImageCheck {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { ok: false, error: "Only JPG, PNG or WEBP images are allowed." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "Image must be under 3 MB." };
  if (file.size === 0) return { ok: false, error: "That file is empty." };
  return { ok: true, ext };
}

export const GALLERY_BUCKET = "gallery";

export type PublicSettings = {
  headline: string;
  slogan: string;
  description: string;
  contract_address: string | null;
  hero_image_url: string | null;
  links: Partial<Record<LinkKey, string>>;
};

export type PublicGalleryItem = { id: string; caption: string; url: string };

export type PublicSite = { settings: PublicSettings; gallery: PublicGalleryItem[] };