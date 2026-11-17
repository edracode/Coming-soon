import type { ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border-2 border-border bg-card p-5 sm:p-7">
      <h2 className="font-display text-xl uppercase">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 py-10 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> {label}
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive/60 bg-destructive/10 p-4 text-sm text-destructive">
      <p className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" aria-hidden="true" /> {message}</p>
      {onRetry ? <Button size="sm" variant="outline" onClick={onRetry}>Try again</Button> : null}
    </div>
  );
}