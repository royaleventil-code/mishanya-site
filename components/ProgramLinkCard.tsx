import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BidiText } from "@/components/BidiText";
import { localePath, type Locale } from "@/lib/i18n";
import { formatProgramPriceLabel } from "@/lib/prices";

type ProgramLike = {
  id: string;
  title: string;
  tagline?: string;
  priceFrom: number;
};

/** Компактная карточка-ссылка на страницу программы (города, «похожие программы») */
export function ProgramLinkCard({ locale, program }: { locale: Locale; program: ProgramLike }) {
  return (
    <Link
      href={localePath(locale, `/programs/${program.id}`)}
      className="apple-glass group flex h-full flex-col rounded-2xl px-4 py-3 transition hover:shadow-[0_10px_28px_rgba(15,15,20,0.08)]"
    >
      <span className="flex items-center justify-between gap-2 font-semibold">
        <BidiText locale={locale}>{program.title}</BidiText>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-[var(--color-ink-soft)] transition group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
          strokeWidth={2.2}
        />
      </span>
      {program.tagline && (
        <span className="mt-0.5 text-sm text-[var(--color-ink-soft)]">
          <BidiText locale={locale}>{program.tagline}</BidiText>
        </span>
      )}
      <span className="mt-auto pt-1.5 text-sm font-semibold tabular-nums">
        {formatProgramPriceLabel(program.id, program.priceFrom, locale)}
      </span>
    </Link>
  );
}
