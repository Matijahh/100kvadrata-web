import { useEffect, useState, type RefObject } from "react";

/**
 * Whether a sticky element is currently pinned. Put `sentinelRef` on an empty
 * element right above it: once that marker leaves the visible area (a
 * scrolling popup clips it too), the element is stuck. `offset` is how far
 * above the top edge the element pins — its negative `top`, in px.
 */
export function useIsStuck(sentinelRef: RefObject<HTMLElement | null>, offset = 0) {
  const [isStuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
      rootMargin: `${offset}px 0px 0px 0px`,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelRef, offset]);

  return isStuck;
}
