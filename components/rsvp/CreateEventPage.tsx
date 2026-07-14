"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  Link2,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  MessageCircle,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { RsvpShell } from "@/components/rsvp/RsvpShell";
import { RSVP_TURNSTILE_ENABLED, RsvpTurnstile } from "@/components/rsvp/RsvpTurnstile";
import {
  createRsvpEvent,
  type CreatedRsvpEvent,
  type RsvpEventInput,
} from "@/lib/rsvp";

const COPY = {
  ru: {
    tag: "Бесплатный сервис для гостей",
    title: "Создайте текстовое приглашение на праздник",
    intro: "Одна красивая ссылка для гостей и отдельный приватный кабинет со всеми ответами.",
    stepOne: "Информация про праздник",
    stepTwo: "Когда и где встречаемся",
    stepThree: "Последние штрихи",
    organizerName: "Имя родителя",
    organizerNamePlaceholder: "Например, Анна",
    phone: "Телефон / WhatsApp",
    phoneHint: "Нужен для связи с гостями и восстановления доступа позже.",
    childName: "Имя ребёнка",
    childNamePlaceholder: "Например, Миша",
    childAge: "Сколько лет исполняется?",
    childAgePlaceholder: "Выберите возраст",
    date: "Дата и время",
    datePlaceholder: "Выберите дату и время",
    city: "Город",
    cityPlaceholder: "Например, Хайфа",
    address: "Адрес или название места",
    addressPlaceholder: "Улица, зал или ресторан",
    message: "Сообщение гостям",
    messagePlaceholder: "Будем рады разделить этот день вместе!",
    messageHint: "Можно оставить этот текст или написать свой.",
    language: "Язык приглашения",
    contact: "Показывать гостям кнопку «Связаться со мной в WhatsApp»",
    privacy: "Страница не появится в Google. Управление будет доступно только по приватной ссылке.",
    submit: "Создать приглашение",
    submitting: "Создаём приглашение…",
    error: "Не удалось создать событие. Проверьте поля и попробуйте ещё раз.",
    verification: "Подтвердите, что форму заполняет человек.",
    createdTag: "Приглашение готово",
    createdTitle: "Можно приглашать гостей",
    createdIntro: "Сохраните приватную ссылку, а публичную отправьте гостям.",
    guestLink: "Ссылка для гостей",
    manageLink: "Приватная ссылка родителя",
    guestHint: "Эту ссылку можно свободно отправлять в чаты.",
    manageHint: "Не пересылайте её гостям — по ней видны все ответы.",
    copy: "Копировать",
    copied: "Скопировано",
    openGuest: "Открыть приглашение",
    openDashboard: "Открыть мой кабинет",
    sendToMyself: "Отправить себе в WhatsApp",
    createAnother: "Создать ещё одно",
  },
  he: {
    tag: "שירות חינמי לאורחים",
    title: "צרו הזמנה לחגיגה",
    intro: "קישור יפה אחד לאורחים וקישור פרטי נפרד עם כל התשובות.",
    stepOne: "על הילד או הילדה והמארגן",
    stepTwo: "מתי ואיפה נפגשים",
    stepThree: "נגיעות אחרונות",
    organizerName: "שם ההורה",
    organizerNamePlaceholder: "לדוגמה, אנה",
    phone: "טלפון / WhatsApp",
    phoneHint: "נדרש ליצירת קשר עם האורחים ולשחזור גישה בעתיד.",
    childName: "שם הילד או הילדה",
    childNamePlaceholder: "לדוגמה, מישה",
    childAge: "בן או בת כמה יהיו?",
    childAgePlaceholder: "בחרו גיל",
    date: "תאריך ושעה",
    datePlaceholder: "בחרו תאריך ושעה",
    city: "עיר",
    cityPlaceholder: "לדוגמה, חיפה",
    address: "כתובת או שם המקום",
    addressPlaceholder: "רחוב, אולם או מסעדה",
    message: "הודעה לאורחים",
    messagePlaceholder: "נשמח לחגוג את היום הזה יחד!",
    messageHint: "אפשר להשאיר את הטקסט הזה או לכתוב טקסט משלכם.",
    language: "שפת ההזמנה",
    contact: "להציג לאורחים כפתור ליצירת קשר איתי ב־WhatsApp",
    privacy: "העמוד לא יופיע ב־Google. הניהול יהיה זמין רק דרך הקישור הפרטי.",
    submit: "יצירת הזמנה",
    submitting: "יוצרים את ההזמנה…",
    error: "לא הצלחנו ליצור את האירוע. בדקו את השדות ונסו שוב.",
    verification: "אשרו שהטופס נשלח על ידי אדם.",
    createdTag: "ההזמנה מוכנה",
    createdTitle: "אפשר להזמין אורחים",
    createdIntro: "שמרו את הקישור הפרטי ושלחו לאורחים את הקישור הציבורי.",
    guestLink: "קישור לאורחים",
    manageLink: "הקישור הפרטי של ההורה",
    guestHint: "אפשר לשלוח את הקישור הזה בחופשיות בקבוצות.",
    manageHint: "אל תשלחו אותו לאורחים — הוא מציג את כל התשובות.",
    copy: "העתקה",
    copied: "הועתק",
    openGuest: "פתיחת ההזמנה",
    openDashboard: "פתיחת האזור שלי",
    sendToMyself: "שליחה לעצמי ב־WhatsApp",
    createAnother: "יצירת הזמנה נוספת",
  },
} as const;

