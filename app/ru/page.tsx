import { HomePage } from "@/components/home/HomePage";
import { createPageMetadata, SITE_NAME } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: `${SITE_NAME} — детские праздники в Израиле`,
  description:
    "Мишаня в Стране Чудес, также Михаил в Стране Чудес и Страна Чудес: детские праздники, герои и шоу в Израиле.",
  path: "/ru",
  canonicalPath: "/ru",
  image: "/generated/program-party.webp",
});

export default function RuHomePage() {
  return <HomePage />;
}
