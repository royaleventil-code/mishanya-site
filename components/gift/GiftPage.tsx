"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Gift,
  LoaderCircle,
  MapPin,
  Phone,
  Plus,
  UserRound,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type Language = "ru" | "he";
type GiftCode = "discount-200" | "confetti" | "bubbles";
type FamilyGender = "" | "boy" | "girl" | "two";
type ChildGender = "boy" | "girl";
type ChildGenderChoice = "" | ChildGender;
type HostCode =
  | "mishanya"
  | "artur-magician"
  | "artur-mad-professor"
  | "hanna"
  | "ira"
  | "zhenya"
  | "leon"
  | "unknown";
type SubmitState = "idle" | "submitting" | "success" | "existing" | "error";

type BirthdayInput = {
  age: string;
  day: string;
  month: string;
};

type MultipleChildInput = {
  id: number;
  gender: ChildGenderChoice;
  birthday: BirthdayInput;
};

type GiftPayloadChild = {
  gender: ChildGender;
  ageTurning: number;
  birthdayDay: number;
  birthdayMonth: number;
  nextBirthday: string;
};

type GiftPayload = {
  language: Language;
  sourceCode: string;
  giftCode: GiftCode;
  clientName: string;
  phone: string;
  city: string;
  hostCode: HostCode;
  children: GiftPayloadChild[];
  primaryChildIndex: number;
  turnstileToken?: string;
  website?: string;
};

