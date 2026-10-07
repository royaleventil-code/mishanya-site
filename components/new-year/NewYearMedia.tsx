/* eslint-disable @next/next/no-img-element */
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { NEW_YEAR_PHOTO_SIZE, NEW_YEAR_REVIEWS, NEW_YEAR_VIDEOS } from "@/data/new-year";
import type { Locale } from "@/lib/i18n";
import { LiteYouTube } from "@/components/LiteYouTube";
import s from "./new-year.module.css";

export function WinterPhoto({ name, alt, className = "", eager = false, sizes = "(max-width: 700px) 90vw, 550px" }: {
  name: string; alt: string; className?: string; eager?: boolean; sizes?: string;
}) {
  const [width, height] = NEW_YEAR_PHOTO_SIZE[name];
  const srcSet = width > 400 ? `/new-year/${name}-400.webp 400w, /new-year/${name}-1000.webp ${width}w` : undefined;
  return <img src={`/new-year/${name}-1000.webp`} srcSet={srcSet} width={width} height={height}
    sizes={srcSet ? sizes : undefined} alt={alt} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"}
    decoding="async" className={className} />;
}

export function PastCelebrations({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const he = locale === "he";
  const videos = compact ? NEW_YEAR_VIDEOS.slice(0, 1) : NEW_YEAR_VIDEOS;
  return <section className={s.memories} aria-labelledby="memories-title" id="memories">
    <h2 id="memories-title" className={compact ? s.screenReaderOnly : undefined}>{he ? "ככה נראתה השמחה" : "Так выглядит радость"}</h2>
    <p className={s.sectionNote}>{he ? "וידאו מחגיגות קודמות שלנו" : "Видео с наших прошлых праздников"}</p>
    <div className={compact ? s.oneVideo : s.videoGrid}>
      {videos.map((video) => <figure key={video.id}>
        <LiteYouTube videoId={video.id} title={he ? `לצפייה ב־YouTube: ${video.title.he}` : `Смотреть на YouTube: ${video.title.ru}`} poster={`/new-year/video-${video.id}.webp`} watchUrl={`https://www.youtube.com/watch?v=${video.id}`} />
        <figcaption><span>{video.title[locale]}</span><a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">YouTube <ArrowUpRight size={14} aria-hidden /></a></figcaption>
      </figure>)}
    </div>
  </section>;
}

export function NewYearReview({ locale }: { locale: Locale }) {
  const he = locale === "he";
  return <section className={s.review} id="reviews" aria-labelledby="review-title">
    <h2 id="review-title"><MessageCircle size={23} aria-hidden />{he ? "חוות דעת מחגיגות השנה החדשה" : "Отзывы о новогодних праздниках"}</h2>
    <p className={s.reviewIntro}>{he ? "צילומי מסך מקוריים מפייסבוק, ברוסית." : "Скриншоты отзывов из Facebook"}</p>
    <div className={s.reviewList}>
      {NEW_YEAR_REVIEWS.map((review) => <figure key={review.id} className={s.reviewCard}>
        <figcaption><strong><bdi>{review.author}</bdi></strong><time dateTime={review.isoDate}><bdi>{review.date}</bdi></time></figcaption>
        <blockquote className={s.reviewExcerpt} lang="ru" dir="ltr">«{review.excerpt}»</blockquote>
        <img src={`/new-year/reviews/${review.id}.webp`} width={review.width} height={review.height}
          alt={`${review.author} · ${review.date}. ${review.description[locale]}`} loading="lazy" decoding="async" />
      </figure>)}
    </div>
  </section>;
}
