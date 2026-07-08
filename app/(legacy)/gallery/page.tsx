import GalleryContent from "@/components/gallery/GalleryContent";
import { createPageMetadata, SITE_NAME } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: `Фото, видео и отзывы | ${SITE_NAME}`,
  description:
    "Галерея Мишани: реальные фото детских праздников, видео шоу-программ и отзывы родителей. 5,0 по 783 отзывам, праздники по всему Израилю.",
  path: "/gallery",
  canonicalPath: "/ru/gallery",
  image: "/proof/girls-4-6/page-14.webp",
});

export default function GalleryPage() {
  return <GalleryContent />;
}
