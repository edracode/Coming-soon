import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Save, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminKeys, friendlyError, galleryQuery, removeImage, uploadImage, type GalleryRow } from "@/lib/admin-data";
import { ImagePicker } from "./ImagePicker";
import { ErrorBlock, LoadingBlock, Panel } from "./Panel";

export function GalleryManager({ heroPath }: { heroPath: string | null }) {
  const qc = useQueryClient();
  const gallery = useQuery(galleryQuery);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");

  const refresh = () => {
    qc.invalidateQueries({ queryKey: adminKeys.gallery });
    qc.invalidateQueries({ queryKey: ["public-site"] });
  };

  const add = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose an image first.");
      const path = await uploadImage(file, "gallery");
      const maxOrder = Math.max(-1, ...(gallery.data ?? []).map((g) => g.sort_order));
      const { error } = await supabase
        .from("gallery_items")
        .insert({ image_path: path, caption: caption.trim().slice(0, 140), sort_order: maxOrder + 1 });
      if (error) {
        await removeImage(path).catch(() => undefined);
        throw new Error(friendlyError(error.message));
      }
    },
    onSuccess: () => {
      setFile(null);
      setCaption("");
      toast.success("Sticker added to the gallery");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: async ({ index, dir }: { index: number; dir: -1 | 1 }) => {
      const items = [...(gallery.data ?? [])];
      const target = index + dir;
      if (target < 0 || target >= items.length) return;
      const a = items[index]!;
      const b = items[target]!;
      items[index] = b;
      items[target] = a;
      const updates = items
        .map((it, i) => ({ id: it.id, sort_order: i, changed: it.sort_order !== i }))
        .filter((u) => u.changed);
      const results = await Promise.all(
        updates.map((u) => supabase.from("gallery_items").update({ sort_order: u.sort_order }).eq("id", u.id)),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw new Error(friendlyError(failed.error.message));
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <Panel title="Add a sticker" description="Upload a photo or meme. It appears on the public gallery right away.">
        <div className="grid gap-5 md:grid-cols-[1fr_1fr] md:items-start">
          <ImagePicker file={file} onChange={setFile} />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-caption">Caption (optional)</Label>
              <Input id="new-caption" value={caption} maxLength={140} onChange={(e) => setCaption(e.target.value)} placeholder="Too crazy to grow up!" />
            </div>
            <Button variant="hero" disabled={!file || add.isPending} onClick={() => add.mutate()}>
              {add.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
              Upload to gallery
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title={`Gallery (${gallery.data?.length ?? 0})`} description="Edit captions, change the order, set a hero photo or delete.">
        {gallery.isPending ? (
          <LoadingBlock label="Loading gallery…" />
        ) : gallery.isError ? (
          <ErrorBlock message="Couldn't load the gallery." onRetry={() => gallery.refetch()} />
        ) : gallery.data.length === 0 ? (
          <p className="py-6 text-muted-foreground">No stickers yet. Upload your first one above.</p>
        ) : (
          <ul className="space-y-4">
            {gallery.data.map((item, i) => (
              <GalleryRowItem
                key={item.id}
                item={item}
                index={i}
                total={gallery.data.length}
                isHero={heroPath === item.image_path}
                moving={move.isPending}
                onMove={(dir) => move.mutate({ index: i, dir })}
                onChanged={refresh}
              />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function GalleryRowItem({
  item,
  index,
  total,
  isHero,
  moving,
  onMove,
  onChanged,
}: {
  item: GalleryRow;
  index: number;
  total: number;
  isHero: boolean;
  moving: boolean;
  onMove: (dir: -1 | 1) => void;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const [caption, setCaption] = useState(item.caption);
  const dirty = caption !== item.caption;

  const saveCaption = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("gallery_items").update({ caption: caption.trim().slice(0, 140) }).eq("id", item.id);
      if (error) throw new Error(friendlyError(error.message));
    },
    onSuccess: () => {
      toast.success("Caption saved");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (isHero) {
        const { error: hErr } = await supabase.from("site_settings").update({ hero_image_path: null }).eq("id", 1);
        if (hErr) throw new Error(friendlyError(hErr.message));
      }
      const { error } = await supabase.from("gallery_items").delete().eq("id", item.id);
      if (error) throw new Error(friendlyError(error.message));
      await removeImage(item.image_path).catch(() => undefined);
    },
    onSuccess: () => {
      toast.success("Sticker deleted");
      qc.invalidateQueries({ queryKey: adminKeys.settings });
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const makeHero = useMutation({
    mutationFn: async () => {
      const { data: s } = await supabase.from("site_settings").select("hero_image_path").eq("id", 1).single();
      const { error } = await supabase.from("site_settings").update({ hero_image_path: item.image_path }).eq("id", 1);
      if (error) throw new Error(friendlyError(error.message));
      if (s?.hero_image_path?.startsWith("hero/")) await removeImage(s.hero_image_path).catch(() => undefined);
    },
    onSuccess: () => {
      toast.success("Hero photo updated");
      qc.invalidateQueries({ queryKey: adminKeys.settings });
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const captionId = `caption-${item.id}`;

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-border bg-background p-3 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        {item.url ? (
          <img src={item.url} alt={item.caption || "Gallery image"} className="h-24 w-24 rounded-lg border-2 border-ink object-cover" loading="lazy" />
        ) : (
          <div className="grid h-24 w-24 place-items-center rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground">No preview</div>
        )}
        {isHero ? (
          <span className="absolute -left-2 -top-2 rounded-md border-2 border-ink bg-primary px-1.5 py-0.5 font-display text-[10px] uppercase text-primary-foreground">Hero</span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor={captionId} className="sr-only">Caption</Label>
        <div className="flex gap-2">
          <Input id={captionId} value={caption} maxLength={140} placeholder="Add a caption" onChange={(e) => setCaption(e.target.value)} />
          <Button size="icon" variant="outline" disabled={!dirty || saveCaption.isPending} onClick={() => saveCaption.mutate()} aria-label="Save caption">
            {saveCaption.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="icon" variant="outline" disabled={index === 0 || moving} onClick={() => onMove(-1)} aria-label="Move up">
          <ArrowUp aria-hidden="true" />
        </Button>
        <Button size="icon" variant="outline" disabled={index === total - 1 || moving} onClick={() => onMove(1)} aria-label="Move down">
          <ArrowDown aria-hidden="true" />
        </Button>
        <Button size="sm" variant="outline" disabled={isHero || makeHero.isPending} onClick={() => makeHero.mutate()}>
          <Star aria-hidden="true" /> {isHero ? "Hero" : "Set as hero"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="destructive" disabled={del.isPending} aria-label="Delete sticker">
              {del.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this sticker?</AlertDialogTitle>
              <AlertDialogDescription>
                It will be removed from the public gallery and the image file deleted. {isHero ? "It's also your hero photo, so the illustration will show instead." : ""}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => del.mutate()}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}