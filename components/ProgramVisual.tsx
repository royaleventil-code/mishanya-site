import Image from "next/image";
import type { Program } from "@/lib/types";

type VisualKind = "party" | "heroes" | "magic" | "show";

const VISUALS: Record<VisualKind, { src: string; tint: string }> = {
  party: {
    src: "/generated/program-party.webp",
    tint: "from-amber-200/16 via-transparent to-pink-300/18",
  },
  heroes: {
    src: "/generated/program-heroes.webp",
    tint: "from-blue-200/14 via-transparent to-red-300/18",
  },
  magic: {
    src: "/generated/program-magic.webp",
    tint: "from-pink-200/18 via-transparent to-sky-200/20",
  },
  show: {
    src: "/generated/program-show.webp",
    tint: "from-fuchsia-200/14 via-transparent to-cyan-200/18",
  },
};

const VISUAL_BY_PROGRAM_ID: Record<string, VisualKind> = {
  mini: "party",
  start: "party",
  standart: "party",
  mishanya: "party",
  vip: "party",
  "super-vip": "party",
  "super-heroes": "heroes",
  "paw-patrol-toddler-girls": "heroes",
  "paw-patrol-toddler-boys": "heroes",
  "harry-potter": "heroes",
  "squid-game": "heroes",
  "frozen-toddler-girls": "magic",
  "unicorn-toddler-girls": "magic",
  barbie: "magic",
  wednesday: "magic",
  kpop: "show",
  tiktok: "show",
  chemistry: "show",
  circus: "show",
  magician: "show",
  neon: "show",
  foam: "show",
  tesla: "show",
  techno: "show",
};

function visualFor(program: Pick<Program, "id">) {
  return VISUALS[VISUAL_BY_PROGRAM_ID[program.id] ?? "party"];
}

export function ProgramVisual({
  program,
  priority = false,
  sizes,
  className = "",
}: {
  program: Pick<Program, "id" | "cover">;
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  const visual = visualFor(program);
  const src = program.cover ?? visual.src;

  return (
    <div className={`relative overflow-hidden bg-white ${className}`} aria-hidden="true">
      <Image
        src={src}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
      />
      <div className={`absolute inset-0 bg-gradient-to-tr ${visual.tint}`} />
    </div>
  );
}
