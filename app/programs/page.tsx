import type { Metadata } from "next";
import { PublicFooter } from "@/components/PublicFooter";
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
    <main className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader />
      <RedirectToAll />
      <PublicFooter />
    </main>
  );
}
