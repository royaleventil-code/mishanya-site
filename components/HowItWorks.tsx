import { MessageCircle, ListChecks, Calendar, PartyPopper } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Step = {
  n: number;
  title: string;
  desc: string;
  Icon: LucideIcon;
  from: string;
  to: string;
};

const STEPS: Step[] = [
  {
    n: 1,
    title: "Заявка",
    desc: "Напишите в WhatsApp",
    Icon: MessageCircle,
    from: "#60a5fa",
    to: "#2563eb",
  },
  {
    n: 2,
    title: "Подбор",
    desc: "Согласуем программу и героя",
    Icon: ListChecks,
    from: "#c084fc",
    to: "#7c3aed",
  },
  {
    n: 3,
    title: "Подтверждение",
    desc: "Бронируем дату",
    Icon: Calendar,
    from: "#fbbf24",
    to: "#f97316",
  },
  {
    n: 4,
    title: "Праздник",
    desc: "Приезжаем за час, дарим эмоции",
    Icon: PartyPopper,
    from: "#5eead4",
    to: "#0d9488",
  },
];

export function HowItWorks() {
  return (
    <section
      className="relative mx-auto max-w-5xl px-5 sm:px-6 py-14 sm:py-24 overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 78% 58% at 50% 8%, rgba(219,234,254,0.7) 0%, rgba(250,245,255,0.35) 45%, transparent 76%)",
      }}
    >
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">
        Как мы работаем
      </h2>

      <div className="mt-12 sm:mt-16 mx-auto w-full max-w-[760px]">
        {STEPS.map((step, idx) => {
          const isLeft = idx % 2 === 0;
          const nextStep = STEPS[idx + 1];
          return (
            <div key={step.n}>
              <div
                className={`flex ${
                  isLeft ? "justify-start" : "justify-end"
                }`}
              >
                <StepCard step={step} />
              </div>
              {nextStep && (
                <ZigZagConnector
                  direction={isLeft ? "rightDown" : "leftDown"}
                  color={step.to}
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
  const { n, title, desc, Icon, from, to } = step;
  return (
    <div
      className="relative w-full max-w-[520px] rounded-[32px] px-6 py-6 sm:px-8 sm:py-7 flex items-center gap-5 sm:gap-7"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.78) 100%)",
        backdropFilter: "blur(18px) saturate(160%)",
        WebkitBackdropFilter: "blur(18px) saturate(160%)",
        boxShadow: `0 30px 70px -34px ${to}99, 0 22px 48px -34px rgba(15,15,20,0.18), inset 0 0 0 1px rgba(255,255,255,0.78)`,
      }}
    >
      <span
        aria-hidden
        className="absolute left-7 top-5 w-2 h-2 rounded-full opacity-70"
        style={{ background: from }}
      />
      <span
        aria-hidden
        className="absolute left-5 top-12 w-2 h-2 rounded-full opacity-60"
        style={{ background: to }}
      />
      <span
        aria-hidden
        className="absolute bottom-7 right-7 w-2.5 h-2.5 rounded-full opacity-70"
        style={{ background: from }}
      />

      <div className="relative shrink-0">
        <div
          aria-hidden
          className="absolute inset-0 rounded-full blur-2xl -z-0"
          style={{
            background: `radial-gradient(circle, ${to}66 0%, transparent 70%)`,
            transform: "scale(1.4)",
          }}
        />
        <div
          className="relative w-[88px] h-[88px] sm:w-[112px] sm:h-[112px] rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
            boxShadow: `0 18px 40px -12px ${to}aa, inset 0 -10px 22px rgba(0,0,0,0.18), inset 0 9px 20px rgba(255,255,255,0.44), 0 0 0 8px rgba(255,255,255,0.62)`,
          }}
        >
          <Icon
            className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow"
            strokeWidth={2.35}
          />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-2xl sm:text-[28px] font-bold tracking-tight leading-tight">
          {title}
        </h3>
        <p className="mt-2 text-base sm:text-lg leading-snug text-[var(--color-ink-soft)]">
          {desc}
        </p>
      </div>

      <span
        className="absolute -top-4 right-7 sm:right-10 grid w-14 h-14 sm:w-16 sm:h-16 place-items-center rounded-full text-xl sm:text-2xl font-bold tabular-nums"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,255,255,0.68))",
          color: to,
          boxShadow: `0 12px 28px -16px ${to}, inset 0 0 0 1px rgba(255,255,255,0.82)`,
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
    <div className="-mt-8 -mb-1 sm:-mt-9 sm:-mb-1 relative w-full" style={{ height: 124 }} aria-hidden>
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
