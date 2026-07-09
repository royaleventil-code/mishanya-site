import { ContactsContent } from "@/components/contacts/ContactsContent";
import { SiteFooter } from "@/components/home/SiteFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { createPageMetadata, siteName } from "@/lib/seo";
import { isLocale, type Locale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";
  const name = siteName(locale);

  return createPageMetadata({
    title: locale === "he" ? `יצירת קשר | ${name}` : `Контакты | ${name}`,
    description:
      locale === "he"
        ? "צרו קשר עם מישניה בארץ הפלאות: WhatsApp, טלפון, אימייל ורשתות. מגיעים לכל רחבי הארץ, מנחים בעברית וברוסית - מענה מהיר לכל שאלה על התוכניות והמחירים."
        : "Свяжитесь с агентством детских праздников «Мишаня в Стране Чудес». WhatsApp, телефон, email и соцсети. Работаем по всему Израилю, на русском и иврите.",
    path: `/${locale}/contacts`,
    canonicalPath: `/${locale}/contacts`,
    image: "/generated/program-party.webp",
    locale,
  });
}

export default async function LocalizedContactsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale: Locale = isLocale(localeParam) ? localeParam : "ru";

  return (
    <main id="main" className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader locale={locale} />
      <ContactsContent locale={locale} />
      <SiteFooter locale={locale} />
    </main>
  );
}
