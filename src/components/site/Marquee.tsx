import { TOKEN } from "@/lib/site";

export function Marquee({ slogan, reverse = false, tone = "lime" }: { slogan: string; reverse?: boolean; tone?: "lime" | "pink" }) {
  const items = [slogan, `$${TOKEN.ticker}`, TOKEN.network, "STAY CRAZY", "STAY LEGENDARY", "NO BORING VIBES"];
  const row = (
    <div className="flex shrink-0 items-center gap-6 pr-6">
      {items.map((t, i) => (
        <span key={i} className="flex items-center gap-6 whitespace-nowrap font-display text-xl uppercase sm:text-2xl">
          {t} <span aria-hidden="true">★</span>
        </span>
      ))}
    </div>
  );
  return (
    <div
      aria-hidden="true"
      className={
        (tone === "lime" ? "bg-primary text-primary-foreground rotate-[-1.5deg]" : "bg-accent text-accent-foreground rotate-[1.2deg]") +
        " relative z-10 -mx-4 overflow-hidden border-y-2 border-ink py-3"
      }
    >
      <div className={(reverse ? "animate-marquee-reverse" : "animate-marquee") + " flex w-max"}>
        {row}
        {row}
      </div>
    </div>
  );
}