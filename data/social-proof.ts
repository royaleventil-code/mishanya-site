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

export type ProofSet = {
  gallery: ProofImage[];
  reviews: ProofLinkImage[];
  media: ProofLinkImage[];
};

export const SOCIAL_LINKS: ProofLink[] = [
  { label: "Instagram", href: "https://www.instagram.com/show.mishanya/" },
  { label: "Facebook", href: "https://www.facebook.com/royaleventisrael/" },
  { label: "YouTube", href: "https://www.youtube.com/channel/UCo189jVSku-2H_0Rgrw9JCw" },
  { label: "Наш сайт" },
];

export const KIDS_1_3_PROOF: ProofSet = {
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

export const BOYS_6_10_PROOF: ProofSet = {
  gallery: [
    { src: "/proof/boys-6-10/page-11.webp", alt: "Фото с праздников для мальчиков 6-10 лет" },
    { src: "/proof/boys-6-10/page-12.webp", alt: "Командные игры и герои на праздниках для мальчиков" },
    { src: "/proof/boys-6-10/page-13.webp", alt: "Тесла шоу, неоновое шоу и шоу трансформеров" },
    { src: "/proof/boys-6-10/page-14.webp", alt: "Вынос торта, герои и дискотека на празднике" },
    { src: "/proof/boys-6-10/page-15.webp", alt: "Фото с ростовыми куклами и активностями для детей" },
  ],
  reviews: [
    { src: "/proof/boys-6-10/page-16.webp", alt: "Отзывы родителей о праздниках для мальчиков 6-10 лет" },
    { src: "/proof/boys-6-10/page-17.webp", alt: "Отзывы клиентов о праздниках Страны Чудес" },
    {
      src: "/proof/boys-6-10/page-18.webp",
      alt: "Отзывы родителей и ссылка на все отзывы",
      hotspots: [
        {
          label: "Все отзывы на Facebook",
          href: "https://www.facebook.com/royaleventisrael/reviews/?ref=page_internal",
          rect: { left: 0, top: 85.5, width: 100, height: 14.5 },
        },
      ],
    },
  ],
  media: [
    {
      src: "/proof/boys-6-10/page-19.webp",
      alt: "Видео с праздников для мальчиков 6-10 лет",
      hotspots: [
        {
          label: "Лучшие детские праздники в Израиле на YouTube",
          href: "https://youtu.be/Kh6AZUa_uks",
          rect: { left: 5.3, top: 15.8, width: 90.9, height: 23.8 },
        },
        {
          label: "Шоу трансформеров на празднике",
          href: "https://youtu.be/ZlYyaCGYWFk",
          rect: { left: 10.5, top: 45.7, width: 79.4, height: 22.1 },
        },
        {
          label: "Фокусник и Спайдермен на дне рождения",
          href: "https://www.youtube.com/watch?v=Jgx0YZekOno",
          rect: { left: 6.2, top: 73, width: 89.4, height: 26.2 },
        },
      ],
    },
  ],
};

export const BOYS_4_5_PROOF: ProofSet = {
  gallery: [
    { src: "/proof/boys-4-5/page-10.webp", alt: "Фото с праздников для мальчиков 4-5 лет" },
    { src: "/proof/boys-4-5/page-11.webp", alt: "Фото с фокусником, героями и ростовыми куклами" },
    { src: "/proof/boys-4-5/page-12.webp", alt: "Неоновое шоу и шоу трансформеров на празднике" },
    { src: "/proof/boys-4-5/page-13.webp", alt: "Игры, супергерои и активная программа для мальчиков" },
    { src: "/proof/boys-4-5/page-14.webp", alt: "Железный человек, шоу мыльных пузырей и трансформеры" },
    { src: "/proof/boys-4-5/page-15.webp", alt: "Пикачу, зайка и шоу мыльных пузырей для детей" },
  ],
  reviews: [
    {
      src: "/proof/boys-4-5/page-16.webp",
      alt: "Отзывы родителей о праздниках для мальчиков 4-5 лет",
      links: [
        {
          label: "Все отзывы на Facebook",
          href: "https://www.facebook.com/royaleventisrael/reviews/?ref=page_internal",
        },
      ],
    },
    {
      src: "/proof/boys-4-5/page-17.webp",
      alt: "Отзывы клиентов о праздниках Страны Чудес для мальчиков",
      links: [
        {
          label: "Все отзывы на Facebook",
          href: "https://www.facebook.com/royaleventisrael/reviews/?ref=page_internal",
        },
      ],
    },
    {
      src: "/proof/boys-4-5/page-18.webp",
      alt: "Отзывы родителей и ссылка на все отзывы",
      hotspots: [
        {
          label: "Все отзывы на Facebook",
          href: "https://www.facebook.com/royaleventisrael/reviews/?ref=page_internal",
          rect: { left: 0.5, top: 88.1, width: 99.5, height: 11.9 },
        },
      ],
    },
  ],
  media: [
    {
      src: "/proof/boys-4-5/page-19.webp",
      alt: "Видео с праздников для мальчиков 4-5 лет",
      hotspots: [
        {
          label: "Лучшие детские праздники в Израиле на YouTube",
          href: "https://youtu.be/Kh6AZUa_uks",
          rect: { left: 6.4, top: 15.6, width: 88.8, height: 24.9 },
        },
        {
          label: "Фокусник и Спайдермен на дне рождения",
          href: "https://www.youtube.com/watch?v=Jgx0YZekOno",
          rect: { left: 6.3, top: 43.9, width: 88.8, height: 25.3 },
        },
        {
          label: "Шоу трансформеров на праздник",
          href: "https://youtu.be/5KqewOsv5qs",
          rect: { left: 8.4, top: 73.4, width: 83.7, height: 24.8 },
        },
      ],
    },
  ],
};

export const GIRLS_4_6_PROOF: ProofSet = {
  gallery: [
    { src: "/proof/girls-4-6/page-11.webp", alt: "Фото с праздников для девочек 4-6 лет с единорожкой и ЛОЛ" },
    { src: "/proof/girls-4-6/page-12.webp", alt: "Фото с праздников для девочек 4-6 лет" },
    { src: "/proof/girls-4-6/page-13.webp", alt: "Неоновое шоу и световые эффекты на празднике" },
    { src: "/proof/girls-4-6/page-14.webp", alt: "Игры, ростовые куклы и танцы на празднике для девочек" },
    { src: "/proof/girls-4-6/page-15.webp", alt: "Микки Маус, шоу мыльных пузырей и ЛОЛ на празднике" },
    { src: "/proof/girls-4-6/page-16.webp", alt: "Пикачу, зайка и шоу мыльных пузырей для детей" },
  ],
  reviews: [
    {
      src: "/proof/girls-4-6/page-17.webp",
      alt: "Отзывы родителей о праздниках для девочек 4-6 лет",
      links: [
        {
          label: "Все отзывы на Facebook",
          href: "https://www.facebook.com/royaleventisrael/reviews/?ref=page_internal",
        },
      ],
    },
    {
      src: "/proof/girls-4-6/page-18.webp",
      alt: "Отзывы клиентов о праздниках Страны Чудес для девочек",
      links: [
        {
          label: "Все отзывы на Facebook",
          href: "https://www.facebook.com/royaleventisrael/reviews/?ref=page_internal",
        },
      ],
    },
    {
      src: "/proof/girls-4-6/page-19.webp",
      alt: "Отзывы родителей и ссылка на все отзывы",
      hotspots: [
        {
          label: "Все отзывы на Facebook",
          href: "https://www.facebook.com/royaleventisrael/reviews/?ref=page_internal",
          rect: { left: 0, top: 86.1, width: 100, height: 13.9 },
        },
      ],
    },
  ],
  media: [
    {
      src: "/proof/girls-4-6/page-20.webp",
      alt: "Видео с праздников для девочек 4-6 лет",
      hotspots: [
        {
          label: "Лучшие детские праздники в Израиле на YouTube",
          href: "https://youtu.be/Kh6AZUa_uks",
          rect: { left: 5, top: 15.4, width: 92.5, height: 24 },
        },
        {
          label: "День рождения для принцессы на YouTube",
          href: "https://youtu.be/ddiZzQ2XfUM",
          rect: { left: 7.1, top: 44.5, width: 89.2, height: 24.2 },
        },
        {
          label: "Праздник в стиле куклы ЛОЛ на YouTube",
          href: "https://youtu.be/WIZTyyLQZWA",
          rect: { left: 6.4, top: 73.3, width: 91.4, height: 25.8 },
        },
      ],
    },
  ],
};

export const GIRLS_7_10_PROOF: ProofSet = {
  gallery: [
    { src: "/proof/girls-7-10/page-12.webp", alt: "Фото с праздников для девочек 7-10 лет" },
    { src: "/proof/girls-7-10/page-13.webp", alt: "Фото программ и героев на праздниках для девочек" },
    { src: "/proof/girls-7-10/page-14.webp", alt: "Неоновое шоу и Микки Маус на детском празднике" },
    { src: "/proof/girls-7-10/page-15.webp", alt: "Вынос торта, фокусник и дискотека для девочек" },
    { src: "/proof/girls-7-10/page-16.webp", alt: "Пикачу, зайка и шоу мыльных пузырей для детей" },
  ],
  reviews: [
    {
      src: "/proof/girls-7-10/page-17.webp",
      alt: "Отзывы родителей о праздниках для девочек 7-10 лет",
      links: [
        {
          label: "Все отзывы на Facebook",
          href: "https://www.facebook.com/royaleventisrael/reviews/?ref=page_internal",
        },
      ],
    },
    {
      src: "/proof/girls-7-10/page-18.webp",
      alt: "Отзывы клиентов о праздниках Страны Чудес для девочек",
      links: [
        {
          label: "Все отзывы на Facebook",
          href: "https://www.facebook.com/royaleventisrael/reviews/?ref=page_internal",
        },
      ],
    },
    {
      src: "/proof/girls-7-10/page-19.webp",
      alt: "Отзывы родителей и ссылка на все отзывы",
      hotspots: [
        {
          label: "Все отзывы на Facebook",
          href: "https://www.facebook.com/royaleventisrael/reviews/?ref=page_internal",
          rect: { left: 0, top: 88.9, width: 100, height: 11.1 },
        },
      ],
    },
  ],
  media: [
    {
      src: "/proof/girls-7-10/page-20.webp",
      alt: "Видео с праздников для девочек 7-10 лет",
      hotspots: [
        {
          label: "Лучшие детские праздники в Израиле на YouTube",
          href: "https://youtu.be/Kh6AZUa_uks",
          rect: { left: 6.2, top: 16.8, width: 88.5, height: 23 },
        },
        {
          label: "Фокусник-иллюзионист на YouTube",
          href: "https://youtu.be/fTI9WY4EUX8",
          rect: { left: 6.7, top: 45.7, width: 88, height: 21.6 },
        },
        {
          label: "Праздник в стиле куклы ЛОЛ на YouTube",
          href: "https://youtu.be/WIZTyyLQZWA",
          rect: { left: 10, top: 73.7, width: 80.4, height: 25.4 },
        },
      ],
    },
  ],
};
