"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from its previous value to `target` over `durationMs`,
 * using an ease-out curve. Snaps straight to `target` for users who've
 * requested reduced motion, and on the very first render (no prior value to
 * animate from).
 */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(target);
  const previousTarget = useRef(target);
  const isFirstRender = useRef(true);
  const rafId = useRef<number>();

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousTarget.current = target;
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setValue(target);
      previousTarget.current = target;
      return;
    }

    const start = previousTarget.current;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + (target - start) * eased);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        previousTarget.current = target;
      }
    }

    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current !== undefined) cancelAnimationFrame(rafId.current);
    };
  }, [target, durationMs]);

  return value;
}
