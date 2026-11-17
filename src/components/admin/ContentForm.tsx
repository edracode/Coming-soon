import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminKeys, friendlyError, type SiteSettingsRow } from "@/lib/admin-data";
import { normalizeContract } from "@/lib/site";
import { Panel } from "./Panel";

export function ContentForm({ settings }: { settings: SiteSettingsRow }) {
  const qc = useQueryClient();
  const [headline, setHeadline] = useState(settings.headline);
  const [slogan, setSlogan] = useState(settings.slogan);
  const [description, setDescription] = useState(settings.description);
  const [contract, setContract] = useState(settings.contract_address ?? "");
  const [errors, setErrors] = useState<Partial<Record<"headline" | "slogan" | "description" | "contract", string>>>({});

  const save = useMutation({
    mutationFn: async (patch: Partial<SiteSettingsRow>) => {
      const { error } = await supabase.from("site_settings").update(patch).eq("id", 1);
      if (error) throw new Error(friendlyError(error.message));
    },
    onSuccess: () => {
      toast.success("Content saved — it's live now");
      qc.invalidateQueries({ queryKey: adminKeys.settings });
      qc.invalidateQueries({ queryKey: ["public-site"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<"headline" | "slogan" | "description" | "contract", string>> = {};
    if (!headline.trim()) next.headline = "Headline is required.";
    if (headline.length > 120) next.headline = "Keep it under 120 characters.";
    if (!slogan.trim()) next.slogan = "Slogan is required.";
    if (slogan.length > 120) next.slogan = "Keep it under 120 characters.";
    if (description.length > 1500) next.description = "Keep it under 1500 characters.";
    const c = normalizeContract(contract);
    if (!c.ok) next.contract = c.error;
    setErrors(next);
    if (Object.keys(next).length > 0 || !c.ok) return;
    save.mutate({
      headline: headline.trim(),
      slogan: slogan.trim(),
      description: description.trim(),
      contract_address: c.value,
    });
  };

  return (
    <Panel title="Text & token" description="Headline, slogan, description and the official contract address.">
      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field id="headline" label="Headline" error={errors.headline}>
          <Input id="headline" value={headline} maxLength={120} onChange={(e) => setHeadline(e.target.value)} aria-invalid={!!errors.headline} />
        </Field>
        <Field id="slogan" label="Slogan" error={errors.slogan}>
          <Input id="slogan" value={slogan} maxLength={120} onChange={(e) => setSlogan(e.target.value)} aria-invalid={!!errors.slogan} />
        </Field>
        <Field id="description" label="Description" error={errors.description} hint={`${description.length}/1500`}>
          <Textarea id="description" rows={6} value={description} maxLength={1500} onChange={(e) => setDescription(e.target.value)} aria-invalid={!!errors.description} />
        </Field>
        <Field
          id="contract"
          label="Solana contract address"
          error={errors.contract}
          hint="Leave empty to show “Token contract not announced”. Double-check before saving."
        >
          <Input id="contract" value={contract} onChange={(e) => setContract(e.target.value)} className="font-mono" spellCheck={false} autoComplete="off" aria-invalid={!!errors.contract} />
        </Field>
        <Button type="submit" variant="hero" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null} Save content
        </Button>
      </form>
    </Panel>
  );
}

export function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string | undefined; hint?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}