import type { Locale } from "@/lib/i18n";
import { READY_QUEST_PRICES } from "@/data/quest-pricing";

export type QuestCategory = "kids" | "performance" | "excursion" | "adults";
type Text = Record<Locale, string>;
type Range = readonly [number, number];

export type Quest = {
  id: string;
  category: QuestCategory;
  title: Text;
  description: Text;
  age: Range | number;
  minutes: Range | number | null;
  players: Range;
  hosts: Range | number;
  languages: ("ru" | "he" | "en")[];
  location?: Text;
};

// Checked against Quest Family's live cards on 01.11.2026.
// Detailed descriptions take precedence over previews for Neverland and Holon.
// Nespandia and Neve Tzedek list only the language shared by conflicting versions.
// Customer pricing follows Sergey's supplier price list received on 01.11.2026.
export const QUEST_PRICE_FROM = READY_QUEST_PRICES.tiers[0].amount;

export const QUESTS: Quest[] = [
  {
    id: "harry-potter", category: "kids",
    title: { ru: "Гарри Поттер: Спасите кристалл жизни Хагрида", he: "הארי פוטר: הצילו את קריסטל החיים של האגריד" },
    description: { ru: "Загадки Хогвартса, волшебные ключи и миссия по спасению кристалла.", he: "חידות מהוגוורטס, מפתחות קסומים ומשימה להצלת הקריסטל." },
    age: [7, 12], minutes: [90, 120], players: [6, 36], hosts: [1, 3], languages: ["ru", "he"],
    location: { ru: "Парк или двор", he: "פארק או חצר" },
  },
  {
    id: "time-travel", category: "kids",
    title: { ru: "Путешествие во времени", he: "מסע בזמן" },
    description: { ru: "Найдите профессора, потерявшегося среди разных эпох.", he: "מצאו את הפרופסור שאבד בין תקופות שונות." },
    age: [6, 12], minutes: [90, 120], players: [5, 40], hosts: [1, 5], languages: ["ru", "he"],
    location: { ru: "На улице", he: "בחוץ" },
  },
  {
    id: "brawl-stars", category: "kids",
    title: { ru: "Brawl Stars", he: "Brawl Stars" },
    description: { ru: "Кристаллы, кубики силы и видеозадания любимых героев.", he: "קריסטלים, קוביות כוח ומשימות וידאו מהדמויות האהובות." },
    age: [6, 12], minutes: [90, 120], players: [5, 40], hosts: [1, 5], languages: ["ru", "he"],
    location: { ru: "На улице", he: "בחוץ" },
  },
  {
    id: "among-us", category: "kids",
    title: { ru: "Among Us", he: "Among Us" },
    description: { ru: "Почините корабль раньше, чем вас настигнет Импостер.", he: "תקנו את החללית לפני שהאימפוסטר ישיג אתכם." },
    age: [6, 12], minutes: [90, 120], players: [5, 40], hosts: [1, 5], languages: ["ru", "he"],
  },
  {
    id: "around-the-world", category: "kids",
    title: { ru: "Путешествие вокруг света", he: "מסע סביב העולם" },
    description: { ru: "Паспорта, 8–10 стран и поиск потерянного багажа.", he: "דרכונים, 8–10 מדינות וחיפוש אחר המזוודות האבודות." },
    age: [6, 12], minutes: [90, 120], players: [5, 40], hosts: [1, 5], languages: ["ru", "he"],
  },
  {
    id: "neverland", category: "kids",
    title: { ru: "Обещанный Неверленд — побег из приюта", he: "ארץ לעולם לא המובטחת — הבריחה מבית היתומים" },
    description: { ru: "Разгадайте тайны приюта и помогите друзьям сбежать.", he: "פענחו את סודות בית היתומים ועזרו לחברים לברוח." },
    age: [12, 15], minutes: [90, 120], players: [5, 40], hosts: [1, 5], languages: ["ru", "he"],
  },
  {
    id: "pirates", category: "kids",
    title: { ru: "Пираты Карибского моря", he: "שודדי הקאריביים" },
    description: { ru: "Старинные карты, испытания и поиск пиратских сокровищ.", he: "מפות עתיקות, אתגרים וחיפוש אחר אוצרות פיראטים." },
    age: [6, 12], minutes: [90, 120], players: [5, 40], hosts: [1, 5], languages: ["ru", "he"],
  },
  {
    id: "animal-world", category: "kids",
    title: { ru: "В мире животных", he: "בעולם החיות" },
    description: { ru: "Загадки и головоломки о птицах и животных.", he: "חידות ואתגרי חשיבה על ציפורים ובעלי חיים." },
    age: [6, 12], minutes: [90, 120], players: [5, 40], hosts: [1, 5], languages: ["ru", "he"],
  },
  {
    id: "santa-traces", category: "kids",
    title: { ru: "Следы Санты и Деда Мороза", he: "עקבותיהם של סנטה ודד מורוז" },
    description: { ru: "По следам и подсказкам — к мешку новогодних подарков.", he: "בעקבות רמזים וסימנים בדרך לשק המתנות של השנה החדשה." },
    age: [6, 12], minutes: [90, 120], players: [5, 40], hosts: [1, 5], languages: ["ru", "he"],
  },
  {
    id: "detective-agency", category: "kids",
    title: { ru: "Детективное агентство ЮГ", he: "סוכנות הבלשים — גאונים צעירים" },
    description: { ru: "Украденный торт, улики, отпечатки и собственное расследование.", he: "עוגה שנגנבה, רמזים, טביעות אצבע וחקירה משלכם." },
    age: [7, 12], minutes: [90, 100], players: [1, 12], hosts: 1, languages: ["ru", "en"],
  },
  {
    id: "nespandia", category: "kids",
    title: { ru: "Спасти Неспандию", he: "להציל את נספנדיה" },
    description: { ru: "Мини-спектакль, три злодея и спасение сказочного короля.", he: "הצגה קטנה, שלושה נבלים והצלת המלך של ארץ האגדות." },
    age: [5, 8], minutes: 90, players: [5, 15], hosts: 2, languages: ["ru"],
    location: { ru: "Парк или помещение", he: "פארק או מקום סגור" },
  },
  {
    id: "forgotten-legends", category: "kids",
    title: { ru: "Остров Забытых Легенд", he: "אי האגדות הנשכחות" },
    description: { ru: "Исследуйте карту острова, древние шифры и испытания.", he: "גלו את מפת האי, פענחו צפנים עתיקים ועמדו באתגרים." },
    age: [7, 12], minutes: [90, 120], players: [6, 36], hosts: [1, 3], languages: ["ru", "en"],
    location: { ru: "Парк или помещение", he: "פארק או מקום סגור" },
  },
  {
    id: "fairy-tale-hotel", category: "performance",
    title: { ru: "Отель «Сказки кончились»", he: "מלון ״האגדות נגמרו״" },
    description: { ru: "Мрачные сказки братьев Гримм, тайные послания и сделки с управляющим отеля.", he: "אגדות אפלות של האחים גרים, מסרים סודיים ועסקאות עם מנהל המלון." },
    age: 12, minutes: 120, players: [6, 10], hosts: 1, languages: ["ru", "en"],
    location: { ru: "Помещение или улица", he: "בפנים או בחוץ" },
  },
  {
    id: "black-cat", category: "performance",
    title: { ru: "Кабаре «Чёрный кот»", he: "קברט ״החתול השחור״" },
    description: { ru: "Париж, 1893 год. Художники и заговорщики собираются в кабаре, где у каждого своя игра.", he: "פריז, 1893. אמנים וקושרים נפגשים בקברט, ולכל אחד משחק משלו." },
    age: 16, minutes: 150, players: [9, 21], hosts: 1, languages: ["ru", "en"],
    location: { ru: "Помещение или улица", he: "בפנים או בחוץ" },
  },
  {
    id: "double-bottom-house", category: "performance",
    title: { ru: "Дом с двойным дном", he: "הבית עם התחתית הכפולה" },
    description: { ru: "Викторианский детектив: особняк, призраки, аукцион украшений и скрытые мотивы гостей.", he: "תעלומה ויקטוריאנית: אחוזה, רוחות רפאים, מכירה פומבית של תכשיטים וכוונות נסתרות." },
    age: 12, minutes: 150, players: [9, 21], hosts: 1, languages: ["ru", "en"],
    location: { ru: "Помещение или улица", he: "בפנים או בחוץ" },
  },
  {
    id: "wizards-choice", category: "performance",
    title: { ru: "Выбор Волшебника", he: "בחירת הקוסם" },
    description: { ru: "Совет магов, исчезновение Мерлина и предсказание, которое превращает встречу в расследование.", he: "מועצת קוסמים, היעלמותו של מרלין ונבואה שהופכת את המפגש לחקירה." },
    age: 11, minutes: null, players: [11, 20], hosts: [1, 2], languages: ["ru", "en"],
    location: { ru: "Парк или помещение", he: "פארק או מקום סגור" },
  },
  {
    id: "neve-tzedek", category: "excursion",
    title: { ru: "Неве-Цедек: режим выживания", he: "נווה צדק: מצב הישרדות" },
    description: { ru: "Семьи основателей собирают ресурсы и строят дом. Аудиоэкскурсия и актёр на маршруте.", he: "משפחות המייסדים אוספות משאבים ובונות בית. סיור קולי ושחקן לאורך המסלול." },
    age: 7, minutes: 120, players: [5, 50], hosts: [1, 2], languages: ["ru"],
    location: { ru: "Неве-Цедек, Тель-Авив", he: "נווה צדק, תל אביב" },
  },
  {
    id: "american-dream", category: "excursion",
    title: { ru: "Американская мечта", he: "החלום האמריקאי" },
    description: { ru: "Подсказки ведут по Американской колонии и открывают истории её жителей.", he: "רמזים מובילים ברחבי המושבה האמריקאית וחושפים את סיפורי תושביה." },
    age: 7, minutes: 120, players: [5, 50], hosts: 1, languages: ["ru", "he"],
    location: { ru: "Американская колония, Тель-Авив", he: "המושבה האמריקאית, תל אביב" },
  },
  {
    id: "sarona", category: "excursion",
    title: { ru: "Темплеры — Сарона, которую мы не знаем", he: "הטמפלרים — שרונה שלא הכרנו" },
    description: { ru: "Изучайте здания и собирайте карту, ведущую через историю Сароны к кладу.", he: "חקרו מבנים והרכיבו מפה שמובילה דרך סיפורי שרונה אל האוצר." },
    age: 7, minutes: 120, players: [5, 50], hosts: 1, languages: ["ru", "he"],
    location: { ru: "Сарона, Тель-Авив", he: "שרונה, תל אביב" },
  },
  {
    id: "zodiac-jaffa", category: "excursion",
    title: { ru: "Зодиакальный Яффо", he: "יפו והמזלות" },
    description: { ru: "Улицы знаков зодиака, тайный шифр и собственная история древнего города.", he: "רחובות המזלות, צופן סודי וסיפור משלכם על העיר העתיקה." },
    age: 7, minutes: 120, players: [5, 50], hosts: 1, languages: ["ru", "he", "en"],
    location: { ru: "Старый Яффо", he: "יפו העתיקה" },
  },
  {
    id: "holon-story-parks", category: "excursion",
    title: { ru: "Парки сказок Холона", he: "גני הסיפור בחולון" },
    description: { ru: "Один из четырёх маршрутов через 5–8 парков: сказки, рисование карты и поиск клада.", he: "אחד מארבעה מסלולים בין 5–8 גנים: אגדות, ציור מפה וחיפוש אחר אוצר." },
    age: [7, 10], minutes: 120, players: [5, 50], hosts: 1, languages: ["ru", "he"],
    location: { ru: "Холон", he: "חולון" },
  },
  {
    id: "alco-quest", category: "adults",
    title: { ru: "Алко-квест", he: "אלקו-קווסט" },
    description: { ru: "Карта, загадки и спрятанные алкогольные станции. Маршрут под интересы компании.", he: "מפה, חידות ותחנות אלכוהול נסתרות. מסלול המותאם לתחומי העניין של הקבוצה." },
    age: 18, minutes: 150, players: [4, 25], hosts: 1, languages: ["ru", "he", "en"],
    location: { ru: "Город или парк", he: "בעיר או בפארק" },
  },
  {
    id: "tel-aviv-bars", category: "adults",
    title: { ru: "Квест по барам Тель-Авива", he: "קווסט בברים של תל אביב" },
    description: { ru: "Задания открывают следующий бар на маршруте из 3–5 заведений. В последнем — финальное испытание.", he: "משימות חושפות את הבר הבא במסלול של 3–5 מקומות. בבר האחרון מחכה אתגר הסיום." },
    age: 18, minutes: 150, players: [4, 25], hosts: 1, languages: ["ru", "he", "en"],
    location: { ru: "Тель-Авив", he: "תל אביב" },
  },
];

