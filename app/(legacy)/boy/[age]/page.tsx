import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SegmentPage } from "@/components/SegmentPage";
import { createAgeProgramsMetadata } from "@/lib/seo";
import { heroTitle, segmentFromAge } from "@/lib/segments";

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, index) => ({ age: String(index + 1) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ age: string }>;
}): Promise<Metadata> {
  const { age } = await params;
  const ageNum = Number.parseInt(age, 10);
  if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 10) {
    return {
      title: "Программы для мальчиков | Мишаня в Стране Чудес",
    };
  }

  return createAgeProgramsMetadata({
    gender: "boy",
    age: ageNum,
    path: `/boy/${ageNum}`,
  });
}

export default async function BoyAgePage({
  params,
}: {
  params: Promise<{ age: string }>;
}) {
  const { age } = await params;
  const ageNum = Number.parseInt(age, 10);
  if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 10) notFound();

  const segment = segmentFromAge(ageNum, "boy");
  return (
    <SegmentPage
      segment={segment}
      title={heroTitle(segment, ageNum, "boy")}
      audience={{ gender: "boy", age: ageNum }}
    />
  );
}
