This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3003](http://localhost:3003) with your browser to see the result.

## Telegram для заказов видеопоздравлений

1. Создайте отдельного бота командой `/newbot` в [@BotFather](https://t.me/BotFather).
2. Запустите `setup-ded-moroz-telegram.cmd` и вставьте токен. Добавьте бота в нужную группу или канал. Для канала назначьте бота администратором с правом публиковать сообщения.
3. Отправьте в Telegram команду из текущего окна настройки и нажмите Enter в этом окне. После проверочного сообщения перезапустите `open-ded-moroz.cmd`. Новые заказы будут сохраняться в [кабинете](http://localhost:3003/admin/ded-moroz), а бот отправит номер заказа и срок в выбранный чат.

Настройки бота хранятся в `.ded-moroz-local/telegram.json`. Если Telegram временно недоступен, сайт сохранит заявку и повторит отправку уведомления. Телефон и фотографии остаются в карточке заказа.

### Видеопоздравления на боевом сайте

1. Заявки и четыре фотографии хранятся в существующей D1 `mishanya-gift`. Перед первым выпуском выполните `migrations/0013_ded_moroz_orders.sql` в консоли этой базы. Миграция создаёт таблицы для анкет и зашифрованных частей фотографий. Кабинет и Telegram получают заказ после сохранения всех четырёх снимков.
2. Создайте одно приложение Cloudflare Access для `mishanya-show.com/admin/ded-moroz` и `mishanya-show.com/api/ded-moroz/staff/*`. Добавьте сотрудников в политику Allow по рабочим адресам электронной почты. В секретах Pages `mishanya-site` укажите `DM_ACCESS_TEAM_DOMAIN` (домен команды вида `team.cloudflareaccess.com`) и `DM_ACCESS_AUD` (Application Audience). Не закрывайте публичный маршрут отправки заказа `/api/ded-moroz/orders`.
3. Задайте секреты `DM_TELEGRAM_BOT_TOKEN`, `DM_TELEGRAM_CHAT_ID` и, для темы группы, `DM_TELEGRAM_THREAD_ID` в Worker `mishanya-gift-sync`. Скопируйте настройки бота из локальной настройки непосредственно в поля секретов. Worker проверяет очередь каждую минуту и при необходимости повторяет доставку. В Telegram приходит номер заказа, срок и ссылка на кабинет. Данные семьи и фотографии открываются в кабинете.

GitHub Actions проверяет секреты и публикует сайт после push в `main`. После публикации запрос `HEAD /api/ded-moroz/orders` проверяет подключение к таблицам заявок и фото через привязку Pages к D1. Исправный сервис отвечает HTTP 204. В анкете используется существующий Turnstile. Оплату менеджер согласовывает после заявки.

You can start editing the legacy home page in `app/(legacy)/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
