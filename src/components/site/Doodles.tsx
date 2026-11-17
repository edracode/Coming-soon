import { cn } from "@/lib/utils";

/** Hand-drawn wobbly star. Decorative only. */
export function DoodleStar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={cn("pointer-events-none", className)}
      fill="currentColor"
    >
      <path
        d="M50 4c4 14 7 26 13 33 8 3 21 3 33 6-10 8-21 14-25 22 1 11 6 23 8 33-10-7-19-15-29-16-9 4-19 12-29 17 3-11 8-22 7-32-6-8-17-14-27-22 13-2 26-2 33-6 7-8 11-21 16-35z"
        stroke="var(--ink)"
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DoodleSquiggle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 24" aria-hidden="true" className={cn("pointer-events-none", className)}>
      <path
        d="M2 14c12-12 22 10 34 0s22-12 34 0 22 10 34 0 22-12 34 0 22 10 34 0 16-6 26-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DoodleBurst({ className, label }: { className?: string; label: string }) {
  return (
    <div className={cn("relative grid place-items-center", className)} aria-hidden="true">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-spin-slow">
        <polygon
          points="50,2 58,18 75,8 76,27 95,26 86,43 99,55 82,62 89,80 70,78 64,96 50,85 36,96 30,78 11,80 18,62 1,55 14,43 5,26 24,27 25,8 42,18"
          fill="currentColor"
          stroke="var(--ink)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </svg>
      <span className="relative rotate-[-10deg] text-center font-display text-[0.7rem] leading-tight text-ink">
        {label}
      </span>
    </div>
  );
}