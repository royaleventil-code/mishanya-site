import { BidiText } from "@/components/BidiText";
import { LiteYouTube } from "@/components/LiteYouTube";
import {
  formatVideoDuration,
  resolveVideoId,
  videoWatchUrl,
  WATCH_ON_YOUTUBE,
  type EventVideo,
} from "@/data/event-videos";
import type { Locale } from "@/lib/i18n";

type Props = {
  videos: readonly EventVideo[];
  locale: Locale;
};

/**
 * Галерея роликов события. Горизонтальные ролики идут сеткой 16:9,
 * вертикальные Shorts - отдельной лентой 9:16: в общей сетке они
 * вытягивались бы втрое выше соседей и ломали ряд.
 */
export function EventVideoGallery({ videos, locale }: Props) {
  const landscape = videos.filter((video) => video.orientation === "landscape");
  const portrait = videos.filter((video) => video.orientation === "portrait");

  if (videos.length === 0) return null;

  return (
    <div className="space-y-5">
      {landscape.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          {landscape.map((video) => (
            <figure key={video.id} className="m-0">
              <LiteYouTube
                videoId={resolveVideoId(video, locale)}
                title={video.title[locale]}
                duration={formatVideoDuration(video.durationSeconds)}
                watchUrl={video.embeddable ? undefined : videoWatchUrl(resolveVideoId(video, locale))}
              />
              <figcaption className="mt-2">
                <span className="block text-[15px] font-semibold leading-snug">
                  <BidiText locale={locale}>{video.title[locale]}</BidiText>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  <BidiText locale={locale}>{video.description[locale]}</BidiText>
                </span>
                {!video.embeddable && (
                  <span className="mt-1 block text-xs font-semibold text-[var(--color-ink-soft)]">
                    <BidiText locale={locale}>{WATCH_ON_YOUTUBE[locale]}</BidiText>
                  </span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {portrait.length > 0 && (
        // Лента: на мобильном свайп по горизонтали, на десктопе просто ряд
        <ul className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
          {portrait.map((video) => (
            <li key={video.id} className="w-[46%] shrink-0 snap-start sm:w-[180px]">
              <figure className="m-0">
                <LiteYouTube
                  videoId={resolveVideoId(video, locale)}
                  title={video.title[locale]}
                  orientation="portrait"
                  duration={formatVideoDuration(video.durationSeconds)}
                  sizes="(max-width: 640px) 46vw, 180px"
                  watchUrl={video.embeddable ? undefined : videoWatchUrl(resolveVideoId(video, locale))}
                />
                <figcaption className="mt-2">
                  <span className="block text-sm font-semibold leading-snug">
                    <BidiText locale={locale}>{video.title[locale]}</BidiText>
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-[var(--color-ink-soft)]">
                    <BidiText locale={locale}>{video.description[locale]}</BidiText>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
