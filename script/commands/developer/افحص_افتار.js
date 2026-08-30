const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "افحص_افاتر",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "عرض كود changeAvatar",
  commandCategory: "Developer",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const HINA = "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬";

  try {
    const file = path.join(
      process.cwd(),
      "node_modules",
      "hut-chat-api",
      "src",
      "changeAvatar.js"
    );

    if (!fs.existsSync(file)) {
      return api.sendMessage(
        `${HINA}\n\n❌ الملف غير موجود:\n${file}`,
        event.threadID,
        event.messageID
      );
    }

    const lines = fs.readFileSync(file, "utf8")
      .split(/\r?\n/);

    const start = Math.max(0, 40);
    const end = Math.min(lines.length, 140);

    let output =
      `${HINA}\n\n` +
      `📄 changeAvatar.js\n` +
      `📌 الأسطر ${start + 1} إلى ${end}\n\n`;

    for (let i = start; i < end; i++) {
      output += `${i + 1}: ${lines[i]}\n`;
    }

    return api.sendMessage(
      output.slice(0, 19000),
      event.threadID,
      event.messageID
    );

  } catch (error) {
    console.error(error);

    return api.sendMessage(
      `${HINA}\n\n❌ فشل قراءة الملف\n\n${error.message}`,
      event.threadID,
      event.messageID
    );
  }
};