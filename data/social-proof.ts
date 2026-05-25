export type ProofImage = {
  src: string;
  alt: string;
};

export type ProofLink = {
  label: string;
  href?: string;
};

export type ProofHotspot = ProofLink & {
  rect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};

export type ProofLinkImage = ProofImage & {
  links?: ProofLink[];
  hotspots?: ProofHotspot[];
};

export const SOCIAL_LINKS: ProofLink[] = [
  { label: "Instagram", href: "https://www.instagram.com/show.mishanya/" },
  { label: "Facebook", href: "https://www.facebook.com/royaleventisrael/" },
  { label: "YouTube", href: "https://www.youtube.com/channel/UCo189jVSku-2H_0Rgrw9JCw" },
  { label: "Наш сайт" },
];

export const KIDS_1_3_PROOF = {
  gallery: [
    { src: "/proof/kids-1-3/page-09.webp", alt: "Фото с праздников для малышей 1-3 года" },
    { src: "/proof/kids-1-3/page-10.webp", alt: "Коллаж фотографий с детских праздников" },
    { src: "/proof/kids-1-3/page-11.webp", alt: "Фото с персонажами, конфетти и танцами" },
    { src: "/proof/kids-1-3/page-12.webp", alt: "Фото с аниматорами и детьми на праздниках" },
    { src: "/proof/kids-1-3/page-13.webp", alt: "Фото шоу-программы на детском празднике" },
    { src: "/proof/kids-1-3/page-14.webp", alt: "Фото ростовых кукол и активностей на праздниках" },
  ],
  reviews: [
    { src: "/proof/kids-1-3/page-15.webp", alt: "Отзывы родителей о праздниках Страны Чудес" },
    { src: "/proof/kids-1-3/page-16.webp", alt: "Отзывы клиентов о детских праздниках" },
    {
      src: "/proof/kids-1-3/page-17.webp",
      alt: "Отзывы родителей и ссылка на все отзывы",
      hotspots: [
        {
          label: "Все отзывы на Facebook",
          href: "https://www.facebook.com/royaleventisrael/reviews/?id=100064180173364&sk=reviews",
          rect: { left: 0, top: 85.7, width: 100, height: 14.3 },
        },
      ],
    },
  ],
  media: [
    {
      src: "/proof/kids-1-3/page-18.webp",
      alt: "Видео с детских праздников",
      hotspots: [
        {
          label: "Лучшие детские праздники в Израиле на YouTube",
          href: "https://www.youtube.com/watch?v=Kh6AZUa_uks",
          rect: { left: 5.8, top: 13.5, width: 88.4, height: 28 },
        },
        {
          label: "Маша и Медведь на YouTube",
          href: "https://www.youtube.com/watch?v=m3XfC5tYpv8",
          rect: { left: 5.8, top: 45.5, width: 88.4, height: 28 },
        },
        {
          label: "Праздники для самых маленьких на YouTube",
          href: "https://www.youtube.com/watch?v=vAyBfqBMTZY",
          rect: { left: 5.8, top: 77, width: 88.4, height: 23 },
        },
      ],
    },
  ],
};
