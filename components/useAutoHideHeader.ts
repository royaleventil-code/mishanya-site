"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useAutoHideHeader({
  hideAfter = 96,
  delta = 6,
}: {
  hideAfter?: number;
  delta?: number;
} = {}) {
  const [isVisible, setIsVisible] = useState(true);
  const isVisibleRef = useRef(true);
  const lastScrollYRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  const setVisible = useCallback((nextVisible: boolean) => {
    if (isVisibleRef.current === nextVisible) return;
    isVisibleRef.current = nextVisible;
    setIsVisible(nextVisible);
  }, []);

  const showHeader = useCallback(() => {
    if (typeof window !== "undefined") {
      lastScrollYRef.current = window.scrollY;
    }
    setVisible(true);
  }, [setVisible]);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const update = () => {
      frameRef.current = null;

      const currentScrollY = Math.max(window.scrollY, 0);
      const scrollDelta = currentScrollY - lastScrollYRef.current;

      if (currentScrollY <= hideAfter) {
        lastScrollYRef.current = currentScrollY;
        setVisible(true);
        return;
      }

      if (Math.abs(scrollDelta) < delta) return;

      lastScrollYRef.current = currentScrollY;
      setVisible(scrollDelta < 0);
    };

    const onScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [delta, hideAfter, setVisible]);

  return { isVisible, showHeader };
}
