import { notFound } from "next/navigation";
import { SegmentPage } from "@/components/SegmentPage";
import { segmentFromAge, heroTitle } from "@/lib/segments";

export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ age: String(i + 1) }));
}

export default async function GirlAgePage({
  params,
}: {
  params: Promise<{ age: string }>;
}) {
  const { age } = await params;
  const ageNum = Number.parseInt(age, 10);
  if (!Number.isFinite(ageNum) || ageNum < 1 || ageNum > 10) notFound();

  const segment = segmentFromAge(ageNum, "girl");
  return <SegmentPage segment={segment} title={heroTitle(segment, ageNum, "girl")} />;
}
