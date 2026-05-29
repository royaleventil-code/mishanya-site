import { ExternalLink, Globe2 } from "lucide-react";
import {
  KIDS_1_3_PROOF,
  SOCIAL_LINKS,
  type ProofImage,
  type ProofLink,
  type ProofLinkImage,
  type ProofSet,
} from "@/data/social-proof";

export function SocialProofSection({ proofSet = KIDS_1_3_PROOF }: { proofSet?: ProofSet }) {
  return (
    <section className="px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <p className="text-sm font-bold text-[var(--color-ink-soft)]">
            Фото и отзывы
          </p>
          <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
            Праздники, которые уже прошли
          </h2>
        </div>

        <ProofGrid title="Фото наших праздников" items={proofSet.gallery} />
        <ProofGrid title="Отзывы родителей" items={proofSet.reviews} variant="review" />
        <ProofMediaGrid title="Видео и контакты" items={proofSet.media} />
      </div>
    </section>
  );
}

function ProofGrid({
  title,
  items,
  variant = "photo",
}: {
  title: string;
  items: ProofImage[];
  variant?: "photo" | "review";
}) {
  return (
    <div className="mt-8">
      <h3 className="mb-3 text-xl font-black">{title}</h3>
      <div
        className={
          variant === "review"
            ? "grid gap-4 md:grid-cols-3"
            : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {items.map((item) => (
          <ProofImageCard key={item.src} item={item} />
        ))}
      </div>
    </div>
  );
}

function ProofMediaGrid({ title, items }: { title: string; items: ProofLinkImage[] }) {
  return (
    <div className="mt-8">
      <h3 className="mb-3 text-xl font-black">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <ProofImageCard key={item.src} item={item} />
        ))}
        <SocialLinksCard links={SOCIAL_LINKS} />
      </div>
    </div>
  );
}

function SocialLinksCard({ links }: { links: ProofLink[] }) {
  return (
    <div className="rounded-3xl border border-[var(--color-line)] bg-white p-5 shadow-[var(--shadow-card)]">
      <p className="text-sm font-bold text-[var(--color-ink-soft)]">Мы онлайн</p>
      <h4 className="mt-2 text-2xl font-black leading-tight">Наши соцсети</h4>
      <p className="mt-2 text-sm leading-snug text-[var(--color-ink-soft)]">
        Подпишитесь, смотрите видео с праздников и отзывы родителей.
      </p>
      <div className="mt-5 grid gap-3">
        {links.map((link) => (
          <SocialLinkItem key={link.label} link={link} />
        ))}
      </div>
    </div>
  );
}

function SocialLinkItem({ link }: { link: ProofLink }) {
  const brand = getSocialBrand(link.label);
  const content = (
    <>
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
        style={{ background: brand.iconBackground }}
      >
        <SocialIcon label={link.label} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black leading-tight" style={{ color: brand.text }}>
          {link.label}
        </span>
        <span className="mt-0.5 block text-xs font-medium" style={{ color: brand.subtext }}>
          {link.href ? "Открыть" : "Ссылка скоро"}
        </span>
      </span>
      <ExternalLink className="h-4 w-4 shrink-0" style={{ color: brand.subtext }} />
    </>
  );

  const className =
    "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition";
  const style = {
    background: brand.cardBackground,
    borderColor: brand.border,
  };

  if (link.href) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noreferrer"
        className={`${className} hover:-translate-y-0.5 hover:shadow-md`}
        style={style}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" disabled className={`${className} cursor-default`} style={style}>
      {content}
    </button>
  );
}

function getSocialBrand(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes("instagram")) {
    return {
      iconBackground: "linear-gradient(135deg, #f58529 0%, #dd2a7b 45%, #8134af 75%, #515bd4 100%)",
      cardBackground: "linear-gradient(135deg, rgba(245,133,41,0.12), rgba(221,42,123,0.10), rgba(81,91,212,0.10))",
      border: "rgba(221,42,123,0.28)",
      text: "#9f1239",
      subtext: "#7f1d5f",
    };
  }
  if (normalized.includes("facebook")) {
    return {
      iconBackground: "#1877f2",
      cardBackground: "rgba(24,119,242,0.09)",
      border: "rgba(24,119,242,0.24)",
      text: "#0b4ea2",
      subtext: "#315f9f",
    };
  }
  if (normalized.includes("youtube")) {
    return {
      iconBackground: "#ffffff",
      cardBackground: "rgba(255,0,51,0.08)",
      border: "rgba(255,0,51,0.22)",
      text: "#b00020",
      subtext: "#8f2a38",
    };
  }
  return {
    iconBackground: "linear-gradient(135deg, #111827, #334155)",
    cardBackground: "rgba(15,23,42,0.06)",
    border: "rgba(15,23,42,0.14)",
    text: "#0f172a",
    subtext: "#475569",
  };
}

function SocialIcon({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  if (normalized.includes("instagram")) return <InstagramGlyph />;
  if (normalized.includes("facebook")) return <FacebookGlyph />;
  if (normalized.includes("youtube")) return <YouTubeGlyph />;
  return <Globe2 className="h-5 w-5" strokeWidth={2.4} />;
}

function InstagramGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
      <rect x="7" y="7" width="18" height="18" rx="5.5" fill="none" stroke="currentColor" strokeWidth="2.7" />
      <circle cx="16" cy="16" r="4.2" fill="none" stroke="currentColor" strokeWidth="2.7" />
      <circle cx="21.4" cy="10.7" r="1.5" fill="currentColor" />
    </svg>
  );
}

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.1 27V17.3h3.2l.5-3.8h-3.7v-2.4c0-1.1.3-1.8 1.9-1.8h2V5.9c-.4-.1-1.6-.2-3-.2-3 0-5 1.8-5 5.1v2.8h-3.4v3.8H14V27h4.1Z"
      />
    </svg>
  );
}

function YouTubeGlyph() {
  return (
    <svg viewBox="0 0 36 28" className="h-6 w-7" aria-hidden="true">
      <rect x="2" y="4" width="32" height="20" rx="6" fill="#ff0033" />
      <path d="M15 10.5v7l6.5-3.5L15 10.5Z" fill="#ffffff" />
    </svg>
  );
}

function ProofImageCard({ item }: { item: ProofLinkImage }) {
  const activeLinks = item.links?.filter((link) => link.href) ?? [];
  const activeHotspots = item.hotspots?.filter((hotspot) => hotspot.href) ?? [];

  return (
    <figure className="overflow-hidden rounded-3xl border border-[var(--color-line)] bg-white shadow-[var(--shadow-card)]">
      <div className="relative aspect-[837/1482] bg-zinc-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.src}
          alt={item.alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {activeHotspots.map((hotspot) => (
          <a
            key={hotspot.label}
            href={hotspot.href}
            target="_blank"
            rel="noreferrer"
            aria-label={hotspot.label}
            title={hotspot.label}
            className="absolute rounded-lg focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-boy)]"
            style={{
              left: `${hotspot.rect.left}%`,
              top: `${hotspot.rect.top}%`,
              width: `${hotspot.rect.width}%`,
              height: `${hotspot.rect.height}%`,
            }}
          />
        ))}
      </div>
      {activeLinks.length > 0 && (
        <figcaption className="flex flex-wrap gap-2 border-t border-[var(--color-line)] p-3">
          {activeLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[var(--color-ink)] px-3 py-1.5 text-xs font-bold text-white"
            >
              {link.label}
            </a>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
