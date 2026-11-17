import { useEffect, useRef, useState } from "react";
import { Music2, Pause, Play, Repeat2, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Track = {
  id: string; title: string; audio_path: string; duration_seconds: number;
  is_preview: boolean; sort_order: number; signedUrl: string;
};
const musicDb = supabase as any;
function stamp(n: number) {const x=Math.floor(Math.max(0,n)||0);return Math.floor(x/60)+":"+String(x%60).padStart(2,"0");}
export function Music() {
  const ref = useRef<HTMLAudioElement>(null);
  const [tracks,setTracks]=useState<Track[]>([]);
  const [index,setIndex]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [loop,setLoop]=useState(false);
  const [volume,setVolume]=useState(0.85);
  const [progress,setProgress]=useState(0);
  const [duration,setDuration]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const current=tracks[index]??null;
  useEffect(()=>{let live=true;(async()=>{
    try{
      const {data,error}=await musicDb.from("music_tracks").select("id,title,audio_path,duration_seconds,is_preview,sort_order").eq("is_published",true).order("sort_order");
      if(error)throw error;
      const found:Track[]=[];
      for(const t of data??[]){
        const {data:link,error:e}=await supabase.storage.from("crzkd-music").createSignedUrl(t.audio_path,21600);
        if(!e&&link?.signedUrl)found.push({...t,signedUrl:link.signedUrl});
      }
      if(live)setTracks(found);
    }catch(e){if(live)setError("Unable to load the music playlist.");}
    finally{if(live)setLoading(false);}
  })();return()=>{live=false;};},[]);
  useEffect(()=>{const a=ref.current;if(!a||!current)return;a.pause();a.src=current.signedUrl;a.loop=loop;a.volume=volume;a.load();setPlaying(false);setProgress(0);setDuration(current.duration_seconds);},[current?.id]);
  useEffect(()=>{if(ref.current)ref.current.volume=volume;},[volume]);
  useEffect(()=>{if(ref.current)ref.current.loop=loop;},[loop]);
  async function toggle(){const a=ref.current;if(!a||!current)return;if(!a.paused){a.pause();return;}try{await a.play();setError("");}catch{setError("Playback blocked. Tap Play again.");}}
  function choose(n:number){ref.current?.pause();setPlaying(false);setIndex((n+tracks.length)%tracks.length);}
  return <section id="music" aria-labelledby="music-title" className="relative overflow-hidden bg-background px-4 py-20 sm:px-6 md:py-28">
    <div className="mx-auto max-w-6xl">
      <p className="font-marker text-xl text-secondary">the sound of chaos</p>
      <h2 id="music-title" className="mt-2 font-display text-[clamp(2.2rem,7vw,4rem)] leading-none">
        CraZyChilD <span className="text-primary">Radio</span>
      </h2>
      <p className="mt-4 max-w-2xl text-muted-foreground">Too Crazy To Grow Up! Hit Play and make some noise.</p>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="rounded-3xl border-2 border-ink bg-card p-6 shadow-hard-pink sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-ink bg-secondary text-secondary-foreground"><Music2 size={30} aria-hidden="true"/></span>
            <h3 className="font-display text-xl uppercase">Radio $CRZKD</h3>
          </div>
          <p className="mt-6 font-marker text-2xl text-accent">{current?.title??"No songs published yet"}</p>
          {current?.is_preview?<span className="mt-2 inline-block rounded-md bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">PREVIEW / CUPLIKAN</span>:null}
          <audio ref={ref} preload="metadata"
            onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}
            onTimeUpdate={e=>setProgress(e.currentTarget.currentTime)}
            onLoadedMetadata={e=>setDuration(Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:current?.duration_seconds??0)}
            onEnded={()=>{setPlaying(false);if(!loop&&tracks.length>1)choose(index+1);}}
            onError={()=>setError("Audio unavailable. Try again later.")}
          />
          <label className="mt-8 block text-xs text-muted-foreground">Song position
            <input className="mt-2 w-full accent-primary" aria-label="Seek in song" type="range" min={0} max={duration||1} value={Math.min(progress,duration||1)} step={0.1} disabled={!current}
             onChange={e=>{if(ref.current)ref.current.currentTime=Number(e.target.value);}}/>
          </label>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{stamp(progress)}</span><span>{stamp(duration)}</span></div>
          <div className="mt-6 flex items-center justify-center gap-4">
            <button className="rounded-xl border-2 border-border p-3 disabled:opacity-30" aria-label="Previous song" disabled={!current} onClick={()=>choose(index-1)}><SkipBack/></button>
            <button className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-ink bg-primary text-primary-foreground shadow-hard-pink disabled:opacity-30" aria-label={playing?"Pause":"Play"} disabled={!current} onClick={toggle}>{playing?<Pause size={28}/>:<Play size={28}/>}</button>
            <button className="rounded-xl border-2 border-border p-3 disabled:opacity-30" aria-label="Next song" disabled={!current} onClick={()=>choose(index+1)}><SkipForward/></button>
            <button className={"rounded-xl border-2 p-3 "+(loop?"border-primary text-primary":"border-border")} aria-label="Repeat track" aria-pressed={loop} onClick={()=>setLoop(!loop)}><Repeat2/></button>
          </div>
          <label className="mt-7 flex items-center justify-center gap-3 text-sm text-muted-foreground"><Volume2 size={18}/> Volume
            <input type="range" className="max-w-44 accent-primary" min={0} max={1} step={0.05} value={volume} onChange={e=>setVolume(Number(e.target.value))}/>
          </label>
          <p aria-live="polite" className="mt-5 text-center text-sm text-muted-foreground">
            {loading?"Loading playlist…":error||(!tracks.length?"Music has not been uploaded by the owner yet.":"Tap Play to listen.")}
          </p>
        </div>
        <div className="rounded-3xl border-2 border-ink bg-card p-6 shadow-hard-lime">
          <h3 className="font-display text-xl uppercase">Playlist</h3>
          {tracks.length?<ol className="mt-5 space-y-3">{tracks.map((t,n)=><li key={t.id}>
            <button onClick={()=>choose(n)} className={"w-full rounded-xl border-2 px-4 py-4 text-left transition hover:rotate-[-1deg] "+(index===n?"border-ink bg-accent text-accent-foreground":"border-border bg-background")}>
              <span className="mr-3 font-display">{String(n+1).padStart(2,"0")}</span>{t.title}{t.is_preview?<small className="ml-2 opacity-70">(preview)</small>:null}
            </button>
          </li>)}</ol>:<p className="mt-6 text-muted-foreground">Our anthems are coming soon.</p>}
          <p className="mt-7 text-xs text-muted-foreground">Audio never autoplays. You control the sound.</p>
        </div>
      </div>
    </div>
  </section>;
}
