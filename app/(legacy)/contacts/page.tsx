import { ContactsContent } from "@/components/contacts/ContactsContent";
import { SiteFooter } from "@/components/home/SiteFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { createPageMetadata, SITE_NAME } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: `Контакты | ${SITE_NAME}`,
  description:
    "Свяжитесь с агентством детских праздников «Мишаня в Стране Чудес». WhatsApp, телефон, email и соцсети. Работаем по всему Израилю, на русском и иврите.",
  path: "/contacts",
  canonicalPath: "/ru/contacts",
  image: "/generated/program-party.webp",
});

export default function ContactsPage() {
  return (
    <main id="main" className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader />
      <ContactsContent />
      <SiteFooter />
    </main>
  );
}
