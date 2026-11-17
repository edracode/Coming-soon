import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import heroIllustration from "@/assets/hero-crazychild.jpg";
import { Button } from "@/components/ui/button";
import { adminKeys, friendlyError, removeImage, signedUrls, uploadImage, type SiteSettingsRow } from "@/lib/admin-data";
import { ImagePicker } from "./ImagePicker";
import { Panel } from "./Panel";

export function HeroManager({ settings }: { settings: SiteSettingsRow }) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const current = settings.hero_image_path;

  const { data: currentUrl } = useQuery({
    queryKey: ["admin", "hero-url", current],
    enabled: !!current,
    queryFn: async () => (await signedUrls([current!])).get(current!) ?? null,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: adminKeys.settings });
    qc.invalidateQueries({ queryKey: ["public-site"] });
  };

  const setHero = async (path: string | null) => {
    const { error } = await supabase.from("site_settings").update({ hero_image_path: path }).eq("id", 1);
    if (error) throw new Error(friendlyError(error.message));
    // Clean up the old dedicated hero file (gallery images are left alone).
    if (current && current.startsWith("hero/") && current !== path) {
      await removeImage(current).catch(() => undefined);
    }
  };

  const upload = useMutation({
    mutationFn: async (f: File) => {
      const path = await uploadImage(f, "hero");
      try {
        await setHero(path);
      } catch (e) {
        await removeImage(path).catch(() => undefined);
        throw e;
      }
    },
    onSuccess: () => {
      setFile(null);
      toast.success("Hero photo updated");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: () => setHero(null),
    onSuccess: () => {
      toast.success("Back to the illustrated mascot");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Panel
      title="Hero image"
      description="The big picture at the top of the home page. Until you upload a real photo, the original cartoon illustration is shown."
    >
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">Now showing</p>
          <img
            src={current ? (currentUrl ?? heroIllustration) : heroIllustration}
            alt={current ? "Current hero photo" : "Current hero: illustrated placeholder"}
            className="aspect-[8/9] w-full rounded-xl border-2 border-ink object-cover"
          />
          <p className="mt-2 text-xs text-muted-foreground">{current ? "Your uploaded photo" : "Illustrated placeholder"}</p>
        </div>
        <div className="space-y-4">
          <ImagePicker file={file} onChange={setFile} label="Choose a new hero photo" />
          <div className="flex flex-wrap gap-3">
            <Button variant="hero" disabled={!file || upload.isPending} onClick={() => file && upload.mutate(file)}>
              {upload.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
              Upload & use as hero
            </Button>
            {current ? (
              <Button variant="outline" disabled={reset.isPending} onClick={() => reset.mutate()}>
                <RotateCcw aria-hidden="true" /> Use illustration again
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">Tip: you can also pick any gallery photo with “Set as hero”.</p>
        </div>
      </div>
    </Panel>
  );
}