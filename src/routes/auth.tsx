import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/admin/AuthShell";

type Mode = "signin" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => {
    const r = s["redirect"];
    return { redirect: typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? r : undefined };
  },
  head: () => ({
    meta: [
      { title: "Owner login — CraZyChilD" },
      { name: "description", content: "Sign in to manage the CraZyChilD website." },
      { property: "og:title", content: "Owner login — CraZyChilD" },
      { property: "og:description", content: "Sign in to manage the CraZyChilD website." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/admin", replace: true });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/admin", replace: true });
        } else {
          setNotice("Check your inbox and click the confirmation link, then sign in here.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setNotice("If that email has an account, a reset link is on its way.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const titles: Record<Mode, [string, string]> = {
    signin: ["Owner login", "Admins manage the gallery, links and token info."],
    signup: ["Create account", "Accounts get no admin powers until approved by the site owner."],
    forgot: ["Reset password", "We'll email you a secure reset link."],
  };

  return (
    <AuthShell title={titles[mode][0]} subtitle={titles[mode][1]}>
      <form onSubmit={submit} className="space-y-4" noValidate={false}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {mode !== "forgot" ? (
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === "signup" ? <p className="text-xs text-muted-foreground">At least 8 characters.</p> : null}
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="rounded-lg border border-destructive/60 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="rounded-lg border border-primary/60 bg-primary/10 p-3 text-sm text-primary">
            {notice}
          </p>
        ) : null}

        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2 text-sm">
        {mode !== "signin" ? (
          <button type="button" className="text-primary underline-offset-4 hover:underline" onClick={() => setMode("signin")}>
            Back to sign in
          </button>
        ) : (
          <>
            <button type="button" className="text-primary underline-offset-4 hover:underline" onClick={() => setMode("signup")}>
              First time? Create the owner account
            </button>
            <button type="button" className="text-muted-foreground underline-offset-4 hover:underline" onClick={() => setMode("forgot")}>
              Forgot password?
            </button>
          </>
        )}
      </div>
    </AuthShell>
  );
}