import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Мишаня в Стране Чудес - детские праздники в Израиле",
    short_name: "Мишаня",
    description:
      "Детские праздники и дни рождения в Израиле: аниматоры, шоу-программы, 80+ героев.",
    start_url: "/",
    display: "browser",
    background_color: "#fffaf4",
    theme_color: "#fafafa",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
