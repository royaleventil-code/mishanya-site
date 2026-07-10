import { HomePage } from "@/components/home/HomePage";
import { createPageMetadata, HOME_WHATSAPP_PREVIEW_IMAGE, SITE_NAME } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: `${SITE_NAME} - аниматоры и детские праздники в Израиле`,
  description:
    "Аниматоры и детские праздники в Израиле: 40 программ с любимыми героями, шоу и цены сразу на сайте. 11 лет опыта, 10 000+ праздников на русском и иврите.",
  path: "/",
  canonicalPath: "/ru",
  image: HOME_WHATSAPP_PREVIEW_IMAGE,
  imageHeight: 1200,
});

export default function Home() {
  return <HomePage />;
}
