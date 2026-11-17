import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminKeys, friendlyError, type SiteSettingsRow } from "@/lib/admin-data";
import { LINK_FIELDS, normalizeHttpsUrl, type LinkKey } from "@/lib/site";
import { Field } from "./ContentForm";
import { Panel } from "./Panel";

export function LinksForm({ settings }: { settings: SiteSettingsRow }) {
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<LinkKey, string>>(
    () => Object.fromEntries(LINK_FIELDS.map((f) => [f.key, settings[f.key] ?? ""])) as Record<LinkKey, string>,
  );
  const [errors, setErrors] = useState<Partial<Record<LinkKey, string>>>({});

  const save = useMutation({
    mutationFn: async (patch: Partial<SiteSettingsRow>) => {
      const { error } = await supabase.from("site_settings").update(patch).eq("id", 1);
      if (error) throw new Error(friendlyError(error.message));
    },
    onSuccess: () => {
      toast.success("Links saved — they're live now");
      qc.invalidateQueries({ queryKey: adminKeys.settings });
      qc.invalidateQueries({ queryKey: ["public-site"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const patch: Partial<Record<LinkKey, string | null>> = {};
    const errs: Partial<Record<LinkKey, string>> = {};
    for (const f of LINK_FIELDS) {
      const r = normalizeHttpsUrl(values[f.key]);
      if (r.ok) patch[f.key] = r.value;
      else errs[f.key] = r.error;
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Fix the highlighted links first.");
      return;
    }
    save.mutate(patch);
  };

  return (
    <Panel
      title="Links"
      description="Only https:// links are accepted. Empty links stay hidden. With no Buy link, visitors see “Coming soon”."
    >
      <form onSubmit={submit} className="grid gap-5 md:grid-cols-2" noValidate>
        {LINK_FIELDS.map((f) => (
          <Field key={f.key} id={f.key} label={f.label} error={errors[f.key]}>
            <Input
              id={f.key}
              type="url"
              inputMode="url"
              placeholder={f.placeholder}
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              aria-invalid={!!errors[f.key]}
              spellCheck={false}
              autoComplete="off"
            />
          </Field>
        ))}
        <div className="md:col-span-2">
          <Button type="submit" variant="hero" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null} Save links
          </Button>
        </div>
      </form>
    </Panel>
  );
}