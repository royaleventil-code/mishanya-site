import type { Metadata } from "next";
import { GiftLinksPage } from "@/components/admin/GiftLinksPage";

export const metadata: Metadata = {
  title: "QR и ссылки подарка | Внутренний инструмент",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminGiftLinksPage() {
  return <GiftLinksPage />;
}
