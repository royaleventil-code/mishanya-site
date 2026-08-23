import type { ReactNode } from "react";
import { formatBidiText } from "@/components/BidiText";
import type { Locale } from "@/lib/i18n";

/**
 * Текст с выделением: куски в **двойных звёздочках** становятся жирными
 * и красятся в основной цвет чернил - так абзац читается взглядом,
 * а не сплошной серой стеной. Разметка живёт прямо в копирайте,
 * чтобы правки текста не требовали лезть в вёрстку.
 */
export function EmphasisText({ locale, children }: { locale: Locale; children: string }) {
  const parts: ReactNode[] = [];

  children.split(/(\*\*[^*]+\*\*)/g).forEach((chunk, index) => {
    if (!chunk) return;
    const bold = chunk.startsWith("**") && chunk.endsWith("**");
    const value = bold ? chunk.slice(2, -2) : chunk;
    parts.push(
      bold ? (
        <strong key={index} className="font-bold text-[var(--color-ink)]">
          {formatBidiText(value, locale)}
        </strong>
      ) : (
        <span key={index}>{formatBidiText(value, locale)}</span>
      ),
    );
  });

  return <>{parts}</>;
}
