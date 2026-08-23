"use client";

import { useState } from "react";

type LiteYouTubeProps = {
  videoId: string;
  /** Название видео - для aria-label кнопки и alt превью */
  title: string;
  /** portrait = вертикальный Shorts: рамка 9:16 и вертикальное превью вместо 16:9 с чёрными полями */
  orientation?: "landscape" | "portrait";
  /** Бейдж длительности в углу превью, формат «м:сс» */
  duration?: string;
  /** sizes для srcset превью - под ширину карточки в конкретной раскладке */
  sizes?: string;
  /**
   * Ролик с запрещённым эмбедом (YouTube error 150): вместо iframe карточка
   * открывает ролик на youtube.com. Передаём готовый watch-URL.
   */
  watchUrl?: string;
  /** false - без скругления: карточка-родитель уже скругляет и режет углы сама */
  rounded?: boolean;
  /** Своя заставка вместо кадра с ytimg - когда у нас есть кадр лучше автоматического */
  poster?: string;
};

/**
 * Лёгкий фасад YouTube: при загрузке страницы - только превью-картинка
 * с i.ytimg.com (без внешних скриптов), iframe с youtube-nocookie
 * подгружается только после клика по кнопке play.
 */
export function LiteYouTube({
  videoId,
  title,
  orientation = "landscape",
  duration,
  sizes = "(max-width: 640px) 90vw, 340px",
  watchUrl,
  rounded = true,
  poster: customPoster,
}: LiteYouTubeProps) {
  const [playing, setPlaying] = useState(false);
  const portrait = orientation === "portrait";
  const frame = `${portrait ? "aspect-[9/16]" : "aspect-video"}${rounded ? " rounded-2xl" : ""}`;
  // У вертикальных роликов hqdefault - это 16:9 с чёрными полями по бокам,
  // вертикальный кадр лежит только в oardefault (original aspect ratio).
  const poster = portrait ? "oardefault" : "hqdefault";
  // hqdefault - лёгкие 480x360 (4:3, поля обрезает object-cover), hq720 - честные 1280x720.
  // srcset даёт retina-экрану чёткий кадр, обычному - маленький файл.
  const posterSrcSet =
    customPoster || portrait
      ? undefined
      : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg 480w, https://i.ytimg.com/vi/${videoId}/hq720.jpg 1280w`;
  const posterSrc = customPoster ?? `https://i.ytimg.com/vi/${videoId}/${poster}.jpg`;

  if (playing && !watchUrl) {
    return (
      <div className={`${frame} w-full overflow-hidden bg-black`}>
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

  const posterInner = (
    <>
      {/* Обычный <img>: превью не должно тянуть next/image-обвязку, фасад без внешних запросов кроме самой картинки */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={posterSrc}
        srcSet={posterSrcSet}
        sizes={sizes}
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
      {duration && (
        <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-semibold text-white">
          {duration}
        </span>
      )}
    </>
  );

  const shell = `group relative block ${frame} w-full cursor-pointer overflow-hidden bg-black`;

  // Эмбед запрещён владельцем ролика - открываем YouTube вместо мёртвого плеера
  if (watchUrl) {
    return (
      <a href={watchUrl} target="_blank" rel="noopener noreferrer" aria-label={title} className={shell}>
        {posterInner}
      </a>
    );
  }

  return (
    <button type="button" onClick={() => setPlaying(true)} aria-label={title} className={shell}>
      {posterInner}
    </button>
  );
}
