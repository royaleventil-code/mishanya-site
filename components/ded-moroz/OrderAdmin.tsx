"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { greetingOrderPath } from "@/data/new-year";
import { CircleCheck, Download, MessageCircle, Plus, RefreshCw } from "lucide-react";
import { photoRoles, statuses, whatsappContactDigits, type Order } from "@/shared/ded-moroz";
import { Brand } from "./GreetingPage";
import { OrderForm } from "./OrderForm";
import { apiIssue } from "./Photos";
import { copy } from "./copy";

const endpoint = "/api/ded-moroz/staff/orders";
async function fetchOrders(signal: AbortSignal): Promise<Order[]> {
  const res = await fetch(endpoint, { cache: "no-store", signal });
  if (!res.ok) throw new Error(await apiIssue(res));
  return res.json();
}
function Editor({ item, onSaved }: { item: Order; onSaved: (o: Order) => void }) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus(); }, []);
  const [status, setStatus] = useState(item.status), [url, setUrl] = useState(item.video_url || "");
  const [info, setInfo] = useState(""), [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const target = endpoint + "/" + item.order_id;
  const whatsappRecipient = whatsappContactDigits(item.parent.whatsapp);
  async function download() {
    setDownloading(true); setInfo("");
    try {
      const res = await fetch(target + "/zip");
      if (!res.ok) throw new Error(await apiIssue(res));
      const address = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = address; link.download = item.order_id + ".zip";
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(address), 30000);
    } catch (e) { setInfo(e instanceof Error ? e.message : "Не удалось скачать архив."); }
    finally { setDownloading(false); }
  }
  const save = async () => {
    setBusy(true); setInfo("");
    try {
      const res = await fetch(target, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, video_url: url }) });
      if (!res.ok) throw new Error(await apiIssue(res));
      onSaved(await res.json()); setInfo("Изменения сохранены.");
    } catch (e) { setInfo(e instanceof Error ? e.message : "Не удалось сохранить."); }
    finally { setBusy(false); }
  };
  return <section className="dm-panel dm-admin-card" aria-labelledby="detail-title"><h2 id="detail-title" ref={title} tabIndex={-1}>{item.order_id}</h2>
    <dl className="dm-dl"><dt>Город</dt><dd>{item.city}</dd><dt>К какой дате</dt><dd>{item.ready_by}</dd>
      <dt>Родитель</dt><dd>{item.parent.name}</dd><dt>Телефон</dt><dd>{item.parent.whatsapp}</dd>
      {item.parent.email && <><dt>Email</dt><dd>{item.parent.email}</dd></>}
      <dt>Слова родителей</dt><dd>{item.parents_words}</dd><dt>Согласие</dt><dd>{item.consent ? "Получено" : "—"}</dd>
      {item.payment_reported && <><dt>Отметка клиента</dt><dd>{item.payment_reported} · демо</dd></>}</dl>
    {item.children.map((c,i) => <div className="dm-admin-child" key={i}><b>{c.name}</b> · {c.gender === "boy" ? "мальчик" : "девочка"}, {c.age} л.
      {c.name_pronounce && <p>Произношение · {c.name_pronounce}</p>}<p>Достижение · {c.fact_learned}</p>{c.fact_kind && <p>Доброе дело · {c.fact_kind}</p>}</div>)}
    <div className="dm-admin-photos">{photoRoles.map((role, i) => <figure key={role}>
      {/* Private local API images use individual order URLs. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={target + "/" + item.photos[role]} alt={copy.photos[i].name} /><figcaption>{copy.photos[i].name}</figcaption></figure>)}</div>
    <button className="dm-btn dm-outline" type="button" disabled={downloading} onClick={() => void download()}><Download size={17} />{downloading ? "Готовим архив…" : "Скачать папку заказа (.zip)"}</button>
    <div className="dm-field"><label htmlFor="dm-status">Статус заказа</label><select id="dm-status" value={status} onChange={e => setStatus(e.target.value as Order["status"])}>{Object.entries(statuses).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></div>
    <div className="dm-field"><label htmlFor="dm-video">Ссылка на готовое видео</label><input id="dm-video" type="url" value={url} placeholder="https://" onChange={e => setUrl(e.target.value)} /></div>
    <div className="dm-admin-actions"><button type="button" className="dm-btn dm-green" disabled={busy} onClick={() => void save()}>Сохранить</button>
      {item.video_url && whatsappRecipient && <a className="dm-btn dm-outline" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${whatsappRecipient}?text=${encodeURIComponent("Здравствуйте! Ваше именное видеопоздравление готово. " + item.video_url)}`}><MessageCircle size={17} />Открыть в WhatsApp</a>}</div>
    {info && <p role="status">{info}</p>}
  </section>;
}
export function OrderAdmin() {
  const [orders, setOrders] = useState<Order[]>([]), [selected, setSelected] = useState(""), [loading, setLoading] = useState(true), [issue, setIssue] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal).then(items => { if (!controller.signal.aborted) { setOrders(items); setIssue(""); } })
      .catch(e => { if (!controller.signal.aborted) setIssue(e instanceof Error ? e.message : "Не удалось загрузить заказы."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  const item = orders.find(o => o.order_id === selected);
  function refresh() {
    setLoading(true);
    setRevision(r => r + 1);
  }
  function orderCreated(id: string) {
    setCreatedId(id);
    setSelected(id);
    setCreating(false);
    refresh();
  }
  return <><header className="dm-head"><div className="dm-wrap dm-top"><Brand /><Link className="dm-nav-cta" href={greetingOrderPath} prefetch={false}>Страница заказа</Link></div></header>
    <main className="dm-wrap dm-admin"><h1>{creating ? "Новый заказ" : "Заказы видеопоздравлений"}</h1>
      {creating ? <div className="dm-admin-create">
        <OrderForm staff={{ onCreated: orderCreated, onCancel: () => setCreating(false) }} />
      </div> : <>
      <div className="dm-admin-actions">
        <button type="button" className="dm-btn dm-green" disabled={loading || !!issue} onClick={() => { setCreatedId(""); setSelected(""); setCreating(true); }}><Plus size={18} />Создать заказ</button>
        <button type="button" className="dm-btn dm-outline" disabled={loading} onClick={refresh}><RefreshCw size={16} />Обновить</button>
      </div>
      {createdId && <p className="dm-admin-success" role="status"><CircleCheck size={18} />Заказ {createdId} создан.</p>}
      {issue && <p role="alert" className="dm-error">{issue}</p>}
      {loading ? <p role="status">Загружаем заказы…</p> : !orders.length && !issue ? <p className="dm-empty">Пока нет заказов. После оформления здесь появятся анкета и фотографии.</p> :
        orders.length > 0 && <div className="dm-table-scroll"><table><caption>Заказы · {orders.length}</caption><thead><tr>{["Номер", "Оформлен", "Дети", "Телефон", "Город", "К какой дате", "Статус"].map(t => <th key={t}>{t}</th>)}</tr></thead>
          <tbody>{orders.map(o => <tr key={o.order_id}><td><button className="dm-text-btn" onClick={() => { setCreatedId(""); setSelected(o.order_id); }}>{o.order_id}</button></td><td>{new Date(o.created_at).toLocaleDateString("ru")}</td><td>{o.children.map(c => c.name).join(", ")}</td><td>{o.parent.whatsapp}</td><td>{o.city}</td><td>{o.ready_by}</td><td>{statuses[o.status]}</td></tr>)}</tbody></table></div>}
      {item && <Editor key={item.order_id} item={item} onSaved={next => setOrders(list => list.map(o => o.order_id === next.order_id ? next : o))} />}
      </>}
    </main></>;
}
