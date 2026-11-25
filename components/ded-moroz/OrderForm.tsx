"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Check, CircleCheck, Plus, Trash2 } from "lucide-react";
import { childAges, cities, earliestDate, formattedName, newChild, newDraft, photoRoles, validateDraft, type Child, type Draft } from "@/shared/ded-moroz";
import { copy } from "./copy";
import { draftKey, loadText, persistPhoto, storedPhotos, type Photo } from "./draft";
import { apiIssue, isLocalPreview, PhotoSlot, prepareOrderPhoto } from "./Photos";
import { RsvpTurnstile } from "@/components/rsvp/RsvpTurnstile";
import "@/app/(ded-moroz)/greeting.css";

type Receipt = { order_id: string; ready_by: string; reported?: string };
type SharedFields = Exclude<keyof Draft, "children" | "consent">;
const emptyPhotos = () => [null, null, null, null] as (Photo | null)[];
const dateLabel = (value: string) => new Intl.DateTimeFormat("ru", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(value + "T12:00:00Z"));

function Field({ id, label, hint, count, max, error, optional, children }: {
  id: string; label: string; hint?: string; count?: number; max?: number; error?: string; optional?: boolean; children: ReactNode;
}) {
  return <div className="dm-field" data-issue={!!error}>
    <div className="dm-label-row"><label htmlFor={id}>{label}{optional && <small> · по желанию</small>}</label>
      {typeof count === "number" && <span aria-label={`${count} из ${max}`}>{count}/{max}</span>}</div>
    {children}
    {(hint || error) && <span id={id + "-help"} className={error ? "dm-error" : "dm-hint"} role={error ? "alert" : undefined}>{error || hint}</span>}
  </div>;
}
export function OrderForm({ price }: { price: number | null }) {
  const [draft, setDraft] = useState<Draft>(newDraft), [photos, setPhotos] = useState(emptyPhotos);
  const [step, setStep] = useState(0), [key, setKey] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({}), [issue, setIssue] = useState("");
  const [busyPhotos, setBusyPhotos] = useState(0), [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null), [method, setMethod] = useState("Bit");
  const [storageNote, setStorageNote] = useState("");
  const [preview, setPreview] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [verification, setVerification] = useState(0);
  const panel = useRef<HTMLDivElement>(null), sending = useRef(false);
  useEffect(() => {
    let active = true;
    async function restore() {
      const saved = loadText();
      const images = await (saved.restorePhotos ? storedPhotos() : persistPhoto(null).then(emptyPhotos)).catch(() => null);
      if (!active) return;
      setPreview(isLocalPreview());
      if (images) setPhotos(images); else setStorageNote("Браузер не смог сохранить фотографии для следующего посещения.");
      setDraft(saved.data); setStep(saved.step); setKey(saved.key);
      try { const last = sessionStorage.getItem(draftKey + "-receipt"); if (last) setReceipt(JSON.parse(last)); } catch { /* In-memory mode. */ }
    }
    void restore(); return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!key || receipt) return;
    try { localStorage.setItem(draftKey, JSON.stringify({ data: draft, step, key, savedAt: Date.now() })); }
    catch { /* The form also works in memory. */ }
  }, [draft, step, key, receipt]);
  const focusPanel = () => requestAnimationFrame(() => { panel.current?.focus({ preventScroll: true }); panel.current?.scrollIntoView({ block: "start" }); });
  const go = (index: number) => { setErrors({}); setIssue(""); setStep(index); focusPanel(); };
  const mark = (id: string) => setErrors(old => { if (!(id in old)) return old; const next = { ...old }; delete next[id]; return next; });
  const update = (field: SharedFields, value: string) => { setDraft(old => ({ ...old, [field]: value })); mark(field === "otherCity" ? "city" : field); };
  const editChild = (index: number, field: keyof Child, value: string) => {
    setDraft(old => ({ ...old, children: old.children.map((c, i) => i === index ? { ...c, [field]: value } : c) }));
    mark(`child-${index}-${field}`);
  };
  const updatePhoto = (index: number, photo: Photo) => {
    setPhotos(old => old.map((p, i) => i === index ? photo : p)); mark("photo-" + index);
    void persistPhoto(index, photo).catch(() => setStorageNote("Фото открыто, но браузер не смог сохранить его в черновике."));
  };
  const checkPhotos = () => Object.fromEntries(photos.flatMap((p, i) => p ? [] : [["photo-" + i, "Выберите фотографию."]]));
  function highlight(found: Record<string, string>, target: number) {
    setStep(target); setErrors(found);
    const first = Object.keys(found)[0];
    requestAnimationFrame(() => { const el = document.getElementById(first.startsWith("photo-") ? first.replace("photo-", "photo-button-") : first); el?.focus(); el?.scrollIntoView({ block: "center" }); });
  }
  function keepReceipt(next: Receipt) {
    setReceipt(next);
    try { sessionStorage.setItem(draftKey + "-receipt", JSON.stringify(next)); } catch { /* In-memory mode. */ }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (sending.current || busyPhotos) return;
    setIssue("");
    const checks = [validateDraft(draft, 0), checkPhotos(), validateDraft(draft, 2)];
    for (let i = 0; i <= step; i++) if (Object.keys(checks[i]).length) { highlight(checks[i], i); return; }
    if (step < 2) { go(step + 1); return; }
    if (!preview && !turnstileToken) return;
    sending.current = true; setSubmitting(true);
    try {
      const form = new FormData();
      form.set("draft", JSON.stringify(draft)); form.set("key", key);
      if (!preview) form.set("turnstileToken", turnstileToken);
      for (const [i, photo] of photos.entries()) {
        if (!photo) continue;
        const jpeg = preview ? photo.blob : await prepareOrderPhoto(photo, i);
        form.set(photoRoles[i], jpeg, `photo${i + 1}.jpg`);
        if (preview) form.set(photoRoles[i] + "_position", String(photo.position));
      }
      const res = await fetch("/api/ded-moroz/orders", { method: "POST", body: form });
      if (!res.ok) throw new Error(await apiIssue(res));
      const result: Receipt = await res.json();
      keepReceipt(result); focusPanel();
      try { localStorage.removeItem(draftKey); } catch { /* In-memory mode. */ }
      await persistPhoto(null).catch(() => {});
    } catch (e) {
      setIssue(e instanceof Error ? e.message : "Не удалось оформить заказ.");
      if (!preview) { setTurnstileToken(""); setVerification(value => value + 1); }
    }
    finally { sending.current = false; setSubmitting(false); }
  }
  async function reportPayment() {
    if (!receipt || sending.current) return;
    sending.current = true; setSubmitting(true); setIssue("");
    try {
      const res = await fetch(`/api/ded-moroz/orders/${receipt.order_id}/payment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method }) });
      if (!res.ok) throw new Error(await apiIssue(res));
      keepReceipt({ ...receipt, reported: method });
    } catch (e) { setIssue(e instanceof Error ? e.message : "Попробуйте ещё раз."); }
    finally { sending.current = false; setSubmitting(false); }
  }
  function restart() {
    try { sessionStorage.removeItem(draftKey + "-receipt"); } catch { /* In-memory mode. */ }
    setDraft(newDraft()); setPhotos(emptyPhotos()); setKey(crypto.randomUUID()); setReceipt(null); go(0);
  }
  const familyText = (field: SharedFields, label: string, max?: number, placeholder?: string, type = "text", optional = false) =>
    <Field id={field} label={label} max={max} count={max ? draft[field].length : undefined} error={errors[field]} optional={optional}>
      <input id={field} value={draft[field]} maxLength={max} placeholder={placeholder} type={type} aria-invalid={!!errors[field]}
        aria-describedby={errors[field] ? field + "-help" : undefined} onChange={e => update(field, e.target.value)} />
    </Field>;
  return <div className="dm-panel" ref={panel} tabIndex={-1}>
    {receipt ? <div className="dm-receipt">
      <span className="dm-confirm-icon"><CircleCheck size={34} /></span><h3>Спасибо, заказ принят!</h3>
      <p>Номер заказа <strong>{receipt.order_id}</strong>.</p>
      <div className="dm-summary-line"><span>Желаемая дата</span><b>{dateLabel(receipt.ready_by)}</b></div>
      <h4>Оплата {price ? `· ${price} ₪` : ""}</h4>
      {!preview ? <p>Свяжемся с вами по указанному телефону и согласуем оплату и дату.</p> : receipt.reported ? <p role="status">Отметка об оплате через {receipt.reported} сохранена. Администратор подтвердит её вручную.</p> : <>
        <p>Это проверка оплаты. Переводить деньги не нужно.</p>
        <div className="dm-choice">{["Bit", "PayBox"].map(item => <button type="button" key={item} aria-pressed={method === item} onClick={() => setMethod(item)}>{item}</button>)}</div>
        <button type="button" className="dm-btn dm-green" disabled={submitting} onClick={() => void reportPayment()}>Я оплатил · демо</button>
      </>}
      {issue && <p className="dm-error" role="alert">{issue}</p>}
      <button className="dm-text-btn" type="button" onClick={restart}>Оформить ещё один заказ</button>
    </div> : <>
      <ol className="dm-steps" aria-label="Шаги оформления">{copy.steps.map((text, i) => <li key={text} data-state={i === step ? "current" : i < step ? "done" : "next"} aria-current={i === step ? "step" : undefined}>
        <button type="button" disabled={i >= step || !!busyPhotos || submitting} onClick={() => go(i)}><span>{i < step ? <Check size={15} /> : i + 1}</span>{text}</button>
      </li>)}</ol>
      <form className="dm-form" onSubmit={submit} noValidate>
        <h3>{copy.stepTitles[step]}</h3><p className="dm-form-note">{copy.stepNotes[step]}</p>
        {step === 0 && <>
          {draft.children.map((child, i) => {
            const fieldId = (field: keyof Child) => `child-${i}-${field}`;
            const field = (name: keyof Child, max: number, example: string, optional = false, multiline = false) => {
              const id = fieldId(name);
              const props = { id, value: child[name], maxLength: max, placeholder: example, "aria-invalid": !!errors[id],
                "aria-describedby": errors[id] ? id + "-help" : undefined,
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => editChild(i, name, e.target.value) };
              return <Field id={id} label={copy.fields[name]} count={child[name].length} max={max} error={errors[id]} optional={optional}>
                {multiline ? <textarea rows={2} {...props} /> : <input {...props} onBlur={() => {
                  if (name !== "name") return;
                  const formatted = formattedName(child.name.trim());
                  if (formatted !== child.name) editChild(i, name, formatted);
                }} />}
              </Field>;
            };
            return <fieldset className="dm-child" key={i} aria-label={`Ребёнок ${i + 1}`}>
              {draft.children.length > 1 && <button type="button" className="dm-remove" aria-label={`Убрать ребёнка ${i + 1}`} onClick={() => { setDraft(d => ({ ...d, children: d.children.filter((_, n) => i !== n) })); setErrors({}); }}><Trash2 size={15} /> Убрать</button>}
              <div className="dm-two">{field("name", 12, "Например, Соня")}{field("name_pronounce", 30, "Например, ЛиОр", true)}</div>
              <div className="dm-two">
                <Field id={fieldId("gender")} label={copy.fields.gender} error={errors[fieldId("gender")]}>
                  <select id={fieldId("gender")} value={child.gender} onChange={e => editChild(i, "gender", e.target.value)}>
                    <option value="">Выберите</option><option value="boy">Мальчик</option><option value="girl">Девочка</option></select></Field>
                <Field id={fieldId("age")} label={copy.fields.age} error={errors[fieldId("age")]}>
                  <select id={fieldId("age")} value={child.age} onChange={e => editChild(i, "age", e.target.value)}>
                    <option value="">Сколько лет?</option>
                    {childAges.map(age => <option value={age} key={age}>{age === "1" ? "1 год" : age}</option>)}
                  </select>
                </Field>
              </div>
              {field("fact_learned", 60, "Например, научилась кататься на велосипеде", false, true)}
              {field("fact_kind", 60, "Например, помогает заботиться о младшей сестре", true, true)}
            </fieldset>;
          })}
          <button type="button" className="dm-add" onClick={() => { const index = draft.children.length; setDraft(d => ({ ...d, children: [...d.children, newChild()] })); requestAnimationFrame(() => document.getElementById(`child-${index}-name`)?.focus()); }}><Plus size={17} />Добавить ребёнка</button>
          <div className="dm-family-fields"><Field id="city" label={copy.fields.city} error={errors.city}><select id="city" value={draft.city} onChange={e => update("city", e.target.value)}><option value="">Выберите город</option>{cities.map(c => <option key={c}>{c}</option>)}</select></Field>
            {draft.city === "Другой" && familyText("otherCity", copy.fields.otherCity, 25, "Ваш город")}
            <Field id="parents_words" label={copy.fields.parents_words} max={70} count={draft.parents_words.length} error={errors.parents_words}>
              <textarea id="parents_words" rows={2} maxLength={70} value={draft.parents_words} placeholder="Например, мы тобой очень гордимся и любим тебя!" onChange={e => update("parents_words", e.target.value)} />
            </Field></div>
        </>}
        {step === 1 && <div className="dm-photo-grid">{photos.map((photo, i) => <PhotoSlot key={i} index={i} value={photo} error={errors["photo-" + i]} onChange={p => updatePhoto(i, p)} onBusy={delta => setBusyPhotos(x => x + delta)} />)}</div>}
        {step === 2 && <div className="dm-contact">
          <div className="dm-summary-line"><span>Для кого</span><b>{draft.children.map(c => formattedName(c.name)).join(", ")}</b></div>
          <div className="dm-two">
            {familyText("parentName", copy.fields.parentName, 30, "Имя родителя")}
            {familyText("whatsapp", copy.fields.whatsapp, undefined, "Номер в любом формате", "tel")}
          </div>
          {familyText("email", copy.fields.email, undefined, "name@example.com", "email", true)}
          <Field id="ready_by" label={copy.fields.ready_by} error={errors.ready_by} hint="Можно выбрать дату начиная с послезавтра."><input id="ready_by" type="date" min={earliestDate()} value={draft.ready_by} onChange={e => update("ready_by", e.target.value)} /></Field>
          <label className="dm-consent"><input id="consent" type="checkbox" checked={draft.consent} onChange={e => { const checked = e.target.checked; setDraft(d => ({ ...d, consent: checked })); mark("consent"); }} />Соглашаюсь на обработку фотографий и данных детей для создания этого видео.</label>
          {errors.consent && <span className="dm-error" role="alert">{errors.consent}</span>}
          {!preview && <RsvpTurnstile locale="ru" action="ded_moroz_order" resetKey={verification} onTokenChange={setTurnstileToken} />}
        </div>}
        {storageNote && <p className="dm-small-note" role="status">{storageNote}</p>}
        {issue && <p role="alert" className="dm-error">{issue}</p>}
        <div className="dm-form-actions">{step > 0 && <button type="button" className="dm-back" disabled={submitting || !!busyPhotos} onClick={() => go(step - 1)}>Назад</button>}
          <button type="submit" className="dm-btn dm-green" disabled={!key || !!busyPhotos || submitting || (step === 2 && !preview && !turnstileToken)}>{submitting ? "Сохраняем заказ…" : ["Перейти к фотографиям", "Перейти к контактам", "Оформить заказ"][step]}</button>
        </div>
      </form>
    </>}
  </div>;
}
