import { useState } from "react";
import { Menu, X } from "lucide-react";
const logo = "https://crazychild-crzkd.lovable.app/favicon.png";
import { BuyButton } from "./BuyButton";

const NAV = [
  { href: "#about", label: "About" },
  { href: "#gallery", label: "Gallery" },
  { href: "#music", label: "Music" },
  { href: "#token", label: "Token" },
  { href: "#links", label: "Links" },
];

export function Navbar({ buyUrl }: { buyUrl?: string | undefined }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-background/85 backdrop-blur-md">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <a href="#top" className="group flex items-center gap-2" aria-label="CraZyChilD home">
          <img
            src={logo}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 transition-transform group-hover:rotate-12"
          />
          <span className="font-display text-lg text-foreground">
            CraZy<span className="text-primary">ChilD</span>
          </span>
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <li key={n.href}>
              <a
                href={n.href}
                className="rounded-lg px-3 py-2 font-display text-sm uppercase text-muted-foreground transition-colors hover:text-primary"
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <BuyButton url={buyUrl} size="default" />
        </div>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-xl border-2 border-border text-foreground md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </nav>

      {open ? (
        <div
          id="mobile-menu"
          className="animate-in slide-in-from-top-2 fade-in border-t-2 border-ink bg-background px-4 pb-6 pt-2 md:hidden"
        >
          <ul className="flex flex-col">
            {NAV.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-border py-4 font-display text-xl uppercase text-foreground hover:text-primary"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <BuyButton url={buyUrl} size="lg" />
          </div>
        </div>
      ) : null}
    </header>
  );
}