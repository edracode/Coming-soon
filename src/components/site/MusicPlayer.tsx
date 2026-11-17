import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Track = { id: string; title: string; audio_path: string; is_preview: boolean; url: string };
const db = supabase as unknown as SupabaseClient;
// Bundled official audio ships with the site. Supabase tracks extend this playlist
// without requiring the owner to re-upload the two original songs.
const BUNDLED_TRACKS: Track[] = [
  { id: "official-crzkd-1", title: "Too Crazy To Grow Up", audio_path: "/audio/01-Too-Crazy-To-Grow-Up.mp3", is_preview: false, url: "/audio/01-Too-Crazy-To-Grow-Up.mp3" },
  { id: "official-crzkd-2", title: "Small Human, Big Chaos", audio_path: "/audio/02-Small-Human-Big-Chaos-PREVIEW.mp3", is_preview: true, url: "/audio/02-Small-Human-Big-Chaos-PREVIEW.mp3" },
];

export function MusicPlayer() {
  const [tracks, setTracks] = useState<Track[]>(BUNDLED_TRACKS);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState("Tap Play to listen.");
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  async function loadTracks() {
    setStatus("Loading official music…");
    try {
      const { data, error } = await db.from("music_tracks")
        .select("id,title,audio_path,is_preview,sort_order")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as Omit<Track, "url">[];
      if (rows.length === 0) { setTracks(BUNDLED_TRACKS); setStatus("Tap Play to listen."); return; }
      const { data: signed, error: signedError } = await supabase.storage.from("crzkd-music")
        .createSignedUrls(rows.map((row) => row.audio_path), 3600);
      if (signedError) throw signedError;
      const urls = new Map((signed ?? []).filter((item) => item.signedUrl)
        .map((item) => [item.path, item.signedUrl]));
      const valid = rows.map((row) => ({ ...row, url: urls.get(row.audio_path) ?? "" }))
        .filter((row) => row.url);
      setTracks([...BUNDLED_TRACKS, ...valid]);
      setStatus("Tap Play to listen.");
    } catch {
      setTracks(BUNDLED_TRACKS); setStatus("Tap Play to listen.");
    }
  }

  useEffect(() => { void loadTracks(); }, []);

  async function playTrack(next: number) {
    const audio = audioRef.current;
    if (!audio || tracks.length === 0) return;
    const target = (next + tracks.length) % tracks.length;
    setIndex(target);
    const row = tracks[target]!;
    const resolved = new URL(row.url, document.baseURI).href;
    if (audio.src !== resolved) audio.src = resolved;
    try {
      await audio.play();
      setPlaying(true);
      setStatus("Now playing");
    } catch {
      setPlaying(false);
      setStatus("Tap Play again to enable sound.");
    }
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || tracks.length === 0) return;
    if (audio.paused) void playTrack(index);
    else { audio.pause(); setPlaying(false); setStatus("Paused"); }
  }

  function onEnded() {
    setPlaying(false);
    if (index + 1 < tracks.length) void playTrack(index + 1);
    else if (loop) void playTrack(0);
  }

  return (
    <div className="fixed bottom-4 left-4 z-[1000001] font-body sm:bottom-6 sm:left-6">
      <audio ref={audioRef} preload="none" onEnded={onEnded} onError={() => setStatus("Audio could not load. Refresh the playlist.")} />
      {open ? (
        <section aria-label="CraZyChilD music player" className="mb-3 w-[min(350px,calc(100vw-32px))] rounded-2xl border-[3px] border-black bg-card p-4 text-card-foreground shadow-hard-pink">
          <h2 className="font-display text-xl uppercase">♫ CraZyChilD Radio</h2>
          <p className="mt-2 text-xs text-muted-foreground" role="status">{status}</p>
          <p className="mt-3 min-h-6 font-bold">{tracks[index]?.title ?? "Music"}</p>
          <div className="mt-3 flex items-center gap-2">
            <button aria-label="Previous track" type="button" onClick={() => void playTrack(index - 1)} disabled={!tracks.length} className="rounded-xl border-2 border-ink bg-accent px-3 py-2 font-bold text-ink disabled:opacity-40">⏮</button>
            <button aria-label={playing ? "Pause" : "Play"} type="button" onClick={togglePlay} disabled={!tracks.length} className="rounded-xl border-2 border-ink bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-40">{playing ? "⏸" : "▶"}</button>
            <button aria-label="Next track" type="button" onClick={() => void playTrack(index + 1)} disabled={!tracks.length} className="rounded-xl border-2 border-ink bg-accent px-3 py-2 font-bold text-ink disabled:opacity-40">⏭</button>
            <input aria-label="Music volume" type="range" min="0" max="1" step=".05" defaultValue=".8" onChange={(e) => { if (audioRef.current) audioRef.current.volume = Number(e.target.value); }} className="min-w-0 flex-1 accent-primary" />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <label className="flex items-center gap-1"><input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> Loop playlist</label>
            <button type="button" className="underline" onClick={() => { audioRef.current?.pause(); setPlaying(false); void loadTracks(); }}>Refresh</button>
          </div>
          <ul className="mt-3 max-h-44 space-y-1 overflow-y-auto">
            {tracks.map((track, i) => <li key={track.id}>
              <button type="button" aria-current={index === i ? "true" : undefined} onClick={() => void playTrack(i)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left text-sm aria-[current=true]:border-primary aria-[current=true]:text-primary">{i + 1}. {track.title}{track.is_preview ? " · Preview" : ""}</button>
            </li>)}
          </ul>
        </section>
      ) : null}
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="rounded-2xl border-[3px] border-ink bg-primary px-4 py-3 font-display text-base uppercase text-primary-foreground shadow-hard-pink">
        ♫ {open ? "Close music" : "Music"}
      </button>
    </div>
  );
}
