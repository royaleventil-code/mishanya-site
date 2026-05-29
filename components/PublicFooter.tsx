import Link from "next/link";
import { WA_DISPLAY } from "@/lib/whatsapp";

const LINKS = [
  { href: "/about", label: "О нас" },
  { href: "/formats", label: "Форматы" },
  { href: "/programs", label: "Программы" },
  { href: "/gallery", label: "Фото и отзывы" },
  { href: "/contacts", label: "Контакты" },
];

export function PublicFooter() {
  return (
    <footer className="bg-[#111318] px-5 py-8 text-white sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="text-lg font-black">Мишаня в Стране Чудес</div>
          <div className="mt-1 text-sm text-white/60">
            Детские праздники, шоу и персонажи в Израиле
          </div>
          <div className="mt-3 text-sm font-bold text-white/82">{WA_DISPLAY}</div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-white/72 md:justify-end">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
