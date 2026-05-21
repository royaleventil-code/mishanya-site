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

const CARD_W = 250;
const CARD_W_SM = 280;

export function HowItWorks() {
  return (
    <section
      className="relative mx-auto max-w-4xl px-5 sm:px-6 py-12 sm:py-20 overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 60% at 50% 0%, #eef2ff 0%, transparent 70%)",
      }}
    >
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">
        Как мы работаем
      </h2>

      <div className="mt-10 sm:mt-14 mx-auto w-full max-w-[420px] sm:max-w-[480px]">
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
                <ArrowConnector
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
      className="relative rounded-3xl px-5 py-5 flex items-center gap-4"
      style={{
        width: CARD_W,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 100%)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: `0 18px 40px -16px ${to}55, 0 8px 20px -12px rgba(15,15,20,0.08), inset 0 0 0 1px rgba(255,255,255,0.6)`,
      }}
    >
      {/* Decorative dots */}
      <span
        aria-hidden
        className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full opacity-70"
        style={{ background: from }}
      />
      <span
        aria-hidden
        className="absolute bottom-3 left-3 w-1 h-1 rounded-full opacity-50"
        style={{ background: to }}
      />
      <span
        aria-hidden
        className="absolute bottom-5 right-6 w-1 h-1 rounded-full opacity-50"
        style={{ background: from }}
      />

      {/* Icon orb with glow */}
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
          className="relative w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
            boxShadow: `0 12px 28px -8px ${to}99, inset 0 -6px 14px rgba(0,0,0,0.18), inset 0 6px 14px rgba(255,255,255,0.4)`,
          }}
        >
          <Icon
            className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow"
            strokeWidth={2.2}
          />
        </div>
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base sm:text-lg font-bold tracking-tight">
            {title}
          </h3>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
            style={{
              background: `${to}1a`,
              color: to,
            }}
          >
            {String(n).padStart(2, "0")}
          </span>
        </div>
        <p className="mt-1 text-[12.5px] leading-snug text-[var(--color-ink-soft)]">
          {desc}
        </p>
      </div>
    </div>
  );
}

function ArrowConnector({
  direction,
  color,
}: {
  direction: "rightDown" | "leftDown";
  color: string;
}) {
  const isRight = direction === "rightDown";

  /*
    SVG uses a virtual 1000×90 viewBox. The line is drawn from the
    horizontal center of the upper card to the horizontal center of
    the next (opposite-side) card with a soft S-curve in between.
    No arrowhead — just a clean curved line.

    Card width ≈ 60% of the container, so card centers sit roughly at
    x≈300 (left card) and x≈700 (right card) within the 1000-unit viewBox.
  */
  const startX = isRight ? 300 : 700;
  const endX = isRight ? 700 : 300;
  const midX = 500;
  const startY = 4;
  const endY = 86;

  const path = `M ${startX} ${startY} C ${midX} ${startY + 6}, ${midX} ${endY - 6}, ${endX} ${endY}`;

  return (
    <div className="relative w-full" style={{ height: 70 }} aria-hidden>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1000 90"
        preserveAspectRatio="none"
        fill="none"
        className="block"
      >
        <path
          d={path}
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
