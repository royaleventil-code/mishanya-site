import type { Metadata } from "next";
import { RootDocument, viewport as rootViewport } from "@/app/RootDocument";

export const metadata: Metadata = {
  title: "Приглашение на праздник | Мишаня в Стране Чудес",
  description: "Создайте красивое приглашение и соберите ответы гостей в одном месте.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export const viewport = rootViewport;

export default function RsvpRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootDocument locale="ru" showFloatingWhatsApp={false} showAccessibilityWidget={false}>
      {children}
    </RootDocument>
  );
}