export const QUEST_CATEGORIES: { id: QuestCategory; title: Text; description: Text; color: string; tint: string }[] = [
  { id: "kids", title: { ru: "Детские квесты", he: "קווסטים לילדים" }, description: { ru: "Любимые миры, загадки и командные приключения для дня рождения.", he: "עולמות אהובים, חידות והרפתקאות קבוצתיות ליום ההולדת." }, color: "#6d43bb", tint: "#f3edff" },
  { id: "performance", title: { ru: "Квест-спектакли", he: "קווסטים עם משחקי תפקידים" }, description: { ru: "У каждого своя роль, секреты и цели. Историю создают ваши решения.", he: "לכל אחד תפקיד, סודות ומטרות. ההחלטות שלכם יוצרות את הסיפור." }, color: "#b64064", tint: "#fff0f4" },
  { id: "excursion", title: { ru: "Квест-экскурсии", he: "קווסטים וסיורים" }, description: { ru: "Откройте город через подсказки, истории и поиск сокровищ.", he: "גלו את העיר דרך רמזים, סיפורים וחיפוש אחר אוצרות." }, color: "#21745d", tint: "#eaf7ef" },
  { id: "adults", title: { ru: "Квесты для взрослых", he: "קווסטים למבוגרים" }, description: { ru: "Необычный вечер с друзьями, день рождения или праздник компании. 18+.", he: "ערב מיוחד עם חברים, יום הולדת או חגיגה לקבוצה. מגיל 18." }, color: "#b45e1c", tint: "#fff3e5" },
];

