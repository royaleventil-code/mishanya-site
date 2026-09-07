import { getHeroImage } from "@/data/heroes";

export function PikachuPortrait({ alt = "", className }: { alt?: string; className?: string }) {
  return (
    <svg
      viewBox="632 -24 640 1112"
      className={className}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      style={{ mixBlendMode: "multiply" }}
    >
      {/* Frame the costume without the wide margins in the original photograph. */}
      <image href={getHeroImage("pikachu-mascot")!} width="1920" height="1080" />
    </svg>
  );
}
