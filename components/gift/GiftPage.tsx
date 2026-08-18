"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Gift,
  LoaderCircle,
  MapPin,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Language = "ru" | "he";
type GiftCode = "discount-200" | "confetti" | "bubbles";
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

const AGES = Array.from({ length: 10 }, (_, index) => index + 1);
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const BIRTHDAY_DAYS = Array.from({ length: 31 }, (_, index) => index + 1);
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

const COPY = {
  ru: {
    logoAlt: "Мишаня в Стране Чудес",
    eyebrow: "Подарок с праздника",
    title: "Вы можете забрать подарок — скидку 200\u00a0₪",
    intro:
      "Скидка действует на программу будущего праздника. Закрепим её за вашим номером телефона, подтвердим в WhatsApp и один раз напомним ближе ко дню рождения ребёнка.",
    promise: "Скидка действует 12 месяцев",
    claimDiscount: "Забрать скидку 200 шек.",
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
    stepTwo: "Закрепите скидку",
    stepTwoHint: "Все поля обязательны",
    closeForm: "Закрыть форму",
    clientName: "Имя клиента",
    clientNamePlaceholder: "Как к вам обращаться?",
    phone: "Номер телефона / WhatsApp",
    phonePlaceholder: "Введите ваш номер телефона",
    phoneHint: "Введите номер в любом удобном формате",
    city: "Город",
    cityPlaceholder: "Например, Хайфа",
    host: "Кто был ведущим на празднике?",
    hostPlaceholder: "Выберите ведущего",
    childDetails: "О ребёнке",
    gender: "Пол",
    genderBoy: "Мальчик",
    genderGirl: "Девочка",
    age: "Возраст",
    ageHint: "От 1 до 10 лет",
    month: "Месяц рождения",
    day: "Число рождения",
    months: [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ],
    consent:
      "Нажимая «Закрепить скидку», вы соглашаетесь на сохранение указанных данных, подтверждение скидки сообщением в WhatsApp и одно напоминание ближе ко дню рождения ребёнка. Мы используем данные только для этих обращений.",
    submit: "Закрепить скидку",
    submitting: "Закрепляем скидку…",
    invalidHost: "Выберите, кто был ведущим на празднике",
    invalidBirthday: "Выберите пол, возраст, месяц и число рождения",
    verificationPending: "Подтвердите, что форму заполняет человек",
    formError: "Не удалось сохранить подарок. Попробуйте ещё раз.",
    successTitle: "Скидка сохранена",
    successText:
      "Спасибо! Скидка 200 ₪ закреплена за вами. Мы подтвердим её сообщением в WhatsApp и один раз напомним ближе ко дню рождения ребёнка.",
    existingTitle: "Подарок уже закреплён",
    existingText: (giftName: string) =>
      `За вашим номером уже закреплён подарок: «${giftName}».`,
    validFor: "Срок действия — 12 месяцев с момента заполнения анкеты.",
    closeHint: "Эту страницу можно закрыть",
  },
  he: {
    logoAlt: "מישניה בארץ הפלאות",
    eyebrow: "מתנה מהאירוע",
    title: "מחכה לכם מתנה — הנחה של 200\u00a0₪",
    intro:
      "ההנחה תקפה לתוכנית ליום ההולדת הבא. נשמור אותה לפי מספר הטלפון שלכם, נאשר ב-WhatsApp ונשלח תזכורת אחת לקראת יום ההולדת של הילד או הילדה.",
    promise: "ההנחה בתוקף ל-12 חודשים",
    claimDiscount: "לקבלת הנחה של 200 ₪",
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
    stepTwo: "שמרו את ההנחה",
    stepTwoHint: "כל השדות הם חובה",
    closeForm: "סגירת הטופס",
    clientName: "שם ההורה",
    clientNamePlaceholder: "איך לפנות אליכם?",
    phone: "מספר טלפון / WhatsApp",
    phonePlaceholder: "הזינו את מספר הטלפון שלכם",
    phoneHint: "אפשר להזין את המספר בכל פורמט שנוח לכם",
    city: "עיר",
    cityPlaceholder: "לדוגמה, חיפה",
    host: "מי היה המפעיל או המפעילה באירוע?",
    hostPlaceholder: "בחרו מפעיל או מפעילה",
    childDetails: "פרטי הילד/ה",
    gender: "מין",
    genderBoy: "בן",
    genderGirl: "בת",
    age: "גיל",
    ageHint: "מגיל שנה עד 10",
    month: "חודש לידה",
    day: "יום בחודש",
    months: [
      "ינואר",
      "פברואר",
      "מרץ",
      "אפריל",
      "מאי",
      "יוני",
      "יולי",
      "אוגוסט",
      "ספטמבר",
      "אוקטובר",
      "נובמבר",
      "דצמבר",
    ],
    consent:
      "בלחיצה על „שמירת ההנחה“ אתם מסכימים לשמירת הפרטים שמסרתם, לקבלת הודעת WhatsApp לאישור ההנחה ולתזכורת אחת לקראת יום ההולדת של הילד/ה. נשתמש בפרטים רק לצורך הפניות האלה.",
    submit: "שמירת ההנחה",
    submitting: "שומרים את ההנחה…",
    invalidHost: "בחרו מי היה המפעיל או המפעילה באירוע",
    invalidBirthday: "בחרו מין, גיל, חודש ויום לידה",
    verificationPending: "אשרו שהטופס נשלח על ידי אדם",
    formError: "לא הצלחנו לשמור את המתנה. נסו שוב.",
    successTitle: "ההנחה נשמרה",
    successText:
      "תודה! ההנחה של 200 ₪ נשמרה עבורכם. נאשר אותה בהודעת WhatsApp ונשלח תזכורת אחת לקראת יום ההולדת של הילד/ה.",
    existingTitle: "כבר שמורה מתנה",
    existingText: (giftName: string) =>
      `למספר הטלפון שלכם כבר שמורה מתנה: „${giftName}“.`,
    validFor: "המתנה בתוקף ל-12 חודשים ממועד מילוי הטופס.",
    closeHint: "אפשר לסגור את העמוד",
  },
} as const;

