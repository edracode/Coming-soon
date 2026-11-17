import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getPublicSite } from "@/lib/site.functions";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Marquee } from "@/components/site/Marquee";
import { About } from "@/components/site/About";
import { Gallery } from "@/components/site/Gallery";
import { TokenStatus } from "@/components/site/TokenStatus";
import { Links } from "@/components/site/Links";
import { Footer } from "@/components/site/Footer";

export const publicSiteQuery = queryOptions({
  queryKey: ["public-site"],
  queryFn: () => getPublicSite(),
  staleTime: 60_000,
});

const TITLE = "CraZyChilD ($CRZKD) — Too Crazy To Grow Up! | Solana Meme Coin";
const DESC =
  "Meet CraZyChilD ($CRZKD): the little legend with unstoppable chaos energy, powered by memes and a community that refuses to grow up. Small human. Big chaos.";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publicSiteQuery),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
  }),
  pendingComponent: HomePending,
  component: Home,
});

function HomePending() {
  return (
    <div className="grid min-h-screen place-items-center bg-background bg-halftone" role="status">
      <p className="animate-pulse font-display text-2xl text-primary">Loading chaos…</p>
    </div>
  );
}

function Home() {
  const { data } = useSuspenseQuery(publicSiteQuery);
  const { settings, gallery } = data;
  return (
    <div className="min-h-screen overflow-x-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Navbar buyUrl={settings.links.buy_url} />
      <main id="main">
        <Hero settings={settings} />
        <Marquee slogan={settings.slogan} />
        <About description={settings.description} />
        <Gallery items={gallery} />
        <Marquee slogan={settings.slogan} reverse tone="pink" />
        <TokenStatus contract={settings.contract_address} buyUrl={settings.links.buy_url} />
        <Links links={settings.links} />
      </main>
      <Footer />
    </div>
  );
}