"use client";

import { useState } from "react";

type LiteYouTubeProps = {
  videoId: string;
  /** Название видео — для aria-label кнопки и alt превью */
  title: string;
};

/**
 * Лёгкий фасад YouTube: при загрузке страницы — только превью-картинка
 * с i.ytimg.com (без внешних скриптов), iframe с youtube-nocookie
 * подгружается только после клика по кнопке play.
 */
export function LiteYouTube({ videoId, title }: LiteYouTubeProps) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="autoplay; encrypted-media"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={title}
      className="group relative block aspect-video w-full cursor-pointer overflow-hidden rounded-2xl bg-black"
    >
      {/* Обычный <img>: превью не должно тянуть next/image-обвязку, фасад без внешних запросов кроме самой картинки */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt={title}
        loading="lazy"
        className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-100"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition duration-300 group-hover:scale-110 group-hover:bg-white">
          <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6 text-[var(--color-ink)]" aria-hidden>
            <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.89l10.54-6.86c.63-.41.63-1.37 0-1.78L9.56 4.25C8.87 3.84 8 4.34 8 5.14Z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
