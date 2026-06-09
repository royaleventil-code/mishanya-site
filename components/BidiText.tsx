import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";

const MIXED_PATTERN = /[A-Za-z0-9₪+]/;
const LTR_FRAGMENT_PATTERN =
  /(\([A-Za-z][A-Za-z0-9@.+&'-]*(?:\s*\/\s*[A-Za-z][A-Za-z0-9@.+&'-]*)*(?:\s+[A-Za-z][A-Za-z0-9@.+&'-]*(?:\s*\/\s*[A-Za-z][A-Za-z0-9@.+&'-]*)*)*\)|\+?\d(?:[\d\s.,:/-]*\d)?(?:\s*(?:₪|[A-Za-z]+)|[+%★])?|[A-Za-z][A-Za-z0-9@.+&'-]*(?:\s*\/\s*[A-Za-z][A-Za-z0-9@.+&'-]*)*(?:\s+[A-Za-z][A-Za-z0-9@.+&'-]*(?:\s*\/\s*[A-Za-z][A-Za-z0-9@.+&'-]*)*)*)/g;

type BidiTextProps = {
  locale: Locale;
  children?: string | null;
};

export function BidiText({ locale, children }: BidiTextProps) {
  return <>{formatBidiText(children ?? "", locale)}</>;
}

export function formatBidiText(text: string, locale: Locale): ReactNode {
  if (locale !== "he" || !MIXED_PATTERN.test(text)) {
    return text;
  }

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let partIndex = 0;

  for (const match of text.matchAll(LTR_FRAGMENT_PATTERN)) {
    const value = match[0];
    const index = match.index ?? 0;
    if (!value.trim()) continue;

    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }

    parts.push(
      <bdi key={`${index}-${partIndex}`} dir="ltr" className="whitespace-nowrap">
        {value}
      </bdi>,
    );
    lastIndex = index + value.length;
    partIndex += 1;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
