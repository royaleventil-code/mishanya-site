"use client";

import {
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  HelpCircle,
  LoaderCircle,
  MapPin,
  MessageCircle,
  PartyPopper,
  Sparkles,
  UsersRound,
  XCircle,
} from "lucide-react";
import { FormEvent, useEffect, useLayoutEffect, useMemo, useState } from "react";
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

const COPY = {
  ru: {
    invitation: "Приглашение на праздник",
    turns: (age: number) => `исполняется ${age}!`,
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
    invitation: "הזמנה לחגיגה",
    turns: (age: number) => `חוגג/ת ${age}!`,
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

function formatEventDate(event: PublicRsvpEvent) {
  return new Intl.DateTimeFormat(event.locale === "he" ? "he-IL" : "ru-RU", {
    timeZone: "Asia/Jerusalem",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(event.startsAt));
}

function googleCalendarUrl(event: PublicRsvpEvent) {
  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const details = event.message || `${event.city}, ${event.address}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.locale === "he" ? `יום ההולדת של ${event.childName}` : `День рождения ${event.childName}`,
    dates: `${stamp(start)}/${stamp(end)}`,
    details,
    location: `${event.city}, ${event.address}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function StatusButton({
  active,
  label,
  icon,
  tone,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  tone: "yes" | "no" | "maybe";
  onClick: () => void;
}) {
  const activeTone = {
    yes: "border-emerald-500 bg-emerald-500 text-white shadow-[0_12px_28px_rgba(16,185,129,0.24)]",
    no: "border-rose-500 bg-rose-500 text-white shadow-[0_12px_28px_rgba(244,63,94,0.2)]",
    maybe: "border-amber-400 bg-amber-400 text-zinc-950 shadow-[0_12px_28px_rgba(251,191,36,0.22)]",
  }[tone];
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-3xl border px-3 text-sm font-black transition-[transform,background-color,color,border-color] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e5ce6] ${active ? activeTone : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"}`}
    >
      {icon}{label}
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

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("event") || "";
    getPublicRsvpEvent(slug)
      .then(setEvent)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, []);

  const copy = COPY[event?.locale || "ru"];
  const eventDate = useMemo(() => event ? formatEventDate(event) : "", [event]);

  useLayoutEffect(() => {
    if (!saved) return;
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
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
        <div className="rounded-[30px] border border-black/[0.06] bg-white p-7 text-center shadow-[var(--shadow-card)] sm:p-10">
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
  const wazeHref = `https://www.waze.com/ul?${new URLSearchParams({ q: `${event.city}, ${event.address}`, navigate: "yes" }).toString()}`;
  const inputClass = "h-13 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-base font-semibold outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-zinc-400 focus:border-[#5e5ce6] focus:ring-4 focus:ring-[#5e5ce6]/10";

  return (
    <RsvpShell locale={event.locale} compact>
      <article className="overflow-hidden rounded-[34px] border border-black/[0.06] bg-white/92 shadow-[0_30px_90px_rgba(30,20,60,0.14)] backdrop-blur">
        <header className="relative overflow-hidden bg-[linear-gradient(135deg,#fff0f4_0%,#f2efff_58%,#edf7ff_100%)] px-5 py-9 text-center sm:px-9 sm:py-12">
          <div aria-hidden className="absolute -start-10 -top-12 h-36 w-36 rounded-full bg-[#ff375f]/15 blur-2xl" />
          <div aria-hidden className="absolute -end-8 top-12 h-40 w-40 rounded-full bg-[#5e5ce6]/15 blur-2xl" />
          <div className="relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-[#ff375f] shadow-sm">
              <PartyPopper className="h-7 w-7" />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-[#d91f4d]">{copy.invitation}</p>
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
              {event.childName} {copy.turns(event.childAge)}
            </h1>
            {event.message ? <p className="mx-auto mt-4 max-w-lg whitespace-pre-line text-base leading-7 text-zinc-650">{event.message}</p> : null}
          </div>
        </header>

        <div className="grid gap-3 border-y border-black/[0.05] bg-white p-5 sm:grid-cols-2 sm:p-7">
          <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-[#5e5ce6]"><Clock3 className="h-5 w-5" /></span>
            <p className="self-center text-sm font-black capitalize">{eventDate}</p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-zinc-50 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600"><MapPin className="h-5 w-5" /></span>
            <div><p className="text-sm font-black">{event.city}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{event.address}</p></div>
          </div>
        </div>

        {saved ? (
          <section className="p-6 text-center sm:p-9">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700"><Check className="h-8 w-8" /></div>
            <h2 className="mt-5 text-3xl font-black">{copy.successTitle}</h2>
            <p className="mt-3 leading-7 text-zinc-600">{copy.successText}</p>
            <button type="button" onClick={() => setSaved(false)} className="mt-6 min-h-11 rounded-xl px-4 text-sm font-black text-[#5e5ce6] underline decoration-violet-200 underline-offset-4 hover:text-violet-800">
              {copy.update}
            </button>
            <div className="mt-7 rounded-3xl bg-zinc-950 p-6 text-white">
              <Sparkles className="mx-auto h-6 w-6 text-amber-300" />
              <p className="mt-3 text-lg font-black">{copy.brand}</p>
              <a href={`/${event.locale}/all?utm_source=rsvp_invite&utm_medium=referral&utm_campaign=guest_response`} className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-zinc-950 transition-transform duration-150 active:scale-[0.98]">
                {copy.brandAction}<ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </a>
            </div>
          </section>
        ) : (
          <form onSubmit={submit} className="p-5 sm:p-8">
            <div className="text-center">
              <h2 className="text-2xl font-black sm:text-3xl">{copy.question}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{copy.questionHint}</p>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              <StatusButton active={status === "yes"} label={copy.yes} icon={<CheckCircle2 className="h-6 w-6" />} tone="yes" onClick={() => setStatus("yes")} />
              <StatusButton active={status === "no"} label={copy.no} icon={<XCircle className="h-6 w-6" />} tone="no" onClick={() => setStatus("no")} />
              <StatusButton active={status === "maybe"} label={copy.maybe} icon={<HelpCircle className="h-6 w-6" />} tone="maybe" onClick={() => setStatus("maybe")} />
            </div>

            <div className="mt-6">
              <label>
                <span className="mb-2 block text-sm font-black">{copy.name}</span>
                <input className={inputClass} value={respondentName} onChange={(input) => setRespondentName(input.target.value)} placeholder={copy.namePlaceholder} minLength={2} maxLength={80} required />
              </label>
            </div>

            {status === "yes" ? (
              <fieldset className="mt-5 rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                <legend className="px-2 text-sm font-black"><span className="inline-flex items-center gap-2"><UsersRound className="h-4 w-4" />{copy.yes}</span></legend>
                <div className="grid grid-cols-2 gap-4">
                  <label><span className="mb-2 block text-sm font-black">{copy.adults}</span><select className={inputClass} value={adults} onChange={(input) => setAdults(Number(input.target.value))}>{Array.from({ length: 11 }, (_, index) => <option key={index} value={index}>{index}</option>)}</select></label>
                  <label><span className="mb-2 block text-sm font-black">{copy.children}</span><select className={inputClass} value={children} onChange={(input) => setChildren(Number(input.target.value))}>{Array.from({ length: 11 }, (_, index) => <option key={index} value={index}>{index}</option>)}</select></label>
                </div>
              </fieldset>
            ) : null}

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black">{copy.comment}</span>
              <textarea className="min-h-24 w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base font-semibold leading-6 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-zinc-400 focus:border-[#5e5ce6] focus:ring-4 focus:ring-[#5e5ce6]/10" value={comment} onChange={(input) => setComment(input.target.value)} placeholder={copy.commentPlaceholder} maxLength={500} />
            </label>
            <RsvpTurnstile locale={event.locale} action="rsvp_response" onTokenChange={setTurnstileToken} resetKey={turnstileReset} />
            {error ? <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{RSVP_TURNSTILE_ENABLED && !turnstileToken ? copy.verification : copy.error}</p> : null}
            <button type="submit" disabled={submitting} className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-base font-black text-white transition-transform duration-150 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5e5ce6]">
              {submitting ? <LoaderCircle className="h-5 w-5 animate-spin motion-reduce:animate-none" /> : <CheckCircle2 className="h-5 w-5" />}
              {submitting ? copy.submitting : copy.submit}
            </button>
          </form>
        )}
      </article>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-black shadow-sm transition-colors duration-150 hover:bg-zinc-50"><CalendarPlus className="h-4 w-4" />{copy.calendar}</a>
        <a href={wazeHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-black shadow-sm transition-colors duration-150 hover:bg-zinc-50"><MapPin className="h-4 w-4" />{copy.route}</a>
        {contactHref ? <a href={contactHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--color-whatsapp)] px-4 text-sm font-black text-white shadow-sm transition-transform duration-150 active:scale-[0.98]"><MessageCircle className="h-4 w-4" />{copy.contact}</a> : null}
      </div>
    </RsvpShell>
  );
}
