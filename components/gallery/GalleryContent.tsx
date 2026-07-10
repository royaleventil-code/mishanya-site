"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  CalendarCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  Languages,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { BidiText } from "@/components/BidiText";
import { PublicHeader } from "@/components/PublicHeader";
import {
  BOYS_4_5_PROOF,
  BOYS_6_10_PROOF,
  GIRLS_4_6_PROOF,
  GIRLS_7_10_PROOF,
  KIDS_1_3_PROOF,
  type ProofImage,
  type ProofLinkImage,
} from "@/data/social-proof";
import { getDictionary } from "@/lib/dictionaries";
import { type Locale } from "@/lib/i18n";
import { getPageCopy, localizeProofImageAlt, localizeProofLinkLabel } from "@/lib/page-copy";
import { WA_DISPLAY, getWhatsAppMessages, whatsappLink } from "@/lib/whatsapp";

const FB_REVIEWS = "https://www.facebook.com/royaleventisrael/reviews/?ref=page_internal";
const YT_CHANNEL = "https://www.youtube.com/channel/UCo189jVSku-2H_0Rgrw9JCw";
const INSTAGRAM = "https://www.instagram.com/show.mishanya/";
const PROOF_SETS = [
  KIDS_1_3_PROOF,
  BOYS_4_5_PROOF,
  BOYS_6_10_PROOF,
  GIRLS_4_6_PROOF,
  GIRLS_7_10_PROOF,
];

// All real event-photo collages from every age/segment, de-duplicated by src.
const GALLERY: ProofImage[] = dedupe(PROOF_SETS.flatMap((set) => set.gallery));
// Real review screenshots (keep their Facebook links + hotspots intact).
const REVIEWS: ProofLinkImage[] = dedupe(PROOF_SETS.flatMap((set) => set.reviews));
// Real video pages with clickable YouTube hotspots.
const MEDIA: ProofLinkImage[] = dedupe(PROOF_SETS.flatMap((set) => set.media));

function dedupe<T extends { src: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.src)) return false;
    seen.add(item.src);
    return true;
  });
}

const TRUST = [
  { icon: Camera },
  { icon: ShieldCheck },
  { icon: Palette },
  { icon: CalendarCheck },
  { icon: Languages },
  { icon: BadgeCheck },
];

const Stars = () => (
  <span className="text-[#ffb400]" aria-hidden="true">
    ★★★★★
  </span>
);

