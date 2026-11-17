import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
const logo = "https://crazychild-crzkd.lovable.app/favicon.png";
import type { PublicGalleryItem } from "@/lib/site";
import { DoodleStar } from "./Doodles";

const TILTS = [-4, 3, -2, 5, -5, 2, -3, 4];
const TAPE = ["bg-primary", "bg-accent", "bg-secondary"];

export function Gallery({ items }: { items: PublicGalleryItem[] }) {
  const [active, setActive] = useState<PublicGalleryItem | null>(null);

  return (
    <section id="gallery" aria-labelledby="gallery-title" className="relative overflow-hidden bg-card px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-marker text-xl text-accent">the sticker wall</p>
            <h2 id="gallery-title" className="mt-2 font-display text-[clamp(2.2rem,7vw,4rem)] leading-none">
              Meme Gallery
            </h2>
          </div>
          <DoodleStar className="h-14 w-14 animate-wiggle text-secondary" />
        </div>

        {items.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-border px-6 py-16 text-center">
            <img src={logo} alt="" width={120} height={120} loading="lazy" className="h-28 w-28 animate-float" />
            <p className="font-display text-xl uppercase">Fresh chaos coming soon</p>
            <p className="max-w-sm text-muted-foreground">
              The crew is still printing stickers. Check back for wild faces and crazy adventures.
            </p>
          </div>
        ) : (
          <ul className="mt-12 grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item, i) => {
              const tilt = TILTS[i % TILTS.length];
              return (
                <li
                  key={item.id}
                  className="animate-pop-in"
                  style={{ ["--tilt" as string]: `${tilt}deg`, animationDelay: `${Math.min(i, 12) * 70}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => setActive(item)}
                    className="jelly relative block w-full rounded-2xl text-left"
                    style={{ transform: `rotate(${tilt}deg)` }}
                    aria-label={`Open sticker${item.caption ? `: ${item.caption}` : ""}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`tape absolute -top-3 left-1/2 z-10 h-6 w-16 -translate-x-1/2 rotate-[-4deg] opacity-90 ${TAPE[i % 3]}`}
                    />
                    <span className="sticker block overflow-hidden rounded-2xl bg-paper">
                      <img
                        src={item.url}
                        alt={item.caption || "CraZyChilD meme"}
                        loading="lazy"
                        width={400}
                        height={400}
                        className="aspect-square w-full object-cover"
                      />
                      {item.caption ? (
                        <span className="block bg-paper px-3 py-2 font-marker text-sm leading-snug text-ink sm:text-base">
                          {item.caption}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl border-2 border-ink bg-card p-3 sm:p-4">
          <DialogTitle className="sr-only">{active?.caption || "CraZyChilD meme"}</DialogTitle>
          <DialogDescription className="sr-only">Full-size gallery image</DialogDescription>
          {active ? (
            <figure>
              <img src={active.url} alt={active.caption || "CraZyChilD meme"} className="max-h-[75vh] w-full rounded-xl object-contain" />
              {active.caption ? (
                <figcaption className="mt-3 text-center font-marker text-xl text-primary">{active.caption}</figcaption>
              ) : null}
            </figure>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}