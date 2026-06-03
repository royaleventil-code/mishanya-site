"use client";

import { MessageCircle, ListChecks, Calendar, PartyPopper } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type Step = {
  n: number;
  title: string;
  desc: string;
  Icon: LucideIcon;
  color: string;
};

const STEPS: Step[] = [
  {
    n: 1,
    title: "Заявка",
    desc: "Напишите в WhatsApp",
    Icon: MessageCircle,
    color: "#0a84ff",
  },
  {
    n: 2,
    title: "Подбор",
    desc: "Согласуем программу и героя",
    Icon: ListChecks,
    color: "#5e5ce6",
  },
  {
    n: 3,
    title: "Подтверждение",
    desc: "Бронируем дату",
    Icon: Calendar,
    color: "#ff9f0a",
  },
  {
    n: 4,
    title: "Праздник",
    desc: "Приезжаем за час, дарим эмоции",
    Icon: PartyPopper,
    color: "#ff375f",
  },
];

export function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    <section
      className="relative mx-auto max-w-5xl overflow-hidden px-5 py-14 sm:px-6 sm:py-24"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 78% 58% at 50% 8%, rgba(10,132,255,0.10) 0%, rgba(94,92,230,0.06) 45%, transparent 76%)",
      }}
    >
      <div className="text-center">
        <p className="text-sm font-black uppercase tracking-wide text-[#5e5ce6]">
          Просто и понятно
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-nunito)] text-2xl font-black tracking-tight sm:text-3xl">
          Как мы работаем
        </h2>
      </div>

      <div className="mx-auto mt-12 w-full max-w-[760px] sm:mt-16">
        {STEPS.map((step, idx) => {
          const isLeft = idx % 2 === 0;
          const nextStep = STEPS[idx + 1];
          return (
            <div key={step.n}>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.5, delay: idx * 0.08, ease: "easeOut" }}
                className={`flex ${isLeft ? "justify-start" : "justify-end"}`}
              >
                <StepCard step={step} />
              </motion.div>
              {nextStep && (
                <ZigZagConnector
                  direction={isLeft ? "rightDown" : "leftDown"}
                  color={step.color}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StepCard({ step }: { step: Step }) {
  const { n, title, desc, Icon, color } = step;
  return (
    <div
      className="relative flex w-full max-w-[520px] items-center gap-5 rounded-[32px] px-6 py-6 sm:gap-7 sm:px-8 sm:py-7"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.78) 100%)",
        backdropFilter: "blur(18px) saturate(160%)",
        WebkitBackdropFilter: "blur(18px) saturate(160%)",
        boxShadow: `0 30px 70px -34px ${color}99, 0 22px 48px -34px rgba(15,15,20,0.18), inset 0 0 0 1px rgba(255,255,255,0.78)`,
      }}
    >
      <span
        aria-hidden
        className="absolute left-7 top-5 h-2 w-2 rounded-full opacity-70"
        style={{ background: color }}
      />
      <span
        aria-hidden
        className="absolute left-5 top-12 h-2 w-2 rounded-full opacity-60"
        style={{ background: color }}
      />
      <span
        aria-hidden
        className="absolute bottom-7 right-7 h-2.5 w-2.5 rounded-full opacity-70"
        style={{ background: color }}
      />

      <div className="relative shrink-0">
        <div
          aria-hidden
          className="absolute inset-0 -z-0 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, ${color}66 0%, transparent 70%)`,
            transform: "scale(1.4)",
          }}
        />
        <div
          className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full sm:h-[112px] sm:w-[112px]"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
            boxShadow: `0 18px 40px -12px ${color}aa, inset 0 -10px 22px rgba(0,0,0,0.18), inset 0 9px 20px rgba(255,255,255,0.44), 0 0 0 8px rgba(255,255,255,0.62)`,
          }}
        >
          <Icon
            className="h-10 w-10 text-white drop-shadow sm:h-12 sm:w-12"
            strokeWidth={2.35}
          />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-[family-name:var(--font-nunito)] text-2xl font-black leading-tight tracking-tight sm:text-[28px]">
          {title}
        </h3>
        <p className="mt-2 text-base leading-snug text-[var(--color-ink-soft)] sm:text-lg">
          {desc}
        </p>
      </div>

      <span
        className="absolute -top-4 right-7 grid h-14 w-14 place-items-center rounded-full font-[family-name:var(--font-nunito)] text-xl font-black tabular-nums sm:right-10 sm:h-16 sm:w-16 sm:text-2xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,255,255,0.68))",
          color: color,
          boxShadow: `0 12px 28px -16px ${color}, inset 0 0 0 1px rgba(255,255,255,0.82)`,
        }}
      >
        {String(n).padStart(2, "0")}
      </span>
    </div>
  );
}

function ZigZagConnector({
  direction,
  color,
}: {
  direction: "rightDown" | "leftDown";
  color: string;
}) {
  const isRight = direction === "rightDown";
  const shadowId = `journey-arrow-${direction}-${color.replace("#", "")}`;
  const path = isRight
    ? "M 520 8 C 650 8 704 52 704 104"
    : "M 240 8 C 110 8 56 52 56 104";
  const arrowHead = isRight ? "M 682 84 L704 106 L724 84" : "M 78 84 L56 106 L36 84";

  return (
    <div className="relative -mb-1 -mt-8 w-full sm:-mb-1 sm:-mt-9" style={{ height: 124 }} aria-hidden>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 760 124"
        preserveAspectRatio="none"
        fill="none"
        className="block"
      >
        <defs>
          <filter id={shadowId} x="-18%" y="-30%" width="136%" height="170%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor={color} floodOpacity="0.18" />
          </filter>
        </defs>
        <path
          d={path}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path}
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.58"
          filter={`url(#${shadowId})`}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={arrowHead}
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.72"
          filter={`url(#${shadowId})`}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
