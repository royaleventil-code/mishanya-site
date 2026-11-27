import { ArrowLeft, ArrowRight, Clock3, MessageCircle, Video } from "lucide-react";
import { LiteYouTube } from "@/components/LiteYouTube";
import { greetingTurnaround, newYearMessage, newYearPath, type NewYearProgram } from "@/data/new-year";
import type { Locale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/whatsapp";
import { WinterPhoto } from "./NewYearMedia";
import { GreetingOrderActions } from "./GreetingOrderActions";
import s from "./new-year.module.css";

const photoSizes = "(max-width: 520px) calc(100vw - 32px), (max-width: 700px) 488px, (max-width: 1120px) calc(48vw - 28px), 510px";
const exampleVideoId = "HKAMrUrXrC8";

const orderSteps = {
  ru: [
    { title: "Заполните короткую анкету", detail: "Выберите от одного до четырёх детей, укажите город, имена и ударения. Анкета подскажет, нужна ли запись в волшебную книгу." },
    { title: "Загрузите фотографии", detail: "Для одного ребёнка нужны портрет, фото за любимым занятием и ещё один снимок. Для двух–четырёх детей понадобится по одному фото каждого. В любом случае добавьте горизонтальное семейное фото." },
    { title: "Оплатите и получите видео", detail: "После оформления мы свяжемся с вами в WhatsApp для оплаты. Готовое поздравление пришлём туда же в течение пяти рабочих дней после оплаты." },
  ],
  he: [
    { title: "מסרו את פרטי המשפחה", detail: "כתבו לנו בוואטסאפ כמה ילדים ישתתפו (עד ארבעה), באיזו עיר אתם גרים ועל איזו הברה נופל הדגש בכל שם." },
    { title: "שלחו תמונות", detail: "לילד אחד נבקש תמונת פנים, תמונה מפעילות אהובה ועוד תמונה לבחירתכם. לשניים עד ארבעה ילדים נבקש תמונה אחת של כל ילד. בכל הזמנה הוסיפו תמונה משפחתית לרוחב." },
    { title: "שלמו וקבלו את הסרטון", detail: "נתאם את התשלום בוואטסאפ ונשלח לשם את הסרטון האישי תוך חמישה ימי עסקים מהתשלום." },
  ],
};

export function NewYearVideoGreeting({ locale, program }: { locale: Locale; program: NewYearProgram }) {
  const he = locale === "he";
  const option = program.options[0];
  const price = `${option.price} ₪`;
  const href = whatsappLink(newYearMessage(program, option, locale));
  const hebrewOrderLink = <a className={s.whatsapp} href={href} target="_blank" rel="noopener noreferrer">
    <MessageCircle size={23} aria-hidden />
    <span>להזמנה בוואטסאפ</span>
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
        <p className={s.greetingTurnaround}><Clock3 size={16} aria-hidden />{greetingTurnaround[locale]}</p>
        {he ? <div className={s.desktopCta}>{hebrewOrderLink}</div> : <GreetingOrderActions inquiryHref={href} price={option.price} />}
      </div>
      {program.photo && <figure className={s.greetingPhoto}>
        <WinterPhoto name={program.photo} alt={he ? "דד מורוז, סנגורוצ׳קה ומישניה סביב ספר קסום פתוח" : "Дед Мороз, Снегурочка и Мишаня над раскрытой волшебной книгой"} eager sizes={photoSizes} />
        <figcaption>{he ? "גיבורי ברכת הווידאו" : "Герои видеопоздравления"}</figcaption>
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
        <div className={s.greetingVideo}>
          <LiteYouTube
            videoId={exampleVideoId}
            title={he ? "דוגמה לברכת וידאו מדד מורוז" : "Пример видеопоздравления от Деда Мороза"}
            sizes={photoSizes}
            rounded={false}
          />
        </div>
        <figcaption>
          <a href={`https://www.youtube.com/watch?v=${exampleVideoId}`} target="_blank" rel="noopener noreferrer">
            {he ? "לצפייה בדוגמה ב־YouTube" : "Смотреть пример на YouTube"}
          </a>
        </figcaption>
      </figure>
    </section>
    {he && <aside className={s.mobileCta} aria-label="הזמנת ברכת וידאו">
      {hebrewOrderLink}
      <p>ברכת וידאו אישית · <bdi>{price}</bdi></p>
    </aside>}
  </article>;
}
