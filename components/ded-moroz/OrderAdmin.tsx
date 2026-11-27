"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronLeft, CircleAlert, CircleCheck, Clapperboard, Download, ExternalLink, Inbox, MessageCircle, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { greetingQuizPath } from "@/data/new-year";
import { WinterPhoto } from "@/components/new-year/NewYearMedia";
import { orderPhotos, paymentStatuses, statuses, whatsappContactDigits, type Order, type OrderPatch } from "@/shared/ded-moroz";
import { OrderForm } from "./OrderForm";
import { apiIssue } from "./Photos";
import s from "./order-admin.module.css";

const endpoint = "/api/ded-moroz/staff/orders";
const columns = ["Номер заказа", "Оформлен", "Дети", "Телефон", "Город", "Статус", "Оплата", "Действия"];
const createdDate = new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Jerusalem" });
const statusOptions = Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>);
const paymentOptions = Object.entries(paymentStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>);

type OrderChange = OrderPatch | "delete";

async function fetchOrders(signal: AbortSignal): Promise<Order[]> {
  const res = await fetch(endpoint, { cache: "no-store", signal });
  if (!res.ok) throw new Error(await apiIssue(res));
  return res.json();
}

async function patchOrder(id: string, patch: OrderPatch): Promise<Order> {
  const res = await fetch(endpoint + "/" + id, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await apiIssue(res));
  return res.json();
}

function Status({ value }: { value: Order["status"] }) {
  return <span className={s.status} data-status={value}>{statuses[value]}</span>;
}

function StatusSelect({ value, label, options, busy, onChange }: {
  value: string; label: string; options: ReactNode; busy: boolean; onChange: (value: string) => void;
}) {
  return <span className={s.status + " " + s.statusControl} data-status={value}>
    <select value={value} disabled={busy} aria-label={label} onChange={event => onChange(event.target.value)}>
      {options}
    </select>
    <ChevronDown size={14} aria-hidden />
  </span>;
}

function Phone({ value }: { value: string }) {
  const digits = whatsappContactDigits(value);
  return digits
    ? <a className={s.phone} dir="ltr" href={"tel:+" + digits}>{value}</a>
    : <bdi>{value}</bdi>;
}

function OrdersTable({ orders, pendingId, onSelect, onChange }: {
  orders: Order[]; pendingId: string;
  onSelect: (id: string) => void;
  onChange: (id: string, change: OrderChange) => void;
}) {
  const busy = !!pendingId;
  return <table className={s.table} role="table" aria-label="Все заказы">
    <thead role="rowgroup"><tr role="row">
      {columns.map(label => <th scope="col" role="columnheader" key={label}>{label}</th>)}
    </tr></thead>
    <tbody role="rowgroup">{orders.map(order => <tr role="row" key={order.order_id} aria-busy={pendingId === order.order_id}>
      <td role="cell" className={s.idCell}>
        <button id={"open-" + order.order_id} className={s.orderLink} disabled={busy} onClick={() => onSelect(order.order_id)}>{order.order_id}</button>
      </td>
      <td role="cell"><span className={s.mobileLabel} aria-hidden>Оформлен</span><time dateTime={order.created_at}>{createdDate.format(new Date(order.created_at))}</time></td>
      <td role="cell"><span className={s.mobileLabel} aria-hidden>Дети</span>{order.children.map(child => child.name).join(", ")}</td>
      <td role="cell"><span className={s.mobileLabel} aria-hidden>Телефон</span><Phone value={order.parent.whatsapp} /></td>
      <td role="cell"><span className={s.mobileLabel} aria-hidden>Город</span>{order.city}</td>
      <td role="cell" className={s.statusCell}>
        <StatusSelect value={order.status} busy={busy} label={`Статус заказа ${order.order_id}`} options={statusOptions}
          onChange={value => onChange(order.order_id, { status: value as Order["status"] })} />
      </td>
      <td role="cell" className={s.paymentCell}>
        <span className={s.mobileLabel} aria-hidden>Оплата</span>
        <StatusSelect value={order.payment_status} busy={busy} label={`Оплата заказа ${order.order_id}`} options={paymentOptions}
          onChange={value => onChange(order.order_id, { payment_status: value as Order["payment_status"] })} />
        <bdi className={s.amount}>{order.amount_ils} ₪</bdi>
      </td>
      <td role="cell" className={s.actionsCell}>
        <button type="button" className={s.deleteOrder} disabled={busy} aria-label={`Удалить заказ ${order.order_id}`} title="Удалить заказ"
          onClick={() => onChange(order.order_id, "delete")}><Trash2 size={17} aria-hidden /></button>
      </td>
    </tr>)}</tbody>
  </table>;
}

