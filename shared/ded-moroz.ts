import { parsePhoneNumberFromString } from "libphonenumber-js/min";

export type Child = { name: string; name_pronounce: string; gender: string; age: string; fact_learned: string; fact_kind: string };
export type Draft = {
  children: Child[]; city: string; otherCity: string; parents_words: string;
  parentName: string; whatsapp: string; email: string; ready_by: string; consent: boolean;
};

export const newChild = (): Child => ({ name: "", name_pronounce: "", gender: "", age: "", fact_learned: "", fact_kind: "" });
export const newDraft = (): Draft => ({
  children: [newChild()], city: "", otherCity: "", parents_words: "", parentName: "",
  whatsapp: "", email: "", ready_by: "", consent: false,
});

export const minimumChildAge = 1;
export const maximumChildAge = 12;
export const childAges = Array.from(
  { length: maximumChildAge - minimumChildAge + 1 },
  (_, index) => String(minimumChildAge + index),
);

export const cities = [
  "Нетания", "Тель-Авив", "Хайфа", "Иерусалим", "Ришон-ле-Цион", "Бат-Ям", "Ашдод", "Ашкелон",
  "Беэр-Шева", "Петах-Тиква", "Холон", "Реховот", "Герцлия", "Кфар-Саба", "Раанана", "Хадера",
  "Нагария", "Акко", "Кармиэль", "Афула", "Назарет-Иллит (Ноф-ха-Галиль)", "Кирьят-Ям",
  "Кирьят-Бялик", "Кирьят-Моцкин", "Кирьят-Ата", "Эйлат", "Модиин", "Рамат-Ган", "Гиватаим",
  "Ор-Акива", "Мигдаль-ха-Эмек", "Тират-Кармель",
].sort(new Intl.Collator("ru").compare).concat("Другой");
export const photoRoles = ["portrait", "activity", "drawing", "family"] as const;
export const statuses = { new: "Оформлен", paid: "Оплачен", in_work: "В работе", review: "На проверке", done: "Отправлен клиенту" };
export const photoLimit = 15 * 1024 * 1024;
export const preparedPhotoLimit = 3 * 1024 * 1024;
export const bookText = /^[\p{Script=Cyrillic}0-9 .,!-]+$/u;
export const formattedName = (name: string) => name.slice(0, 1).toLocaleUpperCase("ru") + name.slice(1).toLocaleLowerCase("ru");
export const familyCity = (draft: Draft) => (draft.city === "Другой" ? draft.otherCity : draft.city).trim();
export function whatsappContactDigits(value: string) {
  const phone = parsePhoneNumberFromString(value, { defaultCountry: "IL", extract: false });
  return phone?.isValid() && !phone.ext ? phone.number.slice(1) : "";
}
export function earliestDate(now = new Date()) {
  const local = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jerusalem" }).format(now);
  const day = new Date(local + "T12:00:00Z");
  day.setUTCDate(day.getUTCDate() + 2);
  return day.toISOString().slice(0, 10);
}
export function validateDraft(draft: Draft, step: 0 | 2, now = new Date()) {
  const errors: Record<string, string> = {};
  const story = (key: string, value: string, min: number, max: number) => {
    if (value.trim().length < min || value.length > max) errors[key] = `Введите от ${min} до ${max} знаков.`;
    else if (value && (!bookText.test(value) || /[\p{L}\d-]+\.(?:рф|рус|онлайн|сайт|дети|укр)(?=[\s.,!]|$)/iu.test(value))) errors[key] = "Подойдут русские буквы, цифры, пробел и знаки . , ! -";
  };
  if (step === 0) {
    if (!draft.children.length) errors.children = "Добавьте хотя бы одного ребёнка.";
    draft.children.forEach((child, index) => {
      const prefix = `child-${index}-`;
      if (!/^\p{L}{2,12}$/u.test(child.name.trim())) errors[prefix + "name"] = "Введите одно имя, от 2 до 12 букв.";
      if (child.name_pronounce.length > 30) errors[prefix + "name_pronounce"] = "Можно ввести до 30 знаков.";
      if (!["boy", "girl"].includes(child.gender)) errors[prefix + "gender"] = "Выберите вариант для обращения.";
      if (!childAges.includes(String(child.age))) {
        errors[prefix + "age"] = `Выберите возраст от ${minimumChildAge} до ${maximumChildAge} лет.`;
      }
      story(prefix + "fact_learned", child.fact_learned, 15, 60);
      story(prefix + "fact_kind", child.fact_kind, 0, 60);
    });
    if (!cities.includes(draft.city) || !familyCity(draft) || (draft.city === "Другой" && familyCity(draft).length > 25)) errors.city = "Укажите город.";
    story("parents_words", draft.parents_words, 15, 70);
  } else {
    if (!draft.parentName.trim() || draft.parentName.length > 30) errors.parentName = "Введите имя родителя, до 30 знаков.";
    if (typeof draft.whatsapp !== "string" || !draft.whatsapp.trim()) {
      errors.whatsapp = "Введите номер телефона.";
    }
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) errors.email = "Проверьте адрес почты.";
    const date = new Date(draft.ready_by + "T12:00:00Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.ready_by) || !Number.isFinite(+date) || date.toISOString().slice(0, 10) !== draft.ready_by || draft.ready_by < earliestDate(now)) errors.ready_by = "Выберите дату минимум через два дня.";
    if (draft.consent !== true) errors.consent = "Для создания видео нужно согласие родителя.";
  }
  return errors;
}

export function orderFromDraft(draft: Draft, id: string, now: Date) {
  const children = draft.children.map(c => ({
    name: formattedName(c.name.trim()), name_pronounce: c.name_pronounce.trim(), gender: c.gender,
    age: Number(c.age), fact_learned: c.fact_learned.trim(), fact_kind: c.fact_kind.trim(),
  }));
  const { name, name_pronounce, gender, age, fact_learned, fact_kind } = children[0];
  return {
    order_id: id, created_at: now.toISOString(), status: "new" as keyof typeof statuses,
    child: { name, name_pronounce, gender, age }, children, city: familyCity(draft),
    fact_learned, fact_kind, parents_words: draft.parents_words.trim(),
    photos: { portrait: "photo1.jpg", activity: "photo2.jpg", drawing: "photo3.jpg", family: "photo4.jpg" },
    parent: { name: draft.parentName.trim(), whatsapp: draft.whatsapp.trim(), email: draft.email.trim() },
    ready_by: draft.ready_by, consent: true,
  };
}
export type Order = ReturnType<typeof orderFromDraft> & { video_url?: string; payment_reported?: string };

export function cropFrame(width: number, height: number, slot: number, position: number) {
  const aspect = width / height;
  const ratio = slot === 3 ? Math.min(16 / 9, Math.max(1.5, aspect)) : Math.min(1, Math.max(0.75, aspect));
  const w = Math.min(width, Math.round(height * ratio));
  const h = Math.min(height, Math.round(width / ratio));
  const fraction = Number.isFinite(position) ? Math.max(0, Math.min(1, position / 100)) : 0.5;
  return { width: w, height: h, left: Math.round((width - w) * fraction), top: Math.round((height - h) * fraction), ratio, cropped: w !== width || h !== height };
}
