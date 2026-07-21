"use client";

import {
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Sparkles,
  UsersRound,
  XCircle,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { RsvpInvitationDetails } from "@/components/rsvp/RsvpInvitationDetails";
import { RsvpLoading, RsvpShell } from "@/components/rsvp/RsvpShell";
import { RSVP_TURNSTILE_ENABLED, RsvpTurnstile } from "@/components/rsvp/RsvpTurnstile";
import {
  getPublicRsvpEvent,
  getRsvpRespondentKey,
  submitRsvpResponse,
  type PublicRsvpEvent,
  type RsvpResponseInput,
  type RsvpStatus,
} from "@/lib/rsvp";
import { formatRsvpEventLocation, localizeRsvpInvitationEvent } from "@/shared/rsvp-invitation.js";

const COPY = {
  ru: {
    question: "Вы сможете прийти?",
    questionHint: "Ответ можно изменить позже с этого же устройства.",
    yes: "Будем",
    no: "Не сможем",
    maybe: "Пока не знаем",
    name: "Как вас зовут?",
    namePlaceholder: "Например, Анна",
    adults: "Взрослых",
    children: "Детей",
    comment: "Комментарий для родителей",
    commentPlaceholder: "Например, придём немного позже",
    submit: "Отправить ответ",
    submitting: "Сохраняем ответ…",
    successTitle: "Спасибо, ответ сохранён",
    successText: "Родители уже увидят обновлённое количество гостей.",
    update: "Изменить ответ",
    contact: "Связаться с организатором",
    calendar: "Добавить в календарь",
    route: "Открыть маршрут в Waze",
    brand: "Хотите такой праздник для своего ребёнка?",
    brandAction: "Посмотреть программы Мишани",
    notFoundTitle: "Приглашение не найдено",
    notFoundText: "Возможно, ссылка скопирована не полностью. Попросите организатора отправить её ещё раз.",
    error: "Не удалось сохранить ответ. Проверьте данные и попробуйте ещё раз.",
    verification: "Подтвердите, что ответ отправляет человек.",
  },
  he: {
    question: "תוכלו להגיע?",
    questionHint: "אפשר לשנות את התשובה מאוחר יותר מאותו מכשיר.",
    yes: "נגיע",
    no: "לא נוכל להגיע",
    maybe: "עדיין לא יודעים",
    name: "איך קוראים לכם?",
    namePlaceholder: "לדוגמה, אנה",
    adults: "מבוגרים",
    children: "ילדים",
    comment: "הערה להורים",
    commentPlaceholder: "לדוגמה, נגיע מעט מאוחר יותר",
    submit: "שליחת תשובה",
    submitting: "שומרים את התשובה…",
    successTitle: "תודה, התשובה נשמרה",
    successText: "ההורים כבר יראו את מספר האורחים המעודכן.",
    update: "שינוי תשובה",
    contact: "יצירת קשר עם המארגן",
    calendar: "הוספה ליומן",
    route: "פתיחת מסלול ב־Waze",
    brand: "רוצים חגיגה כזאת לילד או לילדה שלכם?",
    brandAction: "לצפייה בתוכניות של מישניה",
    notFoundTitle: "ההזמנה לא נמצאה",
    notFoundText: "ייתכן שהקישור הועתק באופן חלקי. בקשו מהמארגן לשלוח אותו שוב.",
    error: "לא הצלחנו לשמור את התשובה. בדקו את הפרטים ונסו שוב.",
    verification: "אשרו שהתשובה נשלחת על ידי אדם.",
  },
} as const;

function googleCalendarUrl(event: PublicRsvpEvent) {
  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const location = event.city.trim().toLocaleLowerCase() === event.address.trim().toLocaleLowerCase()
    ? event.address
    : `${event.city}, ${event.address}`;
  const details = event.message || location;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.locale === "he" ? `יום ההולדת של ${event.childName}` : `День рождения ${event.childName}`,
    dates: `${stamp(start)}/${stamp(end)}`,
    details,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function StatusButton({
  active,
  label,
  icon,
  tone,
  reduceMotion,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  tone: "yes" | "no" | "maybe";
  reduceMotion: boolean;
  onClick: () => void;
}) {
  const activeTone = {
    yes: "text-emerald-600",
    no: "text-rose-600",
    maybe: "text-amber-600",
  }[tone];
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className="rsvp-pressable relative flex min-h-[4.75rem] min-w-0 items-center justify-center rounded-[1rem] px-1.5 py-2 focus-visible:outline-none sm:px-3"
    >
      {active ? (
        <motion.span
          aria-hidden
          layoutId="rsvp-status-selection"
          className="rsvp-segment-selected absolute inset-1 rounded-[0.85rem]"
          transition={reduceMotion ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.36 }}
        />
      ) : null}
      <span className={`relative z-[1] flex min-w-0 flex-col items-center justify-center gap-1.5 text-center text-xs font-semibold leading-4 sm:text-sm ${active ? activeTone : "text-zinc-600"}`}>
        {icon}{label}
      </span>
    </button>
  );
}

