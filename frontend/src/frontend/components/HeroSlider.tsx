import { useEffect, useRef, useState, type ReactNode } from "react";

const SLIDES = [
  { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80", alt: "Bright, freshly cleaned Dubai apartment living room" },
  { url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=80", alt: "Cleaning professional wiping a modern kitchen counter" },
  { url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1920&q=80", alt: "Technician servicing a wall air conditioner" },
  { url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80", alt: "Hairstylist styling a client at home" },
];

const INTERVAL = 5000;

/** Auto-playing hero background slider with the booking card layered on top. */
export function HeroSlider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      if (!paused.current) setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL);
    return () => window.clearInterval(id);
  }, []);

  const swipeStart = useRef<number | null>(null);

  return (
    <section
      className="relative isolate overflow-hidden"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onTouchStart={(e) => (swipeStart.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const start = swipeStart.current;
        const end = e.changedTouches[0]?.clientX ?? null;
        if (start === null || end === null) return;
        const delta = end - start;
        if (Math.abs(delta) < 40) return;
        setIndex((i) => (i + (delta < 0 ? 1 : SLIDES.length - 1)) % SLIDES.length);
      }}
    >
      <div className="relative h-[320px] w-full sm:h-[420px]">
        {SLIDES.map((slide, i) => (
          <img
            key={slide.url}
            src={slide.url}
            alt={i === index ? slide.alt : ""}
            width={1920}
            height={900}
            loading={i === 0 ? "eager" : "lazy"}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i === index ? undefined : true}
          />
        ))}
        <div
          className="absolute inset-0 bg-gradient-to-b from-foreground/45 via-foreground/25 to-foreground/50"
          aria-hidden
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          {children}
        </div>

        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.url}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
