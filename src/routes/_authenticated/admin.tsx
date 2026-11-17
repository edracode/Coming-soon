import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExternalLink, KeyRound, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
const logo = "https://crazychild-crzkd.lovable.app/favicon.png";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isAdminQuery, settingsQuery } from "@/lib/admin-data";
import { ContentForm } from "@/components/admin/ContentForm";
import { LinksForm } from "@/components/admin/LinksForm";
import { HeroManager } from "@/components/admin/HeroManager";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { MusicManager } from "@/components/admin/MusicManager";
import { AdminsManager } from "@/components/admin/AdminsManager";
import { ErrorBlock, LoadingBlock } from "@/components/admin/Panel";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — CraZyChilD" },
      { name: "description", content: "Private owner dashboard for the CraZyChilD website." },
      { property: "og:title", content: "Admin — CraZyChilD" },
      { property: "og:description", content: "Private owner dashboard for the CraZyChilD website." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const role = useQuery(isAdminQuery(user.id));

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center gap-2" aria-label="View public site">
            <img src={logo} alt="" width={36} height={36} className="h-9 w-9" />
            <span className="font-display">
              Admin<span className="hidden text-muted-foreground sm:inline"> · CraZyChilD</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden="true" /> <span className="hidden sm:inline">View site</span>
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut aria-hidden="true" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user.email}</span>
        </p>

        {role.isPending ? (
          <LoadingBlock label="Checking your access…" />
        ) : role.isError ? (
          <div className="mt-6">
            <ErrorBlock message="Couldn't check your access." onRetry={() => role.refetch()} />
          </div>
        ) : role.data ? (
          <AdminDashboard email={user.email ?? ""} />
        ) : (
          <NotAuthorized userId={user.id} email={user.email ?? ""} />
        )}
      </main>
    </div>
  );
}

function AdminDashboard({ email }: { email: string }) {
  const settings = useQuery(settingsQuery);

  if (settings.isPending) return <LoadingBlock label="Loading site settings…" />;
  if (settings.isError) return <ErrorBlock message="Couldn't load site settings." onRetry={() => settings.refetch()} />;

  const s = settings.data;
  return (
    <div className="mt-6">
      <h1 className="font-display text-3xl uppercase">
        Control <span className="text-primary">room</span>
      </h1>
      <Tabs defaultValue="gallery" className="mt-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-card p-1">
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="music">Music</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="content">Text & token</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>
        <TabsContent value="gallery" className="mt-6">
          <GalleryManager heroPath={s.hero_image_path} />
        </TabsContent>
        <TabsContent value="music" className="mt-6">
          <MusicManager />
        </TabsContent>
        <TabsContent value="hero" className="mt-6">
          <HeroManager key={s.hero_image_path ?? "none"} settings={s} />
        </TabsContent>
        <TabsContent value="content" className="mt-6">
          <ContentForm key={s.updated_at} settings={s} />
        </TabsContent>
        <TabsContent value="links" className="mt-6">
          <LinksForm key={s.updated_at} settings={s} />
        </TabsContent>
        <TabsContent value="admins" className="mt-6">
          <AdminsManager myEmail={email} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotAuthorized({ userId, email }: { userId: string; email: string }) {
  const qc = useQueryClient();
  const claim = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("claim_admin");
      if (error) throw error;
      return data === true;
    },
    onSuccess: (ok) => {
      if (ok) {
        toast.success("Admin access granted. Welcome, boss!");
        qc.invalidateQueries({ queryKey: isAdminQuery(userId).queryKey });
      } else {
        toast.error("This email isn't approved for admin access yet.");
      }
    },
    onError: () => toast.error("Couldn't check admin access. Try again."),
  });

  return (
    <div className="mt-6 rounded-3xl border-2 border-ink bg-card p-6 shadow-hard-orange sm:p-8">
      <KeyRound className="h-10 w-10 text-secondary" aria-hidden="true" />
      <h1 className="mt-4 font-display text-2xl uppercase">No admin access yet</h1>
      <p className="mt-2 text-muted-foreground">
        Your account (<span className="text-foreground">{email}</span>) is signed in but isn't an admin. Signing
        up never grants admin powers by itself.
      </p>

      <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm">
        <li>Your email must be on the site's admin approval list (the site owner adds it).</li>
        <li>Your email must be verified (click the link in the confirmation email).</li>
        <li>Then press the button below to activate admin access.</li>
      </ol>

      <Button variant="hero" size="lg" className="mt-6" disabled={claim.isPending} onClick={() => claim.mutate()}>
        {claim.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
        Activate admin access
      </Button>
    </div>
  );
}