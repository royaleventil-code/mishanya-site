"use client";

import { type ReactNode } from "react";
import { cities, formattedName, isNamesake, isVowel, type Child, type Draft } from "@/shared/ded-moroz";
import s from "./quiz.module.css";

type Issues = Record<string, string>;
type Change = (value: string) => void;
export function TextField({ id, label, value, onChange, error, hint, max, placeholder, type = "text", multiline, autoComplete, inputMode }: {
  id: string; label: string; value: string; onChange: Change; error?: string; hint?: string; max?: number; placeholder?: string; type?: string; multiline?: boolean; autoComplete?: string; inputMode?: "numeric";
}) {
  const props = { id, value, maxLength: max, placeholder, autoComplete, "aria-invalid": !!error, "aria-describedby": error || hint ? id + "-help" : undefined };
  return <div className="dm-field" data-issue={!!error}>
    <div className="dm-label-row"><label htmlFor={id}>{label}</label>{multiline && max && <span>{value.length}/{max}</span>}</div>
    {multiline ? <textarea rows={2} {...props} onChange={e => onChange(e.target.value)} /> : <input type={type} inputMode={inputMode} {...props} onChange={e => onChange(e.target.value)} />}
    {(error || hint) && <span id={id + "-help"} className={error ? "dm-error" : "dm-hint"} role={error ? "alert" : undefined}>{error || hint}</span>}
  </div>;
}
function SelectField({ id, label, value, error, onChange, children }: {
  id: string; label: string; value: string; error?: string; onChange: Change; children: ReactNode;
}) {
  return <div className="dm-field" data-issue={!!error}>
    <label htmlFor={id}>{label}</label>
    <select id={id} value={value} aria-invalid={!!error} aria-describedby={error ? id + "-help" : undefined} onChange={e => onChange(e.target.value)}>{children}</select>
    {error && <span id={id + "-help"} className="dm-error" role="alert">{error}</span>}
  </div>;
}
export function ChildrenFields({ childrenData, errors, edit }: {
  childrenData: Child[]; errors: Issues; edit: (index: number, change: Partial<Child>) => void;
}) {
  return <div className={s.childList}>{childrenData.map((child, index) => {
    const prefix = "child-" + index + "-";
    const name = formattedName(child.name.trim());
    return <fieldset className={s.child} key={index}>
      <legend>Ребёнок {index + 1}</legend>
      <div className={s.two}>
        <TextField id={prefix + "name"} label="Имя ребёнка" value={child.name} max={12} hint="Напишите имя так, как его произносит Дед Мороз." placeholder="Например, Милана" error={errors[prefix + "name"]}
          onChange={value => edit(index, { name: value, stress: -1 })} />
        <div className="dm-field">
          <span className={s.label} id={prefix + "stress-label"}>Ударение в имени</span>
          <div className={s.letters} role="group" id={prefix + "stress"} tabIndex={-1} aria-labelledby={prefix + "stress-label"} aria-describedby={prefix + "stress-help"}>
            {name ? Array.from(name).map((letter, i) => isVowel(letter)
              ? <button type="button" key={i} aria-label={"Ударение на " + letter.toUpperCase() + ", буква " + (i + 1)} aria-pressed={child.stress === i} onClick={() => edit(index, { stress: i })}>{child.stress === i ? letter.toUpperCase() : letter}</button>
              : <span key={i}>{letter}</span>) : <span className={s.placeholder}>Сначала введите имя</span>}
          </div>
          <span id={prefix + "stress-help"} className={errors[prefix + "stress"] ? "dm-error" : "dm-hint"} role={errors[prefix + "stress"] ? "alert" : undefined}>{errors[prefix + "stress"] || "Нажмите на ударную гласную."}</span>
        </div>
      </div>
      {isNamesake(childrenData, index) && <TextField id={prefix + "distinction"} label="Как различить детей с одинаковым именем?" placeholder="Например, старший" value={child.distinction} max={24} error={errors[prefix + "distinction"]} onChange={value => edit(index, { distinction: value })} />}
      <div className={s.two}>
        <SelectField id={prefix + "gender"} label="Пол ребёнка" value={child.gender} error={errors[prefix + "gender"]} onChange={gender => edit(index, { gender })}><option value="">Выберите</option><option value="boy">Мальчик</option><option value="girl">Девочка</option></SelectField>
        <TextField id={prefix + "age"} label="Возраст, лет" value={child.age} inputMode="numeric" placeholder="0, если меньше года" error={errors[prefix + "age"]} onChange={age => edit(index, { age })} />
      </div>
      {childrenData.length <= 2 && <TextField id={prefix + "fact_learned"} label={childrenData.length === 1 ? "Чему ребёнок научился за год?" : "Запись в волшебную книгу"} multiline value={child.fact_learned} placeholder="Например, теперь катается на велосипеде" error={errors[prefix + "fact_learned"]} onChange={fact_learned => edit(index, { fact_learned })} />}
      {childrenData.length === 1 && <TextField id={prefix + "fact_kind"} label="Какое доброе дело сделал ребёнок?" multiline value={child.fact_kind} placeholder="Помогает бабушке по дому" error={errors[prefix + "fact_kind"]} onChange={fact_kind => edit(index, { fact_kind })} />}
    </fieldset>;
  })}</div>;
}
export function FamilyFields({ draft, errors, change }: {draft: Draft; errors: Issues; change: (patch: Partial<Draft>) => void}) {
  return <>
    <SelectField id="city" label="В каком городе живёт семья?" value={draft.city} error={errors.city} onChange={city => change({ city })}><option value="">Выберите город</option>{cities.map(city => <option key={city}>{city}</option>)}</SelectField>
    {draft.city === "Другой" && <TextField id="otherCity" label="Название города" value={draft.otherCity} max={40} error={errors.city} onChange={otherCity => change({ otherCity })} />}
    {draft.children_count === 3 && <TextField id="shared_fact" label="Что ребята сделали вместе в этом году?" hint="Одна запись в книгу для всех троих, от 15 до 60 знаков." multiline max={60} value={draft.shared_fact} placeholder="Помогали бабушке весь год" error={errors.shared_fact} onChange={shared_fact => change({ shared_fact })} />}
  </>;
}
