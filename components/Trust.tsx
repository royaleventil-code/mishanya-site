const STATS = [
  {
    value: "10 000+",
    label: "праздников",
    from: "#3b82f6",
    to: "#06b6d4",
  },
  {
    value: "11 лет",
    label: "в Израиле",
    from: "#a855f7",
    to: "#ec4899",
  },
  {
    value: "783",
    label: "отзыва 5★",
    from: "#f59e0b",
    to: "#fb923c",
  },
  {
    value: "100M",
    label: "просмотров YouTube",
    from: "#10b981",
    to: "#14b8a6",
  },
];

export function Trust() {
  return (
    <section className="py-12 sm:py-20 bg-[var(--color-ink)] text-white">
      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="relative rounded-2xl px-2 py-6 sm:px-4 text-center overflow-hidden"
              style={{
                background: `radial-gradient(120% 100% at 50% 0%, ${s.from}26 0%, ${s.to}14 45%, transparent 75%)`,
                boxShadow: `inset 0 0 0 1px ${s.from}33, 0 0 32px -8px ${s.to}40`,
              }}
            >
              <div
                className="text-[26px] sm:text-5xl font-bold tracking-tight tabular-nums leading-none whitespace-nowrap"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${s.from} 0%, ${s.to} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: `drop-shadow(0 0 14px ${s.to}66)`,
                }}
              >
                {s.value}
              </div>
              <div className="mt-2 text-xs sm:text-sm text-white/70 whitespace-nowrap">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
