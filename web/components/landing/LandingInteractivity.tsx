"use client";

import { useEffect } from "react";

export default function LandingInteractivity() {
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    // Scroll reveal
    const revealEls = document.querySelectorAll<HTMLElement>("[data-reveal]");
    revealEls.forEach((el) => {
      const delay = el.dataset.delay ? `${Number(el.dataset.delay) * 0.1}s` : "0s";
      el.style.opacity = "0";
      el.style.transform = "translateY(16px)";
      el.style.transition = `opacity 0.5s ease ${delay}, transform 0.5s ease ${delay}`;
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "none";
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));

    // Counter animation
    const countEls = document.querySelectorAll<HTMLElement>("[data-count]");
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          co.unobserve(el);
          const target = parseFloat(el.dataset.count!);
          if (isNaN(target)) return;
          const suffix = el.dataset.suffix || "";
          const prefix = el.dataset.prefix || "";
          const dur = 1100;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min((now - start) / dur, 1);
            const ease = 1 - Math.pow(1 - t, 3);
            const v = target * ease;
            const formatted =
              Number.isInteger(target) && !el.dataset.decimals
                ? Math.round(v).toLocaleString()
                : v.toFixed(parseInt(el.dataset.decimals || "1"));
            el.textContent = prefix + formatted + suffix;
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.35 }
    );
    countEls.forEach((el) => co.observe(el));

    return () => {
      io.disconnect();
      co.disconnect();
    };
  }, []);

  return null;
}
