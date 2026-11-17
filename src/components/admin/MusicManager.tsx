import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "./Panel";

type Track = { id: string; title: string; audio_path: string; is_preview: boolean; is_published: boolean; sort_order: number };
const db = supabase as unknown as SupabaseClient;
const MAX = 15 * 1024 * 1024;

function duration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    const url = URL.createObjectURL(file);
    const finish = (n: number) => { URL.revokeObjectURL(url); resolve(Math.max(1, Math.ceil(n || 1))); };
    audio.onloadedmetadata = () => finish(Number.isFinite(audio.duration) ? audio.duration : 1);
    audio.onerror = () => finish(1);
    audio.preload = "metadata";
    audio.src = url;
  });
}

export function MusicManager() {
  const [items, setItems] = useState<Track[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    const { data, error } = await db.from("music_tracks").select("*").order("sort_order", { ascending: true });
    if (error) { setMessage(error.message); return; }
    setItems((data ?? []) as Track[]);
  }
  useEffect(() => { void refresh(); }, []);

  async function upload() {
    if (!file || !title.trim()) return setMessage("Enter a title and choose an MP3 file.");
    if (file.size <= 0 || file.size > MAX || !file.name.toLowerCase().endsWith(".mp3"))
      return setMessage("MP3 files only, maximum 15 MB.");
    setBusy(true); setMessage("Uploading MP3…");
    const path = "music/" + crypto.randomUUID() + ".mp3";
    try {
      const { error: uploadError } = await supabase.storage.from("crzkd-music")
        .upload(path, file, { contentType: "audio/mpeg", upsert: false });
      if (uploadError) throw uploadError;
      const { error } = await db.from("music_tracks").insert({
        title: title.trim().slice(0, 160),
        audio_path: path,
        duration_seconds: await duration(file),
        is_preview: preview,
        is_published: true,
        sort_order: items.length,
      });
      if (error) {
        await supabase.storage.from("crzkd-music").remove([path]).catch(() => null);
        throw error;
      }
      setMessage("Song uploaded and published to the music player.");
      setTitle(""); setFile(null); setPreview(false);
      const input = document.getElementById("music-file") as HTMLInputElement | null;
      if (input) input.value = "";
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed"); }
    finally { setBusy(false); }
  }

  async function update(item: Track, published: boolean) {
    const { error } = await db.from("music_tracks").update({ is_published: published }).eq("id", item.id);
    setMessage(error ? error.message : "Visibility updated.");
    if (!error) await refresh();
  }
  async function remove(item: Track) {
    if (!confirm("Delete this song from the website?")) return;
    const { error } = await db.from("music_tracks").delete().eq("id", item.id);
    if (error) return setMessage(error.message);
    await supabase.storage.from("crzkd-music").remove([item.audio_path]);
    setMessage("Song deleted."); await refresh();
  }

  return (
    <div className="space-y-6">
      <Panel title="Music & playlist" description="Upload official songs directly from your Android phone. Visitors can play them after upload.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="music-title">Song title</Label>
            <Input id="music-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Too Crazy To Grow Up" maxLength={160} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="music-file">Choose MP3 (15 MB max)</Label>
            <Input id="music-file" type="file" accept=".mp3,audio/mpeg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} /> This song is a preview</label>
        <Button onClick={() => void upload()} disabled={busy || !file || !title.trim()} className="mt-4">{busy ? "Uploading…" : "Upload & publish music"}</Button>
        {message ? <p className="mt-3 text-sm" role="status">{message}</p> : null}
      </Panel>
      <Panel title={"Published playlist (" + items.length + ")"} description="Hide, show or delete uploaded music.">
        {items.length === 0 ? <p className="text-sm text-muted-foreground">No music yet. Upload the two MP3 files above.</p> :
          <ul className="space-y-3">{items.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
            <div><strong>{item.title}</strong><p className="text-xs text-muted-foreground">{item.is_preview ? "Preview" : "Full track"} · {item.is_published ? "Published" : "Hidden"}</p></div>
            <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => void update(item, !item.is_published)}>{item.is_published ? "Hide" : "Publish"}</Button><Button variant="destructive" size="sm" onClick={() => void remove(item)}>Delete</Button></div>
          </li>)}</ul>}
      </Panel>
    </div>
  );
}
