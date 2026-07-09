import { filterPrograms } from "@/lib/filtering";
import type { Locale } from "@/lib/i18n";
import { getLocalizedPrograms, hasProgramCopy } from "@/lib/localized-data";
import type { Gender, Program } from "@/lib/types";

// ---------------------------------------------------------------------------
// Гайд «как выбрать программу» + FAQ для возрастных страниц /{boy|girl}/{1-10}.
// Тексты собираются из шаблонов по возрастным полосам, а названия программ,
// цены и лимиты гостей подставляются из живого каталога (PROGRAMS) —
// при изменении каталога тексты обновятся сами.
// ---------------------------------------------------------------------------

export type AgeGuideFaqItem = { q: string; a: string };

export type AgeGuideData = {
  guideTitle: string;
  guide: string;
  faqTitle: string;
  faq: AgeGuideFaqItem[];
};

type AgeBand = "1-2" | "3-4" | "5-6" | "7-8" | "9-10";

function bandOf(age: number): AgeBand {
  if (age <= 2) return "1-2";
  if (age <= 4) return "3-4";
  if (age <= 6) return "5-6";
  if (age <= 8) return "7-8";
  return "9-10";
}

// Видимые программы страницы «{пол} {возраст}» — та же логика, что в ProgramsSection
// (segment = gender, фильтры пустые, audience = { gender, age }).
export function getVisibleAgePrograms(locale: Locale, gender: Gender, age: number): Program[] {
  return filterPrograms(
    getLocalizedPrograms(locale),
    gender,
    { kidsCount: null, location: null, language: null },
    { gender, age },
  );
}

// ---------------------------------------------------------------------------
// Факты из каталога
// ---------------------------------------------------------------------------

type AgeFacts = {
  age: number;
  gender: Gender;
  ageLabel: string; // «3 года»
  childRod: string; // «мальчика» / «девочки»
  count: number;
  minPrice: string; // «1 300 ₪»
  minTitle: string; // «Старт» / «Стандарт»
  typicalPrice: string; // «2 000 ₪» — самая частая цена
  capSmall: number | null; // лимит компактных программ (15)
  capSmallTitles: string[];
  capCommon: number | null; // типичный лимит (35)
  capVip: number | null; // максимальный численный лимит (50)
  capVipTitle: string;
  unlimitedTitle: string; // программа без лимита гостей («Super VIP»)
  outdoorOnly: string[]; // только на улице
  indoorOnly: string[]; // только в помещении
  ex: string[]; // 2–3 примера программ по возрасту и полу
};

