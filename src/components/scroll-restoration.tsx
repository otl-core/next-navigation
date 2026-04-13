"use client";

/**
 * Restores scroll-to-top behavior on client-side navigations.
 *
 * Next.js App Router normally scrolls to top when navigating between pages,
 * but sticky/fixed headers break this: the browser sees the header (the
 * topmost element) as still in view and skips the scroll reset.
 *
 * This component listens for pathname changes and explicitly scrolls to the
 * top of the page, skipping the initial render to avoid interfering with
 * the browser's native scroll restoration on first load.
 */

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function ScrollRestoration() {
  const pathname = usePathname();
  const isInitial = useRef(true);

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
