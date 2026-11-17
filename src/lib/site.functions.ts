import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  GALLERY_BUCKET,
  LINK_FIELDS,
  isSafeHttpsUrl,
  type LinkKey,
  type PublicSite,
} from "./site";

const SIGNED_URL_SECONDS = 60 * 60 * 6;

// Public, read-only: site settings + gallery. Uses the publishable key, so RLS applies.
export const getPublicSite = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicSite> => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabase = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
            h.delete("Authorization");
          }
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const [settingsRes, galleryRes] = await Promise.all([
      supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      supabase
        .from("gallery_items")
        .select("id, caption, image_path, sort_order, created_at")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(200),
    ]);

    if (settingsRes.error || galleryRes.error) {
      console.error("getPublicSite failed", settingsRes.error ?? galleryRes.error);
      throw new Error("Could not load the site right now.");
    }

    const s = settingsRes.data;
    const rows = galleryRes.data ?? [];
    const paths = rows.map((r) => r.image_path);
    if (s?.hero_image_path) paths.push(s.hero_image_path);

    const urlByPath = new Map<string, string>();
    if (paths.length > 0) {
      const { data: signed, error } = await supabase.storage
        .from(GALLERY_BUCKET)
        .createSignedUrls(paths, SIGNED_URL_SECONDS);
      if (error) console.error("signed urls failed", error);
      // Signed URLs come back on the server-side backend URL; rewrite to the browser-facing one.
      const serverBase = (process.env["SUPABASE_URL"] ?? "").replace(/\/+$/, "");
      const publicBase = (import.meta.env['VITE_SUPABASE_URL'] ?? serverBase).replace(/\/+$/, "");
      for (const item of signed ?? []) {
        if (item.path && item.signedUrl) {
          const u = item.signedUrl.startsWith(serverBase)
            ? publicBase + item.signedUrl.slice(serverBase.length)
            : item.signedUrl;
          urlByPath.set(item.path, u);
        }
      }
    }

    const links: Partial<Record<LinkKey, string>> = {};
    for (const f of LINK_FIELDS) {
      const v = s?.[f.key];
      if (isSafeHttpsUrl(v)) links[f.key] = v;
    }

    return {
      settings: {
        headline: s?.headline ?? "SMALL HUMAN. BIG CHAOS.",
        slogan: s?.slogan ?? "TOO CRAZY TO GROW UP!",
        description: s?.description ?? "",
        contract_address: s?.contract_address ?? null,
        hero_image_url: s?.hero_image_path ? (urlByPath.get(s.hero_image_path) ?? null) : null,
        links,
      },
      gallery: rows
        .map((r) => ({ id: r.id, caption: r.caption, url: urlByPath.get(r.image_path) ?? "" }))
        .filter((g) => g.url !== ""),
    };
  },
);