import type { Metadata } from "next";
import { GiftPage } from "@/components/gift/GiftPage";

export const metadata: Metadata = {
  title: "Скидка 200 ₪ на будущий праздник | Мишаня в Стране Чудес",
  description:
    "Заберите скидку 200 ₪ на программу будущего праздника и закрепите её за своим номером телефона.",
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