function formatIls(price: number, locale: Locale): string {
  const grouped =
    locale === "he"
      ? String(price).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      : String(price).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped} ₪`;
}

function ruAgeLabel(age: number): string {
  if (age === 1) return "1 год";
  if (age >= 2 && age <= 4) return `${age} года`;
  return `${age} лет`;
}

// Примеры программ по полосе × полу. Берутся только реально видимые на странице
// (проверка по каталогу в рантайме), при нехватке добираются из каталога.
const EXAMPLE_IDS: Record<AgeBand, Record<Gender, string[]>> = {
  "1-2": {
    boy: ["paw-patrol-toddler-boys", "masha-bear", "mickey-mouse-party"],
    girl: ["unicorn-toddler-girls", "masha-bear", "mickey-mouse-party"],
  },
  "3-4": {
    boy: ["paw-patrol-toddler-boys", "pj-masks", "sonic-party"],
    girl: ["princesses", "frozen-toddler-girls", "ladybug-party"],
  },
  "5-6": {
    boy: ["marvel-superheroes", "super-heroes", "squid-game"],
    girl: ["princesses", "frozen-toddler-girls", "kpop"],
  },
  "7-8": {
    boy: ["minecraft", "chemistry", "harry-potter"],
    girl: ["kpop", "chemistry", "wednesday"],
  },
  "9-10": {
    boy: ["tiktok", "neon", "minecraft"],
    girl: ["kpop", "tiktok", "neon"],
  },
};

// Служебные пакеты — не годятся как «примеры героев»
const NON_EXAMPLE_IDS = new Set(["start", "standart", "vip", "super-vip", "foam", "circus", "magician"]);

function pickExamples(
  visible: Program[],
  locale: Locale,
  gender: Gender,
  band: AgeBand,
  n = 3,
): string[] {
  const byId = new Map(visible.map((p) => [p.id, p]));
  const translated = (id: string) => locale === "ru" || hasProgramCopy(locale, id);
  const picked: string[] = [];
  for (const id of EXAMPLE_IDS[band][gender]) {
    const program = byId.get(id);
    if (program && translated(id)) picked.push(program.title);
    if (picked.length >= n) return picked;
  }
  for (const program of visible) {
    if (picked.length >= n) break;
    if (NON_EXAMPLE_IDS.has(program.id)) continue;
    if (!translated(program.id)) continue;
    if (picked.includes(program.title)) continue;
    picked.push(program.title);
  }
  return picked;
}

function collectFacts(locale: Locale, gender: Gender, age: number): AgeFacts | null {
  const visible = getVisibleAgePrograms(locale, gender, age);
  if (visible.length === 0) return null;

  const cheapest = visible.reduce((min, p) => (p.priceFrom < min.priceFrom ? p : min), visible[0]);

  // Самая частая цена
  const priceFreq = new Map<number, number>();
  for (const p of visible) priceFreq.set(p.priceFrom, (priceFreq.get(p.priceFrom) ?? 0) + 1);
  const typicalPrice = [...priceFreq.entries()].sort((a, b) => b[1] - a[1])[0][0];

  // Лимиты гостей: компактные (минимальный cap), типичный (мода), VIP (максимальный cap)
  const capped = visible.filter((p) => p.maxKids !== null) as (Program & { maxKids: number })[];
  const capFreq = new Map<number, number>();
  for (const p of capped) capFreq.set(p.maxKids, (capFreq.get(p.maxKids) ?? 0) + 1);
  const capCommon = capFreq.size > 0 ? [...capFreq.entries()].sort((a, b) => b[1] - a[1])[0][0] : null;
  const capSmall = capped.length > 0 ? Math.min(...capped.map((p) => p.maxKids)) : null;
  const capVip = capped.length > 0 ? Math.max(...capped.map((p) => p.maxKids)) : null;
  const capSmallTitles =
    capSmall !== null && capSmall !== capCommon
      ? capped.filter((p) => p.maxKids === capSmall).map((p) => p.title)
      : [];
  const capVipTitle =
    capVip !== null ? (capped.find((p) => p.maxKids === capVip)?.title ?? "") : "";
  const unlimitedTitle = visible.find((p) => p.maxKids === null)?.title ?? "";

  const outdoorOnly = visible
    .filter((p) => p.locations.includes("outdoor") && !p.locations.includes("indoor"))
    .map((p) => p.title);
  const indoorOnly = visible
    .filter((p) => p.locations.includes("indoor") && !p.locations.includes("outdoor"))
    .map((p) => p.title);

  return {
    age,
    gender,
    ageLabel: ruAgeLabel(age),
    childRod: gender === "boy" ? "мальчика" : "девочки",
    count: visible.length,
    minPrice: formatIls(cheapest.priceFrom, locale),
    minTitle: cheapest.title,
    typicalPrice: formatIls(typicalPrice, locale),
    capSmall,
    capSmallTitles,
    capCommon,
    capVip,
    capVipTitle,
    unlimitedTitle,
    outdoorOnly,
    indoorOnly,
    ex: pickExamples(visible, locale, gender, bandOf(age)),
  };
}

function quoteList(titles: string[], conj = "и"): string {
  const quoted = titles.map((t) => `«${t}»`);
  if (quoted.length <= 1) return quoted.join("");
  return `${quoted.slice(0, -1).join(", ")} ${conj} ${quoted[quoted.length - 1]}`;
}

// Ивритский вариант quoteList: кавычки прямые, союз «ו» приклеивается к следующей
// кавычке БЕЗ пробела («"טוב" ו"רע"»), союз «או» — отдельным словом с пробелами.
function heQuoteList(titles: string[], conj: "ו" | "או" = "ו"): string {
  const quoted = titles.map((t) => `"${t}"`);
  if (quoted.length <= 1) return quoted.join("");
  const head = quoted.slice(0, -1).join(", ");
  const last = quoted[quoted.length - 1];
  return conj === "ו" ? `${head} ${conj}${last}` : `${head} ${conj} ${last}`;
}

// «בן 3» / «בת שנה» — обращение к ребёнку по полу и возрасту (age=1 → «שנה»)
function heChildLabel(f: AgeFacts): string {
  const ageWord = f.age === 1 ? "שנה" : String(f.age);
  return `${f.gender === "boy" ? "בן" : "בת"} ${ageWord}`;
}

// Общий для всех полос ответ «где проводить», собранный из реальных locations
function ruWhereAnswer(f: AgeFacts, lead: string): string {
  const parts = [lead];
  if (f.outdoorOnly.length > 0) {
    parts.push(`Только на улице проходит ${quoteList(f.outdoorOnly)}.`);
  }
  if (f.indoorOnly.length > 0) {
    parts.push(`${quoteList(f.indoorOnly, "и")} — наоборот, только в помещении.`);
  }
  return parts.join(" ");
}

// Ивритский аналог ruWhereAnswer — общие «хвосты» про улицу/помещение
function heWhereAnswer(f: AgeFacts, lead: string): string {
  const parts = [lead];
  if (f.outdoorOnly.length > 0) {
    parts.push(`רק בחוץ מתקיימות ${heQuoteList(f.outdoorOnly)}.`);
  }
  if (f.indoorOnly.length > 0) {
    parts.push(`${heQuoteList(f.indoorOnly, "ו")} - לעומת זאת, מתקיימות רק בפנים.`);
  }
  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// RU-шаблоны по возрастным полосам
// ---------------------------------------------------------------------------

type BandTemplate = (f: AgeFacts) => { guide: string; faq: AgeGuideFaqItem[] };

const RU_TEMPLATES: Record<AgeBand, BandTemplate> = {
  "1-2": (f) => ({
    guide:
      `${f.age === 1 ? "Первый день рождения" : "День рождения в два года"} — праздник скорее для семьи: малыши смотрят шоу с маминых рук и быстро устают, поэтому мы советуем короткие форматы — «${f.minTitle}» на час за ${f.minPrice} или «Стандарт» на полтора. ` +
      `Героев выбирайте самых мягких и добрых — ${f.gender === "boy" ? "малышам" : "малышкам"} отлично заходят ${quoteList(f.ex.slice(0, 2), "и")}: пузыри, песенки, нежные персонажи без громких спецэффектов. ` +
      `Команда приезжает сама со всем реквизитом и музыкой — вам остаются торт и фотоаппарат.`,
    faq: [
      {
        q: `Сколько стоит праздник для ${f.childRod} ${f.ageLabel}?`,
        a: `Самая доступная программа — «${f.minTitle}» за ${f.minPrice}: час с одним героем. Большинство двухчасовых программ стоят ${f.typicalPrice}, и в цену уже входят ведущий, герои, реквизит и музыка.`,
      },
      {
        q: `Сколько малышей и гостей можно позвать?`,
        a: `Компактные ${quoteList(f.capSmallTitles)} рассчитаны до ${f.capSmall} детей, большие программы — до ${f.capCommon} гостей. Если празднуете всей семьёй с размахом, есть «${f.capVipTitle}» до ${f.capVip} и «${f.unlimitedTitle}» без ограничений.`,
      },
      {
        q: `Где лучше отмечать 1–2 года?`,
        a: ruWhereAnswer(
          f,
          `Дома или в знакомом зале — так малышу спокойнее. Почти все программы одинаково проходят в квартире, зале и парке.`,
        ),
      },
      {
        q: `За сколько бронировать дату?`,
        a: `Обычно хватает 2–3 недель. На высокий сезон — май-июнь, Хануку и Пурим — лучше писать за месяц: утренние слоты выходных уходят первыми.`,
      },
    ],
  }),

  "3-4": (f) => ({
    guide:
      `В ${f.ageLabel} ребёнок впервые по-настоящему ждёт свой праздник: узнаёт любимых героев, включается в игры и танцует. ` +
      `Внимания малышу хватает на 40–60 минут активной программы подряд, поэтому ведущий сам чередует конкурсы с передышками. ` +
      `${f.gender === "boy" ? "Мальчишки" : "Девочки"} в этом возрасте чаще всего выбирают ${quoteList(f.ex.slice(0, 2), "и")}, а если хочется короче и проще — есть «${f.minTitle}» от ${f.minPrice}.`,
    faq: [
      {
        q: `Сколько стоит аниматор для ${f.childRod} ${f.ageLabel}?`,
        a: `От ${f.minPrice} за «${f.minTitle}». Самый популярный формат — два часа с героями за ${f.typicalPrice}: шоу, конкурсы, дискотека и весь реквизит уже в цене.`,
      },
      {
        q: `На сколько детей рассчитана программа?`,
        a: `Комфортный максимум большинства программ — ${f.capCommon} детей, компактные ${quoteList(f.capSmallTitles)} — до ${f.capSmall}. Для группы из садика этого хватает с запасом, а «${f.unlimitedTitle}» вообще без лимита.`,
      },
      {
        q: `Можно провести праздник дома? А в парке?`,
        a: ruWhereAnswer(
          f,
          `Да: команда приезжает со всем реквизитом и работает в квартире, зале или парке — где вам удобнее.`,
        ),
      },
      {
        q: `Когда бронировать, чтобы успеть к дате?`,
        a: `За 2–3 недели — спокойно. За месяц — если день рождения выпадает на май-июнь, Хануку или Пурим: это самые загруженные недели года.`,
      },
    ],
  }),

  "5-6": (f) => ({
    guide:
      `${f.age === 5 ? "Пять" : "Шесть"} лет — золотой возраст для аниматора: ${f.gender === "boy" ? "именинник" : "именинница"} уже держит сюжет, обожает перевоплощения и командные игры. ` +
      `Смело берите сюжетные шоу — ${f.gender === "boy" ? "супергеройские программы вроде" : "например,"} ${quoteList(f.ex.slice(0, 2), "или")}: два часа истории с квестом, конкурсами и дискотекой. ` +
      `На даты высокого сезона (май-июнь, Ханука, Пурим) такие программы разбирают первыми — бронируйте заранее.`,
    faq: [
      {
        q: `Какой бюджет закладывать на праздник ${f.childRod} ${f.ageLabel}?`,
        a: `Большинство сюжетных шоу стоят ${f.typicalPrice} за два часа. Бюджетнее — «${f.minTitle}» от ${f.minPrice}, максимум — VIP-форматы с несколькими героями и шоу.`,
      },
      {
        q: `Сколько гостей потянет одна программа?`,
        a: `До ${f.capCommon} детей — ведущий с героями держит темп без потери драйва. На большую компанию берите «${f.capVipTitle}» до ${f.capVip} гостей или «${f.unlimitedTitle}» без лимита.`,
      },
      {
        q: `Дом, зал или улица — что выбрать?`,
        a: ruWhereAnswer(
          f,
          `Любой вариант: почти все программы одинаково работают в квартире, зале и парке — реквизит и музыку команда привозит с собой.`,
        ),
      },
      {
        q: `За сколько дней бронировать дату?`,
        a: `Оптимально за 2–3 недели. Май-июнь, Ханука и Пурим — высокий сезон: тут лучше написать за месяц, особенно если нужен выходной день.`,
      },
    ],
  }),

  "7-8": (f) => ({
    guide:
      `В ${f.age} лет удивить ребёнка сложнее: простые хороводы уже «для малышей». ` +
      `Зато отлично работают наука, квесты и любимые игры — посмотрите ${quoteList(f.ex.slice(0, 3), "или")}. ` +
      `Ведущий приезжает с полным реквизитом и держит команду до ${f.capCommon} детей в тонусе все два часа — родителям остаётся снимать видео и подавать торт.`,
    faq: [
      {
        q: `Сколько стоит праздник для ${f.childRod} ${f.ageLabel}?`,
        a: `Научные шоу, квесты и тематические вечеринки идут по ${f.typicalPrice} за два часа. Минимум — «${f.minTitle}» за ${f.minPrice}: полтора часа с одним героем.`,
      },
      {
        q: `Сколько детей выдержит программа?`,
        a: `Стандартно до ${f.capCommon} гостей. Если зовёте больше — «${f.capVipTitle}» рассчитан на ${f.capVip} детей, а «${f.unlimitedTitle}» проводим без ограничения по количеству.`,
      },
      {
        q: `Где проводить: дома, в зале или на улице?`,
        a: ruWhereAnswer(
          f,
          `Большинство программ гибкие — квартира, съёмный зал или парк, реквизит привозим сами.`,
        ),
      },
      {
        q: `За сколько времени бронировать?`,
        a: `2–3 недели — комфортный запас, чтобы выбрать программу и героев. В высокий сезон (май-июнь, Ханука, Пурим) даты разлетаются — пишите за месяц.`,
      },
    ],
  }),

  "9-10": (f) => ({
    guide:
      `${f.age === 9 ? "Девять" : "Десять"} лет — уже не малыши: обычный аниматор ${f.gender === "boy" ? "имениннику" : "имениннице"} «не по возрасту». ` +
      `Здесь заходят форматы как у подростков — ${quoteList(f.ex.slice(0, 3), "или")}: челленджи, битвы и дискотека вместо хороводов. ` +
      `Программа идёт два часа, реквизит и музыку команда привозит с собой — от вас только место и ${f.gender === "boy" ? "именинник" : "именинница со своей компанией"}.`,
    faq: [
      {
        q: `Сколько стоит праздник для ${f.childRod} ${f.ageLabel}?`,
        a: `Трендовые программы — ${f.typicalPrice} за два часа с ведущим, героями и реквизитом. Самый доступный вариант — «${f.minTitle}» за ${f.minPrice}.`,
      },
      {
        q: `Нас целый класс — потянете?`,
        a: `Да. Обычные программы комфортно вмещают до ${f.capCommon} детей, «${f.capVipTitle}» — до ${f.capVip}, а «${f.unlimitedTitle}» проводим вообще без лимита гостей.`,
      },
      {
        q: `Подойдёт квартира или лучше зал?`,
        a: ruWhereAnswer(
          f,
          `И то, и другое: программы работают в квартире, зале и на улице — было бы место для дискотеки.`,
        ),
      },
      {
        q: `Праздник уже скоро — успеем забронировать?`,
        a: `Напишите в WhatsApp: если дата свободна, соберём программу и за несколько дней. Надёжнее — за 2–3 недели, а на май-июнь, Хануку и Пурим — за месяц.`,
      },
    ],
  }),
};

// ---------------------------------------------------------------------------
// HE-шаблоны — структура параллельна RU, тексты от иврит-пайплайна
// (hebrew-copywriter). Списки программ собираются через heQuoteList.
// ---------------------------------------------------------------------------

const HE_TEMPLATES: Record<AgeBand, BandTemplate> = {
  "1-2": (f) => ({
    guide:
      `${f.age === 1 ? "יום ההולדת הראשון" : "יום הולדת בגיל שנתיים"} הוא בעיקר חגיגה משפחתית - הפעוטות צופים בהופעה מהזרוע של אמא ומתעייפים מהר, ולכן אנחנו ממליצים על פורמט קצר - "${f.minTitle}" לשעה ב-${f.minPrice} או "סטנדרט" לשעה וחצי. ` +
      `כדאי לבחור דמויות רכות ואוהבות - ל${f.gender === "boy" ? "פעוטים" : "פעוטות"} תמיד מצליחות ${heQuoteList(f.ex.slice(0, 2), "ו")}: בועות סבון, שירים ודמויות עדינות בלי אפקטים רועשים וקולניים. ` +
      `הצוות מגיע עם כל הציוד והמוזיקה - לכם נשארים רק העוגה והמצלמה.`,
    faq: [
      {
        q: `כמה עולה מסיבה ל${heChildLabel(f)}?`,
        a: `התוכנית הזולה ביותר היא "${f.minTitle}" ב-${f.minPrice}: שעה עם דמות אחת. רוב התוכניות בנות השעתיים עולות ${f.typicalPrice}, והמחיר כולל כבר מנחה, דמויות, ציוד ומוזיקה.`,
      },
      {
        q: `כמה פעוטות ואורחים אפשר להזמין?`,
        a: `התוכניות הקומפקטיות ${heQuoteList(f.capSmallTitles)} מיועדות עד ${f.capSmall} ילדים, והתוכניות הגדולות - עד ${f.capCommon} אורחים. אם חוגגים בגדול עם כל המשפחה, יש את "${f.capVipTitle}" עד ${f.capVip} ואת "${f.unlimitedTitle}" בלי הגבלה.`,
      },
      {
        q: `איפה הכי כדאי לחגוג בגיל שנה-שנתיים?`,
        a: heWhereAnswer(
          f,
          `בבית או באולם מוכר - ככה לפעוט יותר נעים. כמעט כל התוכניות מתאימות באותה מידה לדירה, לאולם ולפארק.`,
        ),
      },
      {
        q: `כמה זמן מראש כדאי להזמין תאריך?`,
        a: `בדרך כלל מספיקים שבועיים-שלושה. בעונה העמוסה - מאי-יוני, חנוכה ופורים - עדיף לפנות חודש מראש: שעות הבוקר בסופי השבוע נחטפות ראשונות.`,
      },
    ],
  }),

  "3-4": (f) => ({
    guide:
      `בגיל ${f.age} ${f.gender === "boy" ? "הילד כבר באמת מחכה למסיבה שלו" : "הילדה כבר באמת מחכה למסיבה שלה"}: מזהים את הדמויות האהובות, נכנסים למשחקים ורוקדים. ` +
      `תשומת הלב בגיל הזה מספיקה ל-40 עד 60 דקות של תוכנית רצופה, ולכן המנחה בעצמו משלב בין משחקים להפסקות קצרות. ` +
      `${f.gender === "boy" ? "ילדים" : "ילדות"} בגיל הזה הכי אוהבים ${heQuoteList(f.ex.slice(0, 2), "ו")}, ואם בא לכם משהו קצר ופשוט - יש את "${f.minTitle}" החל מ-${f.minPrice}.`,
    faq: [
      {
        q: `כמה עולה אנימטור ל${heChildLabel(f)}?`,
        a: `החל מ-${f.minPrice} עבור "${f.minTitle}". הפורמט הכי פופולרי הוא שעתיים עם דמויות ב-${f.typicalPrice}: הופעה, משחקים, דיסקוטק וכל הציוד כלול במחיר.`,
      },
      {
        q: `לכמה ילדים מתאימה התוכנית?`,
        a: `המקסימום הנוח ברוב התוכניות הוא ${f.capCommon} ילדים, והתוכניות הקומפקטיות ${heQuoteList(f.capSmallTitles)} - עד ${f.capSmall}. בשביל קבוצה מהגן זה מספיק בענק, ו"${f.unlimitedTitle}" בלי הגבלה בכלל.`,
      },
      {
        q: `אפשר לעשות את המסיבה בבית? ומה לגבי פארק?`,
        a: heWhereAnswer(
          f,
          `בטח: הצוות מגיע עם כל הציוד ועובד בדירה, באולם או בפארק - איפה שנוח לכם.`,
        ),
      },
      {
        q: `מתי כדאי להזמין כדי להספיק לתאריך?`,
        a: `שבועיים-שלושה מראש - בלי לחץ. חודש מראש - אם יום ההולדת יוצא במאי-יוני, בחנוכה או בפורים: אלה השבועות הכי עמוסים בשנה.`,
      },
    ],
  }),

  "5-6": (f) => ({
    guide:
      `גיל ${f.age === 5 ? "חמש" : "שש"} הוא הגיל הזהב לאנימטור: ${f.gender === "boy" ? "החוגג כבר מבין בעלילה, מת על תחפושות ומשחקי קבוצה" : "החוגגת כבר מבינה בעלילה, מתה על תחפושות ומשחקי קבוצה"}. ` +
      `תוכניות עלילתיות זה בול הכיוון - ${f.gender === "boy" ? "למשל תוכניות גיבורי-על כמו" : "למשל"} ${heQuoteList(f.ex.slice(0, 2), "או")}: שעתיים של סיפור עם משימות, משחקים ודיסקוטק. ` +
      `בעונה העמוסה (מאי-יוני, חנוכה, פורים) התוכניות האלה נחטפות ראשונות - כדאי להזמין מראש.`,
    faq: [
      {
        q: `איזה תקציב כדאי להקצות למסיבה ל${heChildLabel(f)}?`,
        a: `רוב התוכניות העלילתיות עולות ${f.typicalPrice} לשעתיים. אפשרות זולה יותר - "${f.minTitle}" החל מ-${f.minPrice}, והמקסימום הוא פורמטים מסוג VIP עם כמה דמויות והופעות.`,
      },
      {
        q: `כמה אורחים תוכנית אחת מסוגלת להכיל?`,
        a: `עד ${f.capCommon} ילדים - המנחה עם הדמויות שומר על הקצב בלי לאבד אנרגייה. לחבורה גדולה יותר כדאי לקחת את "${f.capVipTitle}" עד ${f.capVip} אורחים או את "${f.unlimitedTitle}" בלי הגבלה.`,
      },
      {
        q: `בית, אולם או חוץ - מה לבחור?`,
        a: heWhereAnswer(
          f,
          `כל אופציה מתאימה: כמעט כל התוכניות עובדות באותה מידה בדירה, באולם ובפארק - את הציוד והמוזיקה הצוות מביא איתו.`,
        ),
      },
      {
        q: `כמה ימים מראש כדאי להזמין תאריך?`,
        a: `אופטימלי שבועיים-שלושה מראש. מאי-יוני, חנוכה ופורים הם העונה העמוסה: כדאי לפנות חודש מראש, בעיקר אם רוצים יום סוף שבוע.`,
      },
    ],
  }),

  "7-8": (f) => ({
    guide:
      `בגיל ${f.age} כבר קשה יותר להפתיע: משחקי מעגל פשוטים זה כבר "בשביל הקטנים". ` +
      `לעומת זאת, מדע, משימות ומשחקים אהובים עובדים מצוין - תראו את ${heQuoteList(f.ex.slice(0, 3), "או")}. ` +
      `המנחה מגיע עם ציוד מלא ושומר על הקבוצה, עד ${f.capCommon} ילדים, באנרגייה גבוהה במשך שעתיים שלמות - להורים נשאר רק לצלם ולהגיש עוגה.`,
    faq: [
      {
        q: `כמה עולה מסיבה ל${heChildLabel(f)}?`,
        a: `הופעות מדע, משימות ומסיבות נושאיות עולות ${f.typicalPrice} לשעתיים. המינימום - "${f.minTitle}" ב-${f.minPrice}: שעה וחצי עם דמות אחת.`,
      },
      {
        q: `כמה ילדים התוכנית מכילה?`,
        a: `בדרך כלל עד ${f.capCommon} אורחים. אם מזמינים יותר - "${f.capVipTitle}" מיועד ל-${f.capVip} ילדים, ו"${f.unlimitedTitle}" מתקיימת בלי הגבלת כמות.`,
      },
      {
        q: `איפה לעשות את זה: בבית, באולם או בחוץ?`,
        a: heWhereAnswer(
          f,
          `רוב התוכניות גמישות - דירה, אולם מושכר או פארק, את הציוד אנחנו מביאים בעצמנו.`,
        ),
      },
      {
        q: `כמה זמן מראש להזמין?`,
        a: `שבועיים-שלושה זה מרווח נוח לבחור תוכנית ודמויות. בעונה העמוסה (מאי-יוני, חנוכה, פורים) התאריכים נחטפים - כדאי לפנות חודש מראש.`,
      },
    ],
  }),

  "9-10": (f) => ({
    guide:
      `גיל ${f.age === 9 ? "תשע" : "עשר"} זה כבר לא "קטנים": אנימטור רגיל כבר "לא בגיל" ל${f.gender === "boy" ? "חוגג" : "חוגגת"}. ` +
      `בגיל הזה עובדים פורמטים כמו של בני נוער - ${heQuoteList(f.ex.slice(0, 3), "או")}: אתגרים, קרבות ודיסקוטק במקום משחקי מעגל. ` +
      `התוכנית נמשכת שעתיים, ואת הציוד והמוזיקה הצוות מביא בעצמו - מכם צריך רק מקום ו${f.gender === "boy" ? "החוגג" : "החוגגת והחברות שלה"}.`,
    faq: [
      {
        q: `כמה עולה מסיבה ל${heChildLabel(f)}?`,
        a: `תוכניות טרנדיות עולות ${f.typicalPrice} לשעתיים עם מנחה, דמויות וציוד. האופציה הכי משתלמת - "${f.minTitle}" ב-${f.minPrice}.`,
      },
      {
        q: `אנחנו כיתה שלמה - תסתדרו?`,
        a: `בטח. תוכניות רגילות מכילות בנוחות עד ${f.capCommon} ילדים, "${f.capVipTitle}" - עד ${f.capVip}, ו"${f.unlimitedTitle}" מתקיימת בלי הגבלת אורחים בכלל.`,
      },
      {
        q: `דירה מתאימה או עדיף אולם?`,
        a: heWhereAnswer(
          f,
          `גם וגם: התוכניות עובדות בדירה, באולם ובחוץ - העיקר שיהיה מקום לדיסקוטק.`,
        ),
      },
      {
        q: `המסיבה כבר בקרוב - נספיק להזמין?`,
        a: `תכתבו לנו בוואטסאפ: אם התאריך פנוי, אפשר לסדר תוכנית גם תוך כמה ימים. הכי בטוח - שבועיים-שלושה מראש, ולמאי-יוני, חנוכה ופורים - חודש מראש.`,
      },
    ],
  }),
};

const TEMPLATES: Record<Locale, Record<AgeBand, BandTemplate>> = {
  ru: RU_TEMPLATES,
  he: HE_TEMPLATES,
};

// Заголовки блока
function guideTitle(locale: Locale, f: AgeFacts): string {
  if (locale === "he") return `איך בוחרים תוכנית ליום הולדת של ${heChildLabel(f)}`;
  return `Как выбрать программу для ${f.childRod} ${f.ageLabel}`;
}

function faqTitle(locale: Locale, f: AgeFacts): string {
  if (locale === "he") return `שאלות נפוצות למסיבה בגיל ${f.age === 1 ? "שנה" : f.age}`;
  return `Частые вопросы про праздник в ${f.ageLabel}`;
}

export function getAgeGuide(locale: Locale, gender: Gender, age: number): AgeGuideData | null {
  if (!Number.isInteger(age) || age < 1 || age > 10) return null;
  const facts = collectFacts(locale, gender, age);
  if (!facts) return null;

  const { guide, faq } = TEMPLATES[locale][bandOf(age)](facts);
  // Страховка: пустой шаблон => блок не рендерится
  if (!guide.trim() || faq.some((item) => !item.q.trim() || !item.a.trim())) return null;

  return {
    guideTitle: guideTitle(locale, facts),
    guide,
    faqTitle: faqTitle(locale, facts),
    faq,
  };
}

// ---------------------------------------------------------------------------
// Факты для meta description возрастных страниц (lib/seo.ts)
// ---------------------------------------------------------------------------

export type AgeSeoFacts = {
  titles: string[]; // 2–3 реальных названия программ (для he — только переведенные)
  minPrice: number;
  count: number;
};

export function getAgeSeoFacts(locale: Locale, gender: Gender, age: number): AgeSeoFacts | null {
  const visible = getVisibleAgePrograms(locale, gender, age);
  if (visible.length === 0) return null;
  return {
    titles: pickExamples(visible, locale, gender, bandOf(age), 3),
    minPrice: Math.min(...visible.map((p) => p.priceFrom)),
    count: visible.length,
  };
}
