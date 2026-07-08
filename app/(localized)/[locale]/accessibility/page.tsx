import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { createPageMetadata, siteName } from "@/lib/seo";
import { isLocale, localePath, type Locale } from "@/lib/i18n";

const UPDATED_DATE = { he: "8 ביולי 2026", ru: "8 июля 2026" } as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const name = siteName(locale);

  return createPageMetadata({
    title: locale === "he" ? `הצהרת נגישות | ${name}` : `Заявление о доступности | ${name}`,
    description:
      locale === "he"
        ? "הצהרת הנגישות של אתר מישניה בארץ הפלאות: התאמות הנגישות באתר, מגבלות ידועות ופרטי איש הקשר לפניות בנושא נגישות."
        : "Заявление о доступности сайта «Мишаня в Стране Чудес»: какие возможности доступности есть на сайте, известные ограничения и контакт для обращений.",
    path: `/${locale}/accessibility`,
    canonicalPath: `/${locale}/accessibility`,
    locale,
  });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-2xl font-black tracking-tight text-[var(--color-ink)] sm:text-3xl">{title}</h2>
      <div className="mt-3 space-y-3 text-[0.9375rem] leading-relaxed text-[var(--color-ink-soft)] sm:text-base">
        {children}
      </div>
    </section>
  );
}

function HebrewStatement() {
  return (
    <>
      <h1 className="text-[34px] font-black leading-tight tracking-tight text-[var(--color-ink)] sm:text-5xl">הצהרת נגישות</h1>
      <p className="mt-3 text-sm font-semibold text-[var(--color-ink-soft)]">
        עודכן לאחרונה: {UPDATED_DATE.he}
      </p>

      <Section title="מחויבות לנגישות">
        <p>
          "מישניה בארץ הפלאות" (Royal Event) רואה חשיבות רבה במתן שירות שוויוני ונגיש לכלל
          הלקוחות, כולל אנשים עם מוגבלות. אנו משקיעים מאמצים כדי שהאתר יהיה נגיש ונוח לשימוש
          לכולם, ברוח חוק שוויון זכויות לאנשים עם מוגבלות, התשנ״ח־1998, ותקנות הנגישות לשירות.
        </p>
        <p>
          העסק פועל כעוסק פטור. גם כאשר חלות הקלות על עסקים קטנים, בחרנו ליישם התאמות נגישות
          באתר לטובת כלל הגולשים.
        </p>
      </Section>

      <Section title="התאמות הנגישות באתר">
        <p>האתר שואף לעמוד בדרישות תקן ישראלי (ת״י) 5568 ברמת AA (מבוסס על WCAG 2.0). בין ההתאמות:</p>
        <ul className="list-disc space-y-1.5 ps-6">
          <li>תפריט נגישות קבוע (כפתור בתחתית המסך): הגדלת טקסט, ניגודיות גבוהה, מצב שחור־לבן, הדגשת קישורים, גופן קריא, עצירת אנימציות וסמן מוגדל. ההגדרות נשמרות בין ביקורים.</li>
          <li>ניווט מלא באמצעות מקלדת, כולל קישור "דילוג לתוכן" וסימון פוקוס ברור.</li>
          <li>טקסט חלופי (alt) לתמונות משמעותיות ומבנה כותרות תקין.</li>
          <li>תמיכה בהעדפת "הפחתת תנועה" של מערכת ההפעלה.</li>
          <li>האתר זמין בעברית (כולל RTL מלא) וברוסית.</li>
        </ul>
      </Section>

      <Section title="מגבלות ידועות">
        <p>
          אנו ממשיכים לשפר את נגישות האתר. ייתכן שחלק מהתמונות הישנות מאירועים או תוכן של צדדים
          שלישיים (למשל סרטונים מוטמעים) עדיין אינם נגישים במלואם. נשמח לקבל פנייה על כל קושי —
          ונטפל בו בהקדם.
        </p>
      </Section>

      <Section title="פניות בנושא נגישות">
        <p>נתקלתם בבעיה? נשמח לעזור ולתקן:</p>
        <ul className="list-disc space-y-1.5 ps-6">
          <li>איש קשר לנושאי נגישות: מיכאל צרפין</li>
          <li>
            טלפון / WhatsApp:{" "}
            <a href="tel:+972546163260" dir="ltr" className="font-bold text-[var(--color-link-strong)] underline">
              +972 54-616-3260
            </a>
          </li>
          <li>
            אימייל:{" "}
            <a href="mailto:royal.eventil@gmail.com" dir="ltr" className="font-bold text-[var(--color-link-strong)] underline">
              royal.eventil@gmail.com
            </a>
          </li>
        </ul>
        <p>אנו מתחייבים לטפל בפניות בנושא נגישות בהקדם האפשרי ולא יאוחר מ־60 ימים, כנדרש בחוק.</p>
      </Section>
    </>
  );
}

