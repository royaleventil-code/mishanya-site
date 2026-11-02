"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Clock3, Compass, Languages, MapPin, Puzzle, Users, X } from "lucide-react";
import { getQuestsForAge, QUEST_CATEGORIES, QUEST_COPY, QUEST_PRICE_FROM, type Quest } from "@/data/quests";
import { getQuestStartingPrice } from "@/data/quest-pricing";
import type { Locale } from "@/lib/i18n";
import { formatShekelPrice } from "@/lib/prices";
import { QuestPricing, QuestPriceAmount } from "./QuestPricing";
import s from "./quest-menu.module.css";

function rangeLabel(value: readonly [number, number] | number): string {
  return typeof value === "number" ? String(value) : `${value[0]}–${value[1]}`;
}

function ageLabel(age: number, locale: Locale): string {
  if (age >= 18) return "18+";
  if (locale === "he") return `גיל ${age}`;
  return `${age} лет`;
}

function QuestDetails({ quest, locale, age, first }: { quest: Quest; locale: Locale; age: number; first: boolean }) {
  const copy = QUEST_COPY[locale];
  const startingPrice = getQuestStartingPrice(quest);
  return (
    <details data-quest-id={quest.id} className={s.quest} name="quest-description" open={first}>
      <summary><div className={s.summaryText}><h3>{quest.title[locale]}</h3>{startingPrice !== null && <span className={s.summaryPrice}><QuestPriceAmount amount={startingPrice} locale={locale} from />{quest.category === "adults" && (locale === "he" ? " + אלכוהול" : " + алкоголь")}</span>}</div><ChevronDown size={19} aria-hidden /></summary>
      <div className={s.description}>
        <p>{quest.description[locale]}</p>
        <dl className={s.facts}>
          <div><dt><Users size={15} aria-hidden />{copy.age}</dt><dd><bdi dir="ltr">{typeof quest.age === "number" ? `${quest.age}+` : rangeLabel(quest.age)}</bdi></dd></div>
          <div><dt><Clock3 size={15} aria-hidden />{copy.duration}</dt><dd>{quest.minutes === null ? copy.onRequest : <><bdi dir="ltr">{rangeLabel(quest.minutes)}</bdi> {copy.minutes}</>}</dd></div>
          <div><dt><Users size={15} aria-hidden />{copy.players}</dt><dd><bdi dir="ltr">{rangeLabel(quest.players)}</bdi></dd></div>
          <div><dt><Compass size={15} aria-hidden />{copy.hosts}</dt><dd><bdi dir="ltr">{rangeLabel(quest.hosts)}</bdi></dd></div>
        </dl>
        <p className={s.extra}><Languages size={16} aria-hidden />{quest.languages.map((language) => copy.languageNames[language]).join(" · ")}</p>
        {quest.location && <p className={s.extra}><MapPin size={16} aria-hidden />{quest.location[locale]}</p>}
        <QuestPricing quest={quest} locale={locale} age={age} />
      </div>
    </details>
  );
}

