"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Camera, Check, ChevronLeft, ChevronRight, Clock3, Image as ImageIcon, Snowflake, UsersRound, X } from "lucide-react";
import { WinterPhoto } from "@/components/new-year/NewYearMedia";
import { greetingOrderPath } from "@/data/new-year";
import { maximumChildAge, minimumChildAge } from "@/shared/ded-moroz";
import { copy } from "./copy";
import { OrderForm } from "./OrderForm";

export function Brand() {
  return <Link className="dm-brand" href={greetingOrderPath} prefetch={false} aria-label="Мишаня в Стране Чудес">
    <span className="dm-mark"><Snowflake size={28} strokeWidth={1.6} /></span>
    <span><b>{copy.brand}</b><small>{copy.brandSub}</small></span>
  </Link>;
}
export function GreetingPage({ price }: { price: number | null }) {
  const gallery = useRef<HTMLDialogElement>(null);
  const [frame, setFrame] = useState(0);
  const show = (index: number) => { setFrame(index); gallery.current?.showModal(); };
  const current = copy.gallery[frame];
  return <>
    <a className="dm-skip" href="#order">К анкете</a>
    <header className="dm-head"><div className="dm-wrap dm-top"><Brand /><nav aria-label="Навигация">
      <button type="button" className="dm-nav-link" onClick={() => show(0)}>Кадры из сказки</button>
      <a className="dm-nav-cta" href="#order">Оформить заказ</a>
    </nav></div></header>
    <main className="dm-wrap">
      <section className="dm-hero" aria-labelledby="dm-title">
        <div className="dm-hero-photo"><WinterPhoto name="video-greeting-seated" alt={copy.gallery[0].alt} eager sizes="(max-width: 720px) 100vw, (max-width: 1260px) 59vw, 727px" /></div>
        <div className="dm-hero-copy"><p className="dm-kicker"><span className="dm-gold-rule" /> Новогоднее видеопоздравление</p>
          <h1 id="dm-title">Дед Мороз поздравит вашего ребёнка <em>по имени</em></h1>
          <p className="dm-lead">{copy.intro}</p>
          <div className="dm-hero-actions"><a href="#order" className="dm-btn dm-gold"><BookOpen size={19} />{copy.order}</a>
            <button type="button" className="dm-frame-action" onClick={() => show(0)}><ImageIcon size={17} />{copy.frames}</button></div>
        </div>
      </section>
      <div className="dm-facts" aria-label="О поздравлении">
        <span><Clock3 />Около 6 минут</span>
        <span><UsersRound />Детям от {minimumChildAge} до {maximumChildAge} лет</span>
        <span><Camera />4 фотографии семьи</span>
      </div>
      <section className="dm-order-section" id="order" aria-labelledby="order-title">
        <div className="dm-section-heading"><span className="dm-section-icon"><BookOpen size={25} /></span><h2 id="order-title">Ваша история для Деда Мороза</h2></div>
        <div className="dm-order-grid"><OrderForm price={price} />
          <aside className="dm-book"><button className="dm-book-image" onClick={() => show(1)} aria-label="Увеличить кадр волшебной книги">
            <WinterPhoto name="video-greeting-album" alt={copy.gallery[1].alt} sizes="(max-width: 780px) 90vw, 345px" />
            <span><ImageIcon size={16} /> Кадр из сказки</span></button>
            <div className="dm-book-copy"><h3>Что будет в видео</h3><ul>{copy.book.map(([title, text]) => <li key={title}><Check size={17} /><div><b>{title}</b><p>{text}</p></div></li>)}</ul></div>
          </aside>
        </div>
      </section>
    </main>
    <footer className="dm-foot"><div className="dm-wrap"><Brand /><span>Именное видеопоздравление Деда Мороза</span></div></footer>
    <dialog ref={gallery} className="dm-dialog" aria-labelledby="dm-dialog-title" onClick={e => { if (e.target === gallery.current) gallery.current?.close(); }}>
      <div className="dm-dialog-body"><button className="dm-close" aria-label="Закрыть кадры" autoFocus onClick={() => gallery.current?.close()}><X size={21} /></button>
        <WinterPhoto name={current.image} alt={current.alt} eager sizes="(max-width: 800px) 90vw, 750px" />
        <div className="dm-dialog-caption"><div><h2 id="dm-dialog-title">{current.title}</h2><p>{current.detail}</p></div>
          <div className="dm-gallery-controls"><button aria-label="Предыдущий кадр" disabled={frame === 0} onClick={() => setFrame(frame - 1)}><ChevronLeft /></button>
            <span>{frame + 1} / {copy.gallery.length}</span>
            <button aria-label="Следующий кадр" disabled={frame === copy.gallery.length - 1} onClick={() => setFrame(frame + 1)}><ChevronRight /></button></div></div>
      </div>
    </dialog>
  </>;
}