export const QUEST_COPY = {
  ru: {
    title: "Квесты", eyebrow: "Детям, семьям и взрослым", headline: "Праздник с сюжетом",
    intro: "Ищите подсказки, раскрывайте тайны и становитесь героями собственной истории. Выберите приключение для дня рождения, семейной прогулки или вечера с друзьями.",
    browse: "Выбрать квест", all: "Все квесты", inquiry: "Узнать стоимость", catalogue: "Выберите своё приключение",
    catalogueIntro: "От волшебных миров до городских маршрутов — найдите сюжет для своей компании.",
    age: "Возраст", minutes: "мин", duration: "Длительность", players: "Участники", hosts: "Ведущие", languages: "Языки", location: "Место", onRequest: "Уточним при заказе",
    customTitle: "Квест по вашему сценарию", customEyebrow: "Ваша идея — отдельная история",
    customDescription: "Хотите приключение о вашей семье, друзьях или любимом мире? Обсудим идею, сюжет и задания. Возраст, длительность, место и состав команды согласуем отдельно.",
    customFeatures: ["Индивидуальный сюжет", "Задания под вашу компанию", "Подготовка и проведение"],
    helper: "Не можете выбрать?", helperDescription: "Напишите город, дату, возраст и количество участников — поможем подобрать квест.",
    languageNames: { ru: "Русский", he: "Иврит", en: "Английский" },
    metadata: "Квесты для детей, семей и взрослых в Израиле: сюжетные игры, квест-спектакли и городские квест-экскурсии. Выберите программу и узнайте стоимость.",
  },
  he: {
    title: "קווסטים", eyebrow: "לילדים, למשפחות ולמבוגרים", headline: "חגיגה עם עלילה",
    intro: "חפשו רמזים, פענחו תעלומות והפכו לגיבורים של הסיפור שלכם. בחרו הרפתקה ליום הולדת, לבילוי משפחתי או לערב עם חברים.",
    browse: "לבחירת קווסט", all: "כל הקווסטים", inquiry: "לבירור מחיר", catalogue: "בחרו את ההרפתקה שלכם",
    catalogueIntro: "מעולמות קסומים ועד מסלולים בעיר — מצאו את הסיפור המתאים לקבוצה שלכם.",
    age: "גיל", minutes: "דקות", duration: "משך הפעילות", players: "משתתפים", hosts: "מנחים", languages: "שפות", location: "מיקום", onRequest: "נתאם בעת ההזמנה",
    customTitle: "קווסט לפי התסריט שלכם", customEyebrow: "הרעיון שלכם — סיפור ייחודי",
    customDescription: "רוצים הרפתקה על המשפחה, החברים או העולם האהוב עליכם? נדבר על הרעיון, העלילה והמשימות. הגיל, המשך, המקום והרכב הצוות יתואמו בנפרד.",
    customFeatures: ["עלילה אישית", "משימות שמתאימות לקבוצה", "הכנה והנחיה"],
    helper: "מתלבטים במה לבחור?", helperDescription: "כתבו לנו עיר, תאריך, גיל ומספר משתתפים — ונעזור לבחור קווסט.",
    languageNames: { ru: "רוסית", he: "עברית", en: "אנגלית" },
    metadata: "קווסטים לילדים, למשפחות ולמבוגרים בישראל: משחקי הרפתקאות, משחקי תפקידים וסיורים בעיר. בחרו תוכנית ופנו לבירור מחיר.",
  },
};

export function getQuestsForAge(age?: number): Quest[] {
  if (age === undefined || !Number.isInteger(age) || age < 1 || age > 120) return [];
  return QUESTS.filter((quest) => typeof quest.age === "number"
    ? age >= quest.age
    : age >= quest.age[0] && age <= quest.age[1]);
}

export function questInquiryMessage(locale: Locale, title?: string, age?: number): string {
  const ageLabel = age === undefined ? "" : age >= 18 ? "18+" : String(age);
  return locale === "he"
    ? ["שלום! אשמח לברר מחיר לקווסט.", ...(title ? [`קווסט: ${title}`] : []), "עיר:", "תאריך:", `גיל המשתתפים: ${ageLabel}`, "מספר משתתפים:"].join("\n")
    : ["Здравствуйте! Хочу узнать стоимость квеста.", ...(title ? [`Квест: ${title}`] : []), "Город:", "Дата:", `Возраст участников: ${ageLabel}`, "Количество участников:"].join("\n");
}
