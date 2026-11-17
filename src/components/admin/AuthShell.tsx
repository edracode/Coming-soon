import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo-crazychild-256.png";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-halftone px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto mb-6 flex w-fit items-center gap-2" aria-label="Back to CraZyChilD home">
          <img src={logo} alt="" width={48} height={48} className="h-12 w-12" />
          <span className="font-display text-xl">
            CraZy<span className="text-primary">ChilD</span>
          </span>
        </Link>
        <main className="rounded-3xl border-2 border-ink bg-card p-6 shadow-hard-lime sm:p-8">
          <h1 className="font-display text-2xl uppercase">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}