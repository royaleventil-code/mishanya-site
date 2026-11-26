import { GreetingPage } from "@/components/ded-moroz/GreetingPage";
import { newYearProgram, NEW_YEAR_VIDEO_GREETING_ID } from "@/data/new-year";

export const metadata = { title: "Заказать видеопоздравление | Мишаня в Стране Чудес" };

export default function Page() {
  return <GreetingPage price={newYearProgram(NEW_YEAR_VIDEO_GREETING_ID)?.options[0].price ?? null} />;
}
