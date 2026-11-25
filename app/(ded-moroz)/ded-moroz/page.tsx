import { greetingOrderPath } from "@/data/new-year";

export default function Page() {
  return <>
    <meta httpEquiv="refresh" content={`0;url=${greetingOrderPath}`} />
    <a href={greetingOrderPath}>Перейти к видеопоздравлению от Деда Мороза</a>
  </>;
}
