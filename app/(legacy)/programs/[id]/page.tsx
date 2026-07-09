import type { Metadata } from "next";
import { SiteFooter } from "@/components/home/SiteFooter";
import { notFound } from "next/navigation";
import { PROGRAMS, getProgramById } from "@/data/programs";
import { PublicHeader } from "@/components/PublicHeader";
import { RedirectToAll } from "../RedirectToAll";

type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return PROGRAMS.map((program) => ({ id: program.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const program = getProgramById(id);

  if (!program) {
    return {
      title: "Программа не найдена | Мишаня в Стране Чудес",
    };
  }

  return {
    title: `${program.title} | Все программы Мишани`,
    description:
      program.tagline ??
      "Программа детского праздника с ценой, составом и возможностью уточнить детали в новом каталоге.",
    alternates: {
      canonical: `/ru/programs/${program.id}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProgramDetailPage({ params }: Props) {
  const { id } = await params;
  const program = getProgramById(id);
  if (!program) notFound();

  return (
    <main id="main" className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader />
      <RedirectToAll
        target={`/ru/programs/${encodeURIComponent(program.id)}`}
        title={`Открываем программу «${program.title}»`}
        text="Эта программа теперь живёт на собственной странице с ценой, составом и быстрым переходом в WhatsApp."
      />
      <SiteFooter />
    </main>
  );
}
