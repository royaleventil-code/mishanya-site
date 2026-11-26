"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, CircleCheck } from "lucide-react";
import { childLabel, counts, newChild, newDraft, photoSlots, validateDraft, type Child, type Draft } from "@/shared/ded-moroz";
import { RsvpTurnstile } from "@/components/rsvp/RsvpTurnstile";
import { draftKey, loadText, persistPhoto, storedPhotos, type Photo, type Photos } from "./draft";
import { apiIssue, isLocalPreview, PhotoSlot } from "./Photos";
import { ChildrenFields, FamilyFields, TextField } from "./QuizFields";
import s from "./quiz.module.css";

type Receipt = { order_id: string; reported?: string };
type FormProps = { price: number | null; staff?: undefined } | { price?: undefined; staff: { onCreated: (id: string) => void; onCancel: () => void } };
const steps = ["Участники", "Дети", "Семья", "Фотографии", "Контакты"];
const titles = ["Сколько планируется детей поздравить?", "Расскажите о каждом ребёнке", "Расскажите о вашей семье", "Добавьте фотографии для ролика", "Куда прислать поздравление?"];
const anchors = ["kolichestvo", "deti", "semya", "foto", "kontakty"];
const receiptKey = draftKey + "-receipt";

function issuesAt(draft: Draft, photos: Photos, step: number) {
  if (step !== 3) return validateDraft(draft, step);
  const errors: Record<string,string> = {};
  for (const slot of photoSlots(draft.children)) if (!photos[slot.file]) errors["photo-" + slot.file] = "Выберите фотографию.";
  return errors;
}
function reachable(draft: Draft, photos: Photos, step: number) {
  for (let i = 0; i < step; i++) if (Object.keys(issuesAt(draft, photos, i)).length) return i;
  return step;
}
export function OrderForm({ price, staff }: FormProps) {
  const isStaff = !!staff;
  const [draft, setDraft] = useState<Draft>(newDraft), [photos, setPhotos] = useState<Photos>({});
  const [step, setStep] = useState(0), [key, setKey] = useState("");
  const [errors, setErrors] = useState<Record<string,string>>({}), [issue, setIssue] = useState(""), [storageNote, setStorageNote] = useState("");
  const [busyPhotos, setBusyPhotos] = useState(0), [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(false), [receipt, setReceipt] = useState<Receipt | null>(null);
  const [method, setMethod] = useState("Bit"), [token, setToken] = useState(""), [verification, setVerification] = useState(0);
  const title = useRef<HTMLHeadingElement>(null), sending = useRef(false);
  const Heading = isStaff ? "h2" : "h1";
  const slots = photoSlots(draft.children.map((_, i) => ({ name: childLabel(draft.children, i) })));
  const needsVerification = !isStaff && !preview;

  useEffect(() => {
    let active = true;
    async function restore() {
      setPreview(isLocalPreview());
      if (isStaff) { setKey(crypto.randomUUID()); return; }
      const saved = loadText();
      let restored: Photos = {};
      if (saved.legacy) setStorageNote("Сохранили текст вашей анкеты. Выберите число детей, проверьте ударения и добавьте фотографии.");
      else if (saved.data.children_count) {
        try { restored = await storedPhotos(saved.key); }
        catch { if (active) setStorageNote("Фотографии не удалось восстановить. Добавьте их ещё раз."); }
      }
      if (!active) return;
      const next = reachable(saved.data, restored, saved.step);
      setDraft(saved.data); setPhotos(restored); setStep(next); setKey(saved.key);
      try {
        const last = JSON.parse(sessionStorage.getItem(receiptKey) || "null");
        if (last?.order_id) setReceipt(last);
        window.history.replaceState({ ...window.history.state, greetingKey: saved.key, greetingStep: next }, "", "#" + anchors[next]);
      } catch { /* The form also works without browser storage. */ }
    }
    void restore(); return () => { active = false; };
  }, [isStaff]);
  useEffect(() => {
    if (!isStaff && key && !receipt) {
      try { localStorage.setItem(draftKey, JSON.stringify({ version: 2, data: draft, step, key, savedAt: Date.now() })); }
      catch { /* Keep the draft in memory. */ }
    }
  }, [isStaff, key, draft, step, receipt]);
  useEffect(() => {
    if (isStaff || !key || receipt) return;
    const back = (event: PopStateEvent) => {
      if (event.state?.greetingKey !== key) return;
      const next = reachable(draft, photos, Math.max(0, Math.min(4, Number(event.state.greetingStep) || 0)));
      setErrors({}); setIssue(""); setStep(next);
      requestAnimationFrame(() => title.current?.focus());
    };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, [isStaff, key, draft, photos, receipt]);

  function go(next: number) {
    setErrors({}); setIssue(""); setStep(next);
    if (!isStaff) {
      const state = { ...window.history.state, greetingKey: key, greetingStep: next };
      if (next < step) window.history.replaceState(state, "", "#" + anchors[next]);
      else window.history.pushState(state, "", "#" + anchors[next]);
    }
    requestAnimationFrame(() => { title.current?.focus({ preventScroll: true }); title.current?.scrollIntoView({ block: "start" }); });
  }
  function change(patch: Partial<Draft>) {
    setDraft(old => ({ ...old, ...patch })); setErrors({});
  }
  function changeCount(count: number) {
    if (!key) return;
    const children = Array.from({ length: count }, (_, i) => draft.children[i] || newChild());
    const active = new Set(photoSlots(children).map(slot => slot.file));
    const keep: Photos = {};
    for (const [file, photo] of Object.entries(photos)) {
      if (active.has(file)) keep[file] = photo;
      else if (!isStaff) void persistPhoto(key, file).catch(() => {});
    }
    setPhotos(keep); change({ children_count: count, children }); go(1);
  }
  function changeChild(index: number, patch: Partial<Child>) {
    setDraft(old => ({ ...old, children: old.children.map((c, i) => i === index ? { ...c, ...patch } : c) }));
    setErrors({});
  }
  function addPhoto(file: string, photo: Photo) {
    setPhotos(old => ({ ...old, [file]: photo }));
    setErrors(old => { const next = { ...old }; delete next["photo-" + file]; return next; });
    if (!isStaff) void persistPhoto(key, file, photo).catch(() => setStorageNote("Фото добавлено. Держите эту страницу открытой до отправки."));
  }
  function keepReceipt(next: Receipt) {
    setReceipt(next);
    try { sessionStorage.setItem(receiptKey, JSON.stringify(next)); } catch { /* In-memory mode. */ }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending.current || busyPhotos || !key || !step) return;
    setIssue("");
    for (let i = 0; i <= step; i++) {
      const found = issuesAt(draft, photos, i), first = Object.keys(found)[0];
      if (first) {
        if (i !== step) go(i);
        setErrors(found);
        requestAnimationFrame(() => document.getElementById(first)?.focus());
        return;
      }
    }
    if (step < 4) { go(step + 1); return; }
    if (needsVerification && !token) return;
    sending.current = true; setSubmitting(true);
    try {
      const body = new FormData();
      body.set("key", key); body.set("draft", JSON.stringify(draft));
      if (needsVerification) body.set("turnstileToken", token);
      for (const slot of slots) body.set(slot.file, photos[slot.file].blob, slot.file);
      const res = await fetch(isStaff ? "/api/ded-moroz/staff/orders" : "/api/ded-moroz/orders", { method: "POST", body });
      if (!res.ok) throw new Error(await apiIssue(res));
      const result: Receipt = await res.json();
      if (staff) { staff.onCreated(result.order_id); return; }
      keepReceipt(result);
      try { localStorage.removeItem(draftKey); } catch { /* In-memory mode. */ }
      await persistPhoto(key).catch(() => {});
      window.scrollTo({ top: 0 }); requestAnimationFrame(() => title.current?.focus());
    } catch (e) {
      setIssue(e instanceof Error ? e.message : "Не удалось оформить заказ.");
      if (needsVerification) { setToken(""); setVerification(v => v + 1); }
    } finally { sending.current = false; setSubmitting(false); }
  }
  async function reportPayment() {
    if (!receipt || sending.current) return;
    sending.current = true; setSubmitting(true); setIssue("");
    try {
      const res = await fetch("/api/ded-moroz/orders/" + receipt.order_id + "/payment", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method }),
      });
      if (!res.ok) throw new Error(await apiIssue(res));
      keepReceipt({ ...receipt, reported: method });
    } catch (e) { setIssue(e instanceof Error ? e.message : "Попробуйте ещё раз."); }
    finally { sending.current = false; setSubmitting(false); }
  }
  function restart() {
    try { sessionStorage.removeItem(receiptKey); } catch { /* In-memory mode. */ }
    const fresh = crypto.randomUUID();
    setKey(fresh); setDraft(newDraft()); setPhotos({}); setStep(0); setReceipt(null); setIssue(""); setErrors({}); setStorageNote(""); setToken(""); setVerification(v => v + 1);
    if (!isStaff) window.history.replaceState({ ...window.history.state, greetingKey: fresh, greetingStep: 0 }, "", "#" + anchors[0]);
  }
  if (receipt) return <section className={s.card + " " + s.receipt}>
    <CircleCheck size={36} aria-hidden /><Heading ref={title} tabIndex={-1}>Спасибо, заказ принят!</Heading>
    <p>Номер заказа <strong>{receipt.order_id}</strong></p><p>Срок изготовления — <strong>1–5 рабочих дней</strong>.</p>
    <h3>Оплата {price ? "· " + price + " ₪" : ""}</h3>
    {!preview ? <p>Свяжемся с вами в WhatsApp и согласуем оплату.</p> : receipt.reported ? <p role="status">Отметка об оплате через {receipt.reported} сохранена.</p> : <>
      <p>Демонстрация оплаты. Переводить деньги не нужно.</p>
      <div className="dm-choice">{["Bit", "PayBox"].map(name => <button key={name} aria-pressed={name === method} onClick={() => setMethod(name)}>{name}</button>)}</div>
      <button className={s.primary} disabled={submitting} onClick={() => void reportPayment()}>Я оплатил · демо</button>
    </>}
    {issue && <p role="alert" className="dm-error">{issue}</p>}
    <button className={s.back} onClick={restart}>Оформить ещё один заказ</button>
  </section>;
  return <section className={s.card} aria-labelledby="quiz-question">
    <div className={s.progress}><span>Шаг {step + 1} из {steps.length}</span><b>{steps[step]}</b></div>
    <div className={s.progressBars} aria-hidden>{steps.map((part, i) => <span key={part} data-complete={i <= step} />)}</div>
    <Heading id="quiz-question" tabIndex={-1} ref={title}>{titles[step]}</Heading>
    {storageNote && <p className={s.note} role="status">{storageNote}</p>}
    {step === 0 ? <>
      <div className={s.counts} role="group" aria-label="Количество детей" id="count">{counts.map(n =>
        <button type="button" disabled={!key} key={n} aria-label={n + (n === 1 ? " ребёнок" : n === 5 ? " детей" : " ребёнка")} aria-pressed={draft.children_count === n} onClick={() => changeCount(n)}><strong>{n}</strong><span>{n === 1 ? "ребёнок" : n === 5 ? "детей" : "ребёнка"}</span></button>
      )}</div>
      <p className={s.note}>До пяти детей в одном видеопоздравлении.</p>
      {staff && <button type="button" className={s.back} onClick={staff.onCancel}>Отменить</button>}
    </> : <form onSubmit={submit} noValidate>
      {step === 1 && <ChildrenFields childrenData={draft.children} errors={errors} edit={changeChild} />}
      {step === 2 && <FamilyFields draft={draft} errors={errors} change={change} />}
      {step === 3 && <>
        <p className={s.note}>По короткой стороне — от 800 пикселей. JPG, PNG или HEIC, до 15 МБ за снимок.</p>
        <div className={s.photos}>{slots.map(slot => <PhotoSlot key={slot.file} slot={slot} value={photos[slot.file]} error={errors["photo-" + slot.file]} onChange={p => addPhoto(slot.file, p)} onBusy={delta => setBusyPhotos(n => n + delta)} />)}</div>
      </>}
      {step === 4 && <>
        <p className={s.note}>Видеопоздравление получит родитель в WhatsApp.</p>
        <div className={s.two}>
          <TextField id="parentName" label={isStaff ? "Имя родителя" : "Ваше имя"} value={draft.parentName} max={30} autoComplete="given-name" error={errors.parentName} onChange={parentName => change({ parentName })} />
          <TextField id="whatsapp" type="tel" label="WhatsApp родителя" value={draft.whatsapp} autoComplete="tel" placeholder="050-123-4567" error={errors.whatsapp} onChange={whatsapp => change({ whatsapp })} />
        </div>
        <TextField id="email" type="email" label="Электронная почта · по желанию" value={draft.email} autoComplete="email" error={errors.email} onChange={email => change({ email })} />
        <label className="dm-consent"><input id="consent" type="checkbox" checked={draft.consent} onChange={e => change({ consent: e.target.checked })} />{isStaff ? "Родитель дал согласие на обработку данных и фотографий для создания видео." : "Соглашаюсь на обработку данных и фотографий детей для создания видео."}</label>
        {errors.consent && <span role="alert" className="dm-error">{errors.consent}</span>}
        {needsVerification && <RsvpTurnstile locale="ru" action="ded_moroz_order" resetKey={verification} onTokenChange={setToken} />}
      </>}
      {issue && <p role="alert" className="dm-error">{issue}</p>}
      <div className={s.actions}>
        <button type="button" className={s.back} disabled={!!busyPhotos || submitting} onClick={() => go(step - 1)}>Назад</button>
        {staff && <button type="button" className={s.cancel} disabled={!!busyPhotos || submitting} onClick={staff.onCancel}>Отменить</button>}
        <button className={s.primary} type="submit" disabled={!key || !!busyPhotos || submitting || (step === 4 && needsVerification && !token)}>{submitting ? "Сохраняем…" : step === 4 ? <><Check size={17} aria-hidden />Оформить заказ</> : "Дальше"}</button>
      </div>
    </form>}
  </section>;
}
