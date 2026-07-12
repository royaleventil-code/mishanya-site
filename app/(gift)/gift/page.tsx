import type { Metadata } from "next";
import { GiftPage } from "@/components/gift/GiftPage";

export const metadata: Metadata = {
  title: "Подарок для будущего праздника | Мишаня в Стране Чудес",
  description:
    "Выберите подарок для ближайшего дня рождения ребёнка и сохраните его за своим номером телефона.",
  alternates: {
    canonical: "/gift",
  },
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

export default function GiftLandingPage() {
  return <GiftPage />;
}
