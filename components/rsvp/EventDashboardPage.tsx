"use client";

import {
  Check,
  Copy,
  HelpCircle,
  Link2,
  MessageCircle,
  PartyPopper,
  PencilLine,
  RefreshCw,
  ShieldAlert,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RsvpInvitationDetails } from "@/components/rsvp/RsvpInvitationDetails";
import { RsvpLoading, RsvpShell } from "@/components/rsvp/RsvpShell";
import {
  getManagedRsvpEvent,
  type ManagedRsvpEvent,
  type RsvpLocale,
  type RsvpResponse,
  type RsvpStatus,
} from "@/lib/rsvp";
import {
  buildRsvpGuestShareBody,
  buildRsvpGuestUrl,
  composeRsvpGuestShareText,
  localizeRsvpInvitationEvent,
} from "@/shared/rsvp-invitation.js";

const COPY = {
  ru: {
    tag: "Ваше приглашение и ответы гостей",
    title: "Ответы гостей",
    subtitle: "Это ваш личный кабинет для приглашения гостей на праздник. Отправьте гостям ссылку ниже — здесь вы увидите, кто придёт, кто не сможет, кто ещё думает и сколько будет взрослых и детей. Ответы обновляются автоматически.",
    howItWorks: "Как это работает",
    steps: [
      "Отправьте приглашение гостям",
      "Гости подтвердят участие по ссылке",
      "Ответы и количество гостей появятся здесь",
    ],
    invitationTitle: "Ваше приглашение для гостей",
    invitationHint: "Так гости увидят информацию о празднике. Проверьте дату, время и место перед отправкой.",
    languageHint: "Текст каждой версии можно изменить. Правки сохраняются на этом устройстве, а ссылка для гостей добавляется автоматически.",
    russianOption: "Русская версия",
    hebrewOption: "Версия на иврите",
    russianEditor: "Текст приглашения на русском",
    hebrewEditor: "Текст приглашения на иврите",
    attending: "Придут",
    adults: "взрослых",
    children: "детей",
    declined: "Отказались",
    thinking: "Пока думают",
    replied: "Ответили",
    families: "семей",
    guestLink: "Ссылки для гостей",
    russianLink: "На русском",
    hebrewLink: "На иврите",
    copy: "Копировать",
    copied: "Скопировано",
    shareRussian: "Отправить приглашение на русском",
    shareHebrew: "Отправить приглашение на иврите",
    refresh: "Обновить",
    listTitle: "Список ответов",
    emptyTitle: "Пока никто не ответил",
    emptyText: "Отправьте гостевую ссылку — новые ответы появятся здесь.",
    yes: "Будут",
    no: "Не смогут",
    maybe: "Думают",
    people: "чел.",
    unavailableTitle: "Не удалось открыть кабинет",
    unavailableText: "Приватная ссылка неполная или больше не действует. Откройте именно ту ссылку, которую получили после создания события.",
    updated: "Обновлено",
  },
  he: {
    tag: "ההזמנה שלכם ותשובות האורחים",
    title: "תשובות האורחים",
    subtitle: "זהו האזור האישי שלכם להזמנת אורחים למסיבה. שלחו לאורחים את הקישור שבהמשך — כאן תוכלו לראות מי מגיע, מי לא יוכל להגיע, מי עדיין מתלבט וכמה מבוגרים וילדים יגיעו. התשובות מתעדכנות אוטומטית.",
    howItWorks: "איך זה עובד",
    steps: [
      "שלחו את ההזמנה לאורחים",
      "האורחים יאשרו הגעה דרך הקישור",
      "התשובות ומספר האורחים יופיעו כאן",
    ],
    invitationTitle: "ההזמנה שלכם לאורחים",
    invitationHint: "כך האורחים יראו את פרטי המסיבה. בדקו את התאריך, השעה והמקום לפני השליחה.",
    messagePreview: "טקסט מוכן להודעה",
    attending: "מגיעים",
    adults: "מבוגרים",
    children: "ילדים",
    declined: "לא יגיעו",
    thinking: "עדיין חושבים",
    replied: "ענו",
    families: "משפחות",
    guestLink: "קישור לאורחים",
    copy: "העתקה",
    copied: "הועתק",
    share: "שליחת ההזמנה לאורחים",
    refresh: "רענון",
    listTitle: "רשימת תשובות",
    emptyTitle: "עדיין אין תשובות",
    emptyText: "שלחו את קישור האורחים — התשובות החדשות יופיעו כאן.",
    yes: "מגיעים",
    no: "לא יגיעו",
    maybe: "חושבים",
    people: "אנשים",
    unavailableTitle: "לא הצלחנו לפתוח את האזור",
    unavailableText: "הקישור הפרטי אינו מלא או שכבר אינו בתוקף. פתחו את הקישור שקיבלתם לאחר יצירת האירוע.",
    updated: "עודכן",
  },
} as const;

