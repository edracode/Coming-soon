import { Link } from "@tanstack/react-router";
const logo = "https://crazychild-crzkd.lovable.app/favicon.png";
import { TOKEN } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t-2 border-ink bg-background px-4 pb-10 pt-14 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src={logo} alt="" width={64} height={64} loading="lazy" className="h-16 w-16" />
          <p className="font-display text-2xl">
            CraZy<span className="text-primary">ChilD</span> <span className="text-muted-foreground">${TOKEN.ticker}</span>
          </p>
          <p className="font-marker text-lg text-accent">Stay crazy. Stay legendary!</p>
        </div>

        <div className="mt-10 rounded-2xl border-2 border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground">
          <h2 className="font-display text-base uppercase text-foreground">Risk disclaimer</h2>
          <p className="mt-2">
            ${TOKEN.ticker} is a meme coin made for fun and community. It has no intrinsic value, no
            team-backed utility, and no expectation of financial return. Crypto assets are extremely
            volatile and you can lose everything you put in. Nothing on this website is financial,
            investment, legal or tax advice. Do your own research, only use money you can afford to lose,
            and check the rules where you live. This website never asks you to connect a wallet or share a
            seed phrase.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {TOKEN.name}. Community meme project.</p>
          <Link to="/admin" className="underline-offset-4 hover:text-foreground hover:underline">
            Owner login
          </Link>
        </div>
      </div>
    </footer>
  );
}