import { useEffect, useState } from "react";
import { Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "./Panel";

const db = supabase as any;
type Track = {id:string;title:string;audio_path:string;duration_seconds:number;is_preview:boolean;sort_order:number;is_published:boolean;};
function humanError(e:any){return e instanceof Error?e.message:String(e?.message??e);}
export function MusicManager(){
  const [list,setList]=useState<Track[]>([]);
  const [file,setFile]=useState<File|null>(null);
  const [title,setTitle]=useState("");
  const [preview,setPreview]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  async function refresh(){
    const {data,error}=await db.from("music_tracks").select("*").order("sort_order");
    if(error)throw error;setList(data??[]);
  }
  useEffect(()=>{refresh().catch(e=>setError(humanError(e)));},[]);
  async function upload(){
    if(!file||!title.trim())return;
    if(file.type!=="audio/mpeg"&&!file.name.toLowerCase().endsWith(".mp3")){toast.error("Select an MP3 file.");return;}
    if(file.size>15*1024*1024){toast.error("Maximum 15 MB per MP3.");return;}
    setBusy(true);setError("");
    const path="tracks/"+crypto.randomUUID()+".mp3";
    try{
      const seconds=await durationOf(file);
      const {error:e}=await supabase.storage.from("crzkd-music").upload(path,file,{contentType:"audio/mpeg",cacheControl:"3600",upsert:false});
      if(e)throw e;
      const {error:saveError}=await db.from("music_tracks").insert({title:title.trim(),audio_path:path,duration_seconds:Math.round(seconds),is_preview:preview,is_published:true,sort_order:list.length});
      if(saveError){await supabase.storage.from("crzkd-music").remove([path]);throw saveError;}
      setFile(null);setTitle("");setPreview(false);toast.success("Song uploaded and published!");await refresh();
    }catch(e){toast.error(humanError(e));}finally{setBusy(false);}
  }
  async function toggle(t:Track){
    const {error}=await db.from("music_tracks").update({is_published:!t.is_published}).eq("id",t.id);
    if(error)toast.error(humanError(error));else{toast.success("Track updated");await refresh();}
  }
  async function remove(t:Track){
    if(!confirm("Delete this track permanently?"))return;
    const {error}=await db.from("music_tracks").delete().eq("id",t.id);
    if(error){toast.error(humanError(error));return;}
    await supabase.storage.from("crzkd-music").remove([t.audio_path]);
    toast.success("Song deleted");await refresh();
  }
  return <div className="space-y-6">
    <Panel title="Upload an anthem" description="Upload MP3 to Supabase Storage. Published songs appear on the public Music section.">
      <div className="space-y-4">
        <div><Label htmlFor="track-title">Song title</Label><Input id="track-title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Too Crazy To Grow Up"/></div>
        <div><Label htmlFor="track-audio">MP3 file (15 MB max)</Label><input id="track-audio" type="file" accept="audio/mpeg,.mp3" className="mt-2 block w-full text-sm" onChange={e=>setFile(e.target.files?.[0]??null)}/></div>
        <label className="flex items-center gap-3"><input type="checkbox" checked={preview} onChange={e=>setPreview(e.target.checked)}/>Mark as preview / excerpt</label>
        <Button variant="hero" disabled={busy||!file||!title.trim()} onClick={upload}>{busy?<Loader2 className="animate-spin"/>:<UploadCloud/>} Publish music</Button>
        {error&&<p role="alert" className="text-destructive">{error}</p>}
      </div>
    </Panel>
    <Panel title={"Music library ("+list.length+")"} description="Publish, hide or delete your songs.">
      {!list.length?<p className="text-muted-foreground">No songs yet — add the two CraZyChilD MP3 files above.</p>:<ul className="space-y-3">{list.map(t=><li key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
        <div><p className="font-bold">{t.title}</p><p className="text-xs text-muted-foreground">{t.duration_seconds}s {t.is_preview?"• Preview":""} • {t.is_published?"Public":"Hidden"}</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={()=>toggle(t)}>{t.is_published?"Hide":"Publish"}</Button>
          <Button variant="outline" size="icon" aria-label="Delete song" onClick={()=>remove(t)}><Trash2 size={18}/></Button>
        </div>
      </li>)}</ul>}
    </Panel>
  </div>;
}
async function durationOf(file:File):Promise<number>{
  return new Promise((resolve)=>{
    const audio=document.createElement("audio"); const url=URL.createObjectURL(file);
    audio.preload="metadata";
    const finish=(n:number)=>{URL.revokeObjectURL(url);audio.remove();resolve(Number.isFinite(n)&&n>0?n:1);};
    audio.onloadedmetadata=()=>finish(audio.duration);
    audio.onerror=()=>finish(1);
    audio.src=url;
  });
}
