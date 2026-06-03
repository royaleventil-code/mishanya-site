import type { Metadata } from "next";
import { ContactsContent } from "@/components/contacts/ContactsContent";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";

export const metadata: Metadata = {
  title: "Контакты | Мишаня в Стране Чудес",
  description:
    "Свяжитесь с агентством детских праздников «Мишаня в Стране Чудес». WhatsApp, телефон, email и соцсети. Работаем по всему Израилю, на русском и иврите.",
};

export default function ContactsPage() {
  return (
    <main className="min-h-screen bg-[#fffaf4] text-[var(--color-ink)]">
      <PublicHeader />
      <ContactsContent />
      <PublicFooter />
    </main>
  );
}
