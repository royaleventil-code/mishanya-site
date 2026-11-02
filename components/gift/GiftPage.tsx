"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  Gift,
  LoaderCircle,
  Phone,
  MapPin,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { GIFT_CITY_SUGGESTIONS } from "@/data/gift-cities";

type Language = "ru" | "he";
type GiftCode = "discount-200" | "confetti" | "bubbles";
type SubmitState = "idle" | "submitting" | "success" | "existing" | "error";

type GiftPayload = {
  language: Language;
  sourceCode: string;
  giftCode: GiftCode;
  phone: string;
  clientName: string;
  city: string;
  children: {
    gender: "boy" | "girl";
    ageTurning: number;
    birthdayDay: number;
    birthdayMonth: number;
  }[];
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

const TURNSTILE_SITE_KEY = process.env.NODE_ENV === "development"
  ? undefined
  : process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

const COPY = {
  ru: {
    logoAlt: "Мишаня в Стране Чудес",
    eyebrow: "Подарок с праздника",
    title: "200\u00a0₪ на ваш следующий праздник",
    intro:
      "Чтобы закрепить за вами скидку, заполните форму ниже и нажмите «Закрепить скидку».",
    promise: "Скидка действует 12 месяцев",
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
    city: "В каком городе будет праздник?",
    cityPlaceholder: "Начните вводить название города",
    gender: "У вас мальчик или девочка?",
    boy: "Мальчик",
    girl: "Девочка",
    age: "Сколько лет исполнится?",
    birthday: "Когда день рождения?",
    day: "День",
    month: "Месяц",
    phone: "Ваш номер WhatsApp",
    phonePlaceholder: "Например, 050 123 4567",
    phoneHint: "Для программы и подтверждения скидки",
    clientName: "Ваше имя",
    clientNamePlaceholder: "Например, Анна",
    consent:
      "Нажимая кнопку, вы соглашаетесь на сохранение данных анкеты и получение программы и подтверждения скидки в WhatsApp.",
    submit: "Закрепить скидку 200 ₪",
    submitting: "Закрепляем скидку…",
    invalidPhone: "Введите номер телефона",
    invalidClientName: "Укажите ваше имя",
    invalidCity: "Укажите город, в котором будет праздник",
    incompleteForm: "Укажите пол, возраст и день рождения ребёнка",
    invalidBirthday: "В выбранном месяце нет такого дня. Проверьте дату рождения.",
    formError: "Не удалось сохранить подарок. Попробуйте ещё раз.",
    successTitle: "Скидка сохранена",
    successText:
      "Спасибо! Скидка 200 ₪ закреплена за вашим номером. Подберём программы по возрасту ребёнка и вашему городу и напишем в WhatsApp.",
    existingTitle: "Подарок уже закреплён",
    existingText: (giftName: string) =>
      `За вашим номером уже закреплён подарок: «${giftName}».`,
    validFor: "Срок действия — 12 месяцев с момента заполнения анкеты.",
    closeHint: "Эту страницу можно закрыть",
  },
  he: {
    logoAlt: "מישניה בארץ הפלאות",
    eyebrow: "מתנה מהאירוע",
    title: "200\u00a0₪ הנחה לחגיגה הבאה שלכם",
    intro:
      "כדי לשמור לכם את ההנחה, מלאו את הטופס למטה ולחצו על „שמירת הנחה“.",
    promise: "ההנחה בתוקף ל-12 חודשים",
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
    city: "באיזו עיר תתקיים החגיגה?",
    cityPlaceholder: "התחילו להקליד את שם העיר",
    gender: "יש לכם בן או בת?",
    boy: "בן",
    girl: "בת",
    age: "איזה גיל יחגגו?",
    birthday: "מתי יום ההולדת?",
    day: "יום",
    month: "חודש",
    phone: "מספר ה-WhatsApp שלכם",
    phonePlaceholder: "למשל, 050 123 4567",
    phoneHint: "לשליחת תוכנית ולאישור ההנחה",
    clientName: "השם שלכם",
    clientNamePlaceholder: "למשל, אנה",
    consent:
      "בלחיצה על הכפתור אתם מסכימים לשמירת פרטי הטופס ולקבלת תוכנית ואישור ההנחה ב-WhatsApp.",
    submit: "שמירת הנחה של 200 ₪",
    submitting: "שומרים את ההנחה…",
    invalidPhone: "הזינו מספר טלפון",
    invalidClientName: "הזינו את שמכם",
    invalidCity: "ציינו את העיר שבה תתקיים החגיגה",
    incompleteForm: "בחרו ילד או ילדה, גיל ותאריך יום הולדת",
    invalidBirthday: "היום שבחרתם אינו קיים בחודש הזה. בדקו את תאריך יום ההולדת.",
    formError: "לא הצלחנו לשמור את המתנה. נסו שוב.",
    successTitle: "ההנחה נשמרה",
    successText:
      "תודה! ההנחה של 200 ₪ נשמרה לפי מספר הטלפון שלכם. נתאים תוכניות לפי הגיל והעיר ונכתוב לכם ב-WhatsApp.",
    existingTitle: "כבר שמורה מתנה",
    existingText: (giftName: string) =>
      `למספר הטלפון שלכם כבר שמורה מתנה: „${giftName}“.`,
    validFor: "המתנה בתוקף ל-12 חודשים ממועד מילוי הטופס.",
    closeHint: "אפשר לסגור את העמוד",
  },
} as const;

const OFFER_GIFT: GiftCode = "discount-200";
const KNOWN_GIFT_CODES = new Set<GiftCode>(["discount-200", "confetti", "bubbles"]);
const MONTHS = {
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  he: ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"],
};
const FIELD_CLASS = "h-13 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-base font-semibold outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-zinc-400 focus:border-[#5e5ce6] focus:ring-4 focus:ring-[#5e5ce6]/10";

function daysInBirthdayMonth(month: number) {
  // A birthday can be February 29, even when the next celebration is in a non-leap year.
  return month ? new Date(Date.UTC(2028, month, 0)).getUTCDate() : 31;
}

function sanitizeSource(value: string | null) {
  if (!value) return "party-qr";
  const clean = value.trim().toLowerCase();
  return /^[a-z0-9_-]{1,64}$/.test(clean) ? clean : "party-qr";
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
  const [phone, setPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [city, setCity] = useState("");
  const [citySuggestionsOpen, setCitySuggestionsOpen] = useState(false);
  const [activeCityIndex, setActiveCityIndex] = useState(-1);
  const [gender, setGender] = useState<"boy" | "girl" | "">("");
  const [age, setAge] = useState("");
  const [birthdayDay, setBirthdayDay] = useState("");
  const [birthdayMonth, setBirthdayMonth] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [resultGift, setResultGift] = useState<GiftCode | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [website, setWebsite] = useState("");
  const pageTrackedRef = useRef(false);
  const formStartedRef = useRef(false);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const clientNameInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetRef = useRef<string | null>(null);
  const copy = COPY[language];
  const completed = submitState === "success" || submitState === "existing";
  const cityQuery = city.toLocaleLowerCase().replace(/[-־\s]+/g, "");
  const matchingCities = cityQuery
    ? GIFT_CITY_SUGGESTIONS[language].filter((name) =>
        name.toLocaleLowerCase().replace(/[-־\s]+/g, "").includes(cityQuery),
      )
    : [];
  const showCitySuggestions = citySuggestionsOpen && matchingCities.length > 0;

  const selectCity = (name: string) => {
    setCity(name);
    setCitySuggestionsOpen(false);
    setActiveCityIndex(-1);
  };

  useEffect(() => {
    if (showCitySuggestions && activeCityIndex >= 0) {
      document.getElementById(`gift-city-option-${activeCityIndex}`)?.scrollIntoView({ block: "nearest" });
    }
  }, [activeCityIndex, showCitySuggestions]);

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
      completed ||
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
          // The widget may already be gone when the form is removed.
        }
      }
      if (turnstileWidgetRef.current === widgetId) {
        turnstileWidgetRef.current = null;
      }
    };
  }, [language, turnstileReady, completed]);

  const markFormStarted = () => {
    if (formStartedRef.current) return;
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitState === "submitting") return;
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const submittedPhone = String(formData.get("tel") || "").trim();
    if (!submittedPhone) {
      setSubmitState("error");
      setErrorMessage(copy.invalidPhone);
      phoneInputRef.current?.focus();
      return;
    }
    const submittedClientName = String(formData.get("clientName") || "").trim();
    if (!submittedClientName) {
      setSubmitState("error");
      setErrorMessage(copy.invalidClientName);
      clientNameInputRef.current?.focus();
      return;
    }
    const submittedGender = String(formData.get("gender") || "");
    const submittedAge = Number(formData.get("age"));
    const submittedDay = Number(formData.get("birthdayDay"));
    const submittedMonth = Number(formData.get("birthdayMonth"));
    if (
      (submittedGender !== "boy" && submittedGender !== "girl") ||
      !Number.isInteger(submittedAge) || submittedAge < 1 || submittedAge > 10 ||
      !Number.isInteger(submittedMonth) || submittedMonth < 1 || submittedMonth > 12 ||
      !Number.isInteger(submittedDay) || submittedDay < 1 || submittedDay > 31
    ) {
      setSubmitState("error");
      setErrorMessage(copy.incompleteForm);
      return;
    }

    if (submittedDay > daysInBirthdayMonth(submittedMonth)) {
      setSubmitState("error");
      setErrorMessage(copy.invalidBirthday);
      const dayField = event.currentTarget.elements.namedItem("birthdayDay");
      if (dayField instanceof HTMLSelectElement) dayField.focus();
      return;
    }

    const submittedCity = String(formData.get("city") || "").trim();
    if (!submittedCity) {
      setSubmitState("error");
      setErrorMessage(copy.invalidCity);
      cityInputRef.current?.focus();
      return;
    }

    const payload: GiftPayload = {
      language,
      sourceCode,
      giftCode: OFFER_GIFT,
      phone: submittedPhone,
      clientName: submittedClientName,
      city: submittedCity,
      children: [{
        gender: submittedGender,
        ageTurning: submittedAge,
        birthdayDay: submittedDay,
        birthdayMonth: submittedMonth,
      }],
      turnstileToken: turnstileToken || undefined,
      website,
    };

    setSubmitState("submitting");
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

      <div className="relative mx-auto max-w-xl">
        <header className="flex items-center justify-between gap-4">
          <Image
            src={language === "he" ? "/logo-he.png" : "/logo-ru.png"}
            alt={copy.logoAlt}
            width={188}
            height={76}
            priority
            className="h-16 w-[140px] object-contain"
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
            <section className="pb-6 pt-5 text-center sm:pb-7 sm:pt-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2 text-sm font-black text-[#5e5ce6] shadow-sm backdrop-blur">
                <Gift className="h-4 w-4" />
                {copy.eyebrow}
              </span>
              <h1 id="gift-title" className="mx-auto mt-4 max-w-lg text-[32px] font-black leading-[1.08] tracking-tight text-zinc-950 sm:text-[40px]">
                {copy.title}
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-zinc-800 sm:text-base">
                {copy.intro}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-zinc-600">
                <CalendarDays className="h-4 w-4 text-[#ff9f0a]" />
                {copy.promise}
              </div>
            </section>

            <section
              aria-labelledby="gift-title"
              className="rounded-[28px] bg-white shadow-[var(--shadow-card)] ring-1 ring-black/[0.04]"
            >
                <form
                  onSubmit={handleSubmit}
                  onFocusCapture={markFormStarted}
                  onChangeCapture={() => setErrorMessage("")}
                  autoComplete="on"
                  aria-busy={submitState === "submitting"}
                  className="p-5 sm:p-7"
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
                  <fieldset disabled={submitState === "submitting"} className="min-w-0 space-y-5">
                    <div>
                      <label htmlFor="gift-phone" className="mb-2 block text-sm font-black text-zinc-900">
                        {copy.phone}
                      </label>
                      <span className="relative block" dir="ltr">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                        <input
                          ref={phoneInputRef}
                          id="gift-phone"
                          name="tel"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          value={phone}
                          onChange={(event) => {
                            setPhone(event.target.value);
                            setErrorMessage("");
                          }}
                          placeholder={copy.phonePlaceholder}
                          dir="ltr"
                          aria-describedby="gift-phone-hint"
                          required
                          className={`${FIELD_CLASS} pl-12`}
                        />
                      </span>
                      <span id="gift-phone-hint" className="mt-1.5 block text-xs font-medium text-zinc-500">
                        {copy.phoneHint}
                      </span>
                    </div>

                    <div>
                      <label htmlFor="gift-client-name" className="mb-2 block text-sm font-black text-zinc-900">
                        {copy.clientName}
                      </label>
                      <input
                        ref={clientNameInputRef}
                        id="gift-client-name"
                        name="clientName"
                        type="text"
                        autoComplete="given-name"
                        value={clientName}
                        onChange={(event) => {
                          setClientName(event.target.value);
                          setErrorMessage("");
                        }}
                        placeholder={copy.clientNamePlaceholder}
                        required
                        className={FIELD_CLASS}
                      />
                    </div>

                    <fieldset>
                      <legend className="mb-2 text-sm font-black text-zinc-900">{copy.gender}</legend>
                      <div className="grid grid-cols-2 gap-2">
                        {(["boy", "girl"] as const).map((value) => (
                          <label key={value} className="relative cursor-pointer">
                            <input
                              type="radio"
                              name="gender"
                              value={value}
                              checked={gender === value}
                              onChange={() => setGender(value)}
                              required
                              className="peer sr-only"
                            />
                            <span className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-700 transition-colors duration-150 peer-checked:border-[#5e5ce6] peer-checked:bg-[#5e5ce6]/8 peer-checked:text-[#4b46bd] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#5e5ce6]">
                              {value === "boy" ? copy.boy : copy.girl}
                              {gender === value ? <Check className="h-4 w-4" aria-hidden /> : null}
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset>
                      <legend className="mb-2 text-sm font-black text-zinc-900">{copy.age}</legend>
                      <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                        {Array.from({ length: 10 }, (_, index) => String(index + 1)).map((value) => (
                          <label key={value} className="relative cursor-pointer">
                            <input
                              type="radio"
                              name="age"
                              value={value}
                              checked={age === value}
                              onChange={() => setAge(value)}
                              required
                              className="peer sr-only"
                            />
                            <span className="flex min-h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-base font-bold tabular-nums text-zinc-700 transition-colors duration-150 peer-checked:border-[#5e5ce6] peer-checked:bg-[#5e5ce6] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#5e5ce6]">
                              {value}
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset>
                      <legend className="mb-2 text-sm font-black text-zinc-900">{copy.birthday}</legend>
                      <div className="grid grid-cols-[1fr_1.5fr] gap-2">
                        <select
                          id="gift-birthday-day"
                          name="birthdayDay"
                          aria-label={copy.day}
                          value={birthdayDay}
                          onChange={(event) => setBirthdayDay(event.target.value)}
                          required
                          className={FIELD_CLASS}
                        >
                          <option value="" disabled>{copy.day}</option>
                          {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                        <select
                          id="gift-birthday-month"
                          name="birthdayMonth"
                          aria-label={copy.month}
                          value={birthdayMonth}
                          onChange={(event) => setBirthdayMonth(event.target.value)}
                          required
                          className={FIELD_CLASS}
                        >
                          <option value="" disabled>{copy.month}</option>
                          {MONTHS[language].map((month, index) => (
                            <option key={month} value={index + 1}>{month}</option>
                          ))}
                        </select>
                      </div>
                    </fieldset>

                    <div>
                      <label htmlFor="gift-city" className="mb-2 block text-sm font-black text-zinc-900">
                        {copy.city}
                      </label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                        <input
                          ref={cityInputRef}
                          id="gift-city"
                          name="city"
                          autoComplete="off"
                          role="combobox"
                          aria-autocomplete="list"
                          aria-expanded={showCitySuggestions}
                          aria-controls="gift-city-suggestions"
                          aria-activedescendant={showCitySuggestions && activeCityIndex >= 0 ? `gift-city-option-${activeCityIndex}` : undefined}
                          value={city}
                          onChange={(event) => {
                            setCity(event.target.value);
                            setCitySuggestionsOpen(true);
                            setActiveCityIndex(-1);
                          }}
                          onFocus={() => setCitySuggestionsOpen(true)}
                          onBlur={() => setCitySuggestionsOpen(false)}
                          onKeyDown={(event) => {
                            if ((event.key === "ArrowDown" || event.key === "ArrowUp") && matchingCities.length > 0) {
                              event.preventDefault();
                              setCitySuggestionsOpen(true);
                              setActiveCityIndex((index) => event.key === "ArrowDown"
                                ? (index + 1) % matchingCities.length
                                : (index <= 0 ? matchingCities.length : index) - 1);
                            } else if (event.key === "Enter" && showCitySuggestions && activeCityIndex >= 0) {
                              event.preventDefault();
                              selectCity(matchingCities[activeCityIndex]);
                            } else if (event.key === "Escape") {
                              event.preventDefault();
                              setCitySuggestionsOpen(false);
                            }
                          }}
                          placeholder={copy.cityPlaceholder}
                          required
                          className={`${FIELD_CLASS} ps-12`}
                        />
                        {showCitySuggestions ? (
                          <ul
                            id="gift-city-suggestions"
                            role="listbox"
                            aria-label={copy.city}
                            className="absolute inset-x-0 bottom-full z-20 mb-2 max-h-56 overflow-y-auto overscroll-contain rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl"
                          >
                            {matchingCities.map((name, index) => (
                              <li
                                key={name}
                                id={`gift-city-option-${index}`}
                                role="option"
                                aria-selected={activeCityIndex === index}
                                tabIndex={-1}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => selectCity(name)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    selectCity(name);
                                  }
                                }}
                                className={`flex min-h-11 cursor-pointer items-center rounded-xl px-3 text-start text-base font-semibold hover:bg-[#5e5ce6]/8 ${activeCityIndex === index ? "bg-[#5e5ce6]/8 text-[#4b46bd]" : "text-zinc-800"}`}
                              >
                                {name}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>

                  </fieldset>

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
                    disabled={submitState === "submitting"}
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
            </section>
          </>
        )}
      </div>
    </main>
  );
}