const OFFER_GIFT: GiftCode = "discount-200";
const KNOWN_GIFT_CODES = new Set<GiftCode>(["discount-200", "confetti", "bubbles"]);
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
function sanitizeSource(value: string | null) {
  if (!value) return "party-qr";
  const clean = value.trim().toLowerCase();
  return /^[a-z0-9_-]{1,64}$/.test(clean) ? clean : "party-qr";
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

function birthdayDayLimit(monthValue: string) {
  const month = Number(monthValue);
  if (!Number.isInteger(month) || month < 1 || month > 12) return 31;
  if (month === 2) return 29;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

function childPayload(
  gender: ChildGender,
  ageValue: string,
  monthValue: string,
  dayValue: string,
): GiftPayloadChild | null {
  const ageTurning = Number(ageValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  if (!Number.isInteger(ageTurning) || ageTurning < 1 || ageTurning > 10) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1 || day > birthdayDayLimit(monthValue)) return null;
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-sm font-black text-zinc-900">{children}</span>;
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-11 rounded-xl border px-2 text-sm font-black transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e5ce6] ${
        selected
          ? "border-zinc-950 bg-zinc-950 text-white shadow-sm"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
      }`}
    >
      {children}
    </button>
  );
}

function ChildDetailsPicker({
  gender,
  age,
  month,
  day,
  onGenderChange,
  onAgeChange,
  onMonthChange,
  onDayChange,
  copy,
}: {
  gender: ChildGenderChoice;
  age: string;
  month: string;
  day: string;
  onGenderChange: (value: ChildGender) => void;
  onAgeChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onDayChange: (value: string) => void;
  copy: (typeof COPY)[Language];
}) {
  const availableDays = BIRTHDAY_DAYS.slice(0, birthdayDayLimit(month));

  return (
    <section className="mt-6 rounded-[22px] border border-zinc-200 bg-[#fffdf8] p-4 sm:p-5">
      <h3 className="text-base font-black text-zinc-950">{copy.childDetails}</h3>

      <fieldset className="mt-4">
        <legend className="text-sm font-black text-zinc-900">{copy.gender}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              ["boy", copy.genderBoy],
              ["girl", copy.genderGirl],
            ] as const
          ).map(([value, label]) => (
            <ChoiceButton
              key={value}
              selected={gender === value}
              onClick={() => onGenderChange(value)}
            >
              {label}
            </ChoiceButton>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="flex w-full items-baseline justify-between gap-3 text-sm font-black text-zinc-900">
          <span>{copy.age}</span>
          <span className="text-xs font-semibold text-zinc-500">{copy.ageHint}</span>
        </legend>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {AGES.map((value) => (
            <ChoiceButton
              key={value}
              selected={age === String(value)}
              onClick={() => onAgeChange(String(value))}
            >
              {value}
            </ChoiceButton>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-sm font-black text-zinc-900">{copy.month}</legend>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {MONTHS.map((value, index) => (
            <ChoiceButton
              key={value}
              selected={month === String(value)}
              onClick={() => onMonthChange(String(value))}
            >
              {copy.months[index]}
            </ChoiceButton>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-sm font-black text-zinc-900">{copy.day}</legend>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {availableDays.map((value) => (
            <ChoiceButton
              key={value}
              selected={day === String(value)}
              onClick={() => onDayChange(String(value))}
            >
              {value}
            </ChoiceButton>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

async function localGiftSubmit(payload: GiftPayload): Promise<GiftSubmitResponse> {
  const storageKey = `mishanya-gift:${payload.phone}`;
  const existingRaw = window.localStorage.getItem(storageKey);
  if (existingRaw) {
    try {
      const existing = JSON.parse(existingRaw) as { giftCode?: GiftCode };
      if (existing.giftCode && KNOWN_GIFT_CODES.has(existing.giftCode)) {
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
  const [formOpen, setFormOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [hostCode, setHostCode] = useState<HostCode | "">("");
  const [childGender, setChildGender] = useState<ChildGenderChoice>("");
  const [childAge, setChildAge] = useState("");
  const [birthdayMonth, setBirthdayMonth] = useState("");
  const [birthdayDay, setBirthdayDay] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [resultGift, setResultGift] = useState<GiftCode | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [website, setWebsite] = useState("");
  const pageTrackedRef = useRef(false);
  const formStartedRef = useRef(false);
  const claimButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const clientNameInputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetRef = useRef<string | null>(null);
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
    submittingRef.current = submitState === "submitting";
  }, [submitState]);

  useEffect(() => {
    if (!formOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => clientNameInputRef.current?.focus(), 40);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!submittingRef.current) setFormOpen(false);
        return;
      }
      if (event.key !== "Tab" || !modalRef.current) return;

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]):not([type="hidden"]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        modalRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !modalRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [formOpen]);

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
      !formOpen ||
      !TURNSTILE_SITE_KEY ||
      !turnstileReady ||
      !window.turnstile ||
      !turnstileContainerRef.current ||
      turnstileWidgetRef.current
    ) {
      return;
    }
    let widgetId: string | null = null;
    try {
      widgetId = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "light",
        language,
        action: "gift_form",
        callback: (token) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
      });
      turnstileWidgetRef.current = widgetId;
    } catch {
      window.requestAnimationFrame(() => setTurnstileReady(false));
    }
    return () => {
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // The widget may already be gone when the modal is removed.
        }
      }
      if (turnstileWidgetRef.current === widgetId) {
        turnstileWidgetRef.current = null;
      }
    };
  }, [formOpen, language, turnstileReady]);

  const markFormStarted = () => {
    if (formStartedRef.current || !formOpen) return;
    formStartedRef.current = true;
    window.gtag?.("event", "gift_form_start", {
      event_category: "gift_form",
      source_code: sourceCode,
      gift_type: OFFER_GIFT,
      language,
    });
    window.fbq?.("trackCustom", "GiftFormStart", {
      source_code: sourceCode,
      gift_type: OFFER_GIFT,
      language,
    });
  };

  const openDiscountForm = () => {
    setFormOpen(true);
    setSubmitState("idle");
    setErrorMessage("");
    setTurnstileToken("");
    window.gtag?.("event", "gift_select", {
      event_category: "gift_form",
      source_code: sourceCode,
      gift_type: OFFER_GIFT,
      language,
    });
    window.fbq?.("trackCustom", "GiftSelect", {
      source_code: sourceCode,
      gift_type: OFFER_GIFT,
      language,
    });
  };

  const closeDiscountForm = () => {
    if (submitState === "submitting") return;
    setFormOpen(false);
    setErrorMessage("");
    setTurnstileToken("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState("submitting");
    setErrorMessage("");

    if (!hostCode) {
      setSubmitState("error");
      setErrorMessage(copy.invalidHost);
      return;
    }

    const child = childGender
      ? childPayload(childGender, childAge, birthdayMonth, birthdayDay)
      : null;
    if (!child) {
      setSubmitState("error");
      setErrorMessage(copy.invalidBirthday);
      return;
    }
    const payload: GiftPayload = {
      language,
      sourceCode,
      giftCode: OFFER_GIFT,
      clientName: clientName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      hostCode,
      children: [child],
      primaryChildIndex: 0,
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
      setFormOpen(false);
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
      window.setTimeout(
        () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }),
        0,
      );
    } catch {
      setSubmitState("error");
      setErrorMessage(copy.formError);
      setTurnstileToken("");
      window.turnstile?.reset(turnstileWidgetRef.current ?? undefined);
    }
  };

  const completed = submitState === "success" || submitState === "existing";
  const completedGift = resultGift ?? OFFER_GIFT;

  return (
    <main
      id="main"
      dir={language === "he" ? "rtl" : "ltr"}
      className="min-h-screen overflow-x-hidden bg-[radial-gradient(120%_90%_at_50%_-12%,#fff4d9_0%,#ffedf2_42%,#f1f0ff_100%)] px-4 py-5 text-[var(--color-ink)] sm:px-6 sm:py-8"
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
              <h1 className="mx-auto mt-5 max-w-2xl text-[38px] font-black leading-[1.03] tracking-tight text-zinc-950 sm:max-w-4xl sm:text-6xl">
                {copy.title}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--color-ink-soft)] sm:text-lg">
                {copy.intro}
              </p>
              <button
                ref={claimButtonRef}
                type="button"
                onClick={openDiscountForm}
                className="mx-auto mt-6 flex min-h-14 items-center justify-center gap-2 rounded-full bg-zinc-950 px-8 text-base font-black text-white shadow-[0_12px_30px_rgba(15,15,20,0.22)] transition-[background-color,transform] duration-100 hover:bg-zinc-800 active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e5ce6]"
              >
                <Gift className="h-5 w-5" />
                {copy.claimDiscount}
              </button>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-bold text-zinc-700 ring-1 ring-black/[0.04]">
                <CalendarDays className="h-4 w-4 text-[#ff9f0a]" />
                {copy.promise}
              </div>
            </section>

            <AnimatePresence>
              {formOpen ? (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.16, ease: "easeOut" }}
                  className="fixed inset-0 z-[300] flex items-center justify-center bg-zinc-950/45 p-2 backdrop-blur-[2px] sm:p-6"
                  onMouseDown={(event) => {
                    if (event.target === event.currentTarget) closeDiscountForm();
                  }}
                >
                  <motion.div
                    ref={modalRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="gift-form-title"
                    tabIndex={-1}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.985, y: 4 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
                    className="h-[calc(100dvh-1rem)] w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-black/10 sm:h-[calc(100dvh-3rem)] sm:max-h-[900px] sm:rounded-[30px]"
                  >
                <form
                  onSubmit={handleSubmit}
                  onFocusCapture={markFormStarted}
                  className="h-full overflow-x-hidden overflow-y-auto overscroll-contain p-5 sm:p-8"
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
                  <div className="sticky -top-5 z-10 -mx-5 -mt-5 flex items-center justify-between gap-4 border-b border-zinc-100 bg-white/95 px-5 py-4 backdrop-blur sm:-top-8 sm:-mx-8 sm:-mt-8 sm:px-8 sm:py-5">
                    <div>
                      <h2 id="gift-form-title" className="text-2xl font-black tracking-tight sm:text-3xl">
                        {copy.stepTwo}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{copy.stepTwoHint}</p>
                    </div>
                    <button
                      type="button"
                      onClick={closeDiscountForm}
                      disabled={submitState === "submitting"}
                      aria-label={copy.closeForm}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 transition-[background-color,transform,opacity] duration-100 hover:bg-zinc-200 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e5ce6]"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <label>
                      <FieldLabel>{copy.clientName}</FieldLabel>
                      <span className="relative block">
                        <UserRound className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                        <input
                          ref={clientNameInputRef}
                          value={clientName}
                          onChange={(event) => setClientName(event.target.value)}
                          autoComplete="name"
                          placeholder={copy.clientNamePlaceholder}
                          dir="auto"
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
                          type="text"
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
                        dir="auto"
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

                  <ChildDetailsPicker
                    gender={childGender}
                    age={childAge}
                    month={birthdayMonth}
                    day={birthdayDay}
                    onGenderChange={(value) => {
                      setChildGender(value);
                      setErrorMessage("");
                    }}
                    onAgeChange={(value) => {
                      setChildAge(value);
                      setErrorMessage("");
                    }}
                    onMonthChange={(value) => {
                      if (Number(birthdayDay) > birthdayDayLimit(value)) {
                        setBirthdayDay("");
                      }
                      setBirthdayMonth(value);
                      setErrorMessage("");
                    }}
                    onDayChange={(value) => {
                      setBirthdayDay(value);
                      setErrorMessage("");
                    }}
                    copy={copy}
                  />

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
                    disabled={
                      submitState === "submitting" ||
                      !childGender ||
                      !childAge ||
                      !birthdayMonth ||
                      !birthdayDay
                    }
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
                </motion.div>
              ) : null}
            </AnimatePresence>
          </>
        )}
      </div>
    </main>
  );
}
