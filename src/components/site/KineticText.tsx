/** Bouncing letters; each word stays unbroken. Screen readers get the plain text. */
export function KineticText({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ");
  let i = 0;
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, w) => (
          <span key={w} className="inline-block whitespace-nowrap">
            {Array.from(word).map((ch) => {
              const idx = i++;
              return (
                <span
                  key={idx}
                  className="kinetic-letter"
                  style={{ animationDelay: `${(idx % 14) * 0.08}s` }}
                >
                  {ch}
                </span>
              );
            })}
            {w < words.length - 1 ? "\u00a0" : null}
          </span>
        ))}
      </span>
    </span>
  );
}