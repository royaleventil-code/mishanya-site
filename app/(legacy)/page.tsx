import { HomePage } from "@/components/home/HomePage";
import { createPageMetadata, HOME_WHATSAPP_PREVIEW_IMAGE, SITE_NAME } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: `${SITE_NAME} — детские праздники в Израиле`,
  description:
    "Мишаня в Стране Чудес, также Михаил в Стране Чудес и Страна Чудес: детские праздники, герои и шоу в Израиле.",
  path: "/",
  canonicalPath: "/ru",
  image: HOME_WHATSAPP_PREVIEW_IMAGE,
  imageHeight: 1200,
});

export default function Home() {
  return <HomePage />;
}
