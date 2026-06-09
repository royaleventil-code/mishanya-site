import {
  RootDocument,
  createRootMetadata,
  viewport as rootViewport,
} from "@/app/RootDocument";

export const metadata = createRootMetadata("ru");
export const viewport = rootViewport;

export default function LegacyLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument locale="ru">{children}</RootDocument>;
}
