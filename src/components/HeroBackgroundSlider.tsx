import { useEffect, useRef, useState } from "react";

// Ordered by priority: 1 (highest) → 4 → 2 → 3 (lowest)
const slides = [
  { src: "/assets/journey/GBEAWARD_BNR_IMG_1.jpg", w: 2044, h: 1193, duration: 8000 },
  { src: "/assets/journey/GBEAWARD_BNR_IMG_4.jpg", w: 2042, h: 1001, duration: 7000 },
  { src: "/assets/journey/GBEAWARD_BNR_IMG_2.jpg", w: 1785, h: 1015, duration: 5000 },
  { src: "/assets/journey/GBEAWARD_BNR_IMG_3.jpg", w: 1811, h: 990, duration: 3000 },
];

const FADE_DURATION = 1200;

function preloadImage(src: string) {
  const img = new Image();
  img.src = src;
}

export default function HeroBackgroundSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLight, setIsLight] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    const check = () => setIsLight(html.getAttribute("data-theme") === "light");
    check();

    const observer = new MutationObserver(check);
    observer.observe(html, { attributes: true, attributeFilter: ["data-theme"] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isLight) return;

    const scheduleNext = () => {
      const currentDuration = slides[activeIndex].duration;
      timeoutRef.current = setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % slides.length);
      }, currentDuration);
    };

    scheduleNext();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLight, activeIndex]);

  // Preload next slide ahead of time
  useEffect(() => {
    if (!isLight) return;
    const nextIndex = (activeIndex + 1) % slides.length;
    preloadImage(slides[nextIndex].src);
  }, [isLight, activeIndex]);

  if (!isLight) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {slides.map((slide, index) => {
        const isActive = index === activeIndex;
        const wasActive =
          index === (activeIndex - 1 + slides.length) % slides.length;
        const isVisible = isActive || wasActive;

        return (
          <div
            key={slide.src}
            className="absolute inset-0 transition-opacity"
            style={{
              opacity: isActive ? 1 : 0,
              transitionDuration: `${FADE_DURATION}ms`,
              transitionTimingFunction: "ease-in-out",
              willChange: isVisible ? "opacity, transform" : "auto",
            }}
          >
            <img
              src={slide.src}
              alt=""
              width={slide.w}
              height={slide.h}
              className="h-full w-full object-cover"
              style={{
                transform:
                  isActive || wasActive
                    ? "scale(1.08)"
                    : "scale(1.0)",
                transition: `transform ${slide.duration}ms linear`,
              }}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={isActive ? "high" : "low"}
            />
          </div>
        );
      })}

      {/* Strong gradient overlay: left side clean for text, right side atmospheric */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(90deg, 
              rgba(250, 248, 243, 0.97) 0%, 
              rgba(250, 248, 243, 0.92) 28%, 
              rgba(250, 248, 243, 0.72) 48%, 
              rgba(250, 248, 243, 0.35) 62%, 
              rgba(250, 248, 243, 0.12) 75%, 
              transparent 100%
            ),
            linear-gradient(180deg, 
              rgba(250, 248, 243, 0.4) 0%, 
              transparent 25%, 
              transparent 70%, 
              rgba(250, 248, 243, 0.85) 100%
            )
          `,
        }}
      />

      {/* Warm tint overlay to unify image color temperature with the design */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "rgba(255, 200, 80, 0.04)",
          mixBlendMode: "multiply",
        }}
      />
    </div>
  );
}
