import Link from "next/link";

const SEGMENT_LINKS = [
  { href: "/baby", label: "Малыши 1–3", emoji: "🍼", color: "#ff9f0a" },
  { href: "/boy/5", label: "Мальчик 4–6", emoji: "🚀", color: "#0a84ff" },
  { href: "/girl/5", label: "Девочка 4–6", emoji: "💕", color: "#ff375f" },
  { href: "/boy/8", label: "Мальчик 7+", emoji: "🚀", color: "#0a84ff" },
  { href: "/girl/8", label: "Девочка 7+", emoji: "💕", color: "#ff375f" },
  { href: "/all", label: "Все программы", emoji: "✨", color: "#5e5ce6" },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-center mb-12">
          <span className="text-5xl">🎈</span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
            Мишаня в Стране Чудес
          </h1>
          <p className="mt-3 text-base text-[var(--color-ink-soft)]">
            Выберите возраст ребёнка, чтобы увидеть подходящие программы
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {SEGMENT_LINKS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex flex-col items-center justify-center rounded-3xl bg-white p-6 shadow-[0_16px_40px_rgba(15,15,20,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,15,20,0.12)]"
              style={{ borderTop: `3px solid ${s.color}` }}
            >
              <span className="text-4xl">{s.emoji}</span>
              <span className="mt-3 text-sm font-medium">{s.label}</span>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-[var(--color-ink-soft)]">
          MVP-каталог · WhatsApp +972 54-616-32-60
        </p>
      </div>
    </main>
  );
}
