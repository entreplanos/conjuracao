import { useEffect, useRef } from "react";

export default function EmberCanvas({ count = 28 }) {
  const ref = useRef(null);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let w, h, particles, raf;

    function resize() {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    }
    function init() {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: h + Math.random() * h,
        r: Math.random() * 1.6 + 0.4,
        speed: Math.random() * 0.35 + 0.12,
        drift: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.5 + 0.2,
      }));
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(205,164,52,${p.alpha})`;
        ctx.shadowColor = "rgba(194,104,42,0.8)";
        ctx.shadowBlur = 4;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    resize();
    init();
    tick();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [count]);

  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}
