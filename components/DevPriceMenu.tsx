import Link from "next/link";

const BOY_AGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const GIRL_AGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function DevPriceMenu({ theme = "light" }: { theme?: "light" | "dark" }) {
  const isDark = theme === "dark";
  const summaryClass = isDark
    ? "border-white/25 bg-white/10 text-white hover:bg-white/16"
    : "border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-sm hover:bg-zinc-50";

  return (
    <details className="group relative z-[80]">
      <summary
        className={`flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-full border px-3 text-xs font-black transition active:scale-95 [&::-webkit-details-marker]:hidden ${summaryClass}`}
      >
        Цены
        <span className="text-[10px] opacity-70">dev</span>
      </summary>
      <div className="absolute left-0 top-12 w-[260px] overflow-hidden rounded-lg border border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-2xl">
        <div className="border-b border-[var(--color-line)] px-4 py-3">
          <div className="text-xs font-black uppercase text-[#e34f35]">Разработка</div>
          <div className="mt-1 text-sm font-black leading-tight">Программы с ценами</div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-3">
          <div className="grid gap-2">
            <DevPriceLink href="/all" label="Все программы" />
          </div>

          <div className="mt-4">
            <div className="mb-2 text-xs font-black text-[var(--color-ink-soft)]">Мальчики 1-10</div>
            <div className="grid grid-cols-5 gap-1.5">
              {BOY_AGES.map((age) => (
                <DevPriceLink key={age} href={`/boy/${age}`} label={`${age}`} compact />
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-xs font-black text-[var(--color-ink-soft)]">Девочки 1-10</div>
            <div className="grid grid-cols-5 gap-1.5">
              {GIRL_AGES.map((age) => (
                <DevPriceLink key={age} href={`/girl/${age}`} label={`${age}`} compact />
              ))}
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}

function DevPriceLink({
  href,
  label,
  compact = false,
}: {
  href: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg bg-[#fffaf4] font-black transition hover:bg-zinc-100 active:scale-95 ${
        compact ? "px-3 py-2 text-center text-sm" : "px-3 py-2.5 text-sm"
      }`}
    >
      {label}
    </Link>
  );
}