function Editor({ item, onSaved }: { item: Order; onSaved: (order: Order) => void }) {
  const [status, setStatus] = useState(item.status);
  const [payment, setPayment] = useState(item.payment_status);
  const [url, setUrl] = useState(item.video_url || "");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const target = endpoint + "/" + item.order_id;
  const whatsappRecipient = whatsappContactDigits(item.parent.whatsapp);
  const changes: OrderPatch = {
    status: status === item.status ? undefined : status,
    payment_status: payment === item.payment_status ? undefined : payment,
    video_url: url === (item.video_url || "") ? undefined : url,
  };
  const dirty = Object.values(changes).some(value => value !== undefined);

  async function download() {
    setDownloading(true);
    setInfo("");
    try {
      const res = await fetch(target + "/zip");
      if (!res.ok) throw new Error(await apiIssue(res));
      const address = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = address;
      link.download = item.order_id + ".zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(address), 30000);
    } catch (e) { setInfo(e instanceof Error ? e.message : "Не удалось скачать архив."); }
    finally { setDownloading(false); }
  }

  async function save() {
    setBusy(true);
    setInfo("");
    try {
      const next = await patchOrder(item.order_id, changes);
      setStatus(next.status);
      setPayment(next.payment_status);
      setUrl(next.video_url || "");
      onSaved(next);
      setInfo("Изменения сохранены.");
    } catch (e) { setInfo(e instanceof Error ? e.message : "Не удалось сохранить."); }
    finally { setBusy(false); }
  }

  return <div className={s.detailGrid}>
    <div className={s.details}>
      <section className={s.panel}>
        <h2>Анкета семьи</h2>
        <dl className={s.facts}>
          <div><dt>Родитель</dt><dd>{item.parent.name}</dd></div>
          <div><dt>Телефон</dt><dd><Phone value={item.parent.whatsapp} /></dd></div>
          <div><dt>Город</dt><dd>{item.city}</dd></div>
          {item.parent.email && <div><dt>Email</dt><dd>{item.parent.email}</dd></div>}
          <div><dt>Согласие</dt><dd>{item.consent ? "Получено" : "—"}</dd></div>
          {item.payment_reported && <div><dt>Отметка клиента</dt><dd>{item.payment_reported} · демо</dd></div>}
          {item.parents_words && <div className={s.wideFact}><dt>Слова родителей</dt><dd>{item.parents_words}</dd></div>}
        </dl>
      </section>
      <section className={s.panel}>
        <h2>Детей в заказе — {item.children.length}</h2>
        {item.children.map((child, index) => <div className={s.child} key={index}>
          <h3>{child.name}</h3>
          <p>{child.gender === "boy" ? "Мальчик" : "Девочка"} · {child.age} {child.age === 1 ? "год" : child.age >= 2 && child.age <= 4 ? "года" : "лет"}</p>
          <dl className={s.childFacts}>
            {"name_stress" in child ? <>
              <div><dt>Имя с ударением</dt><dd>{child.name_stress}</dd></div>
              {child.facts.map((fact, i) => <div key={i}><dt>{i === 1 ? "Доброе дело" : "Запись в книгу"}</dt><dd>{fact}</dd></div>)}
            </> : <>
              {child.name_pronounce && <div><dt>Произношение</dt><dd>{child.name_pronounce}</dd></div>}
              <div><dt>Достижение</dt><dd>{child.fact_learned}</dd></div>
              {child.fact_kind && <div><dt>Доброе дело</dt><dd>{child.fact_kind}</dd></div>}
            </>}
          </dl>
        </div>)}
        {"shared_fact" in item && item.shared_fact && <dl className={s.childFacts}><div><dt>Общая запись в книгу</dt><dd>{item.shared_fact}</dd></div></dl>}
      </section>
      <section className={s.panel}>
        <h2>Фотографии</h2>
        <div className={s.photos}>{orderPhotos(item).map(slot => <figure key={slot.file}>
          {/* Authenticated order files must load directly from the staff API. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={target + "/" + slot.file} alt={slot.label} loading="lazy" />
          <figcaption>{slot.label}</figcaption>
        </figure>)}</div>
        <button className={s.secondary} type="button" disabled={downloading} onClick={download}>
          <Download size={17} aria-hidden />{downloading ? "Готовим архив…" : "Скачать папку заказа (.zip)"}
        </button>
      </section>
    </div>
    <section className={s.panel + " " + s.delivery}>
      <h2>Статус, оплата и видео</h2>
      <p className={s.orderAmount}>Сумма заказа <strong>{item.amount_ils} ₪</strong></p>
      {item.repeat_of && <p className={s.repeatOrder}>Второй ролик к заказу <strong>{item.repeat_of}</strong> · скидка 50%</p>}
      <div className="dm-field"><label htmlFor="dm-status">Статус заказа</label>
        <select id="dm-status" value={status} disabled={busy} onChange={event => setStatus(event.target.value as Order["status"])}>
          {statusOptions}
        </select>
      </div>
      <div className="dm-field"><label htmlFor="dm-payment">Оплата</label>
        <select id="dm-payment" value={payment} disabled={busy} onChange={event => setPayment(event.target.value as Order["payment_status"])}>
          {paymentOptions}
        </select>
      </div>
      <div className="dm-field"><label htmlFor="dm-video">Ссылка на готовое видео</label>
        <input id="dm-video" type="url" value={url} disabled={busy} placeholder="https://" onChange={event => setUrl(event.target.value)} />
      </div>
      <div className={s.deliveryActions}>
        <button type="button" className={s.primary} disabled={busy || !dirty} onClick={save}><Save size={17} aria-hidden />Сохранить</button>
        {item.video_url && whatsappRecipient && <a className={s.secondary} target="_blank" rel="noopener noreferrer"
          href={"https://wa.me/" + whatsappRecipient + "?text=" + encodeURIComponent("Здравствуйте! Ваше именное видеопоздравление готово. " + item.video_url)}>
          <MessageCircle size={17} aria-hidden />Открыть в WhatsApp
        </a>}
      </div>
      {info && <p className={s.feedback} role="status">{info}</p>}
    </section>
  </div>;
}

export function OrderAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState("");
  const [revision, setRevision] = useState(0);
  const [pendingId, setPendingId] = useState("");
  const [notice, setNotice] = useState<{ message: string; failed?: boolean }>();
  const title = useRef<HTMLHeadingElement>(null);
  const listTitle = useRef<HTMLHeadingElement>(null);
  const item = orders.find(order => order.order_id === selected);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal).then(items => {
      if (!controller.signal.aborted) { setOrders(items); setIssue(""); }
    }).catch(e => {
      if (!controller.signal.aborted) setIssue(e instanceof Error ? e.message : "Не удалось загрузить заказы.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  const activeOrderId = item?.order_id;
  useEffect(() => {
    if (creating || activeOrderId) title.current?.focus();
  }, [creating, activeOrderId]);

  function refresh() {
    setLoading(true);
    setNotice(undefined);
    setRevision(value => value + 1);
  }
  function orderSaved(next: Order) {
    setOrders(list => list.map(order => order.order_id === next.order_id ? next : order));
  }
  async function changeOrder(id: string, change: OrderChange) {
    if (change === "delete" && !window.confirm(`Удалить заказ ${id} и все его фотографии навсегда?`)) return;
    setPendingId(id);
    setNotice(undefined);
    try {
      if (change === "delete") {
        const res = await fetch(endpoint + "/" + id, { method: "DELETE" });
        if (!res.ok) throw new Error(await apiIssue(res));
        setOrders(list => list.filter(order => order.order_id !== id));
        setNotice({ message: `Заказ ${id} удалён.` });
        requestAnimationFrame(() => listTitle.current?.focus());
      } else {
        const next = await patchOrder(id, change);
        orderSaved(next);
        setNotice({ message: change.payment_status !== undefined
          ? `Отметка об оплате заказа ${id} сохранена.`
          : `Статус заказа ${id} сохранён.` });
      }
    } catch (e) {
      const detail = e instanceof Error ? e.message : "Попробуйте ещё раз.";
      setNotice({ failed: true, message: `Заказ ${id}. ${detail}` });
    } finally { setPendingId(""); }
  }
  function returnToList() {
    const triggerId = creating ? "new-order" : "open-" + selected;
    setCreating(false);
    setSelected("");
    setCreatedId("");
    requestAnimationFrame(() => document.getElementById(triggerId)?.focus());
  }
  function orderCreated(id: string) {
    setCreatedId(id);
    setSelected(id);
    setCreating(false);
    refresh();
  }

  return <div className={s.shell}>
    <header className={s.header}>
      <div className={s.headerInner}>
        <Link href="/ru" aria-label="Мишаня в Стране Чудес — главная" className={s.brand}>
          <Image src="/logo-ru.png" width={76} height={76} alt="Мишаня в Стране Чудес" loading="eager" />
        </Link>
        <span className={s.staffLabel}>Кабинет команды</span>
        <Link className={s.siteLink} href={greetingQuizPath} prefetch={false}>Страница заказа <ExternalLink size={15} aria-hidden /></Link>
      </div>
    </header>
    <main className={s.main}>
      {creating || item ? <>
        {item && <button type="button" className={s.back} onClick={returnToList}><ChevronLeft size={18} aria-hidden />К заказам</button>}
        <div className={s.viewHeading}>
          <h1 ref={title} tabIndex={-1}>{creating ? "Новый заказ" : "Заказ " + item?.order_id}</h1>
          {item && <Status value={item.status} />}
        </div>
        {item && <p className={s.created}>Оформлен <time dateTime={item.created_at}>{createdDate.format(new Date(item.created_at))}</time></p>}
      </> : <div className={s.hero}>
        <div className={s.heroContent}>
          <h1>Заказы <span>видеопоздравлений</span></h1>
          <button id="new-order" type="button" className={s.primary} disabled={loading || !!issue || !!pendingId} onClick={() => { setCreatedId(""); setSelected(""); setCreating(true); }}>
            <Plus size={18} aria-hidden />Создать заказ
          </button>
        </div>
        <div className={s.heroPhoto} aria-hidden="true">
          <WinterPhoto name="video-greeting-book" alt="" eager sizes="(max-width: 600px) 25vw, (max-width: 1120px) 30vw, 360px" />
        </div>
      </div>}

      {createdId && <p className={s.success} role="status"><CircleCheck size={18} aria-hidden />Заказ {createdId} создан.</p>}
      {creating ? <div className={s.create}><OrderForm staff={{ onCreated: orderCreated, onCancel: returnToList }} /></div>
        : item ? <Editor key={item.order_id} item={item} onSaved={orderSaved} />
        : <section className={s.orders} aria-labelledby="orders-title">
          <div className={s.listHead}>
            <h2 id="orders-title" ref={listTitle} tabIndex={-1}><Clapperboard size={21} aria-hidden />Все заказы
              {!loading && (!issue || orders.length > 0) && <span className={s.count}>{orders.length}</span>}
            </h2>
            <button className={s.refresh} type="button" disabled={loading || !!pendingId} onClick={refresh}><RefreshCw size={16} aria-hidden />Обновить</button>
          </div>
          {issue && <p className={s.error} role="alert"><CircleAlert size={18} aria-hidden />{issue}</p>}
          {notice && <p className={notice.failed ? s.error : s.success} role={notice.failed ? "alert" : "status"}>
            {notice.failed ? <CircleAlert size={18} aria-hidden /> : <CircleCheck size={18} aria-hidden />}{notice.message}
          </p>}
          {loading ? <p className={s.empty} role="status">Загружаем заказы…</p> : orders.length > 0
            ? <OrdersTable orders={orders} pendingId={pendingId} onChange={changeOrder} onSelect={id => { setCreatedId(""); setSelected(id); }} />
            : !issue && <div className={s.empty}><Inbox size={27} aria-hidden /><h3>Пока нет заказов</h3><p>После оформления здесь появятся анкета и фотографии.</p></div>}
        </section>}
    </main>
  </div>;
}
