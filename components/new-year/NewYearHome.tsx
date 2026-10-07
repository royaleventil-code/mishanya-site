import Link from "next/link";
import { ArrowRight, ChevronRight, Gift, Heart, Snowflake, Star } from "lucide-react";
import { NEW_YEAR_HERO_PHOTO, NEW_YEAR_PROGRAMS, newYearPath } from "@/data/new-year";
import { siteUrl } from "@/lib/seo";
import { whatsappLink } from "@/lib/whatsapp";
import type { Locale } from "@/lib/i18n";
import { NewYearShell } from "./NewYearShell";
import { NewYearReview, PastCelebrations, WinterPhoto } from "./NewYearMedia";
import s from "./new-year.module.css";

export function NewYearHome({ locale }: { locale: Locale }) {
  const he = locale === "he";
  const jsonLd = {
    "@context": "https://schema.org", "@type": "ItemList",
    name: he ? "תוכניות השנה החדשה" : "Новогодние программы",
    itemListElement: NEW_YEAR_PROGRAMS.map((program, i) => ({ "@type": "ListItem", position: i + 1, name: program.name[locale], url: siteUrl(newYearPath(locale, program.id)) })),
  };
  return <NewYearShell locale={locale}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <section className={s.hero}>
      <div className={s.heroCopy}>
        <p className={s.eyebrow}><Snowflake size={15} aria-hidden />{he ? "חוגגים נובי גוד" : "Время верить в чудеса"}</p>
        <h1>{he ? "תנו לילדים" : "Подарите детям"}<em>{he ? "אגדת חורף" : "зимнюю сказку"}</em></h1>
        <p className={s.heroSubtitle}>{he ? "תוכניות השנה החדשה בישראל" : "Новогодние программы в Израиле"}</p>
        <a className={s.heroAction} href="#programs">{he ? "לבחירת תוכנית" : "Выбрать свою сказку"}<ArrowRight size={18} className={s.directional} aria-hidden /></a>
      </div>
      <div className={s.heroScene}>
        <WinterPhoto name={NEW_YEAR_HERO_PHOTO}
          alt={he ? "קולאז׳ חגיגי: הצוות הכחול והצוות הכסוף, דד מורוז באדום על רקע חורפי, אולף והגרינץ׳" : "Новогодний фотоколлаж: пары в синих и серебряных костюмах, Дед Мороз на зимнем фоне, Олаф и Гринч"}
          eager className={s.heroCollage}
          sizes="(max-width: 480px) calc(100vw - 44px), (max-width: 700px) 436px, (max-width: 1080px) calc(50vw - 32px), 508px" />
        <p className={s.heroNote}>{he ? "הקסם מתחיל כאן" : "Волшебство начинается здесь"}<Heart size={17} aria-hidden /></p>
        <Snowflake className={s.snowAccent} size={28} aria-hidden />
      </div>
    </section>
    <section className={s.catalog} id="programs" aria-labelledby="programs-title">
      <div className={s.sectionTitle}><Snowflake size={22} aria-hidden /><h2 id="programs-title">{he ? "תוכניות השנה החדשה" : "Новогодние программы"} <span className={s.catalogYear}>2027</span></h2><Snowflake size={22} aria-hidden /></div>
      <p className={s.sectionNote}>{he ? "דמויות אהובות. רגעים אמיתיים. חגיגה שזוכרים." : "Любимые герои. Настоящие эмоции. Праздник, который запомнится."}</p>
      <ul className={s.programGrid}>
        {NEW_YEAR_PROGRAMS.map((program, i) => {
          const first = program.options[0];
          const compact = !program.photo;
          return <li key={program.id}><Link href={newYearPath(locale, program.id)} className={`${s.programCard} ${compact ? s.compactCard : ""}`}>
            {compact ? <span className={s.programIcon}><Snowflake size={35} aria-hidden /></span> :
              <span className={`${s.cardPicture} ${program.mascot ? s.cardPictureWithMascot : ""}`}>
                <WinterPhoto name={program.photo!} alt="" className={`${s.cardMainPhoto} ${i === 0 ? s.soloPhoto : ""} ${program.id === "circus" ? s.circusCardPhoto : ""}`} sizes={program.mascot ? "(max-width: 360px) 70px, (max-width: 700px) 78px, (max-width: 900px) 75px, 102px" : "(max-width: 360px) 108px, (max-width: 700px) 120px, (max-width: 900px) 115px, 155px"} />
                {program.mascot && <WinterPhoto name={program.mascot} alt="" className={s.cardMascot} sizes="(max-width: 360px) 35px, (max-width: 700px) 39px, (max-width: 900px) 38px, 51px" />}
              </span>}
            <span className={s.cardCopy}><h3>{program.shortName[locale]}</h3>{!compact && <p>{program.teaser[locale]}</p>}
              {program.hostLabel && <span className={s.hostBadge}>{program.hostLabel[locale]}</span>}
              <span className={s.cardPrice}>{(i === 0 || i === 4) && <>{first.minutes} {he ? "דק׳" : "мин"} · </>}{(i > 0 && i < 5) ? (he ? "החל מ־" : "от ") : ""}<bdi>{first.price} ₪</bdi></span>
            </span>
            <span className={s.cardArrow}><ChevronRight size={21} className={s.directional} aria-hidden /></span>
          </Link></li>;
        })}
      </ul>
      <div className={s.values}>
        <span><Gift aria-hidden />{he ? "תוכניות מלאות צבע" : <>Яркие<br />программы</>}</span>
        <span><Heart aria-hidden />{he ? "רגשות אמיתיים" : <>Настоящие<br />эмоции</>}</span>
        <span><Star aria-hidden />{he ? "חגיגה לכולם" : <>Праздник<br />для всех</>}</span>
      </div>
    </section>
    <div className={s.homeProof}>
      <PastCelebrations locale={locale} />
      <NewYearReview locale={locale} />
      <section className={s.help}>
        <h2>{he ? "נבחר ביחד?" : "Выберем вместе?"}</h2>
        <p>{he ? "ספרו לנו על החגיגה. נעזור לבחור תוכנית ונדבר על התאריך והעיר בוואטסאפ." : "Расскажите о своём празднике. Поможем с программой, а дату, время и город обсудим в переписке."}</p>
        <a className={s.whatsapp} href={whatsappLink(he ? "שלום! אשמח לעזרה בבחירת תוכנית לשנה החדשה." : "Здравствуйте! Помогите выбрать новогоднюю программу.")} target="_blank" rel="noopener noreferrer">{he ? "פשוט לכתוב בוואטסאפ" : "Просто написать в WhatsApp"}<ArrowRight size={20} className={s.directional} aria-hidden /></a>
      </section>
    </div>
  </NewYearShell>;
}
