import { ArrowUpRight } from "lucide-react";
import { LINK_FIELDS, isSafeHttpsUrl, type LinkKey } from "@/lib/site";

const TONES = [
  "bg-primary text-primary-foreground shadow-hard-pink",
  "bg-accent text-accent-foreground shadow-hard-lime",
  "bg-secondary text-secondary-foreground shadow-hard-lime",
  "bg-paper text-ink shadow-hard-orange",
];

export function Links({ links }: { links: Partial<Record<LinkKey, string>> }) {
  const visible = LINK_FIELDS.filter((f) => f.key !== "buy_url" && isSafeHttpsUrl(links[f.key]));
  return (
    <section id="links" aria-labelledby="links-title" className="relative bg-card px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-marker text-xl text-secondary">join the playground</p>
        <h2 id="links-title" className="mt-2 font-display text-[clamp(2.2rem,7vw,4rem)] leading-none">
          Official Links
        </h2>

        {visible.length === 0 ? (
          <p className="mx-auto mt-8 max-w-md text-lg text-muted-foreground" role="status">
            Official community links will appear here once they're live. Until then, ignore anyone claiming
            to be the team.
          </p>
        ) : (
          <ul className="mt-12 flex flex-wrap justify-center gap-5">
            {visible.map((f, i) => (
              <li key={f.key}>
                <a
                  href={links[f.key]}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={`${TONES[i % TONES.length]} jelly inline-flex h-14 items-center gap-2 rounded-2xl border-2 border-ink px-6 font-display text-lg uppercase`}
                  style={{ transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)` }}
                >
                  {f.label.replace(" link", "")}
                  <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}