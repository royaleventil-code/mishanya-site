import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Clock3 } from "lucide-react";
import { WinterPhoto } from "@/components/new-year/NewYearMedia";
import { greetingOrderPath } from "@/data/new-year";
import { OrderForm } from "./OrderForm";
import s from "./quiz.module.css";

export function GreetingPage({ price }: { price: number | null }) {
  return <div className={s.page}>
    <header className={s.header}><div>
      <Link href="/ru" aria-label="Мишаня в Стране Чудес — главная"><Image src="/logo-ru.png" width={70} height={70} alt="Мишаня в Стране Чудес" loading="eager" /></Link>
      <Link className={s.returnLink} href={greetingOrderPath} prefetch={false}><ChevronLeft size={16} aria-hidden />О видеопоздравлении</Link>
    </div></header>
    <main className={s.layout}>
      <div className={s.quiz}><OrderForm price={price} /></div>
      <aside className={s.aside} aria-label="Ваше видеопоздравление">
        <WinterPhoto name="video-greeting-book" alt="Дед Мороз, Снегурочка и Мишаня с волшебной книгой" sizes="(min-width: 820px) 345px, 90vw" />
        <div><h2>Видеопоздравление от Деда Мороза</h2>
          {price && <p><bdi>{price} ₪</bdi> за готовый ролик</p>}
          <p className={s.time}><Clock3 size={17} aria-hidden />1–5 рабочих дней</p>
        </div>
      </aside>
    </main>
  </div>;
}
