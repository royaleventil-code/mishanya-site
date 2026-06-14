# Analytics and indexing checklist

## Site environment variables

Set these variables in the production hosting environment before deploying:

- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: GA4 measurement ID, for example `G-XXXXXXXXXX`.
- `NEXT_PUBLIC_META_PIXEL_ID`: Meta Pixel ID.
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`: optional Google Search Console URL-prefix meta verification token.
- `NEXT_PUBLIC_SITE_URL`: keep as `https://mishanya-show.com` unless the production domain changes.

The site sends:

- GA4 `page_view` on initial page load and client-side navigation.
- GA4 `whatsapp_click` when a visitor clicks a WhatsApp link.
- Meta `PageView` on initial page load and client-side navigation.
- Meta `Lead` and custom `WhatsAppClick` when a visitor clicks a WhatsApp link.

## Google Search Console

Recommended verification: Domain property for `mishanya-show.com` with a DNS TXT record.

After verification:

1. Submit `https://mishanya-show.com/sitemap.xml`.
2. Inspect `https://mishanya-show.com/ru` and `https://mishanya-show.com/he`.
3. Check current indexed pages with `site:mishanya-show.com`.

If DNS access is not available, use a URL-prefix property and set the meta-token in `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.

## Google Analytics 4

1. Create or open a GA4 property for `mishanya-show.com`.
2. Copy the web stream measurement ID into `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
3. Deploy the site.
4. Open GA4 Realtime and visit the site to confirm events arrive.
5. Click a WhatsApp button and confirm `whatsapp_click`.

## Meta Pixel

1. Create or open the Meta Pixel in Events Manager.
2. Copy the Pixel ID into `NEXT_PUBLIC_META_PIXEL_ID`.
3. Deploy the site.
4. Use Events Manager Test Events or Meta Pixel Helper.
5. Confirm `PageView`, `Lead`, and `WhatsAppClick`.

## YouTube channel

Add `https://mishanya-show.com` to:

- channel description or channel links;
- default upload description for new videos;
- descriptions of important existing videos.
