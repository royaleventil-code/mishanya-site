"use client";

import Link from "next/link";
import { useEffect } from "react";
import { localePath, type Locale } from "@/lib/i18n";

export function QuestCatalogRedirect({ locale = "ru" }: { locale?: Locale }) {
  const href = `${localePath(locale, "/all")}?quests=1`;
  useEffect(() => { window.location.replace(href); }, [href]);
  return <main id="main" className="px-5 py-20 text-center"><h1 className="text-3xl font-black">{locale === "he" ? "הקווסטים נמצאים בקטלוג התוכניות" : "Квесты находятся в каталоге программ"}</h1><Link href={href} className="mt-6 inline-block underline">{locale === "he" ? "לתוכניות ולבחירת גיל" : "Перейти к программам и выбрать возраст"}</Link></main>;
}
