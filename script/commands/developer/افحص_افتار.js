const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "افحص_افاتر",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "البحث عن changeAvatar داخل hut-chat-api",
  commandCategory: "Developer",
  usages: "",
  cooldowns: 5
};

function searchFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;

  let files;

  try {
    files = fs.readdirSync(dir);
  } catch {
    return results;
  }

  for (const file of files) {
    const fullPath = path.join(dir, file);

    let stat;

    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      searchFiles(fullPath, results);
      continue;
    }

    if (!file.endsWith(".js")) continue;

    try {
      const content = fs.readFileSync(fullPath, "utf8");

      if (
        content.includes("changeAvatar") ||
        content.includes("changeProfilePicture") ||
        content.includes("change_profile")
      ) {
        const lines = content.split(/\r?\n/);

        const matches = [];

        lines.forEach((line, index) => {
          if (
            line.includes("changeAvatar") ||
            line.includes("changeProfilePicture") ||
            line.includes("change_profile")
          ) {
            matches.push(
              `السطر ${index + 1}: ${line.trim().slice(0, 500)}`
            );
          }
        });

        results.push({
          file: fullPath,
          matches
        });
      }

    } catch {}
  }

  return results;
}

module.exports.run = async function ({ api, event }) {
  const HINA = "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬";

  try {
    const libraryPath = path.dirname(
      require.resolve("hut-chat-api")
    );

    const results = searchFiles(libraryPath);

    if (!results.length) {
      return api.sendMessage(
        `${HINA}\n\n❌ لم يتم العثور على changeAvatar داخل ملفات hut-chat-api`,
        event.threadID,
        event.messageID
      );
    }

    let message =
      `${HINA}\n\n` +
      `🔎 تم العثور على changeAvatar داخل:\n\n`;

    for (const result of results) {
      message += `📄 ${result.file}\n`;

      for (const match of result.matches) {
        message += `   ${match}\n`;
      }

      message += "\n";
    }

    return api.sendMessage(
      message.slice(0, 19000),
      event.threadID,
      event.messageID
    );

  } catch (error) {
    console.error(error);

    return api.sendMessage(
      `${HINA}\n\n❌ حدث خطأ أثناء الفحص\n\n${error.message}`,
      event.threadID,
      event.messageID
    );
  }
};