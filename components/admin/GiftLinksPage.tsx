"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Gift,
  Link2,
  MessageCircle,
  Printer,
  QrCode,
  Users,
} from "lucide-react";

const SITE_URL = "https://mishanya-show.com";

type HostEntry = {
  code: string;
  label: string;
  source: string;
};

const HOSTS: HostEntry[] = [
  { code: "party-qr", label: "Общий QR (любой праздник)", source: "party-qr" },
  { code: "mishanya", label: "Мишаня", source: "qr-mishanya" },
  { code: "artur-magician", label: "Артур Фокусник", source: "qr-artur-magician" },
  {
    code: "artur-mad-professor",
    label: "Артур Сумасшедший Профессор",
    source: "qr-artur-mad-professor",
  },
  { code: "hanna", label: "Ханна", source: "qr-hanna" },
  { code: "ira", label: "Ира", source: "qr-ira" },
  { code: "zhenya", label: "Женя", source: "qr-zhenya" },
  { code: "leon", label: "Леон", source: "qr-leon" },
];

type ParentLanguage = "ru" | "he";

function giftLink(source: string): string {
  return `${SITE_URL}/gift?src=${source}`;
}

function sanitizeRefPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function parentForwardMessage(language: ParentLanguage, link: string): string {
  if (language === "he") {
    return [
      "חברים, שוב תודה שהייתם בחגיגה שלנו! 🎉",
      "",
      'רוצים לשתף אתכם במתנה מ"מישניה בארץ הפלאות": כל משפחה מהמסיבה יכולה לבחור הנחה של 200 ₪ או מופע במתנה (בועות סבון או קונפטי) ליום ההולדת הבא שלכם.',
      "",
      `לקבלת המתנה (דקה אחת): ${link}`,
    ].join("\n");
  }
  return [
    "Друзья, ещё раз спасибо, что были на нашем празднике! 🎉",
    "",
    "Делимся подарком от «Мишаня в Стране Чудес»: каждая семья с праздника может выбрать скидку 200 ₪ или шоу в подарок (мыльные пузыри или конфетти) на свой будущий день рождения.",
    "",
    `Забрать подарок (займёт 1 минуту): ${link}`,
  ].join("\n");
}

function parentIntroMessage(language: ParentLanguage, parentName: string): string {
  const name = parentName.trim();
  if (language === "he") {
    const greeting = name ? `${name}, ` : "";
    return `${greeting}תודה רבה על החגיגה! 🎉 אם נהניתם, תוכלו לפנק את האורחים שלכם במתנה: פשוט העבירו להם את ההודעה למטה 👇`;
  }
  const greeting = name ? `${name}, спасибо` : "Спасибо";
  return `${greeting} вам за праздник! 🎉 Если вам понравилось, подарите подарок своим гостям: просто перешлите им сообщение ниже 👇`;
}