type GiftSubmitResponse = {
  status: "created" | "existing" | "queued";
  giftCode: GiftCode;
  validUntil?: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          language?: string;
          action?: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const EMPTY_BIRTHDAY: BirthdayInput = { age: "", day: "", month: "" };
const MAX_CHILDREN = 8;
const AGES = Array.from({ length: 100 }, (_, index) => index + 1);
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

function createEmptyChild(id: number): MultipleChildInput {
  return { id, gender: "", birthday: { ...EMPTY_BIRTHDAY } };
}

const COPY = {
  ru: {
    logoAlt: "Мишаня в Стране Чудес",
    eyebrow: "Подарок с праздника",
    title: "Выберите подарок для будущего дня рождения",
    intro:
      "Закрепим один подарок за вашим номером телефона, подтвердим его в WhatsApp и один раз напомним ближе ко дню рождения ребёнка.",
    promise: "Подарок действует 12 месяцев",
    stepOne: "1. Выберите подарок",
    stepOneHint: "Можно выбрать только один вариант",
    selectGift: "Выбрать",
    selectedGift: "Выбрано",
    gifts: {
      "discount-200": {
        title: "Скидка 200 ₪",
        description: "На программу будущего праздника",
      },
      confetti: {
        title: "Бесплатное конфетти",
        description: "Яркий финал для детского праздника",
      },
      bubbles: {
        title: "Шоу мыльных пузырей",
        description: "Подарок к выбранной программе",
      },
    },
    stepTwo: "2. Сохраните подарок",
    stepTwoHint: "Все поля обязательны",
    clientName: "Имя клиента",
    clientNamePlaceholder: "Как к вам обращаться?",
    phone: "Номер телефона / WhatsApp",
    phonePlaceholder: "Введите ваш номер телефона",
    phoneHint: "Если у вас номер другой страны, введите его полностью с кодом страны",
    city: "Город",
    cityPlaceholder: "Например, Хайфа",
    host: "Кто был ведущим на празднике?",
    hostPlaceholder: "Выберите ведущего",
    who: "Кого поздравляем?",
    genderBoy: "Мальчик",
    genderGirl: "Девочка",
    genderBoth: "Двое детей",
    bothHint: "Для каждого ребёнка выберите пол, возраст и ближайший день рождения",
    childCard: (index: number) =>
      ["Первый ребёнок", "Второй ребёнок", "Третий ребёнок", "Четвёртый ребёнок"][
        index
      ] ?? `Ребёнок ${index + 1}`,
    addChild: "Добавить ещё ребёнка",
    removeChild: "Убрать",
    childGender: "Пол ребёнка",
    age: "Сколько лет исполнится?",
    agePlaceholder: "Возраст",
    birthday: "Ближайший день рождения",
    day: "День",
    month: "Месяц",
    consent:
      "Нажимая «Сохранить подарок», вы соглашаетесь на сохранение указанных данных, подтверждение подарка сообщением в WhatsApp и одно напоминание ближе ко дню рождения ребёнка. Мы используем данные только для этих обращений.",
    submit: "Сохранить подарок",
    submitting: "Сохраняем подарок…",
    invalidPhone: "Проверьте номер телефона. Для номера другой страны укажите код страны",
    invalidHost: "Выберите, кто был ведущим на празднике",
    invalidBirthday: "Выберите пол и проверьте данные каждого ребёнка",
    verificationPending: "Подтвердите, что форму заполняет человек",
    formError: "Не удалось сохранить подарок. Попробуйте ещё раз.",
    successTitle: "Подарок сохранён",
    successText:
      "Спасибо! Ваш подарок сохранён. Мы подтвердим его сообщением в WhatsApp и один раз напомним ближе ко дню рождения ребёнка.",
    existingTitle: "Подарок уже закреплён",
    existingText: (giftName: string) =>
      `За вашим номером уже закреплён подарок: «${giftName}». Если при бронировании вы захотите выбрать другой подарок, просто сообщите об этом менеджеру.`,
    validFor: "Срок действия — 12 месяцев с момента заполнения анкеты.",
    closeHint: "Эту страницу можно закрыть",
  },
  he: {
    logoAlt: "מישניה בארץ הפלאות",
    eyebrow: "מתנה מהאירוע",
    title: "בחרו מתנה ליום ההולדת הבא",
    intro:
      "נשמור מתנה אחת לפי מספר הטלפון שלכם, נאשר אותה ב-WhatsApp ונשלח תזכורת אחת לקראת יום ההולדת של הילד או הילדה.",
    promise: "המתנה בתוקף ל-12 חודשים",
    stepOne: "1. בחרו מתנה",
    stepOneHint: "אפשר לבחור אפשרות אחת בלבד",
    selectGift: "בחירה",
    selectedGift: "נבחר",
    gifts: {
      "discount-200": {
        title: "הנחה של 200 ₪",
        description: "על תוכנית ליום ההולדת הבא",
      },
      confetti: {
        title: "קונפטי במתנה",
        description: "סיום צבעוני לחגיגת יום ההולדת",
      },
      bubbles: {
        title: "מופע בועות סבון במתנה",
        description: "מתנה כתוספת לתוכנית שתבחרו",
      },
    },
    stepTwo: "2. שמרו את המתנה",
    stepTwoHint: "כל השדות הם חובה",
    clientName: "שם ההורה",
    clientNamePlaceholder: "איך לפנות אליכם?",
    phone: "מספר טלפון / WhatsApp",
    phonePlaceholder: "הזינו את מספר הטלפון שלכם",
    phoneHint: "אם יש לכם מספר ממדינה אחרת, הזינו אותו במלואו עם קידומת המדינה",
    city: "עיר",
    cityPlaceholder: "לדוגמה, חיפה",
    host: "מי היה המפעיל או המפעילה באירוע?",
    hostPlaceholder: "בחרו מפעיל או מפעילה",
    who: "למי חוגגים?",
    genderBoy: "בן",
    genderGirl: "בת",
    genderBoth: "שני ילדים",
    bothHint: "בחרו מין, גיל ויום הולדת קרוב עבור כל ילד או ילדה",
    childCard: (index: number) =>
      ["ילד/ה ראשון/ה", "ילד/ה שני/ה", "ילד/ה שלישי/ת", "ילד/ה רביעי/ת"][index] ??
      `ילד/ה ${index + 1}`,
    addChild: "הוספת ילד/ה נוסף/ת",
    removeChild: "הסרה",
    childGender: "בן או בת?",
    age: "בן או בת כמה יהיו?",
    agePlaceholder: "גיל",
    birthday: "יום ההולדת הקרוב",
    day: "יום",
    month: "חודש",
    consent:
      "בלחיצה על „שמירת המתנה“ אתם מסכימים לשמירת הפרטים שמסרתם, לקבלת הודעת WhatsApp לאישור המתנה ולתזכורת אחת לקראת יום ההולדת של הילד/ה. נשתמש בפרטים רק לצורך הפניות האלה.",
    submit: "שמירת המתנה",
    submitting: "שומרים את המתנה…",
    invalidPhone: "בדקו את מספר הטלפון. למספר ממדינה אחרת יש להזין גם את קידומת המדינה",
    invalidHost: "בחרו מי היה המפעיל או המפעילה באירוע",
    invalidBirthday: "בחרו מין ובדקו את הפרטים של כל ילד או ילדה",
    verificationPending: "אשרו שהטופס נשלח על ידי אדם",
    formError: "לא הצלחנו לשמור את המתנה. נסו שוב.",
    successTitle: "המתנה נשמרה",
    successText:
      "תודה! המתנה שלכם נשמרה. נאשר אותה בהודעת WhatsApp ונשלח תזכורת אחת לקראת יום ההולדת של הילד/ה.",
    existingTitle: "כבר שמורה מתנה",
    existingText: (giftName: string) =>
      `למספר הטלפון שלכם כבר שמורה מתנה: „${giftName}“. אם בזמן ההזמנה תרצו לבחור מתנה אחרת, פשוט אמרו זאת לנציג/ה שלנו.`,
    validFor: "המתנה בתוקף ל-12 חודשים ממועד מילוי הטופס.",
    closeHint: "אפשר לסגור את העמוד",
  },
} as const;

const GIFT_ORDER: GiftCode[] = ["discount-200", "confetti", "bubbles"];
const HOST_OPTIONS: Array<{ code: HostCode; labels: Record<Language, string> }> = [
  { code: "mishanya", labels: { ru: "Мишаня", he: "מישניה" } },
  { code: "artur-magician", labels: { ru: "Артур Фокусник", he: "ארתור הקוסם" } },
  {
    code: "artur-mad-professor",
    labels: { ru: "Артур Сумасшедший Профессор", he: "ארתור הפרופסור המשוגע" },
  },
  { code: "hanna", labels: { ru: "Ханна", he: "חנה" } },
  { code: "ira", labels: { ru: "Ира", he: "אירה" } },
  { code: "zhenya", labels: { ru: "Женя", he: "ז׳ניה" } },
  { code: "leon", labels: { ru: "Леон", he: "ליאון" } },
  {
    code: "unknown",
    labels: { ru: "Не знаю, кто ведущий", he: "לא יודע/ת מי היה המפעיל או המפעילה" },
  },
];
const GIFT_IMAGES: Record<GiftCode, string> = {
  "discount-200": "/gift/gift-discount-200.webp",
  confetti: "/gift/gift-confetti.webp",
  bubbles: "/gift/gift-bubbles.webp",
};

function sanitizeSource(value: string | null) {
  if (!value) return "party-qr";
  const clean = value.trim().toLowerCase();
  return /^[a-z0-9_-]{1,64}$/.test(clean) ? clean : "party-qr";
}

function normalizeInternationalPhone(value: string) {
  const phoneNumber = parsePhoneNumberFromString(value, "IL");
  return phoneNumber?.isValid() ? String(phoneNumber.number) : null;
}

function daysInMonth(month: number) {
  if (month === 2) return 29;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function nextBirthday(day: number, month: number, today = new Date()) {
  const currentYear = today.getFullYear();
  const todayStart = new Date(currentYear, today.getMonth(), today.getDate());

  for (let year = currentYear; year <= currentYear + 4; year += 1) {
    const safeDay = month === 2 && day === 29 && new Date(year, 1, 29).getMonth() !== 1 ? 28 : day;
    const candidate = new Date(year, month - 1, safeDay);
    if (
      candidate.getMonth() === month - 1 &&
      candidate.getDate() === safeDay &&
      candidate >= todayStart
    ) {
      return formatDate(year, month, safeDay);
    }
  }

  return null;
}

function selectedChildren(
  familyGender: FamilyGender,
  single: BirthdayInput,
  multipleChildren: MultipleChildInput[],
) {
  if (familyGender === "two") {
    return multipleChildren.map((child) => ({
      gender: child.gender,
      input: child.birthday,
    }));
  }
  if (familyGender === "boy" || familyGender === "girl") {
    return [{ gender: familyGender, input: single }];
  }
  return [];
}

function childPayload(
  gender: ChildGender,
  input: BirthdayInput,
): GiftPayloadChild | null {
  const ageTurning = Number(input.age);
  const day = Number(input.day);
  const month = Number(input.month);
  if (!Number.isInteger(ageTurning) || ageTurning < 1 || ageTurning > 100) return null;
  if (!Number.isInteger(day) || !Number.isInteger(month)) return null;
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(month)) return null;
  const birthday = nextBirthday(day, month);
  if (!birthday) return null;
  return {
    gender,
    ageTurning,
    birthdayDay: day,
    birthdayMonth: month,
    nextBirthday: birthday,
  };
}

function GiftVisual({ code }: { code: GiftCode }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#fff9ef]">
      <Image
        src={GIFT_IMAGES[code]}
        alt=""
        fill
        sizes="(max-width: 640px) 30vw, 220px"
        className="object-cover"
      />
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-sm font-black text-zinc-900">{children}</span>;
}

function ChildGenderPicker({
  value,
  onChange,
  copy,
}: {
  value: ChildGenderChoice;
  onChange: (value: ChildGender) => void;
  copy: (typeof COPY)[Language];
}) {
  return (
    <fieldset className="mb-4">
      <legend className="text-sm font-black text-zinc-900">{copy.childGender}</legend>
      <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-white/80 p-1.5 ring-1 ring-black/[0.04]">
        {(
          [
            ["boy", copy.genderBoy],
            ["girl", copy.genderGirl],
          ] as const
        ).map(([gender, label]) => (
          <button
            key={gender}
            type="button"
            aria-pressed={value === gender}
            onClick={() => onChange(gender)}
            className={`min-h-11 rounded-xl px-3 text-sm font-black transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e5ce6] ${
              value === gender ? "bg-zinc-950 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function BirthdayFields({
  value,
  onChange,
  copy,
}: {
  value: BirthdayInput;
  onChange: (value: BirthdayInput) => void;
  copy: (typeof COPY)[Language];
}) {
  const maxDay = value.month ? daysInMonth(Number(value.month)) : 31;
  const days = Array.from({ length: maxDay }, (_, index) => index + 1);

  const updateMonth = (month: string) => {
    const nextMax = month ? daysInMonth(Number(month)) : 31;
    onChange({
      ...value,
      month,
      day: Number(value.day) > nextMax ? "" : value.day,
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
      <label className="relative">
        <FieldLabel>{copy.age}</FieldLabel>
        <select
          value={value.age}
          onChange={(event) => onChange({ ...value, age: event.target.value })}
          required
          className="h-13 w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 pe-10 text-base font-semibold outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#5e5ce6] focus:ring-4 focus:ring-[#5e5ce6]/10"
        >
          <option value="">{copy.agePlaceholder}</option>
          {AGES.map((age) => (
            <option key={age} value={age}>
              {age}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute end-3 bottom-[18px] h-4 w-4 text-zinc-400" />
      </label>
      <fieldset>
        <FieldLabel>{copy.birthday}</FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          <label className="relative">
            <span className="sr-only">{copy.day}</span>
            <select
              value={value.day}
              onChange={(event) => onChange({ ...value, day: event.target.value })}
              required
              className="h-13 w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 pe-10 text-base font-semibold outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#5e5ce6] focus:ring-4 focus:ring-[#5e5ce6]/10"
            >
              <option value="">{copy.day}</option>
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          </label>
          <label className="relative">
            <span className="sr-only">{copy.month}</span>
            <select
              value={value.month}
              onChange={(event) => updateMonth(event.target.value)}
              required
              className="h-13 w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 pe-10 text-base font-semibold outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#5e5ce6] focus:ring-4 focus:ring-[#5e5ce6]/10"
            >
              <option value="">{copy.month}</option>
              {MONTHS.map((month) => (
                <option key={month} value={month}>
                  {String(month).padStart(2, "0")}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          </label>
        </div>
      </fieldset>
    </div>
  );
}

async function localGiftSubmit(payload: GiftPayload): Promise<GiftSubmitResponse> {
  const storageKey = `mishanya-gift:${payload.phone}`;
  const existingRaw = window.localStorage.getItem(storageKey);
  if (existingRaw) {
    try {
      const existing = JSON.parse(existingRaw) as { giftCode?: GiftCode };
      if (existing.giftCode && GIFT_ORDER.includes(existing.giftCode)) {
        return { status: "existing", giftCode: existing.giftCode };
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }

  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);
  window.localStorage.setItem(
    storageKey,
    JSON.stringify({ ...payload, validUntil: validUntil.toISOString() }),
  );
  await new Promise((resolve) => window.setTimeout(resolve, 450));
  return {
    status: "created",
    giftCode: payload.giftCode,
    validUntil: validUntil.toISOString(),
  };
}

export function GiftPage() {
  const reduceMotion = useReducedMotion();
  const [language, setLanguage] = useState<Language>("ru");
  const [sourceCode, setSourceCode] = useState("party-qr");
  const [pageContextReady, setPageContextReady] = useState(false);
  const [selectedGift, setSelectedGift] = useState<GiftCode | null>(null);
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [hostCode, setHostCode] = useState<HostCode | "">("");
  const [familyGender, setFamilyGender] = useState<FamilyGender>("");
  const [singleBirthday, setSingleBirthday] = useState<BirthdayInput>(EMPTY_BIRTHDAY);
  const [multipleChildren, setMultipleChildren] = useState<MultipleChildInput[]>(() => [
    createEmptyChild(1),
    createEmptyChild(2),
  ]);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [resultGift, setResultGift] = useState<GiftCode | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [website, setWebsite] = useState("");
  const pageTrackedRef = useRef(false);
  const formStartedRef = useRef(false);
  const formRef = useRef<HTMLDivElement>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetRef = useRef<string | null>(null);
  const nextChildIdRef = useRef(3);
  const copy = COPY[language];

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      const storedLanguage = window.localStorage.getItem("mishanya-gift-language");
      const browserLanguage = window.navigator.language.toLowerCase();
      const nextLanguage: Language =
        storedLanguage === "he" || (!storedLanguage && browserLanguage.startsWith("he"))
          ? "he"
          : "ru";
      setLanguage(nextLanguage);
      setSourceCode(sanitizeSource(new URLSearchParams(window.location.search).get("src")));
      setPageContextReady(true);
    }, 0);
    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    if (!pageContextReady) return;
    document.documentElement.lang = language === "he" ? "he" : "ru";
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";
    window.localStorage.setItem("mishanya-gift-language", language);
  }, [language, pageContextReady]);

  useEffect(() => {
    if (!pageContextReady || pageTrackedRef.current) return;
    pageTrackedRef.current = true;
    window.gtag?.("event", "gift_page_open", {
      event_category: "gift_form",
      source_code: sourceCode,
      language,
    });
    window.fbq?.("trackCustom", "GiftPageOpen", {
      source_code: sourceCode,
      language,
    });
  }, [language, pageContextReady, sourceCode]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;

    const markReady = () => {
      if (window.turnstile) setTurnstileReady(true);
    };
    if (window.turnstile) {
      markReady();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]',
    );
    const script = existingScript ?? document.createElement("script");
    script.addEventListener("load", markReady);
    script.addEventListener("error", () => setTurnstileReady(false));
    if (!existingScript) {
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const fallbackCheck = window.setTimeout(markReady, 4000);
    return () => {
      window.clearTimeout(fallbackCheck);
      script.removeEventListener("load", markReady);
    };
  }, []);

  useEffect(() => {
    if (
      !TURNSTILE_SITE_KEY ||
      !turnstileReady ||
      !window.turnstile ||
      !turnstileContainerRef.current ||
      turnstileWidgetRef.current
    ) {
      return;
    }
    try {
      turnstileWidgetRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "light",
        language,
        action: "gift_form",
        callback: (token) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
      });
    } catch {
      window.requestAnimationFrame(() => setTurnstileReady(false));
    }
  }, [language, turnstileReady]);

  const formChildren = useMemo(
    () => selectedChildren(familyGender, singleBirthday, multipleChildren),
    [familyGender, multipleChildren, singleBirthday],
  );

  const updateMultipleChild = (
    id: number,
    patch: Partial<Pick<MultipleChildInput, "gender" | "birthday">>,
  ) => {
    setMultipleChildren((children) =>
      children.map((child) => (child.id === id ? { ...child, ...patch } : child)),
    );
    setErrorMessage("");
  };

  const addMultipleChild = () => {
    setMultipleChildren((children) => {
      if (children.length >= MAX_CHILDREN) return children;
      const nextChild = createEmptyChild(nextChildIdRef.current);
      nextChildIdRef.current += 1;
      return [...children, nextChild];
    });
    setErrorMessage("");
  };

  const removeMultipleChild = (id: number) => {
    setMultipleChildren((children) =>
      children.length > 2 ? children.filter((child) => child.id !== id) : children,
    );
    setErrorMessage("");
  };

  const markFormStarted = () => {
    if (formStartedRef.current || !selectedGift) return;
    formStartedRef.current = true;
    window.gtag?.("event", "gift_form_start", {
      event_category: "gift_form",
      source_code: sourceCode,
      gift_type: selectedGift,
      language,
    });
    window.fbq?.("trackCustom", "GiftFormStart", {
      source_code: sourceCode,
      gift_type: selectedGift,
      language,
    });
  };

  const chooseGift = (giftCode: GiftCode) => {
    setSelectedGift(giftCode);
    setSubmitState("idle");
    setErrorMessage("");
    window.gtag?.("event", "gift_select", {
      event_category: "gift_form",
      source_code: sourceCode,
      gift_type: giftCode,
      language,
    });
    window.fbq?.("trackCustom", "GiftSelect", {
      source_code: sourceCode,
      gift_type: giftCode,
      language,
    });
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }, 60);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedGift) return;
    setSubmitState("submitting");
    setErrorMessage("");

    const normalizedPhone = normalizeInternationalPhone(phone);
    if (!normalizedPhone) {
      setSubmitState("error");
      setErrorMessage(copy.invalidPhone);
      return;
    }
    if (!hostCode) {
      setSubmitState("error");
      setErrorMessage(copy.invalidHost);
      return;
    }

    const children = formChildren
      .map(({ gender, input }) => (gender ? childPayload(gender, input) : null))
      .filter((child): child is GiftPayloadChild => Boolean(child));
    if (!children.length || children.length !== formChildren.length) {
      setSubmitState("error");
      setErrorMessage(copy.invalidBirthday);
      return;
    }
    const primaryChildIndex = children.reduce(
      (nearestIndex, child, index, list) =>
        child.nextBirthday < list[nearestIndex].nextBirthday ? index : nearestIndex,
      0,
    );
    const payload: GiftPayload = {
      language,
      sourceCode,
      giftCode: selectedGift,
      clientName: clientName.trim(),
      phone: normalizedPhone,
      city: city.trim(),
      hostCode,
      children,
      primaryChildIndex,
      turnstileToken: turnstileToken || undefined,
      website,
    };

    try {
      const response =
        process.env.NODE_ENV === "development"
          ? await localGiftSubmit(payload)
          : await fetch("/api/gift", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }).then(async (result) => {
              if (!result.ok) throw new Error(`Gift endpoint returned ${result.status}`);
              return (await result.json()) as GiftSubmitResponse;
            });

      setResultGift(response.giftCode);
      const state: SubmitState = response.status === "existing" ? "existing" : "success";
      setSubmitState(state);
      window.gtag?.("event", "gift_form_submit_success", {
        event_category: "gift_form",
        source_code: sourceCode,
        gift_type: response.giftCode,
        result: response.status,
        language,
      });
      window.fbq?.("trackCustom", "GiftFormSubmitSuccess", {
        source_code: sourceCode,
        gift_type: response.giftCode,
        result: response.status,
        language,
      });
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    } catch {
      setSubmitState("error");
      setErrorMessage(copy.formError);
      setTurnstileToken("");
      window.turnstile?.reset(turnstileWidgetRef.current ?? undefined);
    }
  };

  const completed = submitState === "success" || submitState === "existing";
  const completedGift = resultGift ?? selectedGift;

  return (
    <main
      id="main"
      dir={language === "he" ? "rtl" : "ltr"}
      className="min-h-screen overflow-hidden bg-[radial-gradient(120%_90%_at_50%_-12%,#fff4d9_0%,#ffedf2_42%,#f1f0ff_100%)] px-4 py-5 text-[var(--color-ink)] sm:px-6 sm:py-8"
    >
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <span className="absolute start-[8%] top-[18%] h-3 w-3 rounded-full bg-[#ff375f]/35" />
        <span className="absolute end-[11%] top-[11%] h-2.5 w-2.5 rounded-full bg-[#0a84ff]/35" />
        <span className="absolute end-[8%] top-[48%] h-3 w-3 rounded-full bg-[#5e5ce6]/30" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4">
          <Image
            src={language === "he" ? "/logo-he.png" : "/logo-ru.png"}
            alt={copy.logoAlt}
            width={188}
            height={76}
            priority
            className="h-auto w-[150px] object-contain sm:w-[188px]"
          />
          <div className="flex rounded-full border border-white/80 bg-white/75 p-1 shadow-sm backdrop-blur">
            {(["ru", "he"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLanguage(item)}
                aria-pressed={language === item}
                className={`min-h-11 min-w-12 rounded-full px-3 text-sm font-black transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e5ce6] ${
                  language === item ? "bg-zinc-950 text-white" : "text-zinc-600 hover:bg-white"
                }`}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        {completed ? (
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-8 rounded-[28px] bg-white p-6 text-center shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] sm:p-10"
            aria-live="polite"
          >
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#34c759]/12 text-[#208a39]">
              <Check className="h-8 w-8" strokeWidth={2.8} />
            </span>
            <p className="mt-5 text-sm font-black uppercase tracking-wide text-[#5e5ce6]">
              {completedGift ? copy.gifts[completedGift].title : ""}
            </p>
            <h1 className="mt-2 text-[34px] font-black leading-tight tracking-tight sm:text-5xl">
              {submitState === "existing" ? copy.existingTitle : copy.successTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
              {submitState === "existing" && completedGift
                ? copy.existingText(copy.gifts[completedGift].title)
                : copy.successText}
            </p>
            <p className="mt-5 rounded-2xl bg-[#fff8e8] px-4 py-3 text-sm font-bold text-[#7a4b00]">
              {copy.validFor}
            </p>
            <p className="mt-5 text-sm text-zinc-400">{copy.closeHint}</p>
          </motion.section>
        ) : (
          <>
            <section className="pb-7 pt-8 text-center sm:pb-10 sm:pt-12">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-sm font-black text-[#5e5ce6] shadow-sm backdrop-blur">
                <Gift className="h-4 w-4" />
                {copy.eyebrow}
              </span>
              <h1 className="mx-auto mt-5 max-w-2xl text-[38px] font-black leading-[1.03] tracking-tight text-zinc-950 sm:text-6xl">
                {copy.title}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
                {copy.intro}
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-zinc-700 ring-1 ring-black/[0.04]">
                <CalendarDays className="h-4 w-4 text-[#ff9f0a]" />
                {copy.promise}
              </div>
            </section>

            <section className="rounded-[28px] bg-white/88 p-4 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] backdrop-blur sm:p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{copy.stepOne}</h2>
                  <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{copy.stepOneHint}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-4" role="radiogroup" aria-label={copy.stepOne}>
                {GIFT_ORDER.map((giftCode) => {
                  const selected = selectedGift === giftCode;
                  return (
                    <button
                      key={giftCode}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => chooseGift(giftCode)}
                      className={`group relative min-w-0 rounded-[22px] border p-2 text-start transition-[border-color,background-color,transform,box-shadow] duration-150 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e5ce6] sm:p-3 ${
                        selected
                          ? "border-[#5e5ce6] bg-[#f5f3ff] shadow-[0_12px_30px_rgba(94,92,230,0.14)]"
                          : "border-zinc-200 bg-white hover:border-zinc-300"
                      }`}
                    >
                      {selected ? (
                        <span className="absolute end-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#5e5ce6] text-white shadow-sm">
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </span>
                      ) : null}
                      <GiftVisual code={giftCode} />
                      <span className="mt-3 block text-[13px] font-black leading-tight text-zinc-950 sm:text-base">
                        {copy.gifts[giftCode].title}
                      </span>
                      <span className="mt-1 hidden text-xs leading-5 text-[var(--color-ink-soft)] sm:block">
                        {copy.gifts[giftCode].description}
                      </span>
                      <span className={`mt-3 block text-xs font-black ${selected ? "text-[#5e5ce6]" : "text-zinc-400"}`}>
                        {selected ? copy.selectedGift : copy.selectGift}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {selectedGift ? (
              <motion.div
                ref={formRef}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="scroll-mt-4"
              >
                <form
                  onSubmit={handleSubmit}
                  onFocusCapture={markFormStarted}
                  className="mt-5 rounded-[28px] bg-white p-5 shadow-[var(--shadow-card)] ring-1 ring-black/[0.04] sm:mt-6 sm:p-8"
                >
                  <div className="absolute -start-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                    <label htmlFor="gift-website">Website</label>
                    <input
                      id="gift-website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                    />
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{copy.stepTwo}</h2>
                      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{copy.stepTwoHint}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label>
                      <FieldLabel>{copy.clientName}</FieldLabel>
                      <span className="relative block">
                        <UserRound className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                        <input
                          value={clientName}
                          onChange={(event) => setClientName(event.target.value)}
                          autoComplete="name"
                          placeholder={copy.clientNamePlaceholder}
                          required
                          className="h-13 w-full rounded-2xl border border-zinc-200 bg-white ps-12 pe-4 text-base font-semibold outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-zinc-400 focus:border-[#5e5ce6] focus:ring-4 focus:ring-[#5e5ce6]/10"
                        />
                      </span>
                    </label>
                    <div>
                      <label htmlFor="gift-phone">
                        <FieldLabel>{copy.phone}</FieldLabel>
                      </label>
                      <span className="relative block" dir="ltr">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                        <input
                          id="gift-phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          placeholder={copy.phonePlaceholder}
                          dir="auto"
                          aria-describedby="gift-phone-hint"
                          required
                          className="h-13 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 text-base font-semibold outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-zinc-400 focus:border-[#5e5ce6] focus:ring-4 focus:ring-[#5e5ce6]/10"
                        />
                      </span>
                      <span
                        id="gift-phone-hint"
                        className="mt-1.5 block text-xs font-medium text-zinc-500"
                      >
                        {copy.phoneHint}
                      </span>
                    </div>
                  </div>

                  <label className="mt-4 block">
                    <FieldLabel>{copy.city}</FieldLabel>
                    <span className="relative block">
                      <MapPin className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                      <input
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                        autoComplete="address-level2"
                        placeholder={copy.cityPlaceholder}
                        required
                        className="h-13 w-full rounded-2xl border border-zinc-200 bg-white ps-12 pe-4 text-base font-semibold outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-zinc-400 focus:border-[#5e5ce6] focus:ring-4 focus:ring-[#5e5ce6]/10"
                      />
                    </span>
                  </label>

                  <label className="relative mt-4 block">
                    <FieldLabel>{copy.host}</FieldLabel>
                    <select
                      value={hostCode}
                      onChange={(event) => {
                        setHostCode(event.target.value as HostCode | "");
                        setErrorMessage("");
                      }}
                      required
                      className="h-13 w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 pe-10 text-base font-semibold outline-none transition-[border-color,box-shadow] duration-150 focus:border-[#5e5ce6] focus:ring-4 focus:ring-[#5e5ce6]/10"
                    >
                      <option value="">{copy.hostPlaceholder}</option>
                      {HOST_OPTIONS.map((host) => (
                        <option key={host.code} value={host.code}>
                          {host.labels[language]}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute end-3 bottom-[18px] h-4 w-4 text-zinc-400" />
                  </label>

                  <fieldset className="mt-6">
                    <legend className="text-sm font-black text-zinc-900">{copy.who}</legend>
                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-zinc-100 p-1.5">
                      {(
                        [
                          ["boy", copy.genderBoy],
                          ["girl", copy.genderGirl],
                          ["two", copy.genderBoth],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={familyGender === value}
                          onClick={() => {
                            setFamilyGender(value);
                            setErrorMessage("");
                          }}
                          className={`min-h-12 rounded-xl px-2 text-sm font-black transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e5ce6] ${
                            familyGender === value
                              ? "bg-white text-zinc-950 shadow-sm"
                              : "text-zinc-500 hover:text-zinc-800"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {familyGender === "boy" || familyGender === "girl" ? (
                    <div className="mt-5 rounded-[22px] border border-zinc-200 bg-[#fffdf8] p-4 sm:p-5">
                      <BirthdayFields value={singleBirthday} onChange={setSingleBirthday} copy={copy} />
                    </div>
                  ) : null}

                  {familyGender === "two" ? (
                    <div className="mt-5 space-y-3">
                      <p className="text-sm leading-6 text-[var(--color-ink-soft)]">{copy.bothHint}</p>
                      {multipleChildren.map((child, index) => {
                        const purpleCard = index % 2 === 0;
                        return (
                          <div
                            key={child.id}
                            className={`rounded-[22px] border p-4 sm:p-5 ${
                              purpleCard
                                ? "border-[#5e5ce6]/20 bg-[#f5f3ff]"
                                : "border-[#ff9f0a]/25 bg-[#fff9ef]"
                            }`}
                          >
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <h3
                                className={`text-base font-black ${
                                  purpleCard ? "text-[#4d49bd]" : "text-[#a55d00]"
                                }`}
                              >
                                {copy.childCard(index)}
                              </h3>
                              {index >= 2 ? (
                                <button
                                  type="button"
                                  onClick={() => removeMultipleChild(child.id)}
                                  aria-label={`${copy.removeChild}: ${copy.childCard(index)}`}
                                  className="inline-flex min-h-9 items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 text-xs font-black text-zinc-600 transition-colors hover:border-red-200 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e5ce6]"
                                >
                                  <X aria-hidden className="h-3.5 w-3.5" />
                                  {copy.removeChild}
                                </button>
                              ) : null}
                            </div>
                            <ChildGenderPicker
                              value={child.gender}
                              onChange={(gender) => updateMultipleChild(child.id, { gender })}
                              copy={copy}
                            />
                            <BirthdayFields
                              value={child.birthday}
                              onChange={(birthday) =>
                                updateMultipleChild(child.id, { birthday })
                              }
                              copy={copy}
                            />
                          </div>
                        );
                      })}
                      {multipleChildren.length < MAX_CHILDREN ? (
                        <button
                          type="button"
                          onClick={addMultipleChild}
                          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#5e5ce6]/35 bg-[#f8f7ff] px-4 text-sm font-black text-[#4d49bd] transition-[background-color,border-color,transform] hover:border-[#5e5ce6]/60 hover:bg-[#f2f0ff] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e5ce6]"
                        >
                          <Plus aria-hidden className="h-4 w-4" />
                          {copy.addChild}
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {errorMessage ? (
                    <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700" role="alert">
                      {errorMessage}
                    </p>
                  ) : null}

                  {TURNSTILE_SITE_KEY && turnstileReady ? (
                    <div className="mt-5 flex min-h-[70px] items-center justify-center overflow-hidden rounded-2xl bg-zinc-50 px-2 py-2">
                      <div ref={turnstileContainerRef} />
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitState === "submitting" || !familyGender}
                    className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 text-base font-black text-white shadow-[0_12px_30px_rgba(15,15,20,0.22)] transition-[background-color,transform,opacity] duration-100 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e5ce6]"
                  >
                    {submitState === "submitting" ? (
                      <>
                        <LoaderCircle className="h-5 w-5 animate-spin motion-reduce:animate-none" />
                        {copy.submitting}
                      </>
                    ) : (
                      <>
                        <Gift className="h-5 w-5" />
                        {copy.submit}
                      </>
                    )}
                  </button>
                  <p className="mx-auto mt-4 max-w-xl text-center text-xs leading-5 text-zinc-500">
                    {copy.consent}
                  </p>
                </form>
              </motion.div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
