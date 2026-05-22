"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Clipboard, RotateCcw } from "lucide-react";
import { PROGRAMS } from "@/data/programs";

const STORAGE_KEY = "mishanya-program-order-v1";

type OrderItem = {
  id: string;
  title: string;
  cover?: string;
  priceFrom: number;
  durationLabel: string;
};

const BASE_ITEMS: OrderItem[] = PROGRAMS.map((program) => ({
  id: program.id,
  title: program.title,
  cover: program.cover,
  priceFrom: program.priceFrom,
  durationLabel: program.durationLabel,
}));

function restoreOrder(savedIds: string[] | null): OrderItem[] {
  if (!savedIds) return BASE_ITEMS;

  const byId = new Map(BASE_ITEMS.map((item) => [item.id, item]));
  const restored = savedIds
    .map((id) => byId.get(id))
    .filter((item): item is OrderItem => Boolean(item));
  const missing = BASE_ITEMS.filter((item) => !savedIds.includes(item.id));

  return [...restored, ...missing];
}

export function ProgramOrderEditor() {
  const [items, setItems] = useState<OrderItem[]>(BASE_ITEMS);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const savedIds = raw ? (JSON.parse(raw) as string[]) : null;
      setItems(restoreOrder(savedIds));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const orderText = useMemo(() => items.map((item) => item.id).join("\n"), [items]);

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    setItems((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSaved(false);
    setCopied(false);
  };

  const saveOrder = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map((item) => item.id)));
    setSaved(true);
    setCopied(false);
  };

  const copyOrder = async () => {
    await navigator.clipboard.writeText(orderText);
    setCopied(true);
  };

  const resetOrder = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setItems(BASE_ITEMS);
    setSaved(false);
    setCopied(false);
  };

  return (
    <main className="min-h-screen bg-[var(--color-canvas)] px-4 py-5">
      <div className="mx-auto max-w-xl">
        <header className="sticky top-0 z-30 -mx-4 mb-4 border-b border-[var(--color-line)] bg-[var(--color-canvas)]/95 px-4 py-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Порядок программ</h1>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                {items.length} программ
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={resetOrder}
                title="Сбросить"
                aria-label="Сбросить"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-sm active:scale-95"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={copyOrder}
                title="Скопировать порядок"
                aria-label="Скопировать порядок"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-sm active:scale-95"
              >
                {copied ? <Check className="h-4 w-4" strokeWidth={2.4} /> : <Clipboard className="h-4 w-4" strokeWidth={2.4} />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={saveOrder}
            className="mt-4 flex w-full items-center justify-center rounded-2xl bg-[var(--color-whatsapp)] px-4 py-3 text-sm font-semibold text-white shadow-sm active:scale-[0.98]"
          >
            {saved ? "Порядок сохранён" : "Сохранить порядок"}
          </button>
        </header>

        <ol className="space-y-2 pb-8">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="grid grid-cols-[36px_58px_1fr_44px] items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-3 shadow-[0_10px_28px_rgba(15,15,20,0.05)]"
            >
              <div className="text-center text-sm font-bold tabular-nums text-[var(--color-ink-soft)]">
                {index + 1}
              </div>

              <div className="h-14 w-14 overflow-hidden rounded-xl bg-zinc-100">
                {item.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.cover} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--color-ink-soft)]">
                    {item.title.slice(0, 2)}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="truncate text-base font-bold">{item.title}</div>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[var(--color-ink-soft)]">
                  <span>от {item.priceFrom.toLocaleString("ru-RU")} ₪</span>
                  <span>{item.durationLabel}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  title="Выше"
                  aria-label="Выше"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-line)] bg-white disabled:opacity-30 active:scale-95"
                >
                  <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  title="Ниже"
                  aria-label="Ниже"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-line)] bg-white disabled:opacity-30 active:scale-95"
                >
                  <ArrowDown className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
