import { QuestCatalogRedirect } from "@/components/quests/QuestCatalogRedirect";
import { QUEST_COPY } from "@/data/quests";
import { createPageMetadata, SITE_NAME } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: `Квесты | ${SITE_NAME}`,
  description: QUEST_COPY.ru.metadata,
  path: "/quests",
  canonicalPath: "/ru/all",
  noIndex: true,
});

export default function QuestsPage() {
  return <QuestCatalogRedirect />;
}
