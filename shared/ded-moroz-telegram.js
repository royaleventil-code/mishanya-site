export const isTelegramBotToken = value => typeof value === "string" && /^\d+:[A-Za-z0-9_-]{20,}$/.test(value);

export async function telegramRequest(token, method, payload = {}, request = fetch) {
  if (!isTelegramBotToken(token)) throw new Error("Проверьте токен из BotFather.");
  let response;
  let body;
  try {
    response = await request("https://api.telegram.org/bot" + token + "/" + method, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "error",
      signal: AbortSignal.timeout(8_000),
    });
    body = await response.json();
  } catch {
    throw new Error("Telegram не ответил. Проверьте подключение к Telegram.");
  }
  if (response.ok && body?.ok === true) return body.result;

  const code = Number.isInteger(body?.error_code) ? body.error_code : response.status;
  const message = {
    401: "Telegram отклонил токен бота (401).",
    403: "Проверьте право бота отправлять сообщения в выбранную группу или канал (403).",
    409: "Telegram не дал прочитать ответы этого бота (409). Для настройки используйте отдельного бота.",
  }[code] || "Telegram вернул ошибку " + code + ".";
  const retryAfter = body?.parameters?.retry_after;
  throw Object.assign(new Error(message), {
    retryAfterMs: Number.isSafeInteger(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 0,
  });
}

export async function sendTelegramMessage(settings, text, request = fetch) {
  const result = await telegramRequest(settings.token, "sendMessage", {
    chat_id: settings.chatId,
    ...(settings.threadId === undefined ? {} : { message_thread_id: settings.threadId }),
    text,
  }, request);
  if (String(result?.chat?.id) !== settings.chatId || !Number.isInteger(result?.message_id)) {
    throw new Error("Telegram не подтвердил доставку в выбранный чат.");
  }
  return result.message_id;
}