function RussianStatement() {
  return (
    <>
      <h1 className="text-[34px] font-black leading-tight tracking-tight text-[var(--color-ink)] sm:text-5xl">
        Заявление о доступности
      </h1>
      <p className="mt-3 text-sm font-semibold text-[var(--color-ink-soft)]">
        Обновлено: {UPDATED_DATE.ru}
      </p>

      <Section title="Наше обязательство">
        <p>
          «Мишаня в Стране Чудес» (Royal Event) стремится сделать свои услуги и сайт удобными для
          всех, включая людей с ограниченными возможностями — в духе израильского Закона о
          равноправии людей с инвалидностью (1998) и правил доступности услуг.
        </p>
        <p>
          Бизнес работает в статусе осек патур. Даже там, где для малого бизнеса действуют
          послабления, мы внедрили меры доступности для удобства всех посетителей.
        </p>
      </Section>

      <Section title="Что сделано на сайте">
        <p>
          Сайт стремится соответствовать израильскому стандарту <span dir="rtl">ת״י 5568</span>{" "}
          уровня AA (на основе WCAG 2.0). Среди мер:
        </p>
        <ul className="list-disc space-y-1.5 ps-6">
          <li>Постоянное меню доступности (кнопка внизу экрана): увеличение текста, высокий контраст, чёрно-белый режим, подсветка ссылок, читаемый шрифт, остановка анимаций и крупный курсор. Настройки сохраняются между визитами.</li>
          <li>Полная навигация с клавиатуры, ссылка «Перейти к содержимому» и заметная подсветка фокуса.</li>
          <li>Альтернативные тексты (alt) для значимых изображений и корректная структура заголовков.</li>
          <li>Поддержка системной настройки «уменьшить движение».</li>
          <li>Сайт доступен на иврите (с полным RTL) и русском.</li>
        </ul>
      </Section>

      <Section title="Известные ограничения">
        <p>
          Мы продолжаем улучшать доступность. Часть старых фотографий с праздников и встроенный
          контент третьих сторон (например, видео) могут быть доступны не полностью. Если вы
          столкнулись с трудностью — напишите нам, мы оперативно поправим.
        </p>
      </Section>

      <Section title="Контакт по вопросам доступности">
        <ul className="list-disc space-y-1.5 ps-6">
          <li>Ответственный за доступность: Михаил Царфин</li>
          <li>
            Телефон / WhatsApp:{" "}
            <a href="tel:+972546163260" dir="ltr" className="font-bold text-[var(--color-link-strong)] underline">
              +972 54-616-3260
            </a>
          </li>
          <li>
            Email:{" "}
            <a href="mailto:royal.eventil@gmail.com" dir="ltr" className="font-bold text-[var(--color-link-strong)] underline">
              royal.eventil@gmail.com
            </a>
          </li>
        </ul>
        <p>
          Обращения по доступности мы разбираем в кратчайший срок и не позднее 60 дней, как
          требует закон.
        </p>
        <p>
          Официальная версия на иврите:{" "}
          <Link href="/he/accessibility" className="font-bold text-[var(--color-link-strong)] underline">
            הצהרת נגישות
          </Link>
        </p>
      </Section>
    </>
  );
}

export default async function AccessibilityStatementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";

  return (
    <main id="main" className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader locale={locale} />
      <div className="mx-auto max-w-3xl px-5 pb-20 pt-10 sm:px-6 sm:pt-14">
        {locale === "he" ? <HebrewStatement /> : <RussianStatement />}
        <div className="mt-10">
          <Link
            href={localePath(locale, "/")}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 motion-reduce:transition-none"
          >
            {locale === "he" ? "חזרה לעמוד הבית" : "На главную"}
          </Link>
        </div>
      </div>
      <PublicFooter locale={locale} />
    </main>
  );
}