function statusPresentation(status: RsvpStatus, locale: RsvpLocale) {
  const copy = COPY[locale];
  return {
    yes: { label: copy.yes, icon: <Check className="h-3.5 w-3.5" />, className: "bg-emerald-100 text-emerald-800" },
    no: { label: copy.no, icon: <XCircle className="h-3.5 w-3.5" />, className: "bg-rose-100 text-rose-800" },
    maybe: { label: copy.maybe, icon: <HelpCircle className="h-3.5 w-3.5" />, className: "bg-amber-100 text-amber-900" },
  }[status];
}

function ResponseRow({ response, locale }: { response: RsvpResponse; locale: RsvpLocale }) {
  const copy = COPY[locale];
  const status = statusPresentation(response.status, locale);
  const updated = new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "ru-RU", {
    timeZone: "Asia/Jerusalem",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(response.updatedAt));
  return (
    <li className="rsvp-material-strong rounded-[1.35rem] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600"><UserRound className="h-4 w-4" /></span>
            <p className="min-w-0 truncate font-black">{response.respondentName}</p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${status.className}`}>{status.icon}{status.label}</span>
      </div>
      {response.status === "yes" ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-zinc-600">
          <span className="rounded-full bg-zinc-100 px-3 py-1.5">{response.adults} {copy.adults}</span>
          <span className="rounded-full bg-zinc-100 px-3 py-1.5">{response.children} {copy.children}</span>
        </div>
      ) : null}
      {response.comment ? <p className="mt-3 whitespace-pre-line rounded-2xl bg-zinc-50 px-3 py-2 text-sm leading-6 text-zinc-700">{response.comment}</p> : null}
      <p className="mt-3 text-xs text-zinc-400">{copy.updated}: {updated}</p>
    </li>
  );
}

function StatCard({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: "green" | "red" | "amber" | "violet" }) {
  const tones = {
    green: "bg-emerald-500",
    red: "bg-rose-500",
    amber: "bg-amber-400",
    violet: "bg-violet-500",
  }[tone];
  return (
    <div className="rsvp-material-strong rounded-[1.55rem] p-5">
      <div className="flex items-center gap-2">
        <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${tones}`} />
        <p className="rsvp-caption text-sm font-semibold">{label}</p>
      </div>
      <p className="rsvp-display mt-3 text-4xl font-bold tabular-nums">{value}</p>
      <p className="rsvp-caption mt-1 min-h-5 text-xs font-medium">{detail}</p>
    </div>
  );
}

const SHARE_DRAFT_KEY_PREFIX = "mishanya-rsvp:share-draft:v1";

function initialShareDraft(storageKey: string, defaultBody: string) {
  try {
    return window.localStorage.getItem(storageKey) ?? defaultBody;
  } catch {
    return defaultBody;
  }
}

function ShareLanguageCard({
  locale,
  event,
  publicUrl,
  optionLabel,
  editorLabel,
  shareLabel,
}: {
  locale: RsvpLocale;
  event: ManagedRsvpEvent["event"];
  publicUrl: string;
  optionLabel: string;
  editorLabel: string;
  shareLabel: string;
}) {
  const defaultBody = buildRsvpGuestShareBody(event);
  const storageKey = `${SHARE_DRAFT_KEY_PREFIX}:${event.slug}:${locale}`;
  const [messageBody, setMessageBody] = useState(() => initialShareDraft(storageKey, defaultBody));
  const isHebrew = locale === "he";

  const updateMessage = (value: string) => {
    setMessageBody(value);
    try {
      if (value === defaultBody) window.localStorage.removeItem(storageKey);
      else window.localStorage.setItem(storageKey, value);
    } catch {
      // The editor still works for the current page when storage is unavailable.
    }
  };

  const shareText = composeRsvpGuestShareText(messageBody, publicUrl);
  const languageTone = isHebrew
    ? "bg-violet-500/10 text-violet-700"
    : "bg-emerald-500/10 text-emerald-700";

  return (
    <div className="rsvp-material-strong min-w-0 flex flex-col rounded-[1.6rem] p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${languageTone}`}>{isHebrew ? "HE" : "RU"}</span>{optionLabel}</div>
      </div>
      <label className="mt-3 flex flex-1 flex-col">
        <span className="sr-only">{editorLabel}</span>
        <textarea
          value={messageBody}
          onChange={(input) => updateMessage(input.target.value)}
          aria-label={editorLabel}
          lang={isHebrew ? "he" : "ru"}
          dir={isHebrew ? "rtl" : "ltr"}
          className="rsvp-field min-h-56 min-w-0 w-full flex-1 resize-y rounded-[1.15rem] px-4 py-3 text-sm font-medium leading-6 outline-none"
        />
      </label>
      <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="rsvp-pressable mt-4 inline-flex min-h-12 min-w-0 w-full items-center justify-center gap-2 rounded-[1rem] bg-[var(--color-whatsapp)] px-4 py-2 text-center text-sm font-semibold leading-5 whitespace-normal text-white shadow-[0_9px_24px_rgba(37,211,102,0.2)]"><MessageCircle className="h-4 w-4 shrink-0" />{shareLabel}</a>
    </div>
  );
}

