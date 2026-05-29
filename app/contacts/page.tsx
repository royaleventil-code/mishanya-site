import type { Metadata } from "next";
import { CalendarHeart, Clock, Languages, MapPin, MessageCircle, Palette, Phone, Users } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { WA_DISPLAY, whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Контакты | Мишаня в Стране Чудес",
  description: "Связаться с агентством детских праздников Мишаня в Стране Чудес в Израиле.",
};

const DETAILS = [
  {
    title: "География",
    text: "Проводим праздники по Израилю, условия зависят от города и площадки.",
    Icon: MapPin,
  },
  {
    title: "Что написать",
    text: "Возраст ребенка, дату, город, место, язык гостей и примерное количество детей.",
    Icon: MessageCircle,
  },
  {
    title: "Варианты",
    text: "Вы получите несколько вариантов и сможете выбрать, что ближе ребенку.",
    Icon: Clock,
  },
];

const REQUEST_HINTS = [
  {
    title: "Кто празднует",
    text: "Возраст ребенка, имя и любимые герои, мультики или темы.",
    Icon: Users,
  },
  {
    title: "Когда и где",
    text: "Дата, город, дом, парк, зал, садик, школа или ресторан.",
    Icon: CalendarHeart,
  },
  {
    title: "Язык гостей",
    text: "Русский, иврит или смешанный формат, чтобы всем детям было комфортно.",
    Icon: Languages,
  },
  {
    title: "Что важно семье",
    text: "Спокойный темп, активные игры, шоу-эффект, фото-моменты или рамки бюджета.",
    Icon: Palette,
  },
];

const PERSONAL_MESSAGE =
  "Здравствуйте! Хочу подобрать праздник под нас.\nВозраст ребенка:\nДата и город:\nМесто проведения:\nЯзык гостей:\nЛюбимые темы или герои:\nЧто важно по формату и бюджету:";

export default function ContactsPage() {
  return (
    <main className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader />
      <section className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-bold text-[#e34f35]">
              Контакты
            </p>
            <h1 className="mt-3 break-words text-4xl font-black leading-tight sm:text-6xl">
              Напишите в WhatsApp и получите варианты под ваш праздник.
            </h1>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappLink(PERSONAL_MESSAGE)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-6 py-3.5 text-base font-black text-white transition active:scale-95"
              >
                <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
                WhatsApp
              </a>
              <a
                href={`tel:${WA_DISPLAY.replace(/[^+\d]/g, "")}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-6 py-3.5 text-base font-black text-[var(--color-ink)] transition active:scale-95"
              >
                <Phone className="h-5 w-5" strokeWidth={2.4} />
                {WA_DISPLAY}
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            {DETAILS.map((item) => (
              <article key={item.title} className="rounded-lg bg-white p-6 shadow-[var(--shadow-card)]">
                <item.Icon className="h-7 w-7 text-[#0a84ff]" strokeWidth={2.4} />
                <h2 className="mt-5 text-2xl font-black">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-[#0a84ff]">
              Чтобы варианты были точнее
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              Напишите только то, что уже знаете. Остальное можно решить вместе.
            </h2>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-4">
            {REQUEST_HINTS.map((item) => (
              <article key={item.title} className="rounded-lg border border-[var(--color-line)] p-5">
                <item.Icon className="h-7 w-7 text-[#e34f35]" strokeWidth={2.4} />
                <h3 className="mt-5 text-xl font-black leading-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-lg bg-[#fffaf4] p-6 shadow-[var(--shadow-card)] md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <h3 className="text-2xl font-black">Можно начать с короткого сообщения</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink-soft)]">
                Шаблон в WhatsApp уже подготовлен: его можно заполнить полностью
                или оставить пустыми те пункты, с которыми пока не определились.
              </p>
            </div>
            <a
              href={whatsappLink(PERSONAL_MESSAGE)}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-6 py-3.5 text-base font-black text-white transition active:scale-95 md:mt-0"
            >
              <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
              Открыть WhatsApp
            </a>
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
