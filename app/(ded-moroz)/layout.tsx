import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./greeting.css";

const nunito = Nunito({ subsets: ["latin", "cyrillic"], weight: ["700", "800", "900"], display: "swap", variable: "--dm-nunito" });
export const metadata: Metadata = {
  title: "Именное видеопоздравление Деда Мороза | Мишаня в Стране Чудес",
  description: "Дед Мороз поздравит ваших детей по имени и покажет фотографии семьи в волшебной книге.",
  robots: { index: false, follow: false },
};
export default function GreetingLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ru" className={nunito.variable}><body className="dm">{children}</body></html>;
}
