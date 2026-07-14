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
      className="relative min-h-screen overflow-hidden bg-[#fffaf4] text-[var(--color-ink)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_18%_8%,rgba(255,55,95,0.16),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(94,92,230,0.16),transparent_36%)]"
      />
      <header className="relative z-10 border-b border-black/[0.05] bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link prefetch={false} href={isHebrew ? "/he" : "/ru"} className="shrink-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5e5ce6]">
            <Image
              src={isHebrew ? "/logo-he.png" : "/logo-ru.png"}
              alt={isHebrew ? "מישניה בארץ הפלאות" : "Мишаня в Стране Чудес"}
              width={150}
              height={77}
              priority
              className="h-16 w-auto"
            />
          </Link>
          {headerAction}
        </div>
      </header>
      <div className={`relative z-[1] mx-auto w-full px-4 sm:px-6 ${compact ? "max-w-3xl py-8 sm:py-12" : "max-w-5xl py-8 sm:py-14"}`}>
        {children}
      </div>
    </main>
  );
}

export function RsvpLoading({ locale = "ru" }: { locale?: RsvpLocale }) {
  return (
    <RsvpShell locale={locale} compact>
      <div className="space-y-4 rounded-[28px] border border-black/[0.06] bg-white/80 p-5 shadow-[var(--shadow-card)] sm:p-8">
        <div className="h-5 w-28 animate-pulse rounded-full bg-zinc-200 motion-reduce:animate-none" />
        <div className="h-12 w-4/5 animate-pulse rounded-2xl bg-zinc-200 motion-reduce:animate-none" />
        <div className="h-24 animate-pulse rounded-3xl bg-zinc-100 motion-reduce:animate-none" />
      </div>
    </RsvpShell>
  );
}
