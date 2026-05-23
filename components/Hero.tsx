"use client";

import { useEffect, useState } from "react";

type Props = {
  emoji?: string;
  title: string;
  accent: string;
};

export function Hero({ title }: Props) {
  const match = title.match(/^(.*?)\s*(\d+)\s*(лет|года|год)\s*$/i);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setRotation(window.scrollY * 0.4);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const Decorations = (
    <>
      {/* soft neutral wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-16 w-72 h-72 rounded-full opacity-45 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(211,205,196,0.62), transparent 62%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-16 w-72 h-72 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(226,223,218,0.74), transparent 62%)" }}
      />
      {/* floating dots */}
      <span aria-hidden className="float-dot float-dot-1" style={{ background: "#c7bfae" }} />
      <span aria-hidden className="float-dot float-dot-2" style={{ background: "#aeb7b5" }} />
      <span aria-hidden className="float-dot float-dot-3" style={{ background: "#d4cdc3" }} />
      <span aria-hidden className="float-star float-star-1">✦</span>
      <span aria-hidden className="float-star float-star-2">✦</span>
    </>
  );

  if (!match) {
    return (
      <section className="relative overflow-hidden mx-auto max-w-3xl px-5 sm:px-6 pt-1 pb-6 sm:pt-2 sm:pb-8">
        {Decorations}
        <h1 className="relative text-[34px] sm:text-5xl font-bold tracking-tight leading-[1.05]">
          {title}
        </h1>
      </section>
    );
  }

  const [, prefix, age, unit] = match;

  return (
    <section className="relative overflow-hidden mx-auto max-w-3xl px-5 sm:px-6 pt-1 pb-6 sm:pt-2 sm:pb-10">
      {Decorations}
      <div className="relative flex items-center justify-between gap-3 sm:gap-6">
        <h1 className="text-[38px] sm:text-[58px] font-bold tracking-tight leading-[1.05]">
          {prefix.split(" ").map((word, i, arr) => (
            <span key={i}>
              {word}
              {i < arr.length - 1 ? (i === 0 ? <br /> : " ") : null}
            </span>
          ))}
        </h1>

        <div className="shrink-0 text-center">
          <div
            className="age-cartoon"
            style={{
              fontFamily: "var(--font-display)",
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {age}
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight -mt-3 sm:-mt-4">
            {unit}
          </div>
        </div>
      </div>
    </section>
  );
}
