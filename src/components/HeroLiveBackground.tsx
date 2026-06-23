import { useEffect, useRef } from "react";

type Particle = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  opacity: number;
  variant: "gold" | "accent";
};

const particleCount = 72;

function createParticles() {
  return Array.from({ length: particleCount }, (_, index): Particle => ({
    angle: (Math.PI * 2 * index) / particleCount + Math.random() * 0.45,
    radius: 0.12 + Math.random() * 0.82,
    speed: 0.0008 + Math.random() * 0.0018,
    size: 0.65 + Math.random() * 1.85,
    opacity: 0.16 + Math.random() * 0.5,
    variant: index % 4 === 0 ? "gold" : "accent",
  }));
}

type ThemeColors = {
  bgCenter: (pulse: number) => string;
  bgMid: string;
  bgEdge: string;
  particlePrimary: (opacity: number) => string;
  particleSecondary: (opacity: number) => string;
  shimmerMid: string;
  shimmerEnd: string;
  ringInner: string;
  ringOuter: string;
};

const darkTheme: ThemeColors = {
  bgCenter: (pulse) => `rgba(28, 82, 196, ${0.2 + pulse * 0.04})`,
  bgMid: "rgba(9, 24, 72, 0.22)",
  bgEdge: "rgba(0, 0, 0, 0.1)",
  particlePrimary: (o) => `rgba(255, 206, 104, ${o})`,
  particleSecondary: (o) => `rgba(116, 166, 255, ${o})`,
  shimmerMid: "rgba(255, 176, 1, 0.07)",
  shimmerEnd: "rgba(38, 111, 255, 0)",
  ringInner: "rgba(255, 176, 1, 0.11)",
  ringOuter: "rgba(38, 111, 255, 0)",
};

const lightTheme: ThemeColors = {
  bgCenter: (pulse) => `rgba(200, 150, 30, ${0.2 + pulse * 0.06})`,
  bgMid: "rgba(200, 150, 30, 0.1)",
  bgEdge: "rgba(200, 150, 30, 0)",
  particlePrimary: (o) => `rgba(200, 150, 30, ${o * 1.2})`,
  particleSecondary: (o) => `rgba(180, 130, 20, ${o * 0.9})`,
  shimmerMid: "rgba(200, 150, 30, 0.12)",
  shimmerEnd: "rgba(200, 150, 30, 0)",
  ringInner: "rgba(200, 150, 30, 0.18)",
  ringOuter: "rgba(200, 150, 30, 0)",
};

export default function HeroLiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });

    if (!canvas || !context) {
      return;
    }

    let currentTheme: "dark" | "light" = "dark";

    const readTheme = () => {
      currentTheme =
        document.documentElement.getAttribute("data-theme") === "light"
          ? "light"
          : "dark";
    };
    readTheme();

    const themeObserver = new MutationObserver(readTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    const particles = createParticles();
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let start = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawAura = (time: number) => {
      const colors =
        currentTheme === "light" ? lightTheme : darkTheme;
      const centerX = width / 2;
      const centerY = height * 0.38;
      const pulse = Math.sin(time * 0.0012) * 0.5 + 0.5;

      context.clearRect(0, 0, width, height);

      // Background glow
      const background = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.max(width, height) * 0.72
      );
      background.addColorStop(0, colors.bgCenter(pulse));
      background.addColorStop(0.36, colors.bgMid);
      background.addColorStop(0.78, colors.bgEdge);
      background.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      context.save();
      context.globalCompositeOperation = "screen";

      // Shimmer lines
      for (let i = 0; i < 9; i += 1) {
        const offset = (i - 4) * width * 0.07;
        const shimmer = Math.sin(time * 0.00055 + i) * 28;
        const gradient = context.createLinearGradient(
          centerX + offset,
          height * 0.08,
          centerX + offset + shimmer,
          height * 0.78
        );
        gradient.addColorStop(0, "rgba(255, 208, 90, 0)");
        gradient.addColorStop(0.48, colors.shimmerMid);
        gradient.addColorStop(1, colors.shimmerEnd);

        context.beginPath();
        context.moveTo(centerX + offset * 0.22, height * 0.12);
        context.lineTo(centerX + offset + shimmer, height * 0.78);
        context.lineWidth = Math.max(1, width * 0.002);
        context.strokeStyle = gradient;
        context.stroke();
      }

      // Particles
      particles.forEach((particle) => {
        particle.angle +=
          particle.speed * (prefersReducedMotion.matches ? 0.2 : 1);
        const ellipseX =
          centerX +
          Math.cos(particle.angle) * particle.radius * width * 0.58;
        const ellipseY =
          centerY +
          Math.sin(particle.angle * 1.38) * particle.radius * height * 0.36;
        const twinkle =
          0.48 + Math.sin(time * 0.0022 + particle.angle * 7) * 0.42;

        context.beginPath();
        context.arc(ellipseX, ellipseY, particle.size, 0, Math.PI * 2);
        context.fillStyle =
          particle.variant === "gold"
            ? colors.particlePrimary(particle.opacity * twinkle)
            : colors.particleSecondary(particle.opacity * twinkle);
        context.fill();
      });

      // Ring
      const ringRadius =
        Math.min(width, height) * (0.23 + pulse * 0.018);
      const ring = context.createRadialGradient(
        centerX,
        centerY,
        ringRadius * 0.78,
        centerX,
        centerY,
        ringRadius * 1.2
      );
      ring.addColorStop(0, "rgba(255, 176, 1, 0)");
      ring.addColorStop(0.48, colors.ringInner);
      ring.addColorStop(1, colors.ringOuter);
      context.strokeStyle = ring;
      context.lineWidth = 1.4;
      context.beginPath();
      context.ellipse(
        centerX,
        centerY,
        ringRadius * 1.55,
        ringRadius * 0.52,
        0,
        0,
        Math.PI * 2
      );
      context.stroke();

      context.restore();
    };

    const render = (time: number) => {
      drawAura(time - start);
      animationFrame = window.requestAnimationFrame(render);
    };

    resize();
    drawAura(0);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const startAnimation = () => {
      window.cancelAnimationFrame(animationFrame);
      start = performance.now();
      animationFrame = window.requestAnimationFrame(render);
    };

    const stopAnimation = () => {
      window.cancelAnimationFrame(animationFrame);
      drawAura(0);
    };

    if (!prefersReducedMotion.matches) {
      startAnimation();
    }

    const onMotionChange = () => {
      if (prefersReducedMotion.matches) {
        stopAnimation();
      } else {
        startAnimation();
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden || prefersReducedMotion.matches) {
        stopAnimation();
      } else {
        startAnimation();
      }
    };

    prefersReducedMotion.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      prefersReducedMotion.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-90 [mask-image:linear-gradient(#000_0%,#000_76%,transparent_100%)]"
      aria-hidden="true"
    />
  );
}
