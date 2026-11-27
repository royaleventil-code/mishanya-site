import { parsePhoneNumberFromString } from "libphonenumber-js/min";
import { secondVideoPrice, videoGreetingPrice } from "./ded-moroz-pricing.js";

export type Child = { name: string; stress: number; distinction: string; gender: string; age: string; fact_learned: string };
export type Draft = {
  children_count: number; children: Child[]; shared_fact: string; city: string; otherCity: string;
  parentName: string; whatsapp: string; email: string; consent: boolean;
};
export const newChild = (): Child => ({ name: "", stress: -1, distinction: "", gender: "", age: "", fact_learned: "" });
export const newDraft = (): Draft => ({
  children_count: 0, children: [], shared_fact: "", city: "", otherCity: "",
  parentName: "", whatsapp: "", email: "", consent: false,
});
export const counts = [1, 2, 3, 4];
export const orderRequestKeyPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const orderCodePattern = /^DM-(\d{4})-(\d{4,12})$/;
export const secondVideoUnavailable = "Скидка на второй ролик по этому заказу уже использована или недоступна.";
export const secondVideoPhoneIssue = "Укажите номер WhatsApp из первого заказа, чтобы получить скидку.";
export function readSecondVideoReference(value: unknown) {
  if (typeof value !== "string") return undefined;
  if (orderCodePattern.test(value)) return value;
  return orderRequestKeyPattern.test(value) ? value.toLowerCase() : undefined;
}
const nofHaGalil = "Ноф-ха-Галиль";
export const cities = [
  "Нетания", "Тель-Авив", "Хайфа", "Иерусалим", "Ришон-ле-Цион", "Бат-Ям", "Ашдод", "Ашкелон",
  "Беэр-Шева", "Петах-Тиква", "Холон", "Реховот", "Герцлия", "Кфар-Саба", "Раанана", "Хадера",
  "Нагария", "Акко", "Кармиэль", "Афула", nofHaGalil, "Кирьят-Ям",
  "Кирьят-Бялик", "Кирьят-Моцкин", "Кирьят-Ата", "Эйлат", "Модиин", "Рамат-Ган", "Гиватаим",
  "Ор-Акива", "Мигдаль-ха-Эмек", "Тират-Кармель",
].sort(new Intl.Collator("ru").compare).concat("Другой");
export const statuses = { new: "Оформлен", in_work: "В работе", review: "На проверке", done: "Отправлен клиенту", cancelled: "Отменён" };
export const paymentStatuses = { unmarked: "Не отмечено", unpaid: "Не оплачен", paid: "Оплачен" };
export type OrderStatus = keyof typeof statuses;
export type PaymentStatus = keyof typeof paymentStatuses;
export type OrderPatch = { status?: OrderStatus; payment_status?: PaymentStatus; video_url?: string };

export function orderProgress(status: OrderStatus | "paid", payment?: PaymentStatus): { status: OrderStatus; payment_status: PaymentStatus } {
  if (status === "paid") return { status: "new", payment_status: "paid" };
  return { status, payment_status: payment ?? "unmarked" };
}

export function readOrderPatch(value: unknown): OrderPatch | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  // An older open copy of the cabinet can still submit payment as an order status.
  const legacyPaid = input.status === "paid" && input.payment_status === undefined;
  const status = legacyPaid ? undefined : input.status;
  const payment = legacyPaid ? "paid" : input.payment_status;
  const patch: OrderPatch = {};
  if (status !== undefined) {
    if (typeof status !== "string" || !Object.hasOwn(statuses, status)) return null;
    patch.status = status as OrderStatus;
  }
  if (payment !== undefined) {
    if (typeof payment !== "string" || !Object.hasOwn(paymentStatuses, payment)) return null;
    patch.payment_status = payment as PaymentStatus;
  }
  if (input.video_url !== undefined) {
    if (typeof input.video_url !== "string") return null;
    patch.video_url = input.video_url.trim();
  }
  return Object.keys(patch).length ? patch : null;
}

