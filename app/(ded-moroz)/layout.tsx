import type { Metadata } from "next";
import "../site-fonts.css";
import "./greeting.css";

export const metadata: Metadata = {
  title: "Именное видеопоздравление Деда Мороза | Мишаня в Стране Чудес",
  description: "Дед Мороз поздравит ваших детей по имени и покажет фотографии семьи в волшебной книге.",
  robots: { index: false, follow: false },
};
export default function GreetingLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ru"><body className="dm">{children}</body></html>;
}
