import { WA_DISPLAY } from "@/lib/whatsapp";

export function Footer() {
  return (
    <footer className="mx-auto max-w-3xl px-5 sm:px-6 pt-0 pb-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-ru.png"
        alt="Мишаня в Стране Чудес"
        className="mx-auto h-40 w-auto"
      />
      <a
        href="tel:+972546163260"
        className="-mt-1 inline-block text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
      >
        {WA_DISPLAY}
      </a>
      <div className="mt-4 flex justify-center gap-5 text-[var(--color-ink-soft)]">
        <a
          href="https://instagram.com/show.mishanya"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm hover:text-[var(--color-ink)]"
        >
          Instagram
        </a>
        <span className="opacity-30">·</span>
        <a
          href="https://facebook.com/royaleventisrael"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm hover:text-[var(--color-ink)]"
        >
          Facebook
        </a>
        <span className="opacity-30">·</span>
        <a
          href="https://wa.me/972546163260"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm hover:text-[var(--color-ink)]"
        >
          WhatsApp
        </a>
      </div>
      <div className="mt-6 text-xs text-[var(--color-ink-soft)]/70">
        © {new Date().getFullYear()} Royal Event Israel
      </div>
    </footer>
  );
}