export function QuestCatalogEntry({ locale = "ru", age, accent }: { locale?: Locale; age?: number; accent: string }) {
  const copy = QUEST_COPY[locale];
  const [open, setOpen] = useState(false);
  const [chosenAge, setChosenAge] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const effectiveAge = age ?? (chosenAge ? Number(chosenAge) : undefined);
  const matching = getQuestsForAge(effectiveAge);
  const hasEntry = age === undefined || getQuestsForAge(age).length > 0;
  const hasAge = effectiveAge !== undefined;
  const ageText = hasAge ? ageLabel(effectiveAge, locale) : "";
  const count = matching.length;
  const countLabel = locale === "he" ? `${count} ${count === 1 ? "קווסט" : "קווסטים"}`
    : `${count} ${count % 10 === 1 && count % 100 !== 11 ? "квест" : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? "квеста" : "квестов"}`;

  const close = useCallback(() => {
    setOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("quests");
    url.searchParams.delete("questAge");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    const syncFromUrl = () => {
      const query = new URLSearchParams(window.location.search);
      setOpen(hasEntry && query.get("quests") === "1" && !query.has("program"));
      const queryAge = Number(query.get("questAge"));
      if (Number.isInteger(queryAge) && queryAge >= 5 && queryAge <= 18) setChosenAge(String(queryAge));
    };
    const timer = window.setTimeout(syncFromUrl, 0);
    window.addEventListener("popstate", syncFromUrl);
    return () => { window.clearTimeout(timer); window.removeEventListener("popstate", syncFromUrl); };
  }, [hasEntry]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key !== "Tab") return;
      const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button, select, summary, a[href]') ?? []).filter((node) => node.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKey); };
  }, [open, close]);

  if (!hasEntry) return null;

  const openMenu = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("program");
    url.searchParams.set("quests", "1");
    if (age === undefined && chosenAge) url.searchParams.set("questAge", chosenAge);
    window.history.pushState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    setOpen(true);
  };

  return (
    <>
      <button ref={triggerRef} id="quests" type="button" aria-label={copy.title} aria-describedby="quest-entry-price" aria-haspopup="dialog" aria-expanded={open} onClick={openMenu} className={s.entry} style={{ "--quest-accent": accent } as CSSProperties}>
        <div className={s.cover} aria-hidden="true"><span className={s.route} /><Compass className={s.coverCompass} size={48} strokeWidth={1.3} /><Puzzle size={94} strokeWidth={1.35} /><span className={s.coverStar}>✦</span></div>
        <div className={s.entryText}><h2>{copy.title}</h2><p>{locale === "he" ? "הרפתקאות, תעלומות ומשחקי חשיבה" : "Приключения, загадки и сюжетные игры"}</p><span id="quest-entry-price" className={s.pricePill}>{locale === "he" ? "החל מ־" : "от "}<bdi dir="ltr">{formatShekelPrice(QUEST_PRICE_FROM, locale)}</bdi></span><span className={s.agePill}>{age === undefined ? (locale === "he" ? "בחרו את גיל המשתתפים" : "Выберите возраст участников") : `${ageText} · ${countLabel}`}</span><span className={s.openLabel}>{locale === "he" ? "לצפייה בקווסטים" : "Выбрать квест"}<ChevronDown size={16} aria-hidden /></span></div>
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div className={s.backdrop} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="quest-menu-title" aria-describedby="quest-menu-intro" dir={locale === "he" ? "rtl" : "ltr"} className={s.dialog} style={{ "--quest-accent": accent } as CSSProperties}>
            <header className={s.header}><div><p>{locale === "he" ? "תוכניות לאירוע שלכם" : "Программы для вашего праздника"}</p><h2 id="quest-menu-title">{copy.title}{hasAge && <span>{ageText}</span>}</h2></div><button ref={closeRef} type="button" onClick={close} aria-label={locale === "he" ? "סגירת הקווסטים" : "Закрыть квесты"} className={s.close}><X size={22} aria-hidden /></button></header>
            <div className={s.body}>
              <p id="quest-menu-intro" className={s.intro}>{hasAge ? (locale === "he" ? "כאן מופיעים רק קווסטים המתאימים לגיל שבחרתם. פתחו קווסט כדי לקרוא את הפרטים." : "Здесь только квесты, подходящие выбранному возрасту. Откройте название, чтобы прочитать описание.") : (locale === "he" ? "בחרו גיל ונציג רק קווסטים שמתאימים למשתתפים." : "Выберите возраст — покажем только подходящие участникам квесты.")}</p>
              {age === undefined && <div className={s.ageChoice}><label htmlFor="quest-age">{locale === "he" ? "גיל המשתתפים" : "Возраст участников"}</label><select id="quest-age" value={chosenAge} onChange={(event) => { setChosenAge(event.target.value); const url = new URL(window.location.href); if (event.target.value) url.searchParams.set("questAge", event.target.value); else url.searchParams.delete("questAge"); window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`); }}><option value="">{locale === "he" ? "בחרו גיל" : "Выберите возраст"}</option>{Array.from({ length: 14 }, (_, index) => index + 5).map((item) => <option key={item} value={item}>{ageLabel(item, locale)}</option>)}</select></div>}
              {hasAge && QUEST_CATEGORIES.map((group) => {
                const quests = matching.filter((quest) => quest.category === group.id);
                if (!quests.length) return null;
                return <section key={group.id} className={s.group} aria-labelledby={`quest-group-${group.id}`}><h3 id={`quest-group-${group.id}`}>{group.title[locale]}</h3>{quests.map((quest) => <QuestDetails key={quest.id} quest={quest} locale={locale} age={effectiveAge} first={quest.id === matching[0]?.id} />)}</section>;
              })}
              {hasAge && matching.length > 0 && <aside className={s.custom}><h3>{effectiveAge < 18 ? (locale === "he" ? "קווסט לילדים עם תסריט אישי" : "Детский квест по индивидуальному сценарию") : copy.customTitle}</h3><p>{locale === "he" ? "יש לכם רעיון משלכם? נדבר על התאמת הסיפור והמשימות לגיל המשתתפים." : "Есть своя идея? Обсудим сюжет и задания под возраст участников."}</p><QuestPricing locale={locale} age={effectiveAge} /></aside>}
            </div>
          </div>
        </div>, document.body,
      )}
    </>
  );
}
