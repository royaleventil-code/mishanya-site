import type { Locale } from "@/lib/i18n";

/**
 * Общая библиотека роликов с YouTube-канала «Мишаня в Стране Чудес»
 * (@RoyalEvent). Один источник для всех страниц событий - страница
 * подключает ролики по id через EVENT_VIDEO_SETS, порядок задаётся там.
 *
 * Заголовки здесь НЕ копия ютубовских (те перегружены ключевиками) -
 * это подписи под виджет на сайте. Описания написаны по факту кадра.
 *
 * ⚠️ Ролики канала мультиков «Mishanya in Wonderland» сюда НЕ добавлять:
 * у них запрещён эмбед (см. data/videos.ts).
 */
export type EventVideo = {
  id: string;
  /** ID ролика на YouTube (для RU; для локали с отдельной озвучкой - videoIdByLocale) */
  videoId: string;
  /**
   * Свой ID для конкретного языка: у промо-ролика мицвы есть русская
   * и ивритская озвучка, и на /he нельзя показывать русскую.
   */
  videoIdByLocale?: Partial<Record<Locale, string>>;
  /** portrait = вертикальный Shorts (9:16), landscape = обычный (16:9) */
  orientation: "landscape" | "portrait";
  /** Длительность в секундах - для бейджа и duration в VideoObject */
  durationSeconds: number;
  /** Дата загрузки на YouTube (ISO YYYY-MM-DD) - uploadDate в VideoObject */
  uploadDate: string;
  /**
   * false = владелец запретил встраивание (YouTube error 150). Такой ролик
   * показываем карточкой-ссылкой на youtube.com, а не iframe - иначе на месте
   * плеера будет «Ошибка 153».
   * Все ролики набора проверены плеером YouTube 23.08.2026: эмбед разрешён.
   * У «Фокусника» и «Цирка» галка была снята - включили в YouTube Studio
   * (видео → Показать дополнительные настройки → «Разрешить встраивание видео»).
   * Новый ролик перед добавлением проверять так же: запрет виден только в плеере.
   */
  embeddable: boolean;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
};

