import { useEffect, useRef, useState } from "react";
import "./chaos-atmosphere.css";

/**
 * Public-page-only visual enhancement. Existing site structure, content,
 * data fetching, navigation, auth, gallery and playback remain untouched.
 */
export function ChaosAtmosphere() {
  const progress = useRef<HTMLDivElement>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    root.classList.add("crzkd-motion");

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        "#about > div, #gallery > div, #token > div, #links > div",
      ),
    );
    let observer: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("crzkd-in-view");
              observer?.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.07, rootMargin: "0px 0px -12px 0px" },
      );
      for (const el of targets) {
        el.classList.add("crzkd-reveal");
        observer.observe(el);
      }
    }

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const max = Math.max(
          1,
          document.documentElement.scrollHeight - window.innerHeight,
        );
        const amount = Math.min(1, Math.max(0, window.scrollY / max));
        progress.current?.style.setProperty("--crzkd-progress", String(amount));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    let pointerFrame = 0;
    let latestX = 0;
    let latestY = 0;
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || pointerFrame) return;
      latestX = event.clientX;
      latestY = event.clientY;
      pointerFrame = window.requestAnimationFrame(() => {
        pointerFrame = 0;
        const x = ((latestX / window.innerWidth) - 0.5) * 26;
        const y = ((latestY / window.innerHeight) - 0.5) * 26;
        root.style.setProperty("--crzkd-pointer-x", String(x) + "px");
        root.style.setProperty("--crzkd-pointer-y", String(y) + "px");
      });
    };
    if (window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("pointermove", onPointer, { passive: true });
    }

    const audio = document.querySelector<HTMLAudioElement>("audio");
    const syncMusic = () => setMusicPlaying(Boolean(audio && !audio.paused));
    audio?.addEventListener("play", syncMusic);
    audio?.addEventListener("pause", syncMusic);
    audio?.addEventListener("ended", syncMusic);
    syncMusic();

    return () => {
      observer?.disconnect();
      targets.forEach((el) => el.classList.remove("crzkd-reveal", "crzkd-in-view"));
      root.classList.remove("crzkd-motion");
      root.style.removeProperty("--crzkd-pointer-x");
      root.style.removeProperty("--crzkd-pointer-y");
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pointermove", onPointer);
      if (frame) window.cancelAnimationFrame(frame);
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      audio?.removeEventListener("play", syncMusic);
      audio?.removeEventListener("pause", syncMusic);
      audio?.removeEventListener("ended", syncMusic);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("crzkd-music-playing", musicPlaying);
    return () => document.documentElement.classList.remove("crzkd-music-playing");
  }, [musicPlaying]);

  return (
    <>
      <div ref={progress} className="crzkd-scroll-track" aria-hidden="true">
        <span />
      </div>
      <div className="crzkd-atmosphere" aria-hidden="true">
        <span className="crzkd-orbit crzkd-orbit-a" />
        <span className="crzkd-orbit crzkd-orbit-b" />
        <span className="crzkd-floating crzkd-floating-1">✦</span>
        <span className="crzkd-floating crzkd-floating-2">✳</span>
        <span className="crzkd-floating crzkd-floating-3">★</span>
        <span className="crzkd-floating crzkd-floating-4">✧</span>
        <span className="crzkd-floating crzkd-floating-5">✦</span>
      </div>
    </>
  );
}
