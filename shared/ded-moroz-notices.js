import { toOrder } from "./ded-moroz-cloud.js";
import { formatOrderNotice, isTelegramBotToken, sendTelegramMessage } from "./ded-moroz-telegram.js";

export async function deliverOrderNotices(env, { clock = Date.now, request = fetch } = {}) {
  if (!env.GIFT_DB) return;
  const now = clock();
  await env.GIFT_DB.prepare("DELETE FROM dm_photo_uploads WHERE expires_at <= ?").bind(now).run();
  const token = env.DM_TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.DM_TELEGRAM_CHAT_ID?.trim();
  const threadId = env.DM_TELEGRAM_THREAD_ID ? Number(env.DM_TELEGRAM_THREAD_ID) : undefined;
  if (!isTelegramBotToken(token) || !/^-[1-9]\d*$/.test(chatId || "") ||
    (threadId !== undefined && (!Number.isSafeInteger(threadId) || threadId <= 0))) return;

  await env.GIFT_DB.prepare("DELETE FROM dm_order_limits WHERE window_start < ?").bind(now - 172_800_000).run();
  const { results } = await env.GIFT_DB.prepare(
    "SELECT id FROM dm_orders " +
    "WHERE telegram_sent_at IS NULL AND telegram_next_at <= ? ORDER BY telegram_next_at LIMIT 10",
  ).bind(now).all();

  for (const row of results) {
    const claimAt = clock();
    const lease = claimAt + 120_000;
    const claimed = await env.GIFT_DB.prepare(
      "UPDATE dm_orders SET telegram_next_at = ? " +
      "WHERE id = ? AND telegram_sent_at IS NULL AND telegram_next_at <= ? RETURNING *",
    ).bind(lease, row.id, claimAt).first();
    if (!claimed) continue;

    try {
      const order = await toOrder(env, claimed);
      await sendTelegramMessage({ token, chatId, threadId }, formatOrderNotice(order), request);
    } catch (error) {
      const backoff = 30_000 * 2 ** Math.min(claimed.telegram_attempts, 5);
      await env.GIFT_DB.prepare(
        "UPDATE dm_orders SET telegram_attempts = telegram_attempts + 1, telegram_next_at = ? " +
        "WHERE id = ? AND telegram_sent_at IS NULL AND telegram_next_at = ?",
      ).bind(clock() + Math.max(backoff, error.retryAfterMs || 0), row.id, lease).run();
      continue;
    }
    await env.GIFT_DB.prepare(
      "UPDATE dm_orders SET telegram_sent_at = ? WHERE id = ? AND telegram_next_at = ?",
    ).bind(clock(), row.id, lease).run();
  }
}
