"use client";

/**
 * next/link, prefetching on intent instead of on sight.
 *
 * WHY. Next prefetches every <Link> as it enters the viewport. Measured on the
 * live site, 27 Nov 2026 (mobile viewport, six seconds of idle after load):
 * `/` +105 KB in 32 requests, `/tools` +163 KB in 52, `/planners` +159 KB in
 * 51, `/learn` +126 KB in 45, all for pages the reader had not opened. Most
 * readers are on metered mobile data. The same fix on Mwangaza Yield took its
 * after-idle download to zero (PapaDanico/Mwangaza-Yield#481).
 *
 * WHAT. Viewport prefetch is off; the route is prefetched when the pointer
 * enters the link, a finger touches it or keyboard focus lands on it, which is
 * usually 100-300 ms before the click. In the App Router `prefetch={false}`
 * also stops hover prefetch, which is why `router.prefetch` is called here.
 * Pass `prefetch` explicitly to opt a link back in.
 */
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useCallback, useRef, type ComponentProps } from "react";
import { prefetchTarget } from "@/lib/prefetch-target";

type Props = ComponentProps<typeof NextLink>;

const Link = forwardRef<HTMLAnchorElement, Props>(function Link(
  { prefetch, onMouseEnter, onTouchStart, onFocus, href, ...rest },
  ref,
) {
  const router = useRouter();
  const done = useRef(false);

  const warm = useCallback(() => {
    if (done.current) return;
    const target = prefetchTarget(typeof href === "string" ? href : href.pathname);
    if (!target) return;
    done.current = true;
    try {
      router.prefetch(target);
    } catch {
      // An optimisation; a failure must never break the link.
    }
  }, [href, router]);

  return (
    <NextLink
      ref={ref}
      href={href}
      prefetch={prefetch ?? false}
      onMouseEnter={(e) => {
        warm();
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        warm();
        onTouchStart?.(e);
      }}
      onFocus={(e) => {
        warm();
        onFocus?.(e);
      }}
      {...rest}
    />
  );
});

export default Link;
