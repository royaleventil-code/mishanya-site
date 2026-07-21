import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { RsvpLocale } from "@/lib/rsvp";

export function RsvpShell({
  locale,
  children,
  headerAction,
  compact = false,
}: {
  locale: RsvpLocale;
  children: ReactNode;
  headerAction?: ReactNode;
  compact?: boolean;
}) {
  const isHebrew = locale === "he";
  return (
    <main
      id="main"
      lang={isHebrew ? "he" : "ru"}
      dir={isHebrew ? "rtl" : "ltr"}
      className="rsvp-shell relative min-h-screen overflow-x-clip"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.28),transparent)]"
      />
      <header className="rsvp-chrome sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6">
          <Link prefetch={false} href={isHebrew ? "/he" : "/ru"} className="shrink-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5e5ce6]">
            <Image
              src={isHebrew ? "/logo-he.png" : "/logo-ru.png"}
              alt={isHebrew ? "מישניה בארץ הפלאות" : "Мишаня в Стране Чудес"}
              width={150}
              height={77}
              priority
              className="h-12 w-auto sm:h-14"
            />
          </Link>
          {headerAction}
        </div>
      </header>
      <div className={`relative z-[1] mx-auto w-full px-4 sm:px-6 ${compact ? "max-w-3xl py-6 sm:py-10" : "max-w-5xl py-7 sm:py-12"}`}>
        {children}
      </div>
    </main>
  );
}

export function RsvpLoading({ locale = "ru" }: { locale?: RsvpLocale }) {
  return (
    <RsvpShell locale={locale} compact>
      <div className="rsvp-material space-y-4 rounded-[2rem] p-5 sm:p-8">
        <div className="h-5 w-28 animate-pulse rounded-full bg-zinc-200 motion-reduce:animate-none" />
        <div className="h-12 w-4/5 animate-pulse rounded-2xl bg-zinc-200 motion-reduce:animate-none" />
        <div className="h-24 animate-pulse rounded-3xl bg-zinc-100 motion-reduce:animate-none" />
      </div>
    </RsvpShell>
  );
}
