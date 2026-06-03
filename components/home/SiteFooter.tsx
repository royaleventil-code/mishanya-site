import Image from "next/image";
import Link from "next/link";
import { WA_DISPLAY, WA_MESSAGES, whatsappLink } from "@/lib/whatsapp";

export function SiteFooter() {
  return (
    <footer className="bg-[#0f0f14] px-5 pb-28 pt-12 text-white sm:px-6 md:pb-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <Image
            src="/logo-ru.png"
            alt="Мишаня в Стране Чудес"
            width={200}
            height={100}
            className="h-16 w-auto"
          />
          <p className="mt-3 text-sm leading-6 text-white/60">
            Детские праздники и шоу по всему Израилю. Нас также ищут как Михаил в Стране Чудес
            или просто Страна Чудес.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="font-black text-white/90">Контакты</div>
          <a
            href={whatsappLink(WA_MESSAGES.default)}
            target="_blank"
            rel="noreferrer"
            className="text-white/70 transition hover:text-white"
          >
            WhatsApp {WA_DISPLAY}
          </a>
          <a href="mailto:royal.eventil@gmail.com" className="text-white/70 transition hover:text-white">
            royal.eventil@gmail.com
          </a>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="font-black text-white/90">Соцсети</div>
          <a
            href="https://www.instagram.com/show.mishanya/"
            target="_blank"
            rel="noreferrer"
            className="text-white/70 transition hover:text-white"
          >
            Instagram
          </a>
          <a
            href="https://www.facebook.com/royaleventisrael/"
            target="_blank"
            rel="noreferrer"
            className="text-white/70 transition hover:text-white"
          >
            Facebook
          </a>
          <a
            href="https://www.youtube.com/channel/UCo189jVSku-2H_0Rgrw9JCw"
            target="_blank"
            rel="noreferrer"
            className="text-white/70 transition hover:text-white"
          >
            YouTube
          </a>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="font-black text-white/90">Сайт</div>
          <Link href="/ru/all" className="text-white/70 transition hover:text-white">
            Программы
          </Link>
          <Link href="/gallery" className="text-white/70 transition hover:text-white">
            Фото и видео
          </Link>
          <Link href="/about" className="text-white/70 transition hover:text-white">
            О нас
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-6 text-xs text-white/40">
        © 2026 Мишаня в Стране Чудес · Royal Event Israel
      </div>
    </footer>
  );
}
