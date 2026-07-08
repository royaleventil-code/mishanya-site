import FormatsContent from "@/components/formats/FormatsContent";
import { createPageMetadata, SITE_NAME } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: `Форматы праздников | ${SITE_NAME}`,
  description:
    "Детские праздники дома, в садике, школе, зале, ресторане, парке и на городских событиях. Мишаня подстраивает программу под место, возраст и язык гостей.",
  path: "/formats",
  canonicalPath: "/ru/formats",
  image: "/generated/program-party.webp",
});

export default function FormatsPage() {
  return <FormatsContent />;
}
