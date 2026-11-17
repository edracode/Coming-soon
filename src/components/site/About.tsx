import { Sparkles, Smile, Users } from "lucide-react";
import { TOKEN } from "@/lib/site";
import { DoodleStar } from "./Doodles";

const TRAITS = [
  { icon: Smile, title: "Wild faces", body: "Tongue out, eyes crossed, zero chill.", tone: "bg-primary text-primary-foreground" },
  { icon: Sparkles, title: "Chaos energy", body: "Born to break boring rules.", tone: "bg-secondary text-secondary-foreground" },
  { icon: Users, title: "Raised by memes", body: "A community that refuses to grow up.", tone: "bg-accent text-accent-foreground" },
];

export function About({ description }: { description: string }) {
  return (
    <section id="about" aria-labelledby="about-title" className="relative px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1fr_1.3fr] md:items-start">
          <div className="relative">
            <p className="font-marker text-xl text-secondary">who is this kid?!</p>
            <h2 id="about-title" className="mt-2 font-display text-[clamp(2.2rem,7vw,4rem)] leading-none">
              Meet <span className="text-chaos">{TOKEN.name}</span>
            </h2>
            <DoodleStar className="absolute -right-2 -top-4 h-12 w-12 animate-wiggle text-primary md:right-8" />
          </div>
          <p className="whitespace-pre-line text-lg leading-relaxed text-foreground/90 md:text-xl">
            {description}
          </p>
        </div>

        <ul className="mt-14 grid gap-6 sm:grid-cols-3">
          {TRAITS.map((t, i) => (
            <li
              key={t.title}
              className={`${t.tone} jelly rounded-2xl border-2 border-ink p-6 shadow-hard`}
              style={{ transform: `rotate(${[-2, 1.5, -1][i]}deg)` }}
            >
              <t.icon className="h-8 w-8" aria-hidden="true" />
              <h3 className="mt-4 font-display text-xl uppercase">{t.title}</h3>
              <p className="mt-1 font-medium">{t.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}