import { ADDONS } from "@/data/addons";

export function AddonsGrid() {
  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-6 py-10 sm:py-14">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
        Можно усилить любую программу
      </h2>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Добавьте к выбранной программе одну или несколько опций
      </p>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ADDONS.map((a) => (
          <div
            key={a.id}
            className="rounded-2xl bg-white pt-1 pb-3 px-2 shadow-[0_8px_24px_rgba(15,15,20,0.04)] flex flex-col items-center text-center"
          >
            <div className="w-full h-[170px] flex items-center justify-center">
              {a.icon ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={a.icon}
                  alt={a.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-[120px] leading-none">{a.emoji}</span>
              )}
            </div>
            <span className="px-2 text-[14px] font-semibold leading-tight min-h-[34px] flex items-center">
              {a.name}
            </span>
            <span className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
              от {a.priceFrom} ₪
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
