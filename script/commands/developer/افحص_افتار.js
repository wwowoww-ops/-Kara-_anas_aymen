const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "افحص_افاتر",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "فحص دالة changeAvatar",
  commandCategory: "Developer",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const HINA = "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬";

  try {
    const file = require.resolve("hut-chat-api");

    const code = fs.readFileSync(file, "utf8");

    const index = code.indexOf("changeAvatar");

    return api.sendMessage(
      `${HINA}\n\n` +
      `📍 ملف المكتبة:\n${file}\n\n` +
      `🔎 موقع changeAvatar:\n${index === -1 ? "غير موجود في الملف الرئيسي" : `وجدته عند الحرف ${index}`}`,
      event.threadID,
      event.messageID
    );

  } catch (error) {
    return api.sendMessage(
      `${HINA}\n\n❌ فشل الفحص\n${error.message}`,
      event.threadID,
      event.messageID
    );
  }
};