const DEFAULT_MESSAGES = {
  ru: COPY.ru.messagePlaceholder,
  he: COPY.he.messagePlaceholder,
} as const;

function localDateTimeValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatLocalDateTime(value: string, locale: RsvpEventInput["locale"]) {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function initialForm(locale: RsvpEventInput["locale"] = "ru"): RsvpEventInput {
  return {
    locale,
    organizerName: "",
    organizerPhone: "+972",
    childName: "",
    childAge: 0,
    startsAt: "",
    city: "",
    address: "",
    message: DEFAULT_MESSAGES[locale],
    contactEnabled: true,
  };
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-sm font-black text-zinc-900">{children}</span>;
}

function StepTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#5e5ce6]/10 text-[#5e5ce6]">
        {icon}
      </span>
      <h2 className="text-xl font-black sm:text-2xl">{children}</h2>
    </div>
  );
}

function LinkCard({
  label,
  value,
  hint,
  privateLink = false,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  value: string;
  hint: string;
  privateLink?: boolean;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <section className={`rounded-3xl border p-5 ${privateLink ? "border-amber-200 bg-amber-50/75" : "border-violet-200 bg-violet-50/70"}`}>
      <div className="flex items-center gap-2 text-sm font-black">
        {privateLink ? <LockKeyhole className="h-4 w-4 text-amber-700" /> : <Link2 className="h-4 w-4 text-[#5e5ce6]" />}
        {label}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-2xl border border-black/[0.06] bg-white p-2 ps-4 shadow-sm">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold" dir="ltr">{value}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-zinc-950 px-3 text-sm font-black text-white transition-[transform,background-color] duration-150 hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e5ce6]"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="hidden sm:inline">{copied ? copiedLabel : copyLabel}</span>
        </button>
      </div>
      <p className="mt-2 text-xs leading-5 text-zinc-600">{hint}</p>
    </section>
  );
}

