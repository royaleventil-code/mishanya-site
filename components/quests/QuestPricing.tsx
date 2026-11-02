"use client";

import { useState } from "react";
import { Gift, MessageCircle } from "lucide-react";
import { QUEST_COPY, questInquiryMessage, type Quest } from "@/data/quests";
import { getQuestGroupPrice, getQuestPriceRows, getQuestPricingKind, getQuestPricingSpec, QUEST_ALCOHOL_EXTRAS, type QuestPricingKind, type QuestVenue } from "@/data/quest-pricing";
import type { Locale } from "@/lib/i18n";
import { formatLocalizedPriceAmount, formatShekelPrice } from "@/lib/prices";
import { whatsappLink } from "@/lib/whatsapp";
import s from "./quest-menu.module.css";

export function QuestPriceAmount({ amount, locale, from = false }: { amount: number; locale: Locale; from?: boolean }) {
  return <>{from && (locale === "he" ? "החל מ־" : "от ")}<bdi dir="ltr">{formatShekelPrice(amount, locale)}</bdi></>;
}

const COPY = {
  ru: {
    price: "Стоимость", organization: "Организация квеста", group: "Участники", total: "Цена за всю группу", client: "На вашей площадке", jaffa: "Старинный дом в Яффо",
    venue: "Площадка", houseTime: "Площадка в Яффо предоставляется на 3 часа. Длительность самой игры указана выше.",
    gift: "Памятный подарок каждому участнику в конце детского квеста.", extra: "Свыше 20 участников: за каждого дополнительного участника",
    unknown: (count: number) => `Для групп более ${count} участников стоимость уточняется по запросу.`,
    alcohol: "Алкоголь оплачивается дополнительно. Ориентировочный бюджет зависит от выбора напитков.", bars: "бара", moreBars: "баров",
  },
  he: {
    price: "מחיר", organization: "ארגון הקווסט", group: "משתתפים", total: "מחיר לכל הקבוצה", client: "במקום שלכם", jaffa: "בית עתיק ביפו",
    venue: "מקום הפעילות", houseTime: "המקום ביפו עומד לרשותכם ל־3 שעות. משך המשחק עצמו מופיע למעלה.",
    gift: "מזכרת לכל משתתף בסיום הקווסט לילדים.", extra: "מעל 20 משתתפים: לכל משתתף נוסף",
    unknown: (count: number) => `לקבוצות של יותר מ־${count} משתתפים המחיר ייקבע בפנייה אלינו.`,
    alcohol: "אלכוהול בתשלום נוסף. התקציב המשוער תלוי בבחירת המשקאות.", bars: "ברים", moreBars: "ברים",
  },
};

export function QuestPricing({ quest, locale, age }: { quest?: Quest; locale: Locale; age: number }) {
  const [venue, setVenue] = useState<QuestVenue>("client");
  const copy = COPY[locale];
  const kind: QuestPricingKind | null = quest ? getQuestPricingKind(quest) : age < 18 ? "customKids" : "custom";
  const spec = kind ? getQuestPricingSpec(kind, venue) : null;
  const rows = kind ? getQuestPriceRows(kind, quest?.players, venue) : [];
  const capacity = quest?.players[1] ?? Infinity;
  const extraRange = kind && spec?.extraParticipant && Number.isFinite(capacity) && capacity > 20
    ? { min: getQuestGroupPrice(kind, 21, venue), max: getQuestGroupPrice(kind, capacity, venue) }
    : null;
  const title = quest?.title[locale] ?? (age < 18 ? (locale === "he" ? "קווסט לילדים עם תסריט אישי" : "Детский квест по индивидуальному сценарию") : QUEST_COPY[locale].customTitle);
  const message = questInquiryMessage(locale, title, age) + (kind === "performance" ? `\n${copy.venue}: ${venue === "jaffa" ? copy.jaffa : (locale === "he" ? "במקום שלנו" : "На нашей площадке")}` : "");

  return (
    <div className={s.pricing}>
      {spec && <>
        <h4>{kind === "bars" || kind === "alcohol" ? copy.organization : copy.price}</h4>
        {kind === "performance" && <div className={s.venueChoices} role="group" aria-label={`${copy.venue}: ${title}`}>
          <button type="button" aria-pressed={venue === "client"} onClick={() => setVenue("client")}>{copy.client}</button>
          <button type="button" aria-pressed={venue === "jaffa"} onClick={() => setVenue("jaffa")}>{copy.jaffa}</button>
        </div>}
        {kind === "performance" && venue === "jaffa" && <p className={s.priceNote}>{copy.houseTime}</p>}
        {rows.length > 0 && <table className={s.priceTable}><thead><tr><th scope="col">{copy.group}</th><th scope="col">{copy.total}</th></tr></thead><tbody>{rows.map((row) => <tr key={row.max}><th scope="row"><bdi dir="ltr">{row.min === row.max ? row.min : `${row.min}–${row.max}`}</bdi></th><td><QuestPriceAmount amount={row.amount} locale={locale} from={row.from} /></td></tr>)}{extraRange?.min !== null && extraRange?.min !== undefined && extraRange.max !== null && <tr><th scope="row"><bdi dir="ltr">21–{capacity}</bdi></th><td><bdi dir="ltr">{formatLocalizedPriceAmount(extraRange.min, locale)}–{formatShekelPrice(extraRange.max, locale)}</bdi></td></tr>}</tbody></table>}
        {spec.flatFrom && <p className={s.flatPrice}><QuestPriceAmount amount={spec.flatFrom} locale={locale} from /></p>}
        {spec.extraParticipant && capacity > 20 && <p className={s.priceNote}>{copy.extra} <strong>+<QuestPriceAmount amount={spec.extraParticipant} locale={locale} /></strong>.</p>}
        {spec.quoteAbove && capacity > spec.quoteAbove && <p className={s.priceNote}>{copy.unknown(spec.quoteAbove)}</p>}
        {(quest?.category === "kids" || kind === "customKids") && <p className={s.giftNote}><Gift size={17} aria-hidden />{copy.gift}</p>}
        {kind === "bars" && <div className={s.alcoholNote}><p>{copy.alcohol}</p><ul>{QUEST_ALCOHOL_EXTRAS.bars.map((item) => <li key={item.bars}><span>{item.bars} {item.bars === 3 ? copy.bars : copy.moreBars}</span><strong>+<QuestPriceAmount amount={item.amount} locale={locale} /></strong></li>)}</ul></div>}
        {kind === "alcohol" && <p className={s.priceNote}>{copy.alcohol} <strong dir="ltr">+{formatLocalizedPriceAmount(QUEST_ALCOHOL_EXTRAS.alcohol.min, locale)}–{formatShekelPrice(QUEST_ALCOHOL_EXTRAS.alcohol.max, locale)}</strong></p>}
      </>}
      <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer" className={s.inquiry}><MessageCircle size={18} aria-hidden />{QUEST_COPY[locale].inquiry}</a>
    </div>
  );
}