export function EventDashboardPage() {
  const [data, setData] = useState<ManagedRsvpEvent | null>(null);
  const tokenRef = useRef("");
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedLocale, setCopiedLocale] = useState<RsvpLocale | null>(null);

  const load = useCallback(async (manageToken: string, quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      setData(await getManagedRsvpEvent(manageToken));
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const manageToken = hash.get("token") || "";
    tokenRef.current = manageToken;
    if (!manageToken) {
      const frame = window.requestAnimationFrame(() => {
        setUnavailable(true);
        setLoading(false);
      });
      return () => window.cancelAnimationFrame(frame);
    }
    const frame = window.requestAnimationFrame(() => void load(manageToken, true));
    const interval = window.setInterval(() => void load(manageToken, true), 10_000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(interval);
    };
  }, [load]);

  const locale: RsvpLocale = "ru";
  const copy = COPY[locale];
  const summary = useMemo(() => {
    const responses = data?.responses || [];
    const yes = responses.filter((response) => response.status === "yes");
    const adults = yes.reduce((sum, response) => sum + response.adults, 0);
    const children = yes.reduce((sum, response) => sum + response.children, 0);
    return {
      total: adults + children,
      adults,
      children,
      no: responses.filter((response) => response.status === "no").length,
      maybe: responses.filter((response) => response.status === "maybe").length,
      replied: responses.length,
    };
  }, [data]);

  if (loading) return <RsvpLoading />;
  if (unavailable || !data) {
    return (
      <RsvpShell locale="ru" compact>
        <div className="rsvp-material rounded-[2rem] p-7 text-center sm:p-10">
          <ShieldAlert className="mx-auto h-12 w-12 text-amber-500" />
          <h1 className="mt-5 text-3xl font-black">{COPY.ru.unavailableTitle}</h1>
          <p className="mx-auto mt-3 max-w-lg leading-7 text-zinc-600">{COPY.ru.unavailableText}</p>
        </div>
      </RsvpShell>
    );
  }

  const russianEvent = localizeRsvpInvitationEvent(data.event, "ru");
  const hebrewEvent = localizeRsvpInvitationEvent(data.event, "he");
  const russianUrl = buildRsvpGuestUrl(window.location.origin, data.event.slug, "ru");
  const hebrewUrl = buildRsvpGuestUrl(window.location.origin, data.event.slug, "he");
  const copyLink = async (linkLocale: RsvpLocale, publicUrl: string) => {
    await navigator.clipboard.writeText(publicUrl);
    setCopiedLocale(linkLocale);
    window.setTimeout(() => setCopiedLocale(null), 1600);
  };

  return (
    <RsvpShell locale={locale}>
      <div className="rsvp-material rounded-[2rem] p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-[#007aff]/10 px-3 py-1.5 text-center text-xs font-bold uppercase leading-5 tracking-[0.1em] text-[#0068d9]"><PartyPopper className="h-4 w-4 shrink-0" />{copy.tag}</div>
            <h1 className="rsvp-display mt-4 text-[2.55rem] font-bold sm:text-5xl">{copy.title}: {data.event.childName}</h1>
            <p className="rsvp-caption mt-3 max-w-3xl text-sm font-medium leading-6">{copy.subtitle}</p>
          </div>
          <button type="button" onClick={() => void load(tokenRef.current)} disabled={refreshing} className="rsvp-pressable inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full bg-black/[0.06] px-4 text-sm font-semibold text-zinc-800 hover:bg-black/[0.09] disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`} />{copy.refresh}
          </button>
        </div>
      </div>

      <section aria-label={copy.howItWorks} className="mt-6 grid gap-3 sm:grid-cols-3">
        {copy.steps.map((step, index) => (
          <div key={step} className="rsvp-material-strong flex items-center gap-3 rounded-[1.25rem] p-4 text-start">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#007aff] text-sm font-semibold text-white">{index + 1}</span>
            <p className="text-sm font-semibold leading-5 text-zinc-800">{step}</p>
          </div>
        ))}
      </section>

      <section className="rsvp-material mt-7 rounded-[2rem] p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-[#007aff]/10 text-[#007aff]"><PartyPopper className="h-5 w-5" /></span>
          <div>
            <h2 className="rsvp-section-title text-2xl font-bold">{copy.invitationTitle}</h2>
            <p className="rsvp-caption mt-1 text-sm font-medium leading-6">{copy.invitationHint}</p>
          </div>
        </div>

        <article className="rsvp-material-strong mt-5 overflow-hidden rounded-[1.75rem]">
          <RsvpInvitationDetails event={russianEvent} headingLevel="h3" />
        </article>

        <div className="mt-5">
          <div className="flex items-start gap-2.5 rounded-[1.15rem] bg-[#007aff]/[0.07] px-4 py-3 text-[#315f8f] ring-1 ring-[#007aff]/10">
            <PencilLine className="mt-0.5 h-4 w-4 shrink-0 text-[#007aff]" />
            <p className="text-sm font-medium leading-6">{copy.languageHint}</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ShareLanguageCard key={`${data.event.slug}-ru`} locale="ru" event={russianEvent} publicUrl={russianUrl} optionLabel={copy.russianOption} editorLabel={copy.russianEditor} shareLabel={copy.shareRussian} />
            <ShareLanguageCard key={`${data.event.slug}-he`} locale="he" event={hebrewEvent} publicUrl={hebrewUrl} optionLabel={copy.hebrewOption} editorLabel={copy.hebrewEditor} shareLabel={copy.shareHebrew} />
          </div>
        </div>
      </section>

      <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={copy.attending} value={summary.total} detail={`${summary.adults} ${copy.adults} · ${summary.children} ${copy.children}`} tone="green" />
        <StatCard label={copy.declined} value={summary.no} detail={copy.families} tone="red" />
        <StatCard label={copy.thinking} value={summary.maybe} detail={copy.families} tone="amber" />
        <StatCard label={copy.replied} value={summary.replied} detail={copy.families} tone="violet" />
      </section>

      <section className="rsvp-material mt-5 rounded-[2rem] p-5 sm:p-7">
        <div className="flex items-center gap-2 text-sm font-semibold"><Link2 className="h-4 w-4 text-[#007aff]" />{copy.guestLink}</div>
        {([
          { locale: "ru" as const, label: copy.russianLink, url: russianUrl },
          { locale: "he" as const, label: copy.hebrewLink, url: hebrewUrl },
        ]).map((link) => (
          <div key={link.locale} className="mt-3">
            <p className="rsvp-caption mb-1.5 text-xs font-semibold">{link.label}</p>
            <div className="rsvp-grouped-surface flex items-center gap-2 rounded-[1.15rem] p-2 ps-4">
              <span className="min-w-0 flex-1 truncate text-sm font-medium" dir="ltr">{link.url}</span>
              <button type="button" onClick={() => void copyLink(link.locale, link.url)} className="rsvp-pressable inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[0.85rem] bg-[#007aff] px-3 text-sm font-semibold text-white">
                {copiedLocale === link.locale ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}<span className="hidden sm:inline">{copiedLocale === link.locale ? copy.copied : copy.copy}</span>
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="rsvp-material mt-5 rounded-[2rem] p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-black/[0.06] text-zinc-700"><UsersRound className="h-5 w-5" /></span>
          <h2 className="rsvp-section-title text-2xl font-bold">{copy.listTitle}</h2>
        </div>
        {data.responses.length ? (
          <ul className="mt-5 grid gap-3 lg:grid-cols-2">
            {data.responses.map((response) => <ResponseRow key={response.id} response={response} locale={locale} />)}
          </ul>
        ) : (
          <div className="rsvp-grouped-surface mt-5 rounded-[1.5rem] px-5 py-10 text-center">
            <UsersRound className="mx-auto h-10 w-10 text-zinc-300" />
            <h3 className="mt-4 text-lg font-black">{copy.emptyTitle}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">{copy.emptyText}</p>
          </div>
        )}
      </section>
    </RsvpShell>
  );
}
