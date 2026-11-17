const heroIllustration = "https://crazychild-crzkd.lovable.app/apple-touch-icon.png";
import { TOKEN, type PublicSettings } from "@/lib/site";
import { BuyButton } from "./BuyButton";
import { DoodleBurst, DoodleSquiggle, DoodleStar } from "./Doodles";
import { KineticText } from "./KineticText";

export function Hero({ settings }: { settings: PublicSettings }) {
  const photo = settings.hero_image_url;
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-halftone px-4 pb-16 pt-10 sm:px-6 md:pb-24 md:pt-16"
    >
      <DoodleStar className="absolute left-[4%] top-8 h-10 w-10 animate-wiggle text-primary" />
      <DoodleStar className="absolute right-[6%] top-24 hidden h-14 w-14 animate-wiggle text-accent [animation-delay:0.6s] sm:block" />
      <DoodleStar className="absolute bottom-10 left-[45%] h-8 w-8 animate-wiggle text-secondary [animation-delay:1.1s]" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[1.1fr_1fr]">
        <div className="relative z-10 text-center md:text-left">
          <p className="inline-flex rotate-[-3deg] items-center gap-2 rounded-lg border-2 border-ink bg-secondary px-3 py-1 font-display text-xs uppercase text-secondary-foreground shadow-hard">
            ${TOKEN.ticker} · {TOKEN.network}
          </p>

          <h1
            id="hero-title"
            className="mt-6 font-display text-[clamp(2.6rem,9vw,5.6rem)] leading-[0.92] text-foreground"
          >
            <KineticText text={settings.headline} />
          </h1>

          <p className="mt-5 font-marker text-[clamp(1.4rem,4.5vw,2.2rem)] leading-tight text-primary">
            <span className="inline-block rotate-[-2deg]">{settings.slogan}</span>
          </p>
          <DoodleSquiggle className="mx-auto mt-1 h-4 w-48 text-accent md:mx-0" />

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row md:justify-start sm:justify-center">
            <BuyButton url={settings.links.buy_url} />
            <a
              href="#about"
              className="inline-flex h-14 items-center rounded-xl border-2 border-border px-7 font-display text-base uppercase text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Meet the legend
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No wallet connection needed to browse. Ever.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-3 rotate-[4deg] rounded-[2rem] bg-accent" aria-hidden="true" />
          <div className="absolute -inset-3 rotate-[-3deg] rounded-[2rem] bg-primary" aria-hidden="true" />
          <figure className="sticker relative animate-float overflow-hidden rounded-[1.6rem] bg-card">
            <img
              src={photo ?? heroIllustration}
              alt={
                photo
                  ? "CraZyChilD mascot photo"
                  : "Original cartoon illustration of the CraZyChilD mascot: a kid in a fluffy white ear headband, purple sweater and camo pants, tongue out, dancing in a garden"
              }
              width={1024}
              height={1152}
              fetchPriority="high"
              className="aspect-[8/9] w-full object-cover"
            />
          </figure>
          <DoodleBurst
            label={"STAY\nCRAZY!"}
            className="absolute -left-6 -top-6 h-24 w-24 text-secondary sm:-left-10 sm:h-28 sm:w-28"
          />
          <span className="absolute -bottom-5 right-2 rotate-[6deg] rounded-lg border-2 border-ink bg-paper px-3 py-1 font-marker text-lg text-ink shadow-hard">
            *tongue out*
          </span>
        </div>
      </div>
    </section>
  );
}