function useQrDataUrls(links: string[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = links.join("|");

  useEffect(() => {
    let cancelled = false;
    async function render() {
      const { toDataURL } = await import("qrcode");
      const entries = await Promise.all(
        links.map(async (link) => {
          try {
            const dataUrl = await toDataURL(link, {
              width: 320,
              margin: 2,
              errorCorrectionLevel: "M",
              color: { dark: "#0f0f14", light: "#ffffff" },
            });
            return [link, dataUrl] as const;
          } catch {
            return null;
          }
        }),
      );
      const ready = entries.filter((entry): entry is readonly [string, string] => entry !== null);
      if (!cancelled && ready.length > 0) {
        setUrls((previous) => ({ ...previous, ...Object.fromEntries(ready) }));
      }
    }
    render().catch((error) => {
      console.error("QR render failed", error);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return urls;
}

function CopyButton({
  value,
  label,
  copiedLabel,
  className,
}: {
  value: string;
  label: string;
  copiedLabel: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Скопируйте вручную:", value);
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={onCopy}
      className={
        className ||
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition-colors duration-200 hover:border-[var(--color-young)] hover:text-[var(--color-young)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-young)]"
      }
    >
      {copied ? <Check aria-hidden className="h-4 w-4" /> : <Copy aria-hidden className="h-4 w-4" />}
      {copied ? copiedLabel : label}
    </button>
  );
}

async function downloadQrPng(link: string, fileName: string) {
  try {
    const { toDataURL } = await import("qrcode");
    const dataUrl = await toDataURL(link, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f0f14", light: "#ffffff" },
    });
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = fileName;
    anchor.click();
  } catch {
    window.alert("Не удалось создать PNG. Обновите страницу и попробуйте ещё раз.");
  }
}

export function GiftLinksPage() {
  const hostLinks = useMemo(() => HOSTS.map((host) => giftLink(host.source)), []);
  const qrByLink = useQrDataUrls(hostLinks);

  const [dealId, setDealId] = useState("");
  const [parentName, setParentName] = useState("");
  const [language, setLanguage] = useState<ParentLanguage>("ru");

  const parentSource = useMemo(() => {
    const ref = sanitizeRefPart(dealId);
    return ref ? `parent-${ref}` : "parent";
  }, [dealId]);
  const parentLink = giftLink(parentSource);
  const forwardMessage = parentForwardMessage(language, parentLink);
  const introMessage = parentIntroMessage(language, parentName);
  const fullParentMessage = `${introMessage}\n\n${forwardMessage}`;

  return (
    <main id="main" className="min-h-screen bg-[var(--color-canvas)]">
      <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-6 sm:py-10 print:hidden">
        <header className="mb-8">
          <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
            Внутренний инструмент · не для клиентов
          </p>
          <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-extrabold text-[var(--color-ink)] sm:text-3xl">
            <Gift aria-hidden className="h-7 w-7 text-[var(--color-young)]" />
            QR и ссылки «Подарок с праздника»
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
            Все ссылки ведут на страницу{" "}
            <a
              href={giftLink("party-qr")}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--color-boy)] underline underline-offset-2"
            >
              {SITE_URL}/gift
            </a>
            . Метка src показывает в Bitrix24, откуда пришёл лид: с чьего QR или с какого праздника.
          </p>
        </header>

        <section aria-labelledby="hosts-title" className="mb-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2
              id="hosts-title"
              className="flex items-center gap-2 text-lg font-extrabold text-[var(--color-ink)]"
            >
              <QrCode aria-hidden className="h-5 w-5 text-[var(--color-young)]" />
              QR-коды аниматоров
            </h2>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)]"
            >
              <Printer aria-hidden className="h-4 w-4" />
              Печать карточек
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {HOSTS.map((host) => {
              const link = giftLink(host.source);
              const qr = qrByLink[link];
              return (
                <article
                  key={host.code}
                  className="rounded-2xl border border-[var(--color-line)] bg-white p-4 shadow-[0_2px_10px_rgba(15,15,20,0.04)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--color-line)] bg-white">
                      {qr ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qr} alt={`QR-код: ${host.label}`} className="h-full w-full" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-ink-soft)]">
                          QR…
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-[var(--color-ink)]">
                        {host.label}
                      </h3>
                      <p className="mt-0.5 break-all text-xs text-[var(--color-ink-soft)]">
                        src={host.source}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <CopyButton value={link} label="Ссылка" copiedLabel="Скопировано" />
                        <button
                          type="button"
                          onClick={() => downloadQrPng(link, `qr-gift-${host.source}.png`)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition-colors duration-200 hover:border-[var(--color-young)] hover:text-[var(--color-young)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-young)]"
                        >
                          <Download aria-hidden className="h-4 w-4" />
                          PNG
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="parent-title">
          <h2
            id="parent-title"
            className="mb-1 flex items-center gap-2 text-lg font-extrabold text-[var(--color-ink)]"
          >
            <Users aria-hidden className="h-5 w-5 text-[var(--color-young)]" />
            Ссылка и сообщение для родителя
          </h2>
          <p className="mb-4 max-w-xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
            После праздника отправьте родителю готовое сообщение. Родитель пересылает его гостям,
            и каждый лид придёт с меткой этого праздника.
          </p>

          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5 shadow-[0_2px_10px_rgba(15,15,20,0.04)]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[var(--color-ink-soft)]">
                  Номер сделки / праздника
                </span>
                <input
                  value={dealId}
                  onChange={(event) => setDealId(event.target.value)}
                  placeholder="Например: 5135"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition-colors duration-200 focus:border-[var(--color-young)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[var(--color-ink-soft)]">
                  Имя родителя (для иврита - на иврите)
                </span>
                <input
                  value={parentName}
                  onChange={(event) => setParentName(event.target.value)}
                  placeholder="Например: Анна"
                  className="w-full rounded-xl border border-[var(--color-line)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition-colors duration-200 focus:border-[var(--color-young)]"
                />
              </label>
              <div>
                <span className="mb-1 block text-xs font-bold text-[var(--color-ink-soft)]">
                  Язык сообщения
                </span>
                <div
                  role="group"
                  aria-label="Язык сообщения"
                  className="inline-flex rounded-xl border border-[var(--color-line)] p-1"
                >
                  {(["ru", "he"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={language === option}
                      onClick={() => setLanguage(option)}
                      className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-bold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-young)] ${
                        language === option
                          ? "bg-[var(--color-ink)] text-white"
                          : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                      }`}
                    >
                      {option === "ru" ? "Русский" : "עברית"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl bg-[var(--color-canvas)] px-3.5 py-2.5">
              <Link2 aria-hidden className="h-4 w-4 shrink-0 text-[var(--color-ink-soft)]" />
              <span className="break-all text-sm font-semibold text-[var(--color-ink)]">
                {parentLink}
              </span>
            </div>

            <div className="mt-4">
              <span className="mb-1 block text-xs font-bold text-[var(--color-ink-soft)]">
                Сообщение родителю целиком (просьба + пересылаемая часть)
              </span>
              <textarea
                readOnly
                value={fullParentMessage}
                rows={9}
                dir={language === "he" ? "rtl" : "ltr"}
                className="w-full resize-y rounded-xl border border-[var(--color-line)] bg-white px-3 py-2.5 text-sm leading-relaxed text-[var(--color-ink)] outline-none focus:border-[var(--color-young)]"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton
                value={fullParentMessage}
                label="Копировать всё сообщение"
                copiedLabel="Скопировано"
              />
              <CopyButton
                value={forwardMessage}
                label="Только пересылаемую часть"
                copiedLabel="Скопировано"
              />
              <a
                href={`https://wa.me/?text=${encodeURIComponent(fullParentMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-whatsapp)] px-4 py-2 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-whatsapp)]"
              >
                <MessageCircle aria-hidden className="h-4 w-4" />
                Открыть в WhatsApp
              </a>
            </div>
          </div>
        </section>
      </div>

      <section aria-hidden className="hidden print:block">
        <div className="grid grid-cols-2 gap-4 p-6">
          {HOSTS.map((host) => {
            const link = giftLink(host.source);
            const qr = qrByLink[link];
            return (
              <div
                key={`print-${host.code}`}
                className="flex break-inside-avoid items-center gap-4 rounded-2xl border border-[#d8d8de] p-4"
              >
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr} alt="" className="h-32 w-32 shrink-0" />
                ) : null}
                <div>
                  <Image
                    src="/logo-ru.png"
                    alt="Мишаня в Стране Чудес"
                    width={120}
                    height={40}
                    priority
                    unoptimized
                    className="h-auto w-28"
                  />
                  <p className="mt-2 text-sm font-extrabold text-[#0f0f14]">
                    Подарок каждому гостю праздника 🎁
                  </p>
                  <p className="mt-1 text-xs leading-snug text-[#3f3f48]">
                    Сканируйте и выберите: скидка 200 ₪, шоу мыльных пузырей или конфетти-шоу к
                    вашему дню рождения.
                  </p>
                  <p className="mt-1.5 text-[10px] font-semibold text-[#8a8a92]">{host.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
