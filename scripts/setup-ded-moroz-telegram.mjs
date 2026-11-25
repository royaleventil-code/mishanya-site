import { randomBytes } from "node:crypto";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { fileURLToPath } from "node:url";
import { isTelegramBotToken, saveTelegramSettings, sendTelegramMessage, setupChats, telegramRequest } from "./ded-moroz-telegram.mjs";

const directory = fileURLToPath(new URL("../.ded-moroz-local/", import.meta.url));

async function configure() {
  if (!process.stdin.isTTY) throw new Error("Запустите настройку в окне терминала Windows.");

  const output = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  const input = createInterface({ input: process.stdin, output, terminal: true, historySize: 0 });
  try {
    console.log("Создайте отдельного бота через @BotFather командой /newbot.");
    console.log("Вставьте токен и нажмите Enter. Введённые символы скрыты.");
    const token = (await input.question("")).trim();
    process.stdout.write("\n");
    if (!isTelegramBotToken(token)) throw new Error("Проверьте токен из BotFather.");

    const bot = await telegramRequest(token, "getMe");
    if (!bot?.is_bot || !/^[A-Za-z0-9_]+$/.test(bot.username ?? "")) {
      throw new Error("Telegram не подтвердил имя бота.");
    }
    const updateOptions = { allowed_updates: ["message", "channel_post"], timeout: 0 };
    // Telegram applies update filters to new messages, so set them before the command is posted.
    await telegramRequest(token, "getUpdates", updateOptions);
    const command = "/dm_connect@" + bot.username + " " + randomBytes(5).toString("hex");
    console.log("Добавьте @" + bot.username + " в нужную группу или канал.");
    console.log("В канале назначьте бота администратором с правом публикации сообщений.");
    console.log("Отправьте в выбранном чате команду из этого окна.");
    console.log(command);

    let chats = [];
    while (chats.length === 0) {
      console.log("После отправки команды в Telegram нажмите Enter в этом окне. Для выхода введите q.");
      const answer = (await input.question("")).trim();
      process.stdout.write("\n");
      if (answer.toLowerCase() === "q") return;
      if (answer) {
        console.log("Команду нужно отправить в Telegram. Здесь достаточно нажать Enter.");
        continue;
      }
      const updates = await telegramRequest(token, "getUpdates", updateOptions);
      chats = setupChats(updates, command);
      if (chats.length === 0) console.log("Проверьте, что в Telegram отправлена команда именно из этого окна.");
    }

    if (chats.length !== 1) throw new Error("Команда получена из нескольких мест. Начните настройку заново и выберите один чат.");
    const { chatId, threadId, title } = chats[0];
    const settings = { token, chatId, threadId };
    await sendTelegramMessage(settings, "Проверка связи. Здесь будут уведомления о новых заказах на видеопоздравления.");
    await saveTelegramSettings(path.resolve(directory), settings);
    console.log("Проверочное сообщение доставлено в «" + title + "».");
    console.log("Перезапустите open-ded-moroz.cmd для уведомлений о новых заказах.");
  } finally {
    try {
      input.close();
    } catch (error) {
      // Some Windows consoles deny restoring raw mode as the child process exits.
      if (process.platform !== "win32" || error.code !== "EPERM") throw error;
    }
  }
}

let exitCode = 0;
try {
  await configure();
} catch (error) {
  console.error(error.message);
  exitCode = 1;
}
// Flush the result before leaving a Windows console that may still hold an input handle.
await Promise.all([process.stdout, process.stderr].map(stream => new Promise(resolve => stream.write("", resolve))));
process.exit(exitCode);
