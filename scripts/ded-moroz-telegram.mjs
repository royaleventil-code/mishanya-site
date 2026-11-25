import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { isTelegramBotToken, sendTelegramMessage } from "../shared/ded-moroz-telegram.js";

export { isTelegramBotToken, sendTelegramMessage, telegramRequest } from "../shared/ded-moroz-telegram.js";

const settingsName = "telegram.json";
const isGroupOrChannelId = value => typeof value === "string" && /^-[1-9]\d*$/.test(value);

export const telegramRetryInterval = 30_000;

function validateSettings(settings) {
  if (!isTelegramBotToken(settings?.token) || !isGroupOrChannelId(settings.chatId) ||
      (settings.threadId !== undefined && (!Number.isSafeInteger(settings.threadId) || settings.threadId <= 0))) {
    throw new Error("Настройки Telegram неверны.");
  }
  return settings;
}

export async function loadTelegramSettings(directory) {
  const text = await readFile(path.join(directory, settingsName), "utf8").catch(error => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (text === null) return null;
  try {
    return validateSettings(JSON.parse(text));
  } catch {
    throw new Error("Настройки Telegram неверны.");
  }
}

export async function saveTelegramSettings(directory, settings) {
  validateSettings(settings);
  await mkdir(directory, { recursive: true });
  const temporary = path.join(directory, settingsName + "." + randomUUID() + ".tmp");
  try {
    await writeFile(temporary, JSON.stringify(settings), { flag: "wx", mode: 0o600 });
    await rename(temporary, path.join(directory, settingsName));
  } finally {
    await rm(temporary, { force: true });
  }
}

export function setupChats(updates, command) {
  const chats = new Map();
  for (const update of updates) {
    const message = update.message ?? update.channel_post;
    if (message?.text?.trim() !== command || !["group", "supergroup", "channel"].includes(message.chat?.type)) continue;
    const chatId = String(message.chat.id);
    if (!isGroupOrChannelId(chatId)) continue;
    const threadId = message.is_topic_message ? message.message_thread_id : undefined;
    chats.set(chatId + "/" + (threadId ?? ""), { chatId, threadId, title: message.chat.title });
  }
  return [...chats.values()];
}

export function createTelegramOrderNotifier(store, settings, { request = fetch, clock = Date.now, log = console.warn } = {}) {
  async function deliver(order) {
    const date = order.ready_by.split("-").reverse().join(".");
    const text = [
      "Новый заказ на видеопоздравление",
      "Заказ " + order.order_id,
      "Видео нужно к " + date,
      "Детей в заказе — " + order.children.length,
      "Анкета, телефон и фотографии в разделе «Заказы видеопоздравлений».",
    ].join("\n");
    let messageId;
    try {
      messageId = await sendTelegramMessage(settings, text, request);
    } catch (error) {
      const attempts = order.telegram_notification.attempts + 1;
      const backoff = telegramRetryInterval * 2 ** Math.min(attempts - 1, 5);
      await store.update(order.order_id, {
        telegram_notification: {
          attempts,
          nextAttemptAt: clock() + Math.max(backoff, error.retryAfterMs ?? 0),
        },
      });
      log("Telegram, заказ " + order.order_id + " — " + error.message);
      return;
    }

    await store.update(order.order_id, {
      telegram_notification: { messageId, sentAt: new Date(clock()).toISOString() },
    });
  }

  let inFlight;
  let scanAgain = false;
  async function drain() {
    do {
      scanAgain = false;
      for (const order of (await store.list()).reverse()) {
        const notice = order.telegram_notification;
        if (!notice || notice.sentAt || notice.nextAttemptAt > clock()) continue;
        await deliver(order);
      }
    } while (scanAgain);
  }

  return function notifyPendingOrders() {
    scanAgain = true;
    inFlight ??= drain()
      .catch(() => log("Telegram — не удалось обработать очередь уведомлений. Повторим автоматически."))
      .finally(() => { inFlight = undefined; });
    return inFlight;
  };
}
