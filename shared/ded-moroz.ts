import { parsePhoneNumberFromString } from "libphonenumber-js/min";

export type Child = { name: string; stress: number; distinction: string; gender: string; age: string; fact_learned: string; fact_kind: string };
export type Draft = {
  children_count: number; children: Child[]; shared_fact: string; city: string; otherCity: string; parents_words: string;
  parentName: string; whatsapp: string; email: string; consent: boolean;
};
export const newChild = (): Child => ({ name: "", stress: -1, distinction: "", gender: "", age: "", fact_learned: "", fact_kind: "" });
export const newDraft = (): Draft => ({
  children_count: 0, children: [], shared_fact: "", city: "", otherCity: "", parents_words: "",
  parentName: "", whatsapp: "", email: "", consent: false,
});
export const counts = [1, 2, 3, 4, 5];
export const minimumChildAge = 1;
export const maximumChildAge = 14;
export const childAges = Array.from({ length: maximumChildAge }, (_, i) => String(i + 1));
export const cities = [
  "Нетания", "Тель-Авив", "Хайфа", "Иерусалим", "Ришон-ле-Цион", "Бат-Ям", "Ашдод", "Ашкелон",
  "Беэр-Шева", "Петах-Тиква", "Холон", "Реховот", "Герцлия", "Кфар-Саба", "Раанана", "Хадера",
  "Нагария", "Акко", "Кармиэль", "Афула", "Назарет-Иллит (Ноф-ха-Галиль)", "Кирьят-Ям",
  "Кирьят-Бялик", "Кирьят-Моцкин", "Кирьят-Ата", "Эйлат", "Модиин", "Рамат-Ган", "Гиватаим",
  "Ор-Акива", "Мигдаль-ха-Эмек", "Тират-Кармель",
].sort(new Intl.Collator("ru").compare).concat("Другой");
export const statuses = { new: "Оформлен", paid: "Оплачен", in_work: "В работе", review: "На проверке", done: "Отправлен клиенту", cancelled: "Отменён" };
export const photoLimit = 15 * 1024 * 1024;
export const preparedPhotoLimit = 3 * 1024 * 1024;
export const maxPhotos = 6;
export const orderPhotoPattern = /^(?:child[1-5]_1|child1_2|family|photo[1-4])\.jpg$/;
export const bookText = /^[\p{Script=Cyrillic}0-9 .,!-]+$/u;
export const formattedName = (name: string) => name.slice(0, 1).toLocaleUpperCase("ru") + name.slice(1).toLocaleLowerCase("ru");
export const familyCity = (draft: Draft) => (draft.city === "Другой" ? draft.otherCity : draft.city).trim();
export function whatsappContactDigits(value: string) {
  const phone = parsePhoneNumberFromString(value, { defaultCountry: "IL", extract: false });
  return phone?.isValid() && !phone.ext ? phone.number.slice(1) : "";
}
export const isVowel = (letter: string) => /^[аеёиоуыэюяєіїaeiouyáéíóúäöü]$/iu.test(letter || "");
export const isNamesake = (children: Child[], index: number) => {
  const name = children[index].name.trim().toLowerCase();
  return !!name && children.some((c, i) => i !== index && c.name.trim().toLowerCase() === name);
};
function qualifier(children: Child[], index: number) {
  return isNamesake(children, index) ? children[index].distinction.trim() : "";
}
export function childLabel(children: Child[], index: number) {
  return [formattedName(children[index].name.trim()), qualifier(children, index)].filter(Boolean).join(" ");
}
export type PhotoSlotInfo = { file: string; kind: "portrait" | "activity" | "family" | "legacy"; label: string; hint: string };
export function photoSlots(children: { name: string }[]): PhotoSlotInfo[] {
  if (!children.length) return [];
  const slots: PhotoSlotInfo[] = children.map((child, i) => ({
    file: "child" + (i + 1) + "_1.jpg", kind: "portrait", label: "Портрет · " + (child.name || "ребёнок " + (i + 1)),
    hint: "Вертикальный или квадратный кадр. Лицо крупно, ребёнок в кадре один.",
  }));
  if (children.length === 1) slots.push({ file: "child1_2.jpg", kind: "activity", label: "Любимое занятие", hint: "Вертикальное или квадратное фото ребёнка за любимым занятием." });
  slots.push({ file: "family.jpg", kind: "family", label: "Семейное фото", hint: "Горизонтальный снимок всей семьи. Оставьте немного места вокруг лиц." });
  return slots;
}
export function photoIssue(width: number, height: number, kind: PhotoSlotInfo["kind"]) {
  if (Math.min(width, height) < 800) return "Фото слишком маленькое, выберите другое";
  if (kind === "family" && width <= height) return "Выберите горизонтальное семейное фото.";
  if ((kind === "portrait" || kind === "activity") && width > height) return "Выберите вертикальное или квадратное фото ребёнка.";
  return "";
}

