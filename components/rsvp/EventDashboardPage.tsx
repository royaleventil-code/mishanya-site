"use client";

import {
  Check,
  Copy,
  HelpCircle,
  Link2,
  MessageCircle,
  PartyPopper,
  RefreshCw,
  ShieldAlert,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RsvpLoading, RsvpShell } from "@/components/rsvp/RsvpShell";
import {
  getManagedRsvpEvent,
  type ManagedRsvpEvent,
  type RsvpLocale,
  type RsvpResponse,
  type RsvpStatus,
} from "@/lib/rsvp";

const COPY = {
  ru: {
    tag: "Приватный кабинет родителя",
    title: "Ответы гостей",
    subtitle: "Сводка обновляется автоматически, пока страница открыта.",
    attending: "Придут",
    adults: "взрослых",
    children: "детей",
    declined: "Отказались",
    thinking: "Пока думают",
    replied: "Ответили",
    families: "семей",
    guestLink: "Ссылка для гостей",
    copy: "Копировать",
    copied: "Скопировано",
    share: "Отправить в WhatsApp",
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
    tag: "האזור הפרטי של ההורה",
    title: "תשובות האורחים",
    subtitle: "הסיכום מתעדכן אוטומטית כל עוד העמוד פתוח.",
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
    share: "שליחה ב־WhatsApp",
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
    <li className="rounded-3xl border border-zinc-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600"><UserRound className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="truncate font-black">{response.respondentName}</p>
              <a href={`tel:${response.phone}`} className="mt-0.5 block text-xs font-semibold text-zinc-500" dir="ltr">{response.phone}</a>
            </div>
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
    green: "bg-emerald-50 text-emerald-950 ring-emerald-100",
    red: "bg-rose-50 text-rose-950 ring-rose-100",
    amber: "bg-amber-50 text-amber-950 ring-amber-100",
    violet: "bg-violet-50 text-violet-950 ring-violet-100",
  }[tone];
  return (
    <div className={`rounded-3xl p-5 ring-1 ${tones}`}>
      <p className="text-sm font-black opacity-70">{label}</p>
      <p className="mt-2 text-4xl font-black tabular-nums">{value}</p>
      <p className="mt-1 min-h-5 text-xs font-bold opacity-65">{detail}</p>
    </div>
  );
}

export function EventDashboardPage() {
  const [data, setData] = useState<ManagedRsvpEvent | null>(null);
  const tokenRef = useRef("");
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const locale = data?.event.locale || "ru";
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
        <div className="rounded-[30px] border border-black/[0.06] bg-white p-7 text-center shadow-[var(--shadow-card)] sm:p-10">
          <ShieldAlert className="mx-auto h-12 w-12 text-amber-500" />
          <h1 className="mt-5 text-3xl font-black">{COPY.ru.unavailableTitle}</h1>
          <p className="mx-auto mt-3 max-w-lg leading-7 text-zinc-600">{COPY.ru.unavailableText}</p>
        </div>
      </RsvpShell>
    );
  }

  const publicUrl = `${window.location.origin}/invite?event=${encodeURIComponent(data.event.slug)}`;
  const shareText = locale === "he"
    ? `נשמח לראות אתכם ביום ההולדת של ${data.event.childName}! אשרו הגעה כאן: ${publicUrl}`
    : `Будем рады видеть вас на дне рождения ${data.event.childName}! Подтвердите участие: ${publicUrl}`;
  const copyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <RsvpShell locale={locale}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-violet-800"><PartyPopper className="h-4 w-4" />{copy.tag}</div>
          <h1 className="mt-4 text-4xl font-black sm:text-5xl">{copy.title}: {data.event.childName}</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{copy.subtitle}</p>
        </div>
        <button type="button" onClick={() => void load(tokenRef.current)} disabled={refreshing} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full border border-zinc-200 bg-white px-4 text-sm font-black shadow-sm transition-colors duration-150 hover:bg-zinc-50 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`} />{copy.refresh}
        </button>
      </div>

      <section className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={copy.attending} value={summary.total} detail={`${summary.adults} ${copy.adults} · ${summary.children} ${copy.children}`} tone="green" />
        <StatCard label={copy.declined} value={summary.no} detail={copy.families} tone="red" />
        <StatCard label={copy.thinking} value={summary.maybe} detail={copy.families} tone="amber" />
        <StatCard label={copy.replied} value={summary.replied} detail={copy.families} tone="violet" />
      </section>

      <section className="mt-5 rounded-[30px] border border-black/[0.06] bg-white/90 p-5 shadow-[var(--shadow-card)] sm:p-7">
        <div className="flex items-center gap-2 text-sm font-black"><Link2 className="h-4 w-4 text-[#5e5ce6]" />{copy.guestLink}</div>
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 ps-4">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold" dir="ltr">{publicUrl}</span>
          <button type="button" onClick={copyLink} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-zinc-950 px-3 text-sm font-black text-white transition-transform duration-150 active:scale-[0.98]">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}<span className="hidden sm:inline">{copied ? copy.copied : copy.copy}</span>
          </button>
        </div>
        <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-whatsapp)] px-4 text-sm font-black text-white transition-transform duration-150 active:scale-[0.98]"><MessageCircle className="h-4 w-4" />{copy.share}</a>
      </section>

      <section className="mt-5 rounded-[30px] border border-black/[0.06] bg-white/90 p-5 shadow-[var(--shadow-card)] sm:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700"><UsersRound className="h-5 w-5" /></span>
          <h2 className="text-2xl font-black">{copy.listTitle}</h2>
        </div>
        {data.responses.length ? (
          <ul className="mt-5 grid gap-3 lg:grid-cols-2">
            {data.responses.map((response) => <ResponseRow key={response.id} response={response} locale={locale} />)}
          </ul>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-10 text-center">
            <UsersRound className="mx-auto h-10 w-10 text-zinc-300" />
            <h3 className="mt-4 text-lg font-black">{copy.emptyTitle}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">{copy.emptyText}</p>
          </div>
        )}
      </section>
    </RsvpShell>
  );
}
