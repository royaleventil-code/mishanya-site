"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useRef, type ReactNode } from "react";

export function DocumentBootScripts({ children }: { children: ReactNode }) {
  const inserted = useRef(false);

  // Keep the inline scripts in the initial head, outside the tree React hydrates.
  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return children;
  });

  return null;
}
