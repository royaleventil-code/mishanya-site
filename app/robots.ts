import type { MetadataRoute } from "next";
import { SITE_URL, siteUrl } from "@/lib/seo";

export const dynamic = "force-static";

// AI-краулеры (поиск и ассистенты) - явно разрешены для видимости в ChatGPT/Claude/Perplexity и т.д.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Bingbot",
  "Google-Extended",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: AI_BOTS,
        allow: "/",
        disallow: ["/admin/"],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/"],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
    host: SITE_URL.replace(/^https?:\/\//, ""),
  };
}
