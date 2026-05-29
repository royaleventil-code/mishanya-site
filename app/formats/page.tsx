import type { Metadata } from "next";
import { Baby, Building2, CalendarHeart, GraduationCap, PartyPopper, Users } from "lucide-react";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Форматы праздников | Мишаня в Стране Чудес",
  description: "Дни рождения, садики, школы, семейные события, Бар и Бат мицва, детская зона и шоу-программы.",
};

const FORMATS = [
  {
    title: "День рождения",
    text: "Герои, ведущие, шоу и сценарий под возраст ребенка.",
    Icon: PartyPopper,
  },
  {
    title: "Первый детский праздник",
    text: "Мягкий темп, простые игры и знакомые образы для маленькой компании.",
    Icon: Baby,
  },
  {
    title: "Садик и школа",
    text: "Праздники для групп, выпускные, сезонные события и выездные шоу.",
    Icon: GraduationCap,
  },
  {
    title: "Бар / Бат мицва",
    text: "Детская часть, интерактив, ведущие и шоу-блоки для семейного события.",
    Icon: CalendarHeart,
  },
  {
    title: "Корпоратив с детьми",
    text: "Детская зона, активности и аниматоры для взрослых мероприятий.",
    Icon: Building2,
  },
  {
    title: "Большие события",
    text: "Команда, несколько зон, фото, видео, музыка и дополнительные активности.",
    Icon: Users,
  },
];

export default function FormatsPage() {
  return (
    <main className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader />
      <section className="px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold text-[#e34f35]">
            Форматы
          </p>
          <h1 className="mt-3 max-w-4xl break-words text-4xl font-black leading-tight sm:text-6xl">
            Вы выбираете формат, а мы настраиваем его под возраст, место и гостей.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-ink-soft)]">
            Один и тот же герой может работать по-разному: дома, в парке, в зале,
            в садике или на большом семейном событии. Поэтому начинаем с формата,
            который комфортен вашей семье.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {FORMATS.map((item) => (
              <article key={item.title} className="rounded-lg bg-white p-6 shadow-[var(--shadow-card)]">
                <item.Icon className="h-8 w-8 text-[#0a84ff]" strokeWidth={2.4} />
                <h2 className="mt-6 text-2xl font-black">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--color-ink-soft)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>

          <a
            href={whatsappLink("Здравствуйте! Хочу обсудить формат детского праздника.")}
            target="_blank"
            rel="noreferrer"
            className="mt-10 inline-flex rounded-full bg-[var(--color-whatsapp)] px-6 py-3.5 text-base font-black text-white transition active:scale-95"
          >
            Обсудить мой формат
          </a>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
