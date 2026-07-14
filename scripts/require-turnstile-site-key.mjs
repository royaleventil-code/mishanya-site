const siteKey = String(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "").trim();

if (!siteKey) {
  console.error("NEXT_PUBLIC_TURNSTILE_SITE_KEY is required for a Cloudflare Pages production build.");
  process.exit(1);
}

if (!/^[A-Za-z0-9_-]{20,128}$/.test(siteKey)) {
  console.error("NEXT_PUBLIC_TURNSTILE_SITE_KEY has an invalid format.");
  process.exit(1);
}

console.log("Turnstile public site key is configured.");
