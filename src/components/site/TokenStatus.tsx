import { useState } from "react";
import { Check, Copy, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { TOKEN } from "@/lib/site";
import { BuyButton } from "./BuyButton";

export function TokenStatus({ contract, buyUrl }: { contract: string | null; buyUrl?: string | undefined }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!contract) return;
    try {
      await navigator.clipboard.writeText(contract);
      setCopied(true);
      toast.success("Contract address copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the address and copy it manually.");
    }
  };

  const facts = [
    { k: "Name", v: TOKEN.name },
    { k: "Ticker", v: `$${TOKEN.ticker}` },
    { k: "Network", v: TOKEN.network },
  ];

  return (
    <section id="token" aria-labelledby="token-title" className="px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto max-w-4xl">
        <p className="font-marker text-xl text-primary">the official bits</p>
        <h2 id="token-title" className="mt-2 font-display text-[clamp(2.2rem,7vw,4rem)] leading-none">
          Token Status
        </h2>

        <div className="mt-10 rounded-3xl border-2 border-ink bg-paper p-6 text-ink shadow-hard-lime sm:p-10">
          <dl className="grid gap-4 sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.k} className="rounded-2xl border-2 border-ink bg-halftone-ink p-4">
                <dt className="text-xs font-bold uppercase tracking-widest">{f.k}</dt>
                <dd className="mt-1 font-display text-2xl">{f.v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 rounded-2xl border-2 border-ink p-4">
            <p className="text-xs font-bold uppercase tracking-widest">Contract address</p>
            {contract ? (
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 break-all rounded-lg bg-ink px-3 py-2 font-mono text-sm text-primary">
                  {contract}
                </code>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-ink bg-primary px-4 font-display text-sm uppercase text-primary-foreground"
                >
                  {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            ) : (
              <p className="mt-2 font-display text-xl uppercase sm:text-2xl" role="status">
                Token contract not announced
              </p>
            )}
          </div>

          <p className="mt-6 flex gap-3 text-sm font-medium">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            Only trust the contract address shown on this page and our official links. We will never DM
            you first, ask for your seed phrase, or ask you to connect a wallet here.
          </p>

          <div className="mt-8">
            <BuyButton url={buyUrl} size="lg" />
          </div>
        </div>
      </div>
    </section>
  );
}