import { SegmentPage } from "@/components/SegmentPage";
import { createAllProgramsMetadata } from "@/lib/seo";

export const metadata = createAllProgramsMetadata("/ru/all");

export default function RuAllPage() {
  return <SegmentPage segment="all" title="Все программы Мишани" />;
}
