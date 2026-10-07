"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Camera, Check, Gift, Languages, MessageCircle, Snowflake, Users } from "lucide-react";
import { newYearMessage, newYearPath, type NewYearProgram as Program } from "@/data/new-year";
import type { Locale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/whatsapp";
import { NewYearReview, PastCelebrations, WinterPhoto } from "./NewYearMedia";
import s from "./new-year.module.css";

export function NewYearProgram({ locale, program }: { locale: Locale; program: Program }) {
  const [selected, setSelected] = useState(0);
  const option = program.options[selected];
  const he = locale === "he";
  const extended = option.minutes === 90 ? program.extended ?? [] : [];
  const href = whatsappLink(newYearMessage(program, option, locale));
  return <article className={s.programDetail}>
    <Link href={newYearPath(locale)} className={s.back}><ArrowLeft size={19} className={s.directional} aria-hidden />{he ? "כל התוכניות" : "Все программы"}</Link>
    <div className={s.detailGrid}>
      <div className={s.detailVisual}>
        <header className={s.programHeading}><h1>{program.name[locale]}</h1></header>
        {program.photo ? <figure className={`${s.mainPhoto} ${program.mascot ? s.mainPhotoWithMascot : ""} ${program.id === "circus" ? s.circusPhoto : program.id === "ded-moroz" ? s.soloFrame : ""}`}>
          <WinterPhoto name={program.photo} alt={program.name[locale]} eager className={`${s.teamPhoto} ${program.id === "ded-moroz" ? s.soloPhoto : ""}`} sizes={program.mascot ? "(max-width: 520px) calc(66.67vw - 33.33px), (max-width: 700px) 314px, (max-width: 900px) calc(34.15vw - 39.3px), (max-width: 1120px) calc(34.15vw - 45.5px), 337px" : "(max-width: 520px) calc(100vw - 32px), (max-width: 700px) 488px, (max-width: 900px) calc(51.22vw - 41px), (max-width: 1120px) calc(51.22vw - 50.2px), 524px"} />
          {program.mascot && <WinterPhoto name={program.mascot} alt={he ? (program.mascot === "olaf" ? "אולף" : "הגרינץ׳") : (program.mascot === "olaf" ? "Олаф" : "Гринч")} className={s.detailMascot} eager sizes="(max-width: 520px) calc(33.33vw - 16.67px), (max-width: 700px) 157px, (max-width: 900px) calc(17.07vw - 19.7px), (max-width: 1120px) calc(17.07vw - 22.7px), 169px" />}
        </figure> : <div className={s.nightArtwork}><Snowflake size={48} aria-hidden /><p>{he ? "לילה של קסם" : "Ночь, полная чудес"}</p></div>}
      </div>
      <div className={s.detailContent}>
        <fieldset className={s.optionGroup}>
          <legend>{option.minutes ? (he ? "משך התוכנית" : "Длительность программы") : (he ? "מחיר התוכנית" : "Стоимость программы")}</legend>
          <div className={s.options}>
            {program.options.map((item, i) => <label key={i} className={`${s.option} ${i === selected ? s.selectedOption : ""}`}>
              <input type="radio" name="duration" checked={i === selected} onChange={() => setSelected(i)} value={i} />
              <span>{item.minutes ? `${item.minutes} ${he ? "דקות" : "минут"}` : (he ? "ליל השנה החדשה" : "Новогодняя ночь")}</span>
              <strong>{item.from && <small>{he ? "החל מ־" : "от "}</small>}<bdi>{item.price} ₪</bdi></strong>
              {program.options.length > 1 && <Check className={s.optionCheck} size={15} aria-hidden />}
            </label>)}
          </div>
        </fieldset>
        <div className={s.selectionDetails} aria-live="polite">
          {option.capacity && <p className={s.capacity}><Users size={17} aria-hidden />{option.capacity[locale]}</p>}
          {program.id !== "circus" && <p className={s.languageNote}><Languages size={16} aria-hidden /><span>{he ? "התוכנית מתקיימת ברוסית בלבד" : "Программа только на русском языке"}</span></p>}
          {extended.length > 0 && <p className={s.extendedHint}>{he ? "כולל " : "Включено: "}{extended.map((item) => item[locale].toLocaleLowerCase()).join(he ? " ו" : " и ")}</p>}
        </div>
        {(program.id === "new-year-night" || program.includes.length === 0) && <p className={s.description}>{program.description[locale]}</p>}
        {program.includes.length > 0 && <section className={s.included}>
          <h2><Gift size={24} aria-hidden />{program.includesTitle?.[locale] ?? (he ? "מה כלול בתוכנית" : "Что входит в программу")}</h2>
          {program.includesNote && <p className={s.includedIntro}>{program.includesNote[locale]}</p>}
          <ul>{[...program.includes, ...extended].map((item) => <li key={item.ru}><Check size={16} aria-hidden /><span>{item[locale]}</span></li>)}</ul>
          {program.extended && option.minutes !== 90 && <p className={s.extendedNote}>{he ? "בתוכנית של 90 דקות: " : "В программе на 90 минут: "}{program.extended.map((item) => item[locale].toLocaleLowerCase()).join(he ? " ו" : " и ") }.</p>}
        </section>}
        <div className={s.desktopCta}><a className={s.whatsapp} href={href} target="_blank" rel="noopener noreferrer"><MessageCircle size={25} aria-hidden />{he ? "פשוט לכתוב בוואטסאפ" : "Просто написать в WhatsApp"}<ArrowRight size={19} className={s.directional} aria-hidden /></a><p className={s.ctaNote}>{he ? "נדבר על התאריך, השעה והעיר בהודעה" : "Дату, время и город обсудим в переписке"}</p></div>
        {program.gallery && <section className={s.programGallery} aria-labelledby="program-photos-title">
          <h2 id="program-photos-title"><Camera size={23} aria-hidden />{he ? "רגעים מהמופע" : "Моменты нашего шоу"}</h2>
          <div className={s.programGalleryGrid}>{program.gallery.map(({ photo, caption, wide }) => <figure key={photo} className={wide ? s.wideGalleryPhoto : undefined}>
            <a href={`/new-year/${photo}-1000.webp`} target="_blank" rel="noopener noreferrer" aria-label={he ? `פתיחת תמונה: ${caption.he}` : `Открыть фото: ${caption.ru}`}>
              <WinterPhoto name={photo} alt={caption[locale]} sizes={wide ? "(max-width: 520px) calc(100vw - 32px), (max-width: 700px) 488px, (max-width: 1120px) 46vw, 500px" : "(max-width: 520px) calc(50vw - 22px), (max-width: 700px) 238px, (max-width: 1120px) 22vw, 244px"} />
            </a>
            <figcaption>{caption[locale]}</figcaption>
          </figure>)}</div>
        </section>}
        <PastCelebrations locale={locale} compact />
        <NewYearReview locale={locale} />
        {program.mascot && <section className={s.gallery}>
          <h2>{he ? "הדמויות של החגיגה שלכם" : "Герои вашего праздника"}</h2>
          <div>{[program.photo!, program.mascot].map((name, i) => <a key={name} href={`/new-year/${name}-1000.webp`} target="_blank" rel="noopener noreferrer" aria-label={he ? `פתיחת תמונה ${i + 1}` : `Открыть фото ${i + 1}`}><WinterPhoto name={name} alt={i === 0 ? (he ? "דד מורוז וסנגורוצ׳קה" : "Дед Мороз и Снегурочка") : (he ? (program.mascot === "olaf" ? "אולף" : "הגרינץ׳") : (program.mascot === "olaf" ? "Олаф" : "Гринч"))} sizes="(max-width: 700px) 44vw, 240px" /></a>)}</div>
        </section>}
        <div className={s.mobileClosing}><p>{he ? "נשמח לענות ולעזור לבחור את החגיגה שלכם." : "Ответим на вопросы и поможем выбрать праздник для вашей семьи."}</p><Link href={newYearPath(locale)}>{he ? "לצפייה בתוכניות נוספות" : "Посмотреть другие программы"}<ArrowRight className={s.directional} size={16} aria-hidden /></Link></div>
      </div>
    </div>
    <aside className={s.mobileCta} aria-label={he ? "יצירת קשר לגבי התוכנית" : "Написать о программе"}>
      <a className={s.whatsapp} href={href} target="_blank" rel="noopener noreferrer"><MessageCircle size={24} aria-hidden /><span>{he ? "פשוט לכתוב בוואטסאפ" : "Просто написать в WhatsApp"}</span><ArrowRight size={20} className={s.directional} aria-hidden /></a>
      <p>{he ? "התוכנית שבחרתם כבר תהיה בהודעה" : "Выбранная программа уже будет в сообщении"}</p>
    </aside>
  </article>;
}
