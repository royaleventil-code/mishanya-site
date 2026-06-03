import type { MetadataRoute } from "next";
import { SITE_URL, siteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/boy/", "/girl/", "/baby/"],
    },
    sitemap: siteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
