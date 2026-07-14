"use client";

import { useEffect, useRef, useState } from "react";
import type { RsvpLocale } from "@/lib/rsvp";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          language?: string;
          action?: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
export const RSVP_TURNSTILE_ENABLED = Boolean(SITE_KEY);

export function RsvpTurnstile({
  locale,
  action,
  onTokenChange,
  resetKey = 0,
}: {
  locale: RsvpLocale;
  action: "rsvp_create" | "rsvp_response";
  onTokenChange: (token: string) => void;
  resetKey?: number;
}) {
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  const callbackRef = useRef(onTokenChange);

  useEffect(() => {
    callbackRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    if (!SITE_KEY) return;
    const markReady = () => {
      if (window.turnstile) setReady(true);
    };
    if (window.turnstile) {
      const frame = window.requestAnimationFrame(markReady);
      return () => window.cancelAnimationFrame(frame);
    }
    const existing = document.querySelector<HTMLScriptElement>('script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]');
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", markReady);
    if (!existing) {
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    const fallback = window.setTimeout(markReady, 4000);
    return () => {
      window.clearTimeout(fallback);
      script.removeEventListener("load", markReady);
    };
  }, []);

  useEffect(() => {
    if (!SITE_KEY || !ready || !window.turnstile || !containerRef.current || widgetRef.current) return;
    widgetRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme: "light",
      language: locale,
      action,
      callback: (token) => callbackRef.current(token),
      "expired-callback": () => callbackRef.current(""),
      "error-callback": () => callbackRef.current(""),
    });
  }, [action, locale, ready]);

  useEffect(() => {
    if (!resetKey || !widgetRef.current) return;
    window.turnstile?.reset(widgetRef.current);
    const frame = window.requestAnimationFrame(() => callbackRef.current(""));
    return () => window.cancelAnimationFrame(frame);
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div className="mt-5 flex min-h-[65px] justify-center" ref={containerRef} />;
}
