/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Caveat } from "next/font/google";
import { Menu, Heart, Snowflake } from "lucide-react";
import { newYearPath } from "@/data/new-year";
import type { Locale } from "@/lib/i18n";
import s from "./new-year.module.css";

const handwriting = Caveat({ subsets: ["latin", "cyrillic"], weight: "500", display: "swap", variable: "--font-winter-hand" });

export function NewYearShell({ locale, programId, children }: { locale: Locale; programId?: string; children: React.ReactNode }) {
  const he = locale === "he";
  const home = newYearPath(locale);
  return <main id="main" className={`${s.page} ${handwriting.variable} ${programId ? s.detailPage : ""}`}>
    <header className={s.header}>
      <Link href={`/${locale}`} className={s.brand} aria-label={he ? "מישניה בארץ הפלאות — ראשי" : "Мишаня в Стране Чудес — главная"}>
        <img src={he ? "/logo-he.png" : "/logo-ru.png"} width="104" height="104" alt={he ? "מישניה בארץ הפלאות" : "Мишаня в Стране Чудес"} />
      </Link>
      <nav className={s.desktopNav} aria-label={he ? "ניווט" : "Навигация"}>
        <Link href={`${home}#programs`}>{he ? "התוכניות" : "Программы"}</Link>
        <a href="#memories">{he ? "וידאו" : "Видео"}</a>
        <a href="#reviews">{he ? "חוות דעת" : "Отзывы"}</a>
      </nav>
      <div className={s.headerTools}>
        <nav className={s.languages} aria-label={he ? "שפה" : "Язык"} dir="ltr">
          <Link href={newYearPath("ru", programId)} lang="ru" aria-current={!he ? "page" : undefined} aria-label="Русский">RU</Link>
          <span aria-hidden>/</span>
          <Link href={newYearPath("he", programId)} lang="he" aria-current={he ? "page" : undefined} aria-label="עברית">HE</Link>
        </nav>
        <details className={s.menu}>
          <summary aria-label={he ? "תפריט" : "Меню"}><Menu size={25} aria-hidden /></summary>
          <nav aria-label={he ? "תפריט האתר" : "Меню сайта"}>
            <Link href={home}>{he ? "תוכניות השנה החדשה" : "Новогодние программы"}</Link>
            <Link href={`/${locale}/all`}>{he ? "ימי הולדת" : "Дни рождения"}</Link>
            <Link href={`/${locale}/about`}>{he ? "עלינו" : "О нас"}</Link>
            <Link href={`/${locale}/contacts`}>{he ? "יצירת קשר" : "Контакты"}</Link>
          </nav>
        </details>
      </div>
    </header>
    {children}
    <footer className={s.footer}>
      <Snowflake size={25} aria-hidden />
      <p>{he ? "ניצור יחד זיכרונות קסומים" : "Создаём тёплые воспоминания"}</p>
      <span><Heart size={15} aria-hidden />{he ? "מישניה בארץ הפלאות" : "Мишаня в Стране Чудес"}</span>
      <nav><Link href={`/${locale}`}>{he ? "האתר הראשי" : "Основной сайт"}</Link><Link href={`/${locale}/accessibility`}>{he ? "נגישות" : "Доступность"}</Link></nav>
    </footer>
  </main>;
}