export function GuestInvitePage() {
  const [event, setEvent] = useState<PublicRsvpEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [status, setStatus] = useState<RsvpStatus>("yes");
  const [respondentName, setRespondentName] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(1);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const successRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const slug = search.get("event") || "";
    const requestedLocale = search.get("lang");
    getPublicRsvpEvent(slug)
      .then((loadedEvent) => {
        const locale = requestedLocale === "he" || requestedLocale === "ru"
          ? requestedLocale
          : loadedEvent.locale;
        setEvent(localizeRsvpInvitationEvent(loadedEvent, locale));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, []);

  const copy = COPY[event?.locale || "ru"];

  useLayoutEffect(() => {
    if (!saved) return;
    const success = successRef.current;
    if (!success) return;
    success.focus({ preventScroll: true });
    success.scrollIntoView({ block: "start", behavior: "auto" });
  }, [saved]);

  const submit = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (!event) return;
    if (RSVP_TURNSTILE_ENABLED && !turnstileToken) {
      setError(true);
      return;
    }
    setSubmitting(true);
    setError(false);
    const payload: RsvpResponseInput = {
      eventSlug: event.slug,
      respondentName,
      respondentKey: getRsvpRespondentKey(event.slug),
      status,
      adults,
      children,
      comment,
    };
    try {
      await submitRsvpResponse(payload, turnstileToken);
      setSaved(true);
      setTurnstileReset((value) => value + 1);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <RsvpLoading />;
  if (notFound || !event) {
    return (
      <RsvpShell locale="ru" compact>
        <div className="rsvp-material rounded-[2rem] p-7 text-center sm:p-10">
          <XCircle className="mx-auto h-12 w-12 text-rose-500" />
          <h1 className="mt-5 text-3xl font-black">{COPY.ru.notFoundTitle}</h1>
          <p className="mx-auto mt-3 max-w-md leading-7 text-zinc-600">{COPY.ru.notFoundText}</p>
        </div>
      </RsvpShell>
    );
  }

  const contactHref = event.contactPhone
    ? `https://wa.me/${event.contactPhone.replace(/\D/g, "")}?text=${encodeURIComponent(event.locale === "he" ? `שלום! יש לי שאלה לגבי יום ההולדת של ${event.childName}` : `Здравствуйте! У меня вопрос по поводу дня рождения ${event.childName}`)}`
    : null;
  const location = formatRsvpEventLocation(event);
  const wazeHref = `https://www.waze.com/ul?${new URLSearchParams({ q: location, navigate: "yes" }).toString()}`;
  const inputClass = "rsvp-field h-13 w-full rounded-[1rem] px-4 text-base font-medium outline-none placeholder:text-zinc-400";

  return (
    <RsvpShell locale={event.locale} compact>
      <article className="rsvp-material overflow-hidden rounded-[2.15rem]">
        <RsvpInvitationDetails event={event} />

        {saved ? (
          <section ref={successRef} role="status" aria-live="polite" tabIndex={-1} className="scroll-mt-20 bg-white/90 p-6 text-center outline-none sm:p-9">
            <motion.div
              initial={reduceMotion ? false : { scale: 0.78, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.22)]"
            >
              <Check className="h-8 w-8" />
            </motion.div>
            <h2 className="rsvp-section-title mt-5 text-3xl font-bold">{copy.successTitle}</h2>
            <p className="rsvp-caption mt-3 font-medium leading-7">{copy.successText}</p>
            <button type="button" onClick={() => setSaved(false)} className="rsvp-pressable mt-5 min-h-11 rounded-xl px-4 text-sm font-semibold text-[#007aff] hover:bg-[#007aff]/[0.06]">
              {copy.update}
            </button>
            <div className="mt-7 rounded-[1.6rem] bg-zinc-950 p-6 text-white shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
              <Sparkles className="mx-auto h-6 w-6 text-amber-300" />
              <p className="mt-3 text-lg font-bold tracking-[-0.015em]">{copy.brand}</p>
              <a href={`/${event.locale}/all?utm_source=rsvp_invite&utm_medium=referral&utm_campaign=guest_response`} className="rsvp-pressable mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-zinc-950">
                {copy.brandAction}<ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </a>
            </div>
          </section>
        ) : (
          <form onSubmit={submit} className="bg-white/90 p-5 sm:p-8">
            <div className="text-center">
              <h2 className="rsvp-section-title text-2xl font-bold sm:text-3xl">{copy.question}</h2>
              <p className="rsvp-caption mt-2 text-sm font-medium leading-6">{copy.questionHint}</p>
            </div>
            <div className="rsvp-segmented-control mt-6 grid grid-cols-3 gap-0.5 rounded-[1.2rem] p-1">
              <StatusButton active={status === "yes"} label={copy.yes} icon={<CheckCircle2 className="h-5 w-5" />} tone="yes" reduceMotion={reduceMotion} onClick={() => setStatus("yes")} />
              <StatusButton active={status === "no"} label={copy.no} icon={<XCircle className="h-5 w-5" />} tone="no" reduceMotion={reduceMotion} onClick={() => setStatus("no")} />
              <StatusButton active={status === "maybe"} label={copy.maybe} icon={<HelpCircle className="h-5 w-5" />} tone="maybe" reduceMotion={reduceMotion} onClick={() => setStatus("maybe")} />
            </div>

            <div className="mt-6">
              <label>
                <span className="mb-2 block text-sm font-semibold">{copy.name}</span>
                <input className={inputClass} value={respondentName} onChange={(input) => setRespondentName(input.target.value)} placeholder={copy.namePlaceholder} minLength={2} maxLength={80} required />
              </label>
            </div>

            {status === "yes" ? (
              <fieldset className="rsvp-grouped-surface mt-5 rounded-[1.35rem] p-4">
                <legend className="px-2 text-sm font-semibold"><span className="inline-flex items-center gap-2"><UsersRound className="h-4 w-4" />{copy.yes}</span></legend>
                <div className="grid grid-cols-2 gap-4">
                  <label><span className="mb-2 block text-sm font-semibold">{copy.adults}</span><select className={inputClass} value={adults} onChange={(input) => setAdults(Number(input.target.value))}>{Array.from({ length: 11 }, (_, index) => <option key={index} value={index}>{index}</option>)}</select></label>
                  <label><span className="mb-2 block text-sm font-semibold">{copy.children}</span><select className={inputClass} value={children} onChange={(input) => setChildren(Number(input.target.value))}>{Array.from({ length: 11 }, (_, index) => <option key={index} value={index}>{index}</option>)}</select></label>
                </div>
              </fieldset>
            ) : null}

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold">{copy.comment}</span>
              <textarea className="rsvp-field min-h-24 w-full resize-y rounded-[1rem] px-4 py-3 text-base font-medium leading-6 outline-none placeholder:text-zinc-400" value={comment} onChange={(input) => setComment(input.target.value)} placeholder={copy.commentPlaceholder} maxLength={500} />
            </label>
            <RsvpTurnstile locale={event.locale} action="rsvp_response" onTokenChange={setTurnstileToken} resetKey={turnstileReset} />
            {error ? <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{RSVP_TURNSTILE_ENABLED && !turnstileToken ? copy.verification : copy.error}</p> : null}
            <button type="submit" disabled={submitting} className="rsvp-pressable rsvp-primary-button mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-[1.15rem] px-5 text-base font-semibold disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none">
              {submitting ? <LoaderCircle className="h-5 w-5 animate-spin motion-reduce:animate-none" /> : <CheckCircle2 className="h-5 w-5" />}
              {submitting ? copy.submitting : copy.submit}
            </button>
          </form>
        )}
      </article>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" className="rsvp-pressable rsvp-material-strong inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.15rem] px-4 text-sm font-semibold text-zinc-800 hover:bg-white"><CalendarPlus className="h-4 w-4 text-[#007aff]" />{copy.calendar}</a>
        <a href={wazeHref} target="_blank" rel="noreferrer" className="rsvp-pressable rsvp-material-strong inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.15rem] px-4 text-sm font-semibold text-zinc-800 hover:bg-white"><MapPin className="h-4 w-4 text-[#007aff]" />{copy.route}</a>
        {contactHref ? <a href={contactHref} target="_blank" rel="noreferrer" className="rsvp-pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.15rem] bg-[var(--color-whatsapp)] px-4 text-sm font-semibold text-white shadow-[0_9px_24px_rgba(37,211,102,0.2)]"><MessageCircle className="h-4 w-4" />{copy.contact}</a> : null}
      </div>
    </RsvpShell>
  );
}