export function CreateEventPage() {
  const [form, setForm] = useState<RsvpEventInput>(initialForm);
  const [created, setCreated] = useState<CreatedRsvpEvent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const copy = COPY[form.locale];
  const minDate = useMemo(() => localDateTimeValue(new Date()), []);

  useLayoutEffect(() => {
    if (!created) return;
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [created]);

  useEffect(() => {
    const requestedLocale = new URLSearchParams(window.location.search).get("lang");
    if (requestedLocale !== "he") return;
    const frame = window.requestAnimationFrame(() => {
      setForm((current) => ({
        ...current,
        locale: "he",
        message: current.message === DEFAULT_MESSAGES.ru ? DEFAULT_MESSAGES.he : current.message,
      }));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const update = <K extends keyof RsvpEventInput>(key: K, value: RsvpEventInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateLocale = (locale: RsvpEventInput["locale"]) => {
    setForm((current) => {
      const messageIsDefault = current.message === DEFAULT_MESSAGES.ru || current.message === DEFAULT_MESSAGES.he;
      return {
        ...current,
        locale,
        message: messageIsDefault ? DEFAULT_MESSAGES[locale] : current.message,
      };
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(false);
    if (RSVP_TURNSTILE_ENABLED && !turnstileToken) {
      setError(true);
      return;
    }
    setSubmitting(true);
    try {
      const startsAt = new Date(form.startsAt).toISOString();
      setCreated(await createRsvpEvent({ ...form, startsAt }, turnstileToken));
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const languageToggle = (
    <div className="flex rounded-full border border-black/[0.08] bg-white p-1 text-sm font-black shadow-sm" aria-label={copy.language}>
      {(["ru", "he"] as const).map((locale) => (
        <button
          key={locale}
          type="button"
          aria-pressed={form.locale === locale}
          onClick={() => updateLocale(locale)}
          className={`min-h-10 rounded-full px-4 transition-colors duration-150 ${form.locale === locale ? "bg-zinc-950 text-white" : "text-zinc-500 hover:text-zinc-950"}`}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );

  if (created) {
    const whatsappText = form.locale === "he"
      ? `הקישור הפרטי שלי לניהול ההזמנה: ${created.manageUrl}`
      : `Моя приватная ссылка для управления приглашением: ${created.manageUrl}`;
    return (
      <RsvpShell locale={form.locale} compact headerAction={languageToggle}>
        <div className="rounded-[32px] border border-black/[0.06] bg-white/90 p-5 shadow-[0_26px_80px_rgba(30,20,60,0.12)] backdrop-blur sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
            <PartyPopper className="h-8 w-8" />
          </div>
          <div className="mx-auto mt-5 max-w-xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">{copy.createdTag}</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">{copy.createdTitle}</h1>
            <p className="mt-3 leading-7 text-zinc-600">{copy.createdIntro}</p>
          </div>

          <div className="mt-7 space-y-4">
            <LinkCard label={copy.guestLink} value={created.publicUrl} hint={copy.guestHint} copyLabel={copy.copy} copiedLabel={copy.copied} />
            <LinkCard label={copy.manageLink} value={created.manageUrl} hint={copy.manageHint} privateLink copyLabel={copy.copy} copiedLabel={copy.copied} />
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <a
              href={created.publicUrl}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(100deg,#ff375f,#ff5a7a)] px-5 text-base font-black text-white shadow-[0_14px_30px_rgba(255,55,95,0.26)] transition-transform duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff375f]"
            >
              {copy.openGuest}<ExternalLink className="h-5 w-5" />
            </a>
            <a
              href={created.manageUrl}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-base font-black text-white transition-transform duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e5ce6]"
            >
              {copy.openDashboard}<ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </a>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 text-sm font-black text-emerald-800 transition-colors duration-150 hover:bg-emerald-100"
          >
            <MessageCircle className="h-5 w-5" />{copy.sendToMyself}
          </a>
          <button
            type="button"
            onClick={() => {
              setCreated(null);
              setForm(initialForm(form.locale));
            }}
            className="mx-auto mt-6 block min-h-11 px-4 text-sm font-black text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-950"
          >
            {copy.createAnother}
          </button>
        </div>
      </RsvpShell>
    );
  }

  const inputClass = "block h-13 min-w-0 w-full max-w-full rounded-2xl border border-zinc-200 bg-white px-4 text-base font-semibold outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-zinc-400 focus:border-[#5e5ce6] focus:ring-4 focus:ring-[#5e5ce6]/10";

  return (
    <RsvpShell locale={form.locale} headerAction={languageToggle}>
      <section className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#ff375f]/15 bg-white/80 px-4 py-2 text-sm font-black text-[#d91f4d] shadow-sm">
          <Sparkles className="h-4 w-4" />{copy.tag}
        </div>
        <h1 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">
          {copy.title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">{copy.intro}</p>
      </section>

      <form onSubmit={submit} className="mx-auto mt-8 max-w-3xl space-y-5 sm:mt-10">
        <section className="rounded-[28px] border border-black/[0.06] bg-white/88 p-5 shadow-[var(--shadow-card)] backdrop-blur sm:p-8">
          <StepTitle icon={<UserRound className="h-5 w-5" />}>{copy.stepOne}</StepTitle>
          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <FieldLabel>{copy.organizerName}</FieldLabel>
              <input className={inputClass} value={form.organizerName} onChange={(event) => update("organizerName", event.target.value)} placeholder={copy.organizerNamePlaceholder} minLength={2} maxLength={80} required />
            </label>
            <label>
              <FieldLabel>{copy.phone}</FieldLabel>
              <input className={inputClass} type="tel" dir="ltr" value={form.organizerPhone} onChange={(event) => update("organizerPhone", event.target.value)} placeholder="+972 54 123 4567" required />
              <span className="mt-2 block text-xs leading-5 text-zinc-500">{copy.phoneHint}</span>
            </label>
            <label>
              <FieldLabel>{copy.childName}</FieldLabel>
              <input className={inputClass} value={form.childName} onChange={(event) => update("childName", event.target.value)} placeholder={copy.childNamePlaceholder} maxLength={60} required />
            </label>
            <label>
              <FieldLabel>{copy.childAge}</FieldLabel>
              <select className={inputClass} value={form.childAge || ""} onChange={(event) => update("childAge", Number(event.target.value))} required>
                <option value="" disabled>{copy.childAgePlaceholder}</option>
                {Array.from({ length: 18 }, (_, index) => index + 1).map((age) => <option key={age} value={age}>{age}</option>)}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-[28px] border border-black/[0.06] bg-white/88 p-5 shadow-[var(--shadow-card)] backdrop-blur sm:p-8">
          <StepTitle icon={<CalendarDays className="h-5 w-5" />}>{copy.stepTwo}</StepTitle>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="min-w-0">
              <FieldLabel>{copy.date}</FieldLabel>
              <div className="relative h-13 min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-[border-color,box-shadow] duration-150 focus-within:border-[#5e5ce6] focus-within:ring-4 focus-within:ring-[#5e5ce6]/10">
                <div aria-hidden="true" className="pointer-events-none flex h-full min-w-0 items-center gap-3 px-4">
                  <span className={`min-w-0 flex-1 truncate text-base font-semibold ${form.startsAt ? "text-zinc-950" : "text-zinc-400"}`}>
                    {form.startsAt ? formatLocalDateTime(form.startsAt, form.locale) : copy.datePlaceholder}
                  </span>
                  <CalendarDays className="h-5 w-5 shrink-0 text-zinc-400" />
                </div>
                <input
                  className="absolute inset-0 z-10 block h-full min-w-0 w-full max-w-full cursor-pointer opacity-0"
                  type="datetime-local"
                  min={minDate}
                  value={form.startsAt.slice(0, 16)}
                  onChange={(event) => update("startsAt", event.target.value)}
                  required
                />
              </div>
            </label>
            <label>
              <FieldLabel>{copy.city}</FieldLabel>
              <input className={inputClass} value={form.city} onChange={(event) => update("city", event.target.value)} placeholder={copy.cityPlaceholder} maxLength={100} required />
            </label>
            <label className="sm:col-span-2">
              <FieldLabel>{copy.address}</FieldLabel>
              <div className="relative">
                <MapPin className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                <input className={`${inputClass} ps-12`} value={form.address} onChange={(event) => update("address", event.target.value)} placeholder={copy.addressPlaceholder} maxLength={180} required />
              </div>
            </label>
          </div>
        </section>

        <section className="rounded-[28px] border border-black/[0.06] bg-white/88 p-5 shadow-[var(--shadow-card)] backdrop-blur sm:p-8">
          <StepTitle icon={<Sparkles className="h-5 w-5" />}>{copy.stepThree}</StepTitle>
          <label>
            <FieldLabel>{copy.message}</FieldLabel>
            <textarea className="min-h-28 w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base font-semibold leading-6 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-zinc-400 focus:border-[#5e5ce6] focus:ring-4 focus:ring-[#5e5ce6]/10" value={form.message} onChange={(event) => update("message", event.target.value)} placeholder={copy.messagePlaceholder} maxLength={600} />
            <span className="mt-2 block text-xs leading-5 text-zinc-500">{copy.messageHint}</span>
          </label>
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <input type="checkbox" checked={form.contactEnabled} onChange={(event) => update("contactEnabled", event.target.checked)} className="mt-1 h-5 w-5 accent-[#5e5ce6]" />
            <span className="text-sm font-bold leading-6">{copy.contact}</span>
          </label>
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-violet-50 p-4 text-sm leading-6 text-violet-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{copy.privacy}</span>
          </div>
        </section>

        <RsvpTurnstile locale={form.locale} action="rsvp_create" onTokenChange={setTurnstileToken} />
        {error ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{RSVP_TURNSTILE_ENABLED && !turnstileToken ? copy.verification : copy.error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(100deg,#ff375f,#ff5a7a)] px-6 text-lg font-black text-white shadow-[0_16px_34px_rgba(255,55,95,0.3)] transition-transform duration-150 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#ff375f]"
        >
          {submitting ? <LoaderCircle className="h-5 w-5 animate-spin motion-reduce:animate-none" /> : <PartyPopper className="h-5 w-5" />}
          {submitting ? copy.submitting : copy.submit}
        </button>
      </form>
    </RsvpShell>
  );
}
