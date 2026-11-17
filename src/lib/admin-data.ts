// Browser-side admin data access. Every write is enforced server-side by RLS + storage policies.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { GALLERY_BUCKET, checkImageFile } from "./site";

export type SiteSettingsRow = Tables<"site_settings">;
export type GalleryRow = Tables<"gallery_items"> & { url: string | null };

export const adminKeys = {
  role: (uid: string) => ["admin", "role", uid] as const,
  settings: ["admin", "settings"] as const,
  gallery: ["admin", "gallery"] as const,
  allowlist: ["admin", "allowlist"] as const,
};

export const isAdminQuery = (uid: string) =>
  queryOptions({
    queryKey: adminKeys.role(uid),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
      if (error) throw error;
      return data === true;
    },
  });

export const settingsQuery = queryOptions({
  queryKey: adminKeys.settings,
  queryFn: async () => {
    const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();
    if (error) throw error;
    return data;
  },
});

export async function signedUrls(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paths.length === 0) return map;
  const { data, error } = await supabase.storage.from(GALLERY_BUCKET).createSignedUrls(paths, 60 * 60);
  if (error) throw error;
  for (const d of data ?? []) if (d.path && d.signedUrl) map.set(d.path, d.signedUrl);
  return map;
}

export const galleryQuery = queryOptions({
  queryKey: adminKeys.gallery,
  queryFn: async (): Promise<GalleryRow[]> => {
    const { data, error } = await supabase
      .from("gallery_items")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    const urls = await signedUrls((data ?? []).map((r) => r.image_path));
    return (data ?? []).map((r) => ({ ...r, url: urls.get(r.image_path) ?? null }));
  },
});

export const allowlistQuery = queryOptions({
  queryKey: adminKeys.allowlist,
  queryFn: async () => {
    const { data, error } = await supabase.from("admin_allowlist").select("*").order("created_at");
    if (error) throw error;
    return data ?? [];
  },
});

export async function uploadImage(file: File, folder: "gallery" | "hero"): Promise<string> {
  const check = checkImageFile(file);
  if (!check.ok) throw new Error(check.error);
  const path = `${folder}/${crypto.randomUUID()}.${check.ext}`;
  const { error } = await supabase.storage.from(GALLERY_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(friendlyError(error.message));
  return path;
}

export async function removeImage(path: string) {
  const { error } = await supabase.storage.from(GALLERY_BUCKET).remove([path]);
  if (error) throw new Error(friendlyError(error.message));
}

export function friendlyError(msg: string): string {
  if (/row-level security|violates|permission|not authorized|unauthorized/i.test(msg)) {
    return "You don't have admin permission for that.";
  }
  if (/payload too large|exceeded the maximum/i.test(msg)) return "Image must be under 3 MB.";
  return msg;
}