import Link from "next/link";
import { CheckCircle2, ChevronDown, ChevronRight, Circle, Clock3 } from "lucide-react";
import { PROGRAM_STATUSES, type ProgramStatus } from "@/data/program-status";

const AGE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function ageLabel(age: number): string {
  if (age === 1) return "1 год";
  if (age >= 2 && age <= 4) return `${age} года`;
  return `${age} лет`;
}

type WorkItem = {
  id: string;
  label: string;
  href: string;
};

const WORK_GROUPS: {
  title: string;
  subtitle: string;
  color: string;
  collapsedByDefault?: boolean;
  items: WorkItem[];
}[] = [
  {
    title: "Мальчики",
    subtitle: "10 программ",
    color: "#0a84ff",
    collapsedByDefault: true,
    items: AGE_OPTIONS.map((age) => ({
      id: `boy-${age}`,
      label: `Мальчики ${ageLabel(age)}`,
      href: `/boy/${age}`,
    })),
  },
  {
    title: "Девочки",
    subtitle: "10 программ",
    color: "#ff375f",
    items: AGE_OPTIONS.map((age) => ({
      id: `girl-${age}`,
      label: `Девочки ${ageLabel(age)}`,
      href: `/girl/${age}`,
    })),
  },
  {
    title: "Общий каталог",
    subtitle: "все программы",
    color: "#5e5ce6",
    items: [{ id: "all", label: "Все программы", href: "/all" }],
  },
];

const TOTAL_COUNT = WORK_GROUPS.reduce((sum, group) => sum + group.items.length, 0);
const READY_COUNT = Object.values(PROGRAM_STATUSES).filter((status) => status === "done").length;

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--color-canvas)]">
      <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink-soft)]">
              Рабочий список
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Программы Мишани
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
              Идём по списку, правим каждую программу и отмечаем готовность.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl bg-white px-4 py-3 text-center shadow-[0_12px_32px_rgba(15,15,20,0.06)]">
            <div className="text-2xl font-bold tabular-nums">
              {READY_COUNT}/{TOTAL_COUNT}
            </div>
            <div className="text-[11px] font-medium text-[var(--color-ink-soft)]">
              готово
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2">
          <LegendItem status="todo" />
          <LegendItem status="in-progress" />
          <LegendItem status="done" />
        </div>

        <div className="space-y-5">
          {WORK_GROUPS.map((group) => {
            const groupReady = group.items.filter(
              (item) => PROGRAM_STATUSES[item.id] === "done",
            ).length;

            return (
              <WorkGroupSection
                key={group.title}
                group={group}
                groupReady={groupReady}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}

function WorkGroupSection({
  group,
  groupReady,
}: {
  group: (typeof WORK_GROUPS)[number];
  groupReady: number;
}) {
  return (
    <details
      open={!group.collapsedByDefault}
      className="group overflow-hidden rounded-3xl bg-white shadow-[0_16px_40px_rgba(15,15,20,0.06)]"
    >
      <summary
        className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-[var(--color-line)] px-5 py-4 [&::-webkit-details-marker]:hidden"
        style={{ borderTop: `4px solid ${group.color}` }}
      >
        <span>
          <span className="block text-xl font-bold tracking-tight">{group.title}</span>
          <span className="mt-0.5 block text-sm text-[var(--color-ink-soft)]">
            {group.subtitle}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold tabular-nums text-[var(--color-ink-soft)]">
            {groupReady}/{group.items.length}
          </span>
          <ChevronDown
            className="h-5 w-5 text-[var(--color-ink-soft)] transition group-open:rotate-180"
            strokeWidth={2.4}
          />
        </span>
      </summary>

      <div className="divide-y divide-[var(--color-line)]">
        {group.items.map((item) => (
          <ProgramWorkRow
            key={item.id}
            item={item}
            status={PROGRAM_STATUSES[item.id] ?? "todo"}
          />
        ))}
      </div>
    </details>
  );
}

function ProgramWorkRow({ item, status }: { item: WorkItem; status: ProgramStatus }) {
  const isDone = status === "done";
  const isInProgress = status === "in-progress";

  return (
    <Link
      href={item.href}
      className={`group flex min-h-[64px] items-center justify-between gap-3 px-5 py-3 transition active:scale-[0.995] ${
        isDone
          ? "bg-emerald-50/80 hover:bg-emerald-50"
          : isInProgress
            ? "bg-amber-50/80 hover:bg-amber-50"
            : "bg-white hover:bg-zinc-50"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <StatusIcon status={status} />
        <span className="min-w-0">
          <span className="block truncate text-base font-semibold">{item.label}</span>
          <span className="mt-0.5 block text-xs text-[var(--color-ink-soft)]">
            {item.href}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <StatusBadge status={status} />
        <ChevronRight
          className="h-5 w-5 text-[var(--color-ink-soft)] transition group-hover:translate-x-0.5"
          strokeWidth={2.4}
        />
      </span>
    </Link>
  );
}

function LegendItem({ status }: { status: ProgramStatus }) {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-white px-2.5 py-2 text-xs font-semibold shadow-[0_10px_24px_rgba(15,15,20,0.04)]">
      <StatusIcon status={status} small />
      <span className="truncate">{statusLabel(status)}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: ProgramStatus }) {
  return (
    <span
      className={`hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex ${statusBadgeClass(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function StatusIcon({ status, small = false }: { status: ProgramStatus; small?: boolean }) {
  const className = small ? "h-4 w-4 shrink-0" : "h-6 w-6 shrink-0";

  if (status === "done") {
    return <CheckCircle2 className={`${className} text-emerald-600`} strokeWidth={2.6} />;
  }

  if (status === "in-progress") {
    return <Clock3 className={`${className} text-amber-600`} strokeWidth={2.5} />;
  }

  return <Circle className={`${className} text-zinc-400`} strokeWidth={2.4} />;
}

function statusLabel(status: ProgramStatus): string {
  if (status === "done") return "Готово";
  if (status === "in-progress") return "В работе";
  return "Не готово";
}

function statusBadgeClass(status: ProgramStatus): string {
  if (status === "done") return "bg-emerald-100 text-emerald-700";
  if (status === "in-progress") return "bg-amber-100 text-amber-700";
  return "bg-zinc-100 text-zinc-600";
}