type Issues = Record<string, string>;
function storyIssue(text: string, max: number, fact = false) {
  const trimmed = text.trim();
  if (trimmed.length < 15 || trimmed.length > max) return "Введите от 15 до " + max + " знаков.";
  if (!bookText.test(trimmed) || /[\p{L}\d-]+\.(?:рф|рус|онлайн|сайт|дети|укр)(?=[\s.,!]|$)/iu.test(trimmed)) return "Напишите фразу по-русски, без ссылок.";
  if (fact) {
    const first = trimmed.toLocaleLowerCase("ru").split(/[\s,.!]+/u)[0].replace(/(?:ся|сь)$/u, "");
    if (!/(?:л[аои]?|[еёиюяау]т|[еи]м|ишь|ешь|[иы]ть|ать|ять|[её]ть|ти|чь|с|г|рос|нёс|шёл)$/u.test(first))
      return "Начните с действия, например «помогает маме по дому».";
  }
  return "";
}
export function validateDraft(draft: Draft, step: number): Issues {
  const errors: Issues = {};
  const mark = (key: string, error: string) => { if (error) errors[key] = error; };
  if (!counts.includes(draft.children_count) || !Array.isArray(draft.children) || draft.children.length !== draft.children_count)
    return { count: "Выберите от одного до пяти детей." };
  if (step === 1) {
    draft.children.forEach((child, i) => {
      const id = "child-" + i + "-";
      const name = child.name.trim();
      if (!/^\p{L}{1,12}$/u.test(name)) errors[id + "name"] = "Введите имя до 12 букв.";
      if (!Number.isInteger(child.stress) || !isVowel(Array.from(name)[child.stress])) errors[id + "stress"] = "Нажмите на ударную гласную в имени.";
      if (isNamesake(draft.children, i)) {
        const note = qualifier(draft.children, i);
        if (!/^[\p{L} -]{1,24}$/u.test(note) || draft.children.some((c, j) => j !== i && c.name.trim().toLowerCase() === name.toLowerCase() && c.distinction.trim().toLowerCase() === note.toLowerCase()))
          errors[id + "distinction"] = "Уточните, как различить детей, например «старший» или «младший».";
      }
      if (!["boy", "girl"].includes(child.gender)) errors[id + "gender"] = "Выберите пол ребёнка.";
      if (!childAges.includes(String(child.age))) errors[id + "age"] = "Выберите возраст от 1 до 14 лет.";
      if (draft.children_count <= 2) mark(id + "fact_learned", storyIssue(child.fact_learned, 60, true));
      if (draft.children_count === 1) mark(id + "fact_kind", storyIssue(child.fact_kind, 60, true));
    });
  }
  if (step === 2) {
    if (!cities.includes(draft.city) || !familyCity(draft) || familyCity(draft).length > 40) errors.city = "Укажите город.";
    mark("parents_words", storyIssue(draft.parents_words, 70));
    if (draft.children_count === 3) mark("shared_fact", storyIssue(draft.shared_fact, 60, true));
  }
  if (step === 4) {
    if (!draft.parentName.trim() || draft.parentName.length > 30) errors.parentName = "Введите имя родителя, до 30 знаков.";
    if (!whatsappContactDigits(draft.whatsapp).startsWith("972")) errors.whatsapp = "Введите израильский номер, например 050-123-4567.";
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email = "Проверьте адрес электронной почты.";
    if (draft.consent !== true) errors.consent = "Для создания видео нужно согласие родителя.";
  }
  return errors;
}
export function allDraftIssues(draft: Draft): Issues {
  return Object.assign({}, ...[0, 1, 2, 4].map(step => validateDraft(draft, step)));
}
export function orderFromDraft(draft: Draft, id: string, now: Date) {
  const count = draft.children.length;
  const children = draft.children.map((c, i) => {
    const name = formattedName(c.name.trim());
    const letters = Array.from(name);
    letters[c.stress] = letters[c.stress].toLocaleUpperCase("ru");
    return {
      name: childLabel(draft.children, i), name_stress: [letters.join(""), qualifier(draft.children, i)].filter(Boolean).join(" "),
      gender: c.gender, age: Number(c.age), photos: count === 1 ? ["child1_1.jpg", "child1_2.jpg"] : ["child" + (i + 1) + "_1.jpg"],
      facts: count === 1 ? [c.fact_learned.trim(), c.fact_kind.trim()] : count === 2 ? [c.fact_learned.trim()] : [],
    };
  });
  return {
    order_id: id, created_at: now.toISOString(), status: "new" as keyof typeof statuses, children_count: count, children,
    shared_fact: count === 3 ? draft.shared_fact.trim() : "", city: familyCity(draft), parents_words: draft.parents_words.trim(),
    family_photo: "family.jpg", parent: { name: draft.parentName.trim(), whatsapp: "+" + whatsappContactDigits(draft.whatsapp), email: draft.email.trim() },
    consent: true,
  };
}
type LegacyChild = { name: string; name_pronounce?: string; gender: string; age: number; fact_learned: string; fact_kind?: string };
type NewOrder = ReturnType<typeof orderFromDraft>;
type LegacyOrder = Omit<NewOrder,"children_count"|"children"|"family_photo"|"shared_fact"> & {
  children: LegacyChild[]; photos: Record<string,string>; ready_by?: string;
};
export type Order = (NewOrder | LegacyOrder) & { video_url?: string; payment_reported?: string };
export function orderPhotos(order: Order): PhotoSlotInfo[] {
  if ("family_photo" in order) return photoSlots(order.children);
  const labels = ["Портрет", "Любимое занятие", "Рисунок или поделка", "Вся семья"];
  return ["portrait","activity","drawing","family"].map((role, i) => ({
    file: order.photos[role], label: labels[i], kind: "legacy", hint: "",
  }));
}
