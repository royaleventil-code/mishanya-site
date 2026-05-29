import type { Metadata } from "next";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { SocialProofSection } from "@/components/SocialProofSection";

export const metadata: Metadata = {
  title: "Фото и отзывы | Мишаня в Стране Чудес",
  description: "Фото, отзывы, видео и социальные сети агентства детских праздников Мишаня в Стране Чудес.",
};

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader />
      <section className="px-5 pt-14 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold text-[#e34f35]">
            Фото и отзывы
          </p>
          <h1 className="mt-3 max-w-4xl break-words text-4xl font-black leading-tight sm:text-6xl">
            Реальные праздники, отзывы родителей и видео с мероприятий.
          </h1>
        </div>
      </section>
      <SocialProofSection />
      <PublicFooter />
    </main>
  );
}