export const photoLimit = 15 * 1024 * 1024;
export const preparedPhotoLimit = 3 * 1024 * 1024;
export const maxPhotos = 5;
export const orderPhotoPattern = /^(?:child[1-5]_1|child1_[23]|family|photo[1-4])\.jpg$/;
export const formattedName = (name: string) => name.slice(0, 1).toLocaleUpperCase("ru") + name.slice(1).toLocaleLowerCase("ru");
export const normalizeSelectedCity = (city: string) => city === "Назарет-Иллит (Ноф-ха-Галиль)" ? nofHaGalil : city;
export const familyCity = (draft: Draft) => (draft.city === "Другой" ? draft.otherCity : normalizeSelectedCity(draft.city)).trim();
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
export type PhotoSlotInfo = { file: string; kind: "portrait" | "activity" | "extra" | "family" | "legacy"; label: string; hint: string };
const singleChildPhotos: PhotoSlotInfo[] = [
  { file: "child1_2.jpg", kind: "activity", label: "Любимое занятие", hint: "Вертикальное или квадратное фото ребёнка за любимым занятием." },
  { file: "child1_3.jpg", kind: "extra", label: "Ещё одно фото ребёнка", hint: "Любой снимок, на котором хорошо видно ребёнка." },
];
const familyPhoto: PhotoSlotInfo = {
  file: "family.jpg", kind: "family", label: "Семейное фото",
  hint: "Горизонтальный снимок всей семьи. Оставьте немного места вокруг лиц.",
};
function portraitPhoto(file: string, name: string, index: number): PhotoSlotInfo {
  return {
    file, kind: "portrait", label: "Портрет · " + (name || "ребёнок " + (index + 1)),
    hint: "Вертикальный или квадратный кадр. Лицо крупно, ребёнок в кадре один.",
  };
}
function childPhotoSlots(child: { name: string }, index: number, count: number) {
  const portrait = portraitPhoto("child" + (index + 1) + "_1.jpg", child.name, index);
  return count === 1 ? [portrait, ...singleChildPhotos] : [portrait];
}
export function photoSlots(children: { name: string }[]): PhotoSlotInfo[] {
  if (!children.length) return [];
  return [...children.flatMap((child, index) => childPhotoSlots(child, index, children.length)), familyPhoto];
}
export function photoIssue(width: number, height: number, kind: PhotoSlotInfo["kind"]) {
  if (Math.min(width, height) < 800) return "Фото слишком маленькое, выберите другое";
  if (kind === "family" && width <= height) return "Выберите горизонтальное семейное фото.";
  if ((kind === "portrait" || kind === "activity") && width > height) return "Выберите вертикальное или квадратное фото ребёнка.";
  return "";
}

type Issues = Record<string, string>;
export function validateDraft(draft: Draft, step: number): Issues {
  const errors: Issues = {};
  if (!counts.includes(draft.children_count) || !Array.isArray(draft.children) || draft.children.length !== draft.children_count)
    return { count: "Выберите от одного до четырёх детей." };
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
      const age = String(child.age).trim();
      if (!/^\d+$/.test(age) || !Number.isSafeInteger(Number(age))) errors[id + "age"] = "Укажите возраст целым числом лет.";
      if (draft.children_count <= 2 && !child.fact_learned.trim()) errors[id + "fact_learned"] = "Добавьте запись о ребёнке.";
    });
  }
  if (step === 2) {
    const city = cities.includes(normalizeSelectedCity(draft.city)) ? familyCity(draft) : "";
    if (!city || city.length > 40) errors.city = "Укажите город.";
    if (draft.children_count === 3) {
      const line = draft.shared_fact.trim();
      if (!line || line.length > 60 || /[\r\n]/.test(line)) errors.shared_fact = "Добавьте одну строку до 60 знаков.";
    }
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
export function orderFromDraft(draft: Draft, id: string, now: Date, repeatOf?: string) {
  const count = draft.children.length;
  const children = draft.children.map((c, i) => {
    const name = formattedName(c.name.trim());
    const letters = Array.from(name);
    letters[c.stress] = letters[c.stress].toLocaleUpperCase("ru");
    return {
      name: childLabel(draft.children, i), name_stress: [letters.join(""), qualifier(draft.children, i)].filter(Boolean).join(" "),
      gender: c.gender, age: Number(c.age), photos: childPhotoSlots(c, i, count).map(slot => slot.file),
      facts: count <= 2 ? [c.fact_learned.trim()] : [],
    };
  });
  return {
    order_id: id, created_at: now.toISOString(), status: "new" as OrderStatus, payment_status: "unpaid" as PaymentStatus,
    amount_ils: repeatOf ? secondVideoPrice : videoGreetingPrice, ...(repeatOf ? { repeat_of: repeatOf } : {}),
    children_count: count, children,
    shared_fact: count === 3 ? draft.shared_fact.trim() : "", city: familyCity(draft),
    family_photo: familyPhoto.file, parent: { name: draft.parentName.trim(), whatsapp: "+" + whatsappContactDigits(draft.whatsapp), email: draft.email.trim() },
    consent: true,
  };
}
type LegacyChild = { name: string; name_pronounce?: string; gender: string; age: number; fact_learned: string; fact_kind?: string };
type NewOrder = ReturnType<typeof orderFromDraft>;
type LegacyOrder = Omit<NewOrder,"children_count"|"children"|"family_photo"|"shared_fact"> & {
  children: LegacyChild[]; photos: Record<string,string>; ready_by?: string;
};
export type Order = (NewOrder | LegacyOrder) & { parents_words?: string; video_url?: string; payment_reported?: string };
export function orderPhotos(order: Order): PhotoSlotInfo[] {
  if ("family_photo" in order) return [
    ...order.children.flatMap((child, index) => child.photos.map(file =>
      singleChildPhotos.find(slot => slot.file === file) ?? portraitPhoto(file, child.name, index),
    )),
    { ...familyPhoto, file: order.family_photo },
  ];
  const labels = ["Портрет", "Любимое занятие", "Рисунок или поделка", "Вся семья"];
  return ["portrait","activity","drawing","family"].map((role, i) => ({
    file: order.photos[role], label: labels[i], kind: "legacy", hint: "",
  }));
}
