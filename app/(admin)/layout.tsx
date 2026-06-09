import type { Metadata } from "next";
import {
  RootDocument,
  viewport as rootViewport,
} from "@/app/RootDocument";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport = rootViewport;

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument locale="ru">{children}</RootDocument>;
}
