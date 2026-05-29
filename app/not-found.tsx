import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader />
      <section className="px-5 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold text-[#e34f35]">
            Страница недоступна
          </p>
          <h1 className="mt-4 text-5xl font-black leading-tight sm:text-6xl">
            Вернитесь к программам и выберите подходящую идею.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--color-ink-soft)]">
            Эта ссылка больше не ведет на публичную страницу. На сайте доступны
            форматы, фото, контакты и программы, которые можно адаптировать под ваш праздник.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex justify-center rounded-full bg-[#0a84ff] px-6 py-3.5 text-base font-black text-white transition active:scale-95"
            >
              На главную
            </Link>
            <Link
              href="/programs"
              className="inline-flex justify-center rounded-full border border-[var(--color-line)] bg-white px-6 py-3.5 text-base font-black text-[var(--color-ink)] transition active:scale-95"
            >
              Программы
            </Link>
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
