import { ArrowLeft, ArrowRight, MessageCircle, Video } from "lucide-react";
import { newYearMessage, newYearPath, type NewYearProgram } from "@/data/new-year";
import type { Locale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/whatsapp";
import { WinterPhoto } from "./NewYearMedia";
import s from "./new-year.module.css";

const photoSizes = "(max-width: 520px) calc(100vw - 32px), (max-width: 700px) 488px, (max-width: 1120px) calc(48vw - 28px), 510px";

const orderSteps = {
  ru: [
    { title: "Напишите в WhatsApp", detail: "Обсудим детали заказа и подскажем, какие снимки подойдут." },
    { title: "Пришлите имя и фотографии ребёнка", detail: "Добавим их в готовую новогоднюю историю." },
    { title: "Получите своё видео", detail: "Покажите его ребёнку в новогоднюю ночь или устройте сюрприз заранее." },
  ],
  he: [
    { title: "כתבו לנו בוואטסאפ", detail: "נדבר על פרטי ההזמנה ונעזור לכם לבחור תמונות מתאימות." },
    { title: "שלחו את השם והתמונות של הילד או הילדה", detail: "נשלב אותם בסיפור חגיגי שהכנו לשנה החדשה." },
    { title: "קבלו את הסרטון האישי שלכם", detail: "הקרינו אותו בליל השנה החדשה או הפתיעו את הילדים עוד לפני החג." },
  ],
};

export function NewYearVideoGreeting({ locale, program }: { locale: Locale; program: NewYearProgram }) {
  const he = locale === "he";
  const option = program.options[0];
  const price = `${option.price} ₪`;
  const href = whatsappLink(newYearMessage(program, option, locale));
  const orderLink = <a className={s.whatsapp} href={href} target="_blank" rel="noopener noreferrer">
    <MessageCircle size={23} aria-hidden />
    <span>{he ? "להזמנה בוואטסאפ" : "Заказать в WhatsApp"}</span>
    <ArrowRight size={19} className={s.directional} aria-hidden />
  </a>;

  return <article className={s.programDetail}>
    <a href={`${newYearPath(locale)}#programs`} className={s.back}>
      <ArrowLeft size={19} className={s.directional} aria-hidden />
      {he ? "כל התוכניות" : "Все программы"}
    </a>
    <div className={s.greetingHero}>
      <div className={s.greetingCopy}>
        <p className={s.eyebrow}><Video size={17} aria-hidden />{he ? "מתנה אישית לנובי גוד" : "Новогодний подарок"}</p>
        <h1>{program.name[locale]}</h1>
        <p className={s.greetingDescription}>{program.description[locale]}</p>
        <div className={s.greetingPrice}>
          <strong><bdi>{price}</bdi></strong>
          <span>{he ? "לסרטון המוכן" : "за готовый ролик"}</span>
        </div>
        <div className={s.desktopCta}>{orderLink}</div>
      </div>
      {program.photo && <figure className={s.greetingPhoto}>
        <WinterPhoto name={program.photo} alt={he ? "דד מורוז בתלבושת אדומה יושב על כיסא עם ספר פתוח" : "Дед Мороз в красном костюме сидит на стуле с открытой книгой"} eager sizes={photoSizes} />
        <figcaption>{he ? "דד מורוז שלנו" : "Наш Дед Мороз"}</figcaption>
      </figure>}
    </div>
    <section className={s.greetingOrder} id="how-to-order" aria-labelledby="greeting-order-title">
      <div>
        <h2 id="greeting-order-title">{he ? "איך מזמינים" : "Как заказать"}</h2>
        <ol className={s.greetingSteps} role="list">
          {orderSteps[locale].map(({ title, detail }, i) => <li key={title}>
            <span aria-hidden>{i + 1}</span>
            <div><h3>{title}</h3><p>{detail}</p></div>
          </li>)}
        </ol>
      </div>
      <figure className={s.greetingPhoto}>
        <WinterPhoto name="video-greeting-album" alt={he ? "אלבום פתוח ובו תמונת ילד בשלג" : "Открытый альбом с зимней фотографией ребёнка"} sizes={photoSizes} />
        <figcaption>{he ? "דוגמה לשילוב תמונה בסיפור" : "Пример того, как фото становится частью истории"}</figcaption>
      </figure>
    </section>
    <aside className={s.mobileCta} aria-label={he ? "הזמנת ברכת וידאו" : "Заказ видеопоздравления"}>
      {orderLink}
      <p>{he ? "ברכת וידאו אישית" : "Именное видеопоздравление"} · <bdi>{price}</bdi></p>
    </aside>
  </article>;
}