export default function GalleryContent({ locale = "ru" }: { locale?: Locale }) {
  const reduce = useReducedMotion();
  const copy = getPageCopy(locale).gallery;
  const dict = getDictionary(locale);
  const waMessages = getWhatsAppMessages(locale);
  const ArrowIcon = locale === "he" ? ChevronLeft : ChevronRight;

  const card = (i: number) => ({
    initial: reduce ? false : { opacity: 0, scale: 0.96 },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.5, delay: (i % 6) * 0.05 },
  });

  return (
    <main id="main" className="min-h-screen overflow-x-hidden bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader locale={locale} />

      {/* Hero */}
      <section className="px-5 pt-14 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-girl)]">
            {copy.hero.eyebrow}
          </p>
          <h1 className="mt-3 max-w-4xl break-words font-[family-name:var(--font-nunito)] text-[34px] font-black leading-tight tracking-tight sm:text-6xl">
            {copy.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
            <BidiText locale={locale}>{copy.hero.description}</BidiText>
          </p>

          {/* Rating */}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-3xl leading-none sm:text-4xl">
              <Stars />
            </span>
            <span className="text-base font-bold text-zinc-900 sm:text-lg">
              <BidiText locale={locale}>{copy.hero.rating}</BidiText>
            </span>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={FB_REVIEWS}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 active:scale-95"
            >
              <BidiText locale={locale}>{copy.hero.facebook}</BidiText>
              <ArrowIcon className="h-4 w-4" strokeWidth={2.6} />
            </a>
            <a
              href={YT_CHANNEL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white px-5 py-3 text-sm font-bold text-zinc-900 ring-1 ring-black/10 transition hover:bg-zinc-50 active:scale-95"
            >
              <BidiText locale={locale}>{copy.hero.youtube}</BidiText>
              <ArrowIcon className="h-4 w-4" strokeWidth={2.6} />
            </a>
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white px-5 py-3 text-sm font-bold text-zinc-900 ring-1 ring-black/10 transition hover:bg-zinc-50 active:scale-95"
            >
              <BidiText locale={locale}>Instagram</BidiText>
              <ArrowIcon className="h-4 w-4" strokeWidth={2.6} />
            </a>
          </div>

          {/* Trust strip */}
          <div className="hide-scrollbar mt-8 flex gap-2.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
            {TRUST.map(({ icon: Icon }, index) => {
              const label = copy.trust[index];
              return (
              <span
                key={label}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]"
              >
                <Icon className="h-4 w-4 text-[var(--color-girl)]" strokeWidth={2.4} />
                <BidiText locale={locale}>{label}</BidiText>
              </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gallery of real event photos */}
      <section className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-young)]">
            {copy.photos.eyebrow}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[28px] font-black leading-tight tracking-tight sm:text-4xl">
            {copy.photos.title}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
            <BidiText locale={locale}>{copy.photos.description}</BidiText>
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {GALLERY.map((item, i) => (
              <motion.figure
                key={item.src}
                {...card(i)}
                className="relative aspect-[837/1482] overflow-hidden rounded-[var(--radius-card)] bg-zinc-100 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]"
              >
                <Image
                  src={item.src}
                  alt={localizeProofImageAlt(locale, "gallery", item.alt)}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover"
                />
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews - real screenshots in a horizontal scroll row */}
      <section id="reviews" className="bg-white px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-all-seg)]">
            {copy.reviews.eyebrow}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[28px] font-black leading-tight tracking-tight sm:text-4xl">
            {copy.reviews.title}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-2xl leading-none">
              <Stars />
            </span>
            <span className="text-base font-bold text-zinc-900"><BidiText locale={locale}>{copy.reviews.rating}</BidiText></span>
            <span className="text-sm text-[var(--color-ink-soft)]"><BidiText locale={locale}>{copy.reviews.suffix}</BidiText></span>
          </div>

          <div className="hide-scrollbar mt-8 flex gap-3 overflow-x-auto pb-2 sm:gap-4">
            {REVIEWS.map((item, i) => (
              <ReviewTile key={item.src} item={item} locale={locale} motionProps={card(i)} />
            ))}
          </div>

          <div className="mt-6">
            <a
              href={FB_REVIEWS}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 active:scale-95"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2.4} />
              <BidiText locale={locale}>{copy.reviews.allFacebook}</BidiText>
              <ArrowIcon className="h-4 w-4" strokeWidth={2.6} />
            </a>
          </div>
        </div>
      </section>

      {/* Video - real YouTube hotspots */}
      <section className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--color-girl)]">
            {copy.videos.eyebrow}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-[28px] font-black leading-tight tracking-tight sm:text-4xl">
            {copy.videos.title}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
            <BidiText locale={locale}>{copy.videos.description}</BidiText>
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {MEDIA.map((item, i) => (
              <MediaTile key={item.src} item={item} locale={locale} motionProps={card(i)} />
            ))}
          </div>

          <div className="mt-6">
            <a
              href={YT_CHANNEL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white px-5 py-3 text-sm font-bold text-zinc-900 ring-1 ring-black/10 transition hover:bg-zinc-50 active:scale-95"
            >
              <BidiText locale={locale}>{copy.videos.allYoutube}</BidiText>
              <ArrowIcon className="h-4 w-4" strokeWidth={2.6} />
            </a>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-[#0f0f14] px-6 py-14 text-center sm:px-10 sm:py-20">
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#ff375f] opacity-30 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-[#5e5ce6] opacity-30 blur-[90px]" />

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="text-2xl text-[#ffb400]" aria-hidden="true">
              ★★★★★
            </div>
            <h2 className="mx-auto mt-3 max-w-2xl font-[family-name:var(--font-nunito)] text-[30px] font-black leading-tight tracking-tight text-white sm:text-5xl">
              {copy.finalCta.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
              <BidiText locale={locale}>{copy.finalCta.description}</BidiText>
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={whatsappLink(waMessages.default)}
                target="_blank"
                rel="noreferrer"
                className="cta-glow inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-8 py-4 text-base font-black text-white transition active:scale-95"
                style={{ ["--cta-glow-color" as unknown as string]: "rgba(37,211,102,0.45)" }}
              >
                <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
                <BidiText locale={locale}>{dict.common.writeWhatsapp}</BidiText>
              </a>
              <a
                href={`tel:${WA_DISPLAY.replace(/[^+\d]/g, "")}`}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/25 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10 active:scale-95"
              >
                <Phone className="h-5 w-5" strokeWidth={2.4} />
                <bdi dir="ltr">{WA_DISPLAY}</bdi>
              </a>
            </div>
            <p className="mt-5 inline-flex items-center justify-center gap-1.5 text-sm text-white/55">
              <MapPin className="h-4 w-4" strokeWidth={2.2} />
              <BidiText locale={locale}>{copy.finalCta.map}</BidiText>
            </p>
          </motion.div>
        </div>
      </section>

    </main>
  );
}

type MotionProps = {
  initial: boolean | { opacity: number; scale: number };
  whileInView: { opacity: number; scale: number };
  viewport: { once: boolean; amount: number };
  transition: { duration: number; delay: number };
};

function ReviewTile({
  item,
  locale,
  motionProps,
}: {
  item: ProofLinkImage;
  locale: Locale;
  motionProps: MotionProps;
}) {
  // A whole-tile link if a single Facebook link is attached; otherwise overlay hotspots.
  const activeLinks = item.links?.filter((link) => link.href) ?? [];
  const activeHotspots = item.hotspots?.filter((h) => h.href) ?? [];
  const wholeLink =
    activeLinks.length > 0 && activeHotspots.length === 0 ? activeLinks[0] : undefined;

  const tile = (
    <motion.div
      {...motionProps}
      className="relative aspect-[837/1482] w-[220px] shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-zinc-100 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] sm:w-[260px]"
    >
      <Image
        src={item.src}
        alt={localizeProofImageAlt(locale, "review", item.alt)}
        fill
        sizes="260px"
        className="object-cover"
      />
      {activeHotspots.map((hotspot) => (
        <a
          key={hotspot.label}
          href={hotspot.href}
          target="_blank"
          rel="noreferrer"
          aria-label={localizeProofLinkLabel(locale, hotspot.label)}
          title={localizeProofLinkLabel(locale, hotspot.label)}
          className="absolute rounded-lg focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-boy)]"
          style={{
            left: `${hotspot.rect.left}%`,
            top: `${hotspot.rect.top}%`,
            width: `${hotspot.rect.width}%`,
            height: `${hotspot.rect.height}%`,
          }}
        />
      ))}
    </motion.div>
  );

  if (wholeLink) {
    return (
      <a
        href={wholeLink.href}
        target="_blank"
        rel="noreferrer"
        aria-label={localizeProofLinkLabel(locale, wholeLink.label)}
        title={localizeProofLinkLabel(locale, wholeLink.label)}
        className="shrink-0 transition active:scale-[0.98]"
      >
        {tile}
      </a>
    );
  }

  return tile;
}

function MediaTile({
  item,
  locale,
  motionProps,
}: {
  item: ProofLinkImage;
  locale: Locale;
  motionProps: MotionProps;
}) {
  const activeHotspots = item.hotspots?.filter((h) => h.href) ?? [];

  return (
    <motion.figure
      {...motionProps}
      className="relative aspect-[837/1482] overflow-hidden rounded-[var(--radius-card)] bg-zinc-100 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]"
    >
      <Image
        src={item.src}
        alt={localizeProofImageAlt(locale, "media", item.alt)}
        fill
        sizes="(min-width: 640px) 33vw, 50vw"
        className="object-cover"
      />
      {activeHotspots.map((hotspot) => (
        <a
          key={hotspot.label}
          href={hotspot.href}
          target="_blank"
          rel="noreferrer"
          aria-label={localizeProofLinkLabel(locale, hotspot.label)}
          title={localizeProofLinkLabel(locale, hotspot.label)}
          className="absolute rounded-lg focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-girl)]"
          style={{
            left: `${hotspot.rect.left}%`,
            top: `${hotspot.rect.top}%`,
            width: `${hotspot.rect.width}%`,
            height: `${hotspot.rect.height}%`,
          }}
        />
      ))}
    </motion.figure>
  );
}
