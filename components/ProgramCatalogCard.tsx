import Link from "next/link";
import { Clock, MapPin, Users } from "lucide-react";
import { BidiText } from "@/components/BidiText";
import type { Program } from "@/lib/types";
import { getDictionary } from "@/lib/dictionaries";
import { localePath, type Locale } from "@/lib/i18n";
import { formatProgramPriceLabel, formatShekelPrice, hasStartingPrice } from "@/lib/prices";
import { SEGMENTS } from "@/lib/segments";

/**
 * Обложка для статичного контекста (нет пола/возраста): первое правило
 * audienceCovers без ограничений по аудитории (segment "all" или пустое) - 
 * та же семантика, что getProgramCover(program, "all", undefined) в каталоге.
 */
function staticProgramCover(program: Program): string | undefined {
  const universalRule = program.audienceCovers?.find(
    (rule) =>
      (!rule.segment || rule.segment === "all") &&
      !rule.gender &&
      rule.age === undefined &&
      rule.minAge === undefined &&
      rule.maxAge === undefined,
  );
  return universalRule?.cover ?? program.cover;
}

/**
 * Карточка программы 1:1 как в основном каталоге (ProgramsSection.ProgramCard),
 * но статичная ссылка на /{locale}/programs/{id} вместо модалки - для
 * SSG-страниц городов, площадок, сезонов и «похожих программ».
 */
export function ProgramCatalogCard({
  locale,
  program,
  accent = SEGMENTS.all.accent,
}: {
  locale: Locale;
  program: Program;
  accent?: string;
}) {
  const dict = getDictionary(locale);
  const indoorOnly = program.locations.length === 1 && program.locations[0] === "indoor";
  const cover = staticProgramCover(program);
  const price = formatShekelPrice(program.priceFrom, locale);
  const pricePrefix = hasStartingPrice(program.id)
    ? locale === "he"
      ? "החל מ־"
      : "от "
    : "";
  const isVipProgram = program.id === "mishanya";

  return (
    <Link
      href={localePath(locale, `/programs/${program.id}`)}
      className={`group block h-full text-start rounded-[28px] bg-white overflow-hidden shadow-[0_16px_40px_rgba(15,15,20,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,15,20,0.12)] focus:outline-none focus:ring-2 ${isVipProgram ? "vip-program-card" : ""}`}
      style={{ ["--tw-ring-color" as never]: accent }}
    >
      {/* Cover */}
      <div
        className="relative aspect-[4/3] flex items-center justify-center overflow-hidden"
        style={
          cover
            ? { background: "white" }
            : { background: "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(244,242,238,0.78))" }
        }
      >
        {!cover && (
          <>
            <div
              aria-hidden
              className="absolute inset-0 opacity-60 pointer-events-none"
              style={{
                background: "radial-gradient(circle at 50% 55%, rgba(255,255,255,0.82), transparent 65%)",
              }}
            />
            <span aria-hidden className="absolute top-5 left-6 text-[var(--color-ink)]/30 text-sm">✦</span>
            <span aria-hidden className="absolute bottom-6 right-8 text-white/60 text-xs">●</span>
            <span aria-hidden className="absolute top-8 right-10 text-white/40 text-xs">●</span>
          </>
        )}

        {cover ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={cover}
            alt={program.title}
            loading="lazy"
            className="relative z-10 w-full h-full object-cover"
            style={{ objectPosition: "center 30%" }}
          />
        ) : (
          <span className="relative z-10 text-7xl" style={{ filter: "drop-shadow(0 10px 28px rgba(15,15,20,0.12))" }}>
            {program.emoji}
          </span>
        )}

        {program.ruOnly && (
          <span className="absolute top-3 right-3 rounded-full bg-white/85 backdrop-blur px-2.5 py-1 text-[10px] font-medium text-[var(--color-ink-soft)] shadow-sm">
            {dict.catalog.labels.ruOnlyBadge}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5 text-center">
        <h3 className="text-xl font-bold tracking-tight"><BidiText locale={locale}>{program.title}</BidiText></h3>
        {program.tagline && (
          <p className="mt-0.5 text-xs text-[var(--color-ink-soft)] line-clamp-2">
            <BidiText locale={locale}>{program.tagline}</BidiText>
          </p>
        )}

        {indoorOnly && (
          <div
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
            style={{ background: `${accent}14`, color: "var(--color-ink)" }}
          >
            <MapPin className="h-3.5 w-3.5" strokeWidth={2.4} />
            {dict.catalog.labels.indoorOnly}
          </div>
        )}

        <div className="mt-2 flex items-center justify-center flex-wrap gap-x-2 gap-y-1.5">
          {/* Price pill */}
          <div className="apple-glass inline-flex items-baseline rounded-full px-3 py-1.5 text-sm font-bold text-[var(--color-ink)]" dir={locale === "he" ? undefined : "ltr"}>
            {locale === "he" ? (
              <>
                {pricePrefix && <span>{pricePrefix}</span>}
                <bdi dir="ltr" className="whitespace-nowrap">
                  {price}
                </bdi>
              </>
            ) : (
              formatProgramPriceLabel(program.id, program.priceFrom, locale)
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-ink-soft)]">
            <Clock className="w-3.5 h-3.5" strokeWidth={2.2} />
            <BidiText locale={locale}>{program.durationLabel}</BidiText>
          </span>

          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-ink-soft)]">
            <Users className="w-3.5 h-3.5" strokeWidth={2.2} />
            <BidiText locale={locale}>{program.maxKids === null ? dict.catalog.labels.unlimitedKids : dict.catalog.labels.upToKids(program.maxKids)}</BidiText>
          </span>
        </div>

        <div className="apple-glass-strong mt-4 inline-flex w-full items-center justify-center gap-1 rounded-full py-2.5 text-sm font-semibold text-[var(--color-ink)] transition group-hover:bg-white">
          {dict.catalog.labels.details}
          <span className={`transition ${locale === "he" ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"}`}>
            {dict.catalog.labels.detailsArrow}
          </span>
        </div>
      </div>
    </Link>
  );
}
