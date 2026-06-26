"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

function isWhatsAppHref(href: string) {
  if (!href) return false;

  try {
    const url = new URL(href, window.location.href);
    return (
      url.protocol === "whatsapp:" ||
      url.hostname === "wa.me" ||
      url.hostname.endsWith(".whatsapp.com")
    );
  } catch {
    return href.startsWith("whatsapp:") || href.includes("wa.me");
  }
}

export function MarketingEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPage = useRef("");
  const skipInitialMetaPageViewRef = useRef(true);

  useEffect(() => {
    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;
    const pageLocation = `${window.location.origin}${pagePath}`;

    if (lastTrackedPage.current === pageLocation) return;
    lastTrackedPage.current = pageLocation;

    window.gtag?.("event", "page_view", {
      page_title: document.title,
      page_location: pageLocation,
      page_path: pagePath,
    });

    if (skipInitialMetaPageViewRef.current) {
      skipInitialMetaPageViewRef.current = false;
      return;
    }

    window.fbq?.("track", "PageView");
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const link = event.target.closest("a");
      const href = link?.getAttribute("href") ?? "";

      if (!isWhatsAppHref(href)) return;

      const destination = link?.href || href;

      window.gtag?.("event", "whatsapp_click", {
        event_category: "engagement",
        event_label: destination,
      });
      window.fbq?.("track", "Lead", {
        content_name: "WhatsApp click",
      });
      window.fbq?.("trackCustom", "WhatsAppClick", {
        destination,
      });
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}
