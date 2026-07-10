import type { Metadata } from "next";
import { SiteFooter } from "@/components/home/SiteFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { RedirectToAll } from "./RedirectToAll";

export const metadata: Metadata = {
  title: "Все программы | Мишаня в Стране Чудес",
  description:
    "Все программы детских праздников Мишани с ценами, описанием и возможностью подобрать вариант под ребенка.",
  alternates: {
    canonical: "/ru/all",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ProgramsPage() {
  return (
    <main id="main" className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      {/* Легаси-путь /programs не существует в локалях - переключатель языка ведём на живые /ru/all и /he/all */}
      <PublicHeader langHrefOverrides={{ ru: "/ru/all", he: "/he/all" }} />
      <RedirectToAll />
      <SiteFooter />
    </main>
  );
}
