import type { Metadata } from "next";
import {
  RootDocument,
  viewport as rootViewport,
} from "@/app/RootDocument";

export const metadata: Metadata = {
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

export default function GiftRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootDocument
      locale="ru"
      showFloatingWhatsApp={false}
      showAccessibilityWidget={false}
    >
      {children}
    </RootDocument>
  );
}
