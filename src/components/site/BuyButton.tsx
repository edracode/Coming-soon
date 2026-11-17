import { ArrowUpRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSafeHttpsUrl, TOKEN } from "@/lib/site";

export function BuyButton({ url, size = "xl" }: { url?: string | undefined; size?: "default" | "lg" | "xl" }) {
  if (isSafeHttpsUrl(url)) {
    return (
      <Button asChild variant="hero" size={size}>
        <a href={url} target="_blank" rel="noopener noreferrer nofollow">
          Buy ${TOKEN.ticker} <ArrowUpRight aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </Button>
    );
  }
  return (
    <Button variant="soon" size={size} disabled aria-disabled="true">
      <Clock aria-hidden="true" /> Coming soon
    </Button>
  );
}