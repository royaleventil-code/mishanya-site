import { createAllProgramsMetadata } from "@/lib/seo";
import { SegmentPage } from "@/components/SegmentPage";

export const metadata = createAllProgramsMetadata("/all");

export default function AllPage() {
  return <SegmentPage segment="all" title="Все программы Мишани" />;
}
