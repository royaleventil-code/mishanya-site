"use client";

import dynamic from "next/dynamic";
import { ClipboardList, MessageCircle, X } from "lucide-react";
import { useRef, useState } from "react";
import s from "./greeting-order.module.css";

const OrderForm = dynamic(
  () => import("@/components/ded-moroz/OrderForm").then(module => module.OrderForm),
  { loading: () => <p role="status" className={s.loading}>Открываем анкету…</p> },
);

export function GreetingOrderActions({ inquiryHref, price }: { inquiryHref: string; price: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [opened, setOpened] = useState(false);

  function openOrder() {
    if (!dialog.current || dialog.current.open) return;
    setOpened(true);
    dialog.current.showModal();
  }

  return <>
    <div className={s.dock}>
      <div className={s.actions}>
        <a href={inquiryHref} className={s.inquiry} target="_blank" rel="noopener noreferrer" title="Узнать подробнее в WhatsApp">
          <MessageCircle size={19} aria-hidden />Узнать подробнее
        </a>
        <button type="button" className={s.order} ref={trigger} aria-haspopup="dialog" aria-controls="greeting-checkout" onClick={openOrder}>
          <ClipboardList size={19} aria-hidden />Сразу заказать
        </button>
      </div>
      <p className={s.mobilePrice}>Именное видеопоздравление · <bdi>{price} ₪</bdi></p>
    </div>
    <dialog ref={dialog} id="greeting-checkout" aria-labelledby="greeting-checkout-title" className={s.dialog}
      onClose={() => trigger.current?.focus({ preventScroll: true })}
      onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className={`dm ${s.surface}`}>
        <header className={s.modalHead}>
          <h2 id="greeting-checkout-title">Заказ видеопоздравления</h2>
          <button type="button" className={s.close} aria-label="Закрыть анкету" onClick={() => dialog.current?.close()}><X size={23} aria-hidden /></button>
        </header>
        {opened && <OrderForm price={price} />}
      </div>
    </dialog>
  </>;
}
