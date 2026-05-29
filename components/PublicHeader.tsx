import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { WA_MESSAGES, whatsappLink } from "@/lib/whatsapp";

const NAV = [
  { href: "/about", label: "О нас" },
  { href: "/formats", label: "Форматы" },
  { href: "/programs", label: "Программы" },
  { href: "/gallery", label: "Фото" },
  { href: "/contacts", label: "Контакты" },
];

export function PublicHeader({ theme = "light" }: { theme?: "light" | "dark" }) {
  const isDark = theme === "dark";

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md ${
        isDark
          ? "border-white/15 bg-zinc-950/78 text-white"
          : "border-[var(--color-line)] bg-[#fffaf4]/88 text-[var(--color-ink)]"
      }`}
    >
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link href="/" aria-label="Мишаня в Стране Чудес" className="flex items-center">
          <Image
            src="/logo-ru.png"
            alt="Мишаня в Стране Чудес"
            width={180}
            height={92}
            className="h-20 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-bold md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isDark ? "text-white/78 hover:text-white" : "text-zinc-700 hover:text-zinc-950"}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <a
          href={whatsappLink(WA_MESSAGES.default)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-4 py-2.5 text-sm font-bold text-white shadow-lg transition active:scale-95"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={2.4} />
          WhatsApp
        </a>
      </div>
    </header>
  );
}
