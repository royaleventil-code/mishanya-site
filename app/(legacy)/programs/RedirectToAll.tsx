"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ChevronRight } from "lucide-react";

type Props = {
  target?: string;
  title?: string;
  text?: string;
};

export function RedirectToAll({
  target = "/ru/all",
  title = "Открываем все программы",
  text = "Мы перенесли каталог программ на новую страницу с ценами и удобным выбором.",
}: Props) {
  useEffect(() => {
    window.location.replace(target);
  }, [target]);

  return (
    <section className="px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-black uppercase tracking-wide text-[#ff375f]">
          Программы
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-nunito)] text-4xl font-black leading-tight text-zinc-950 sm:text-6xl">
          {title}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[var(--color-ink-soft)]">
          {text}
        </p>
        <Link
          href={target}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(100deg,#ff375f,#ff5a7a)] px-7 py-4 text-base font-black text-white shadow-[0_14px_30px_rgba(255,55,95,0.35)] transition active:scale-95"
        >
          Перейти к программам
          <ChevronRight className="h-5 w-5" strokeWidth={2.6} />
        </Link>
      </div>
    </section>
  );
}
