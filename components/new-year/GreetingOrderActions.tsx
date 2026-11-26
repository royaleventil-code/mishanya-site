import Link from "next/link";
import { ClipboardList, MessageCircle } from "lucide-react";
import { greetingQuizPath } from "@/data/new-year";
import s from "./greeting-order.module.css";

export function GreetingOrderActions({ inquiryHref, price }: { inquiryHref: string; price: number }) {
  return <div className={s.dock}>
    <div className={s.actions}>
      <a href={inquiryHref} className={s.inquiry} target="_blank" rel="noopener noreferrer" title="Узнать подробнее в WhatsApp">
        <MessageCircle size={19} aria-hidden />Узнать подробнее
      </a>
      <Link href={greetingQuizPath} prefetch={false} className={s.order}><ClipboardList size={19} aria-hidden />Сразу заказать</Link>
    </div>
    <p className={s.mobilePrice}>Именное видеопоздравление · <bdi>{price} ₪</bdi></p>
  </div>;
}
