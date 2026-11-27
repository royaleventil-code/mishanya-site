"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import {
  counts, newChild, orderEditDraft, orderEditIssues, orderEditPhotos, orderEditSlots, orderPhotos,
  type Child, type Order, type OrderEditDraft,
} from "@/shared/ded-moroz";
import { apiIssue, PhotoSlot } from "./Photos";
import { ChildrenFields, FamilyFields, TextField } from "./QuizFields";
import type { Photos } from "./draft";
import s from "./order-admin.module.css";

type Snapshot = { order: Order; revision: string };

export function OrderDetailsEditor({ target, onSaved, onCancel }: {
  target: string; onSaved: (order: Order) => void; onCancel: () => void;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [draft, setDraft] = useState<OrderEditDraft>();
  const [uploads, setUploads] = useState<Photos>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [issue, setIssue] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyPhotos, setBusyPhotos] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const loaded = !!snapshot;

  useEffect(() => { heading.current?.focus(); }, [loaded]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const res = await fetch(target + "/edit", { cache: "no-store", signal: controller.signal });
      if (!res.ok) throw new Error(await apiIssue(res));
      const current: Snapshot = await res.json();
      if (controller.signal.aborted) return;
      setSnapshot(current);
      setDraft(orderEditDraft(current.order));
    }
    load().catch(error => {
      if (!controller.signal.aborted) setIssue(error instanceof Error ? error.message : "Не удалось загрузить заказ.");
    });
    return () => controller.abort();
  }, [target]);

  if (!snapshot || !draft) return <section className={s.panel + " " + s.editForm}>
    <h2 ref={heading} tabIndex={-1}>Редактирование заказа</h2>
    <p className={s.feedback} role={issue ? "alert" : "status"}>{issue || "Загружаем анкету…"}</p>
    <button type="button" className={s.secondary} onClick={onCancel}>Отмена</button>
  </section>;

  const original = orderEditDraft(snapshot.order);
  const sizes = counts.includes(original.children_count) ? counts : [...counts, original.children_count];
  const slots = orderEditSlots(snapshot.order, draft);
  const existing = new Set(orderPhotos(snapshot.order).map(slot => slot.file));

  function change(patch: Partial<OrderEditDraft>) {
    setDraft(current => current && { ...current, ...patch });
  }
  function editChild(index: number, patch: Partial<Child>) {
    setDraft(current => current && {
      ...current, children: current.children.map((child, i) => i === index ? { ...child, ...patch } : child),
    });
  }
  function setCount(count: number) {
    if (!draft || !snapshot) return;
    change({
      children_count: count,
      children: Array.from({ length: count }, (_, index) => draft.children[index] ?? original.children[index] ?? newChild()),
    });
    setErrors({});
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!snapshot || !draft || saving || busyPhotos) return;
    const replacements = new Set(slots.filter(slot => uploads[slot.file]).map(slot => slot.file));
    const { kept, missing } = orderEditPhotos(snapshot.order, draft, replacements);
    const issues = orderEditIssues(snapshot.order, draft);
    for (const slot of missing) issues["photo-" + slot.file] = "Загрузите фотографию.";
    setErrors(issues);
    setIssue("");
    const firstError = Object.keys(issues)[0];
    if (firstError) {
      document.getElementById(firstError)?.focus();
      return;
    }
    if ([...existing].some(file => !kept.has(file)) && !window.confirm("Сохранить новый состав детей и удалить лишние фотографии?")) return;

    const data = new FormData();
    data.set("draft", JSON.stringify(draft));
    data.set("revision", snapshot.revision);
    for (const name of replacements) data.set(name, uploads[name].blob, name);
    setSaving(true);
    try {
      const res = await fetch(target + "/edit", { method: "PATCH", body: data });
      if (!res.ok) throw new Error(await apiIssue(res));
      onSaved(await res.json());
    } catch (error) {
      setIssue(error instanceof Error ? error.message : "Не удалось сохранить заказ.");
      setSaving(false);
    }
  }

  return <form className={s.editForm} onSubmit={save} noValidate>
    <fieldset className={s.editFields} disabled={saving} aria-busy={saving}>
      <section className={s.panel}>
        <h2 ref={heading} tabIndex={-1}>Редактирование заказа</h2>
        <div className={s.editColumns}>
          <TextField id="amount" label="Сумма заказа, ₪" inputMode="decimal" value={draft.amount}
            error={errors.amount} onChange={amount => change({ amount })} />
          <div className="dm-field" data-issue={!!errors.count}>
            <label htmlFor="count">Количество детей</label>
            <select id="count" value={draft.children_count} onChange={event => setCount(Number(event.target.value))}
              aria-invalid={!!errors.count} aria-describedby={errors.count ? "count-help" : undefined}>
              {sizes.map(count => <option key={count} value={count}>{count}</option>)}
            </select>
            {errors.count && <span id="count-help" role="alert" className="dm-error">{errors.count}</span>}
          </div>
        </div>
      </section>
      <section className={s.panel}>
        <h2>Анкета семьи</h2>
        <div className={s.editColumns}>
          <TextField id="parentName" label="Имя родителя" value={draft.parentName} max={30}
            error={errors.parentName} onChange={parentName => change({ parentName })} />
          <TextField id="whatsapp" label="Номер WhatsApp" type="tel" value={draft.whatsapp}
            error={errors.whatsapp} onChange={whatsapp => change({ whatsapp })} />
          <TextField id="email" label="Email" type="email" value={draft.email}
            error={errors.email} onChange={email => change({ email })} />
          <FamilyFields draft={draft} errors={errors} change={change} />
        </div>
        {("photos" in snapshot.order || snapshot.order.parents_words) && <TextField id="parents_words" label="Слова родителей"
          multiline value={draft.parents_words} onChange={parents_words => change({ parents_words })} />}
        <ChildrenFields childrenData={draft.children} errors={errors} edit={editChild} editing />
      </section>
      <section className={s.panel}>
        <h2>Фотографии</h2>
        <div className={s.editPhotos}>{slots.map(slot => <PhotoSlot
          key={slot.file} slot={slot} value={uploads[slot.file]}
          existingUrl={existing.has(slot.file) ? target + "/" + slot.file + "?v=" + snapshot.revision : undefined}
          error={errors["photo-" + slot.file]}
          onChange={photo => {
            setUploads(current => ({ ...current, [slot.file]: photo }));
            setErrors(current => ({ ...current, ["photo-" + slot.file]: "" }));
          }}
          onBusy={delta => setBusyPhotos(value => value + delta)}
        />)}</div>
      </section>
      <div className={s.editActions}>
        {issue && <p className={s.error} role="alert">{issue}</p>}
        <button type="button" className={s.secondary} onClick={onCancel}>Отмена</button>
        <button type="submit" className={s.primary} disabled={busyPhotos > 0}><Save size={17} aria-hidden />
          {saving ? "Сохраняем…" : "Сохранить изменения"}
        </button>
      </div>
    </fieldset>
  </form>;
}
