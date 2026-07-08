"use client";

import { MotionConfig } from "framer-motion";
import { useEffect, useSyncExternalStore } from "react";
import {
  getA11yServerState,
  getA11yState,
  hydrateA11y,
  subscribeA11y,
} from "@/lib/a11y";

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribeA11y, getA11yState, getA11yServerState);

  useEffect(() => {
    hydrateA11y();
  }, []);

  return (
    <MotionConfig reducedMotion={state.stopAnimations ? "always" : "user"}>
      {children}
    </MotionConfig>
  );
}
