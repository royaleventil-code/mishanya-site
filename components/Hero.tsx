"use client";

import { useEffect, useState } from "react";

type Props = {
  emoji?: string;
  title: string;
  accent: string;
};

export function Hero({ title, accent }: Props) {
  const match = title.match(/^(.*?)\s*(\d+)\s*(лет|года)\s*$/i);
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
      {/* gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-16 w-72 h-72 rounded-full opacity-30 blur-3xl"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 60%)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-16 w-72 h-72 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, #8b5cf6, transparent 60%)" }}
      />
      {/* floating dots */}
      <span aria-hidden className="float-dot float-dot-1" style={{ background: accent }} />
      <span aria-hidden className="float-dot float-dot-2" style={{ background: "#8b5cf6" }} />
      <span aria-hidden className="float-dot float-dot-3" style={{ background: "#ec4899" }} />
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
