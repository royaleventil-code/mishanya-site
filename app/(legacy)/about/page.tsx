import AboutContent from "@/components/about/AboutContent";
import { createPageMetadata, SITE_NAME } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: `О нас | ${SITE_NAME}`,
  description:
    "Команда Мишаня в Стране Чудес: 11 лет детских праздников в Израиле, 10 000+ мероприятий, 783 отзыва с оценкой 5,0 и ведущие на русском и иврите.",
  path: "/about",
  canonicalPath: "/about",
  image: "/proof/kids-1-3/page-09.webp",
});

export default function AboutPage() {
  return <AboutContent />;
}
