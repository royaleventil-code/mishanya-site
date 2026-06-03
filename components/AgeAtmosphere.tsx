import type { CSSProperties } from "react";
import {
  resolveAtmosphereTheme,
  type AtmosphereMotif,
  type ProgramAtmosphereThemeId,
} from "@/lib/atmosphere";
import type { AudienceContext } from "@/lib/types";
import styles from "./AgeAtmosphere.module.css";

type Props = {
  audience?: AudienceContext;
  programThemeId?: ProgramAtmosphereThemeId;
};

type DecorationSlot = {
  top: string;
  left: string;
  size: string;
  rotate: string;
  scale: string;
  opacity: string;
  delay: string;
  duration: string;
};

type AtmosphereStyle = CSSProperties & Record<`--${string}`, string>;

const MOTIF_CLASS: Record<AtmosphereMotif, string> = {
  bubble: styles.bubble,
  heart: styles.heart,
  softCircle: styles.softCircle,
  wave: styles.wave,
  confetti: styles.confetti,
  star: styles.star,
  ribbon: styles.ribbon,
  balloon: styles.balloon,
  bolt: styles.bolt,
  rocket: styles.rocket,
  music: styles.music,
  glow: styles.glow,
  pixel: styles.pixel,
  speedLine: styles.speedLine,
};

const DECORATION_SLOTS: DecorationSlot[] = [
  { top: "4.8rem", left: "5%", size: "2.8rem", rotate: "-10deg", scale: "1", opacity: "0.58", delay: "0s", duration: "6.8s" },
  { top: "8rem", left: "80%", size: "3.6rem", rotate: "16deg", scale: "0.92", opacity: "0.54", delay: "-1.2s", duration: "7.6s" },
  { top: "15.5rem", left: "12%", size: "2.2rem", rotate: "28deg", scale: "0.84", opacity: "0.48", delay: "-2.4s", duration: "6.2s" },
  { top: "20rem", left: "70%", size: "2.9rem", rotate: "-22deg", scale: "0.98", opacity: "0.52", delay: "-0.8s", duration: "8.4s" },
  { top: "31rem", left: "4%", size: "3.4rem", rotate: "12deg", scale: "1.08", opacity: "0.5", delay: "-3.1s", duration: "7.2s" },
  { top: "35rem", left: "86%", size: "2.3rem", rotate: "-18deg", scale: "0.8", opacity: "0.5", delay: "-1.7s", duration: "6.4s" },
  { top: "45rem", left: "16%", size: "2.7rem", rotate: "35deg", scale: "0.9", opacity: "0.46", delay: "-2.8s", duration: "8.8s" },
  { top: "53rem", left: "74%", size: "3.1rem", rotate: "-8deg", scale: "1.02", opacity: "0.52", delay: "-3.6s", duration: "7.8s" },
  { top: "64rem", left: "7%", size: "2.1rem", rotate: "20deg", scale: "0.78", opacity: "0.42", delay: "-4.1s", duration: "6.6s" },
  { top: "70rem", left: "88%", size: "2.8rem", rotate: "-28deg", scale: "0.9", opacity: "0.46", delay: "-2.2s", duration: "8s" },
  { top: "82rem", left: "22%", size: "3.2rem", rotate: "8deg", scale: "0.96", opacity: "0.44", delay: "-1.4s", duration: "8.6s" },
  { top: "91rem", left: "68%", size: "2.4rem", rotate: "24deg", scale: "0.82", opacity: "0.4", delay: "-3.4s", duration: "7s" },
];

export function AgeAtmosphere({ audience, programThemeId }: Props) {
  const theme = resolveAtmosphereTheme(audience, programThemeId);
  if (!theme) return null;

  const motifs = theme.motifs.length > 0 ? theme.motifs : ["softCircle"];
  const atmosphereStyle: AtmosphereStyle = {
    "--atmo-base": theme.palette.base,
    "--atmo-aura": theme.palette.aura,
    "--atmo-glow": theme.palette.glow,
    "--atmo-accent": theme.palette.accent,
    "--atmo-accent-2": theme.palette.accent2,
    "--atmo-accent-3": theme.palette.accent3,
  };

  return (
    <div
      aria-hidden
      className={[
        styles.atmosphere,
        styles[theme.gender],
        styles[theme.ageGroup],
      ].join(" ")}
      style={atmosphereStyle}
    >
      <div className={styles.wash} />
      {DECORATION_SLOTS.map((slot, index) => {
        const motif = motifs[index % motifs.length];
        const style: AtmosphereStyle = {
          "--top": slot.top,
          "--left": slot.left,
          "--size": slot.size,
          "--rotate": slot.rotate,
          "--scale": slot.scale,
          "--opacity": slot.opacity,
          "--delay": slot.delay,
          "--duration": slot.duration,
        };

        return (
          <span
            key={`${theme.id}-${motif}-${index}`}
            className={[styles.element, MOTIF_CLASS[motif]].join(" ")}
            style={style}
          />
        );
      })}
    </div>
  );
}