export const EVENT_VIDEOS: readonly EventVideo[] = [
  {
    id: "mascots-welcome",
    videoId: "5KqewOsv5qs",
    orientation: "landscape",
    durationSeconds: 47,
    uploadDate: "2019-06-12",
    embeddable: true,
    title: {
      ru: "Ростовые куклы встречают гостей",
      he: "בובות ענק מקבלות את פני האורחים",
    },
    description: {
      ru: "Железный человек и Бамблби встречают детей на красной дорожке у входа. Праздник начинается ещё до того, как гости зашли в зал.",
      he: "איירון מן ובאמבלבי מקבלים את הילדים על השטיח האדום בכניסה. החגיגה מתחילה עוד לפני שהאורחים נכנסו לאולם.",
    },
  },
  {
    id: "magician",
    videoId: "fTI9WY4EUX8",
    orientation: "landscape",
    durationSeconds: 50,
    uploadDate: "2021-04-03",
    embeddable: true,
    title: {
      ru: "Фокусник-иллюзионист",
      he: "קוסם ואמן אחיזת עיניים",
    },
    description: {
      ru: "Чемпион Израиля по сценической магии и член международного братства магов. Работает и вблизи за столами, и полным номером на публику - в волшебство верят даже взрослые.",
      he: "אלוף ישראל בקסמי במה וחבר באגודת הקוסמים הבינלאומית. עובד גם קרוב ליד השולחנות וגם במופע מלא לקהל - בקסם מאמינים גם המבוגרים.",
    },
  },
  {
    id: "chemistry-show",
    videoId: "Vwwf4WyNFK8",
    orientation: "landscape",
    durationSeconds: 104,
    uploadDate: "2023-03-21",
    embeddable: true,
    title: {
      ru: "Химическое шоу",
      he: "שואו כימי",
    },
    description: {
      ru: "Сумасшедший профессор, облака пара и опыты, от которых зал ахает. Дети стоят вплотную и участвуют сами.",
      he: "הפרופסור המטורף, ענני אדים וניסויים שגורמים לאולם לפעור פה. הילדים עומדים ממש קרוב ומשתתפים בעצמם.",
    },
  },
  {
    id: "bubbles-show",
    videoId: "Kyi47A5SwBY",
    orientation: "landscape",
    durationSeconds: 79,
    uploadDate: "2023-02-20",
    embeddable: true,
    title: {
      ru: "Шоу мыльных пузырей",
      he: "שואו בועות סבון",
    },
    description: {
      ru: "Гигантские пузыри, пузырь вокруг ребёнка и дым внутри пузыря. Самый фотогеничный номер - родители снимают его целиком.",
      he: "בועות ענק, בועה מסביב לילד ועשן בתוך הבועה. המספר הכי פוטוגני - ההורים מצלמים אותו מההתחלה ועד הסוף.",
    },
  },
  {
    id: "circus-poodles",
    videoId: "-068BNFEHH0",
    orientation: "landscape",
    durationSeconds: 48,
    uploadDate: "2019-09-27",
    embeddable: true,
    title: {
      ru: "Цирк на дом: королевские пудели",
      he: "קרקס עד הבית: פודלים מלכותיים",
    },
    description: {
      ru: "Настоящие цирковые номера с дрессированными собаками, клоунами и акробатами - прямо на вашей площадке.",
      he: "מספרי קרקס אמיתיים עם כלבים מאולפים, ליצנים ואקרובטים - ישר אצלכם באירוע.",
    },
  },
  {
    id: "mitzvah-full",
    videoId: "5w_Jht9SXTA",
    videoIdByLocale: { he: "G1DoR-uiSbo" },
    orientation: "landscape",
    durationSeconds: 150,
    uploadDate: "2023-06-11",
    embeddable: true,
    title: {
      ru: "Бар и бат мицва в Израиле",
      he: "בר מצווה ובת מצווה בישראל",
    },
    description: {
      ru: "Полный ролик с бат-мицвы: стена из пайеток, неоновая вывеска, ростовая кукла Marshmello и танцы с гостями.",
      he: "סרטון מלא מבת מצווה: קיר פאייטים, שלט ניאון, בובת ענק של מארשמלו וריקודים עם האורחים.",
    },
  },
  {
    id: "mitzvah-chair",
    videoId: "1qsfzNdcLOw",
    orientation: "portrait",
    durationSeconds: 44,
    uploadDate: "2024-12-04",
    embeddable: true,
    title: {
      ru: "Поднятие на стуле",
      he: "הרמה על כיסא",
    },
    description: {
      ru: "Тот самый момент: именинника поднимают на стуле, зал в дыму и свете, диджей заводит гостей.",
      he: "בדיוק הרגע הזה: מרימים את חתן השמחה על כיסא, האולם מלא עשן ותאורה, והתקליטן מרים את הקהל.",
    },
  },
  {
    id: "mitzvah-reaction",
    videoId: "u3JPJgb8inU",
    orientation: "portrait",
    durationSeconds: 29,
    uploadDate: "2025-09-30",
    embeddable: true,
    title: {
      ru: "Реакция на сюрприз",
      he: "התגובה להפתעה",
    },
    description: {
      ru: "Девочка входит в зал и не может поверить, подруги снимают всё на телефоны. Ради таких кадров всё и делается.",
      he: "הבת נכנסת לאולם ולא מאמינה, והחברות מצלמות הכול בטלפונים. בשביל הרגעים האלה עושים את הכול.",
    },
  },
] as const;

/**
 * Порядок роликов на каждой странице. Чтобы поменять набор или очерёдность -
 * правим только эти массивы, компонент и данные не трогаем.
 *
 * На /brit-mila отдельного блока видео нет - ролики стоят прямо в карточках
 * опций (BRIT_MILA_OPTION_MEDIA), чтобы не показывать одно и то же дважды.
 */
export const EVENT_VIDEO_SETS = {
  // mitzvah-full здесь нет: этот ролик стоит в шапке страницы, в галерее был бы дублем
  "bar-mitzvah": [
    "mitzvah-chair",
    "mitzvah-reaction",
    "magician",
    "chemistry-show",
    "bubbles-show",
    "circus-poodles",
    "mascots-welcome",
  ],
} as const satisfies Record<string, readonly string[]>;

/** Ролики набора в заданном порядке; неизвестные id молча пропускаем */
export function getEventVideos(setId: keyof typeof EVENT_VIDEO_SETS): EventVideo[] {
  return EVENT_VIDEO_SETS[setId]
    .map((id) => EVENT_VIDEOS.find((video) => video.id === id))
    .filter((video): video is EventVideo => Boolean(video));
}

/** ID ролика на языке страницы: с ивритской озвучкой, если она есть */
export function resolveVideoId(video: EventVideo, locale: Locale): string {
  return video.videoIdByLocale?.[locale] ?? video.videoId;
}

/** Прямая ссылка на просмотр - для роликов с запрещённым эмбедом */
export function videoWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** Подпись под карточкой, которая уводит на YouTube вместо встроенного плеера */
export const WATCH_ON_YOUTUBE: Record<Locale, string> = {
  ru: "Смотреть на YouTube",
  he: "לצפייה ביוטיוב",
};

/** «0:47» / «2:30» - бейдж длительности на превью */
export function formatVideoDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/** ISO 8601 для VideoObject.duration: 104 → «PT1M44S» */
export function isoVideoDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `PT${minutes > 0 ? `${minutes}M` : ""}${rest}S`;
